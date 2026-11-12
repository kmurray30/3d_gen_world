/** Catalog chunk people-b: the words in assign/people-b.tsv. */
import { e, type CatalogEntry } from './types';
import { m } from '../dsl';
import { body, face, hat, held, wear, who, type Extra } from '../accessories';
import type { PersonDims } from '../kit';
import { col } from '../colors';
import { measure } from '../math';
import type { FigPart, Figure, Shape, Vec3 } from '../types';

/* ----- local helpers: custom parts on a person, placed from its dimensions ----- */

type Spec = [parent: string, shape: Shape, size: Vec3, at: Vec3, color: string, o?: Partial<FigPart>];
/** Extra parts in a joint's frame (hips, torso, head, armL/R, foreL/R, handL/R, legL/R, shinL/R, footL/R; '' = figure space). */
const x = (f: (d: PersonDims) => Spec[]): Extra => (p, d) => {
  for (const [parent, shape, size, at, c, o] of f(d)) p.add({ name: `x${p.list.length}`, parent: parent || undefined, shape, size, at, color: col(c, c), layer: 3, ...o });
};
/** Same as x, mirrored: f gets s = 1 (left, +x) and -1. Use side(s) for a sided joint name. */
const x2 = (f: (d: PersonDims, s: 1 | -1, side: 'L' | 'R') => Spec[]): Extra => (p, d) => {
  x((dd) => f(dd, 1, 'L'))(p, d);
  x((dd) => f(dd, -1, 'R'))(p, d);
};
/** Hide parts of the base person (legs under a tail, a missing head). */
const hide = (...names: string[]): Extra => (p) => {
  for (const q of p.list) if (names.includes(q.name)) q.scale = 0;
};
const LEGS = ['legL', 'legR', 'shinL', 'shinR', 'footL', 'footR'];
/** Stand the person on a round base `t` metres thick. */
const onBase = (c: string, t: number, wide = 2.4): Extra => (p, d) => {
  const hips = p.list.find((q) => q.name === 'hips')!;
  hips.at = [hips.at[0], hips.at[1] + t, hips.at[2]];
  x(() => [['', 'cyl', [d.tw * wide, t, d.tw * wide * 0.8], [0, t / 2, 0], c]])(p, d);
};
/** A rod between two points in one joint's frame (as a Spec). */
const rod = (parent: string, a: Vec3, b: Vec3, t: number, c: string, o: Partial<FigPart> = {}): Spec => {
  const v: Vec3 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const L = Math.hypot(...v) || 1e-3;
  const rx = (Math.atan2(v[2] / L, v[1] / L) * 180) / Math.PI;
  const rz = (-Math.asin(Math.max(-1, Math.min(1, v[0] / L))) * 180) / Math.PI;
  return [parent, 'capsule', [t, L + t, t], [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2], c, { srot: [rx, 0, rz], ...o }];
};
const top = (d: PersonDims) => d.headY + d.headH * 0.42;
/** A fedora (brim, crown, band). */
const fedora = (c: string, band = 'black'): Extra =>
  x((d) => {
    const W = d.headW, H = d.headH, D = d.headD, t = top(d);
    return [['head', 'cyl', [W * 1.5, H * 0.05, D * 1.45], [0, t - H * 0.06, 0], c], ['head', 'cyl', [W * 0.88, H * 0.4, D * 0.82], [0, t + H * 0.12, 0], c, { taper: 0.85 }], ['head', 'cyl', [W * 0.9, H * 0.1, D * 0.84], [0, t + H * 0.0, 0], band]];
  });
/** A pointed cone hat (gnomes, wizards without a brim). */
const cone = (c: string, k = 1.1): Extra => x((d) => [['head', 'cyl', [d.headW * 1.12, d.headH * k, d.headD * 1.08], [0, top(d) + d.headH * (k / 2 - 0.12), 0], c, { taper: 0 }]]);
/** A card with text on the chest (jersey numbers, logos). */
const chest = (text: string, c = 'white', w = 0.5): Extra => x((d) => [['torso', 'box', [d.tw * w, d.torsoH * 0.32, d.td * 0.08], [0, d.torsoH * 0.58, d.td * 0.52], c, { role: 'label', text, layer: 6, round: 0.2 }]]);
/** A white shirt front under a jacket. */
const shirtFront = (c = 'white'): Extra => x((d) => [['torso', 'box', [d.tw * 0.3, d.torsoH * 0.5, d.td * 0.1], [0, d.torsoH * 0.7, d.td * 0.52], c, { layer: 4 }]]);
/** A flower on the lapel. */
const flower = (c = 'white'): Extra => x((d) => [['torso', 'ball', [d.tw * 0.14, d.tw * 0.14, d.td * 0.14], [d.tw * 0.3, d.torsoH * 0.78, d.td * 0.56], c, { layer: 6 }]]);
/** Gloves or big hands. */
const gloves = (c: string, k = 1.15): Extra => x2((d, _s, side) => [[`hand${side}`, 'ball', [d.aw * 1.25 * k, d.aw * 1.3 * k, d.aw * 1.0 * k], [0, -d.aw * 0.25, 0], c, { layer: 2 }]]);
/** Boots over the shins. */
const boots = (c: string): Extra => x2((d, _s, side) => [[`shin${side}`, 'capsule', [d.lw * 1.05, d.legLen * 0.32, d.lw * 1.05], [0, -d.legLen * 0.3, 0], c, { layer: 2 }]]);
/** Bands around the torso (stripes, reflective tape). */
const bands = (c: string, ys: number[], k = 0.07): Extra => x((d) => ys.map((y): Spec => ['torso', 'box', [d.tw * 1.08, d.torsoH * k, d.td * 1.12], [0, d.torsoH * y, 0], c, { noInk: true, layer: 4, round: 0.5 }]));
/** Shoulder pads or epaulettes. */
const shoulders = (c: string, k = 1): Extra => x2((d, s) => [['torso', 'ball', [d.tw * 0.42 * k, d.tw * 0.2 * k, d.td * 0.9 * k], [s * d.tw * 0.45, d.torsoH * 0.96, 0], c]]);
/** Earrings. */
const earrings = (c = 'gold'): Extra => x2((d, s) => [['head', 'torus', [d.headW * 0.2, d.headW * 0.2, d.headW * 0.05], [s * d.headW * 0.5, d.headY - d.headH * 0.24, 0], c, { tube: 0.25 }]]);
/** Bracelets around both forearms. */
const cuffs = (c: string): Extra => x2((d, _s, side) => [[`fore${side}`, 'cyl', [d.aw * 1.15, d.aw * 0.7, d.aw * 1.15], [0, -d.lower * 0.75, 0], c]]);
/** Pointy elf/goblin ears. */
const pointyEars = (c: string, k = 1): Extra => x2((d, s) => [['head', 'cyl', [d.headW * 0.18 * k, d.headH * 0.5 * k, d.headW * 0.09], [s * d.headW * 0.62, d.headY + d.headH * 0.08, -d.headD * 0.05], c, { taper: 0, srot: [0, 0, -s * 65] }]]);
/** A solid relative to the grip: shape, size, centre, colour, options. */
type Hold = [shape: Shape, size: Vec3, at: Vec3, color: string, o?: Partial<FigPart>];
/** A small object held in a hand, given as specs relative to the grip. */
const inHand = (side: 'L' | 'R', f: (a: number, d: PersonDims) => Hold[]): Extra =>
  x((d) => f(d.aw, d).map(([shape, size, at, c, o]): Spec => [`hand${side}`, shape, size, at, c, o]));

/** Lean the upper body forward (degrees) and tip the head back up to look ahead. */
const lean = (deg: number, headDeg = -deg * 0.7): Extra => (p) => {
  for (const q of p.list) if (q.name === 'torso') q.rot = [deg, 0, 0];
  else if (q.name === 'head') q.rot = [headDeg, 0, 0];
};
/** A rifle or musket held upright: wooden stock below the fist, barrel above. */
const rifle = (side: 'L' | 'R' = 'R', stock = 'wood', barrel = 'iron'): Extra =>
  inHand(side, (a, d) => [['box', [a * 0.7, a * 3.4, a * 1.1], [0, -a * 1.4, a * 0.6], stock, { round: 0.4 }], ['capsule', [a * 0.35, d.H * 0.26, a * 0.35], [0, a * 0.3 + d.H * 0.13, a * 0.6], barrel]]);
/** An electric guitar slung across the body. */
const guitar = (c: string): Extra =>
  x((d) => [['torso', 'ball', [d.tw * 0.8, d.torsoH * 0.5, d.td * 0.35], [d.tw * 0.12, d.torsoH * 0.2, d.td * 0.85], c, { srot: [0, 0, -30], layer: 6 }], rod('torso', [d.tw * 0.05, d.torsoH * 0.3, d.td * 0.9], [-d.tw * 0.75, d.torsoH * 0.95, d.td * 0.9], d.tw * 0.1, 'darkwood', { layer: 6 }), ['torso', 'box', [d.tw * 0.16, d.tw * 0.28, d.td * 0.15], [-d.tw * 0.85, d.torsoH * 1.05, d.td * 0.9], 'black', { srot: [0, 0, 55], layer: 6 }]]);
/** Diamond patches on the chest and legs (harlequins, jockey silks). */
const diamonds = (cs: string[]): Extra =>
  x((d) => {
    const out: Spec[] = [];
    [[-0.25, 0.3], [0.25, 0.3], [0, 0.55], [-0.25, 0.8], [0.25, 0.8]].forEach(([u, v], i) => out.push(['torso', 'box', [d.tw * 0.24, d.tw * 0.24, d.td * 0.06], [d.tw * u, d.torsoH * v, d.td * 0.52], cs[i % cs.length], { srot: [0, 0, 45], noInk: true, layer: 4, round: 0.1 }]));
    return out;
  });
/** A bicorne worn sideways (Napoleon, harlequins). */
const bicorne = (c: string, cockade?: string): Extra =>
  x((d) => {
    const out: Spec[] = [['head', 'wedge', [d.headW * 2.0, d.headH * 0.6, d.headD * 0.75], [0, top(d) + d.headH * 0.14, -d.headD * 0.05], c]];
    if (cockade) out.push(['head', 'ball', [d.headW * 0.2, d.headW * 0.2, d.headW * 0.08], [d.headW * 0.45, top(d) + d.headH * 0.12, d.headD * 0.33], cockade, { layer: 6 }]);
    return out;
  });
/** A heart held up in one hand. */
const heartIn = (side: 'L' | 'R', c = 'red', k = 1): Extra =>
  inHand(side, (a) => [['ball', [a * 1.8 * k, a * 1.8 * k, a * 0.9 * k], [a * 0.55 * k, a * (1.2 + 1.3 * k), a * 1.0], c], ['ball', [a * 1.8 * k, a * 1.8 * k, a * 0.9 * k], [-a * 0.55 * k, a * (1.2 + 1.3 * k), a * 1.0], c], ['cyl', [a * 2.5 * k, a * 1.6 * k, a * 0.9 * k], [0, a * (1.2 + 0.35 * k), a * 1.0], c, { taper: 0, segs: 4, srot: [180, 45, 0] }], ['capsule', [a * 0.2, a * 1.6, a * 0.2], [0, a * 0.6, a * 1.0], 'white']]);

/** Several people (or figures) side by side as one figure. */
const crowd = (key: string, members: Array<[Figure, number, number?]>): Figure => {
  const parts: FigPart[] = [];
  members.forEach(([f, dx, dz = 0], i) => {
    for (const q of f.parts) parts.push({ ...q, name: `m${i}_${q.name}`, parent: q.parent ? `m${i}_${q.parent}` : undefined, at: q.parent ? q.at : [q.at[0] + dx, q.at[1], q.at[2] + dz] });
  });
  return measure({ key, group: 'people', rig: 'prop', view: 'front', parts, face: members[0][0].face });
};

export const ENTRIES: CatalogEntry[] = [
  e('football player', 'town', 'sports', () =>
    who('football player', { h: 1.85, build: 1.3, top: 'red', bottom: 'white', shoes: 'black', legs: 'red', acc: [hat('helmet', 'navy'), x((d) => [['head', 'box', [d.headW * 0.78, d.headH * 0.06, d.headD * 0.08], [0, d.headY - d.headH * 0.14, d.headD * 0.56], 'gray'], ['head', 'box', [d.headW * 0.06, d.headH * 0.32, d.headD * 0.08], [0, d.headY - d.headH * 0.24, d.headD * 0.55], 'gray']]), shoulders('red', 1.2), chest('22', 'white', 0.45), inHand('L', (a) => [['ball', [a * 1.5, a * 1.5, a * 2.6], [0, -a * 0.6, a * 0.9], 'brown']])] }),
  ),
  e('forest ranger', 'town', 'outdoors', () =>
    who('forest ranger', { top: '#c9b07a', long: true, bottom: 'darkgreen', shoes: 'darkbrown', acc: [hat('cowboy', '#8a6a3a'), wear('badge'), wear('belt', 'darkbrown'), x2((d, s) => [['torso', 'cyl', [d.tw * 0.16, d.torsoH * 0.2, d.tw * 0.16], [s * d.tw * 0.09, d.torsoH * 0.55, d.td * 0.62], 'black']]), held('map', 'paper', 'L')] }),
  ),
  e('fortune teller', 'town', 'entertainment', () =>
    who('fortune teller', { top: 'magenta', long: true, skirt: 'purple', hair: 'black', style: 'long', acc: [hat('bandana', 'purple'), earrings(), wear('necklace', 'gold'), wear('sash', 'gold'), inHand('L', (a) => [['ball', [a * 3, a * 3, a * 3], [0, a * 0.9, a * 2.2], '#c7b5ff'], ['cyl', [a * 1.8, a * 0.6, a * 1.8], [0, -a * 0.6, a * 2.2], 'gold']])] }),
  ),
  e('fraternity brother', 'town', 'school', () =>
    who('fraternity brother', { top: 'navy', bottom: 'tan', shoes: 'white', style: 'short', acc: [hat('cap', 'red'), chest('ΣΑΕ', 'navy', 0.6), held('cup', 'red')] }),
  ),
  e('galileo', 'town', 'history', () =>
    who('galileo', { h: 1.6, top: 'black', long: true, bottom: 'black', hair: 'lightgray', style: 'short', beard: 'lightgray', acc: [face('beard', 'lightgray'), wear('robe', '#3a2a24'), x((d) => [['torso', 'torus', [d.tw * 0.62, d.tw * 0.62, d.td * 0.2], [0, d.torsoH * 0.98, 0], 'white', { srot: [90, 0, 0], tube: 0.4 }]]), inHand('L', (a, d) => [['cyl', [a * 0.7, d.H * 0.32, a * 0.7], [0, a * 2.2, a * 2.4], 'brass', { srot: [50, 0, 0], taper: 0.65 }]])] }),
  ),
  e('gambler', 'town', 'entertainment', () =>
    who('gambler', { top: 'white', long: true, bottom: 'black', shoes: 'black', style: 'short', acc: [wear('vest', 'darkred'), wear('bowtie', 'black'), x((d) => [['head', 'cyl', [d.headW * 1.08, d.headH * 0.12, d.headD * 1.04], [0, top(d) - d.headH * 0.15, 0], 'green'], ['head', 'box', [d.headW * 0.9, d.headH * 0.04, d.headD * 0.5], [0, top(d) - d.headH * 0.15, d.headD * 0.55], '#4fbf6a', { srot: [-15, 0, 0] }]]), inHand('L', (a) => [-25, 0, 25].map((r) => ['box', [a * 1.1, a * 1.6, a * 0.08], [0, a * 0.3, a * 1.1], 'white', { srot: [-20, 0, r] }] as Hold))] }),
  ),
  e('game developer', 'town', 'office', () =>
    who('game developer', { top: 'darkgray', long: true, bottom: 'denim', shoes: 'white', acc: [face('glasses', 'black'), hat('headphones', 'black'), inHand('L', (a) => [['box', [a * 3.4, a * 0.25, a * 2.4], [0, -a * 0.4, a * 1.4], 'silver'], ['box', [a * 3.4, a * 2.2, a * 0.2], [0, a * 0.7, a * 0.3], 'silver', { srot: [-15, 0, 0] }], ['box', [a * 3, a * 1.8, a * 0.06], [0, a * 0.72, a * 0.43], '#6fd3e8', { srot: [-15, 0, 0], noInk: true }]])] }),
  ),
  e('game show host', 'town', 'entertainment', () =>
    who('game show host', { h: 1.75, top: 'purple', long: true, bottom: 'purple', shoes: 'black', hair: 'darkbrown', style: 'short', acc: [wear('suit', 'purple'), held('mic'), held('letter', 'gold', 'L')] }),
  ),
  e('gamer', 'town', 'hobbies', () =>
    who('gamer', { top: 'green', long: true, bottom: 'darkgray', shoes: 'white', acc: [hat('headphones', 'black'), x((d) => [['head', 'capsule', [d.headW * 0.05, d.headW * 0.4, d.headW * 0.05], [-d.headW * 0.5, d.headY - d.headH * 0.2, d.headD * 0.3], 'black', { srot: [70, 0, 0] }]]), inHand('L', (a) => [['box', [a * 2.4, a * 1.2, a * 0.9], [0, -a * 0.2, a * 1.2], 'black', { round: 0.6 }], ['ball', [a * 0.4, a * 0.4, a * 0.3], [a * 0.6, -a * 0.1, a * 1.7], 'red'], ['ball', [a * 0.4, a * 0.4, a * 0.3], [-a * 0.6, -a * 0.1, a * 1.7], 'lime']])] }),
  ),
  e('gangster', 'town', 'crime', () =>
    who('gangster', { top: 'darkgray', long: true, bottom: 'darkgray', shoes: 'black', style: 'short', hair: 'black', acc: [wear('suit', '#3a3a44'), bands('#55555f', [0.2, 0.4, 0.6, 0.8], 0.02), fedora('#2a2a30', 'white'), inHand('R', (a) => [['box', [a * 0.9, a * 1.1, a * 4.2], [0, -a * 0.4, a * 2], 'black'], ['cyl', [a * 1.6, a * 0.7, a * 1.6], [0, -a * 1.3, a * 2.2], 'black', { srot: [90, 0, 0] }], ['box', [a * 0.7, a * 1.2, a * 1.4], [0, -a * 1.3, a * 0.2], 'darkwood']])] }),
  ),
  e('garbage man', 'town', 'city workers', () =>
    who('garbage man', { top: 'orange', bottom: 'navy', shoes: 'black', acc: [hat('cap', 'orange'), bands('#e8eef0', [0.35, 0.55], 0.06), gloves('#e8c43a'), held('bag', 'black'), inHand('R', (a) => [['ball', [a * 3, a * 3.4, a * 2.6], [0, -a * 2.2, a * 0.6], 'black']])] }),
  ),
  e('garbage woman', 'town', 'city workers', () =>
    who('garbage woman', { top: 'orange', long: true, bottom: 'navy', shoes: 'black', style: 'ponytail', acc: [hat('cap', 'orange'), bands('#e8eef0', [0.35, 0.55], 0.06), gloves('#e8c43a'), x((d) => [['', 'box', [d.tw * 0.9, d.H * 0.45, d.tw * 0.9], [-d.tw * 1.05, d.H * 0.23, d.td * 0.2], 'green', { round: 0.15 }], ['', 'box', [d.tw * 0.98, d.H * 0.04, d.tw * 0.98], [-d.tw * 1.05, d.H * 0.47, d.td * 0.2], 'darkgreen', { round: 0.3 }]])] }),
  ),
  e('garden gnome', 'garden', 'garden decor', () =>
    who('garden gnome', { h: 0.34, build: 1.35, skin: 'skin1', top: 'blue', long: true, bottom: 'brown', shoes: 'darkbrown', hair: 'white', style: 'short', blush: '#ff8a8a', acc: [cone('red', 1.25), face('longbeard', 'white'), wear('belt', 'black'), held('shovel'), onBase('grass', 0.03)] }),
  ),
  e('gardener', 'town', 'trades', () =>
    who('gardener', { top: 'green', long: true, bottom: 'tan', shoes: 'darkbrown', acc: [hat('straw'), wear('apron', 'darkgreen'), gloves('#e8c43a'), held('shovel'), inHand('L', (a) => [['cyl', [a * 2.2, a * 2, a * 2.2], [0, -a * 1.6, a * 0.5], 'teal'], ['capsule', [a * 0.35, a * 2.6, a * 0.35], [0, -a * 0.7, a * 2.2], 'teal', { srot: [60, 0, 0] }]])] }),
  ),
  e('gargoyle', 'fantasy', 'monsters', () =>
    who('gargoyle', { h: 1.35, build: 1.25, skin: 'stone', top: 'stone', bottom: 'stone', shoes: 'stone', style: 'bald', eyes: '#d23a2a', acc: [hat('horns', '#7d7d78'), pointyEars('stone'), body('batwings', '#7d7d78'), body('tail', '#8c8c86'), onBase('#7d7d78', 0.15, 2.8)] }),
  ),
  e('geek', 'town', 'everyday people', () =>
    who('geek', { top: 'white', bottom: 'tan', shoes: 'brown', style: 'short', acc: [face('glasses', 'black'), wear('bowtie', 'red'), x((d) => [['torso', 'box', [d.tw * 0.18, d.torsoH * 0.2, d.td * 0.06], [d.tw * 0.25, d.torsoH * 0.7, d.td * 0.52], 'blue'], ...[1, -1].map((s): Spec => ['torso', 'box', [d.tw * 0.07, d.torsoH * 1.0, d.td * 1.12], [s * d.tw * 0.22, d.torsoH * 0.5, 0], 'red', { layer: 4 }])]), held('book', 'blue', 'L')] }),
  ),
  e('geisha', 'town', 'arts', () =>
    who('geisha', { h: 1.6, skin: '#f8f1ea', hair: 'black', style: 'bun', top: 'red', long: true, bottom: 'red', shoes: 'white', blush: '#e86a7a', acc: [wear('robe', 'red'), x((d) => [['torso', 'box', [d.tw * 1.1, d.torsoH * 0.3, d.td * 1.14], [0, d.torsoH * 0.22, 0], 'gold', { layer: 2 }], ['torso', 'box', [d.tw * 0.5, d.torsoH * 0.28, d.td * 0.5], [0, d.torsoH * 0.25, -d.td * 0.55], 'gold', { layer: 2 }]]), hat('flower', 'pink'), x((d) => [['head', 'capsule', [d.headW * 0.05, d.headH * 0.5, d.headW * 0.05], [d.headW * 0.25, top(d) + d.headH * 0.05, -d.headD * 0.1], 'gold', { srot: [0, 0, -40] }]]), inHand('L', (a) => [['wedge', [a * 4, a * 3, a * 0.2], [0, a * 1.2, a * 1.2], '#f4a1c0', { srot: [-15, 0, 180] }], ['capsule', [a * 0.3, a * 1.2, a * 0.3], [0, -a * 0.1, a * 1.2], 'darkwood']])] }),
  ),
  e('general', 'town', 'military', () =>
    who('general', { top: '#5a6b3a', long: true, bottom: '#5a6b3a', shoes: 'black', hair: 'gray', style: 'short', acc: [hat('police', '#4a5a30'), x((d) => [['head', 'cyl', [d.headW * 1.02, d.headH * 0.08, d.headD * 1.02], [0, top(d) - d.headH * 0.02, 0], 'gold']]), shoulders('gold', 0.8), wear('medal'), x((d) => ['red', 'blue', 'gold', 'green'].map((c, i): Spec => ['torso', 'box', [d.tw * 0.12, d.torsoH * 0.06, d.td * 0.08], [-d.tw * (0.12 + (i % 2) * 0.13), d.torsoH * (0.78 - Math.floor(i / 2) * 0.07), d.td * 0.52], c, { layer: 5 }])), wear('belt', 'darkbrown')] }),
  ),
  e('genghis khan', 'town', 'history', () =>
    who('genghis khan', { top: 'darkred', long: true, bottom: 'darkbrown', shoes: 'darkbrown', hair: 'black', style: 'short', acc: [x((d) => [['head', 'cyl', [d.headW * 1.15, d.headH * 0.22, d.headD * 1.1], [0, top(d) - d.headH * 0.08, 0], '#6b4a2a'], ['head', 'cyl', [d.headW * 0.85, d.headH * 0.45, d.headD * 0.8], [0, top(d) + d.headH * 0.2, 0], 'red', { taper: 0.2 }]]), face('mustache', 'black'), face('beard', 'black'), wear('coat', '#7a4a2a'), wear('belt', 'gold'), held('bow'), held('sword', 'silver', 'L')] }),
  ),
  e('genie', 'fantasy', 'spirits', () =>
    who('genie', { skin: '#4e8fd6', top: '#4e8fd6', bottom: '#4e8fd6', style: 'bald', hair: 'black', build: 1.2, acc: [hide(...LEGS), x((d) => [['hips', 'cyl', [d.tw * 1.1, d.legLen * 0.8, d.td * 1.3], [0, -d.legLen * 0.32, 0], '#6fb0ef', { taper: 0.12, srot: [180, 0, 0] }], ['hips', 'ball', [d.tw * 0.3, d.tw * 0.3, d.tw * 0.3], [d.tw * 0.12, -d.legLen * 0.72, 0], '#6fb0ef'], ['head', 'ball', [d.headW * 0.3, d.headW * 0.3, d.headW * 0.3], [0, top(d) + d.headH * 0.02, 0], 'black'], ['head', 'capsule', [d.headW * 0.16, d.headH * 0.55, d.headW * 0.16], [0, top(d) - d.headH * 0.15, -d.headD * 0.5], 'black', { srot: [-30, 0, 0] }]]), face('beard', 'black'), wear('belt', 'red'), cuffs('gold'), earrings()] }),
  ),
  e('geologist', 'town', 'science', () =>
    who('geologist', { top: '#c9b07a', long: true, bottom: 'olive', shoes: 'darkbrown', acc: [hat('cowboy', 'tan'), wear('vest', 'olive'), wear('backpack', 'darkgreen'), held('hammer'), inHand('L', (a) => [['ball', [a * 1.8, a * 1.4, a * 1.6], [0, -a * 0.4, a * 1.4], '#9a7a6a']])] }),
  ),
  e('george washington', 'town', 'history', () =>
    who('george washington', { h: 1.88, top: 'navy', long: true, bottom: 'cream', shoes: 'black', legs: 'white', hair: 'white', style: 'ponytail', acc: [wear('coat', 'navy'), x((d) => [['torso', 'box', [d.tw * 0.4, d.torsoH * 0.62, d.td * 0.1], [0, d.torsoH * 0.62, d.td * 0.56], 'tan', { layer: 4 }], ['torso', 'ball', [d.tw * 0.26, d.tw * 0.22, d.td * 0.3], [0, d.torsoH * 0.9, d.td * 0.52], 'white', { layer: 5 }], ['head', 'cyl', [d.headW * 1.7, d.headH * 0.28, d.headD * 1.7], [0, top(d) + d.headH * 0.04, 0], 'black', { segs: 3, srot: [0, 90, 0] }]]), shoulders('gold', 0.7), held('sword', 'silver', 'L')] }),
  ),
  e('ghoul (monster)', 'fantasy', 'undead', () =>
    who('ghoul (monster)', { h: 1.75, build: 0.9, skin: '#9fb48a', top: '#5f6155', long: true, bottom: '#4a4a3e', shoes: '#9fb48a', hair: '#3a3a36', style: 'spiky', eyes: '#d23a2a', acc: [x((d) => [['torso', 'wedge', [d.tw * 0.4, d.torsoH * 0.3, d.td * 1.1], [d.tw * 0.25, -d.torsoH * 0.05, 0], '#5f6155', { srot: [0, 0, 180] }], ['hips', 'wedge', [d.lw * 1.2, d.lw * 1.2, d.td], [-d.tw * 0.2, -d.legLen * 0.62, 0], '#4a4a3e', { srot: [0, 0, 180] }]]), gloves('#9fb48a', 1.2)] }),
  ),
  e('giant', 'fantasy', 'monsters', () =>
    who('giant', { h: 6, build: 1.3, top: 'tan', bottom: 'brown', shoes: 'darkbrown', hair: 'darkbrown', style: 'long', beard: 'darkbrown', acc: [face('beard', 'darkbrown'), wear('belt', 'darkbrown'), held('club'), wear('sash', 'brown')] }),
  ),
  e('girlfriend', 'town', 'family', () =>
    who('girlfriend', { h: 1.65, top: 'pink', bottom: 'denim', skirt: 'red', hair: 'brown', style: 'long', shoes: 'red', acc: [hat('bow', 'red'), heartIn('L', 'red', 1.3), held('phone')] }),
  ),
  e('glutton (person)', 'town', 'everyday people', () =>
    who('glutton (person)', { build: 1.4, top: 'yellow', bottom: 'brown', shoes: 'darkbrown', style: 'short', acc: [x((d) => [['torso', 'ball', [d.tw * 1.05, d.torsoH * 0.8, d.td * 1.5], [0, d.torsoH * 0.35, d.td * 0.25], 'yellow'], ['torso', 'wedge', [d.tw * 0.6, d.torsoH * 0.4, d.td * 0.1], [0, d.torsoH * 0.72, d.td * 0.9], 'white', { srot: [0, 0, 180] }]]), inHand('R', (a) => [['capsule', [a * 0.4, a * 2.2, a * 0.4], [0, a * 0.4, a * 1.0], 'cream', { srot: [30, 0, 0] }], ['ball', [a * 1.4, a * 1.9, a * 1.4], [0, a * 1.4, a * 1.6], 'crust', { srot: [30, 0, 0] }]]), held('pizza', 'cheese', 'L')] }),
  ),
  e('gnome', 'fantasy', 'little folk', () =>
    who('gnome', { h: 0.28, build: 1.35, top: 'darkgreen', long: true, bottom: 'brown', shoes: 'darkbrown', hair: 'white', style: 'short', blush: '#ff8a8a', acc: [cone('#d23a2a', 1.3), face('longbeard', 'white'), wear('belt', 'darkbrown'), held('lantern')] }),
  ),
  e('goalie', 'town', 'sports', () =>
    who('goalie', { h: 1.8, top: 'lime', long: true, bottom: 'black', legs: 'lime', shoes: 'black', acc: [chest('1', 'black', 0.3), gloves('orange', 1.6), inHand('L', (a) => [['ball', [a * 3, a * 3, a * 3], [0, -a * 0.6, a * 2], 'white']])] }),
  ),
  e('goblin', 'fantasy', 'monsters', () =>
    who('goblin', { h: 1.05, skin: '#6fa83a', top: 'brown', bottom: 'darkbrown', shoes: '#6fa83a', style: 'bald', eyes: '#f6d24a', acc: [pointyEars('#6fa83a', 1.3), x((d) => [['head', 'ball', [d.headW * 0.22, d.headW * 0.3, d.headW * 0.3], [0, d.headY - d.headH * 0.02, d.headD * 0.5], '#5a9030']]), wear('belt', 'black'), held('knife')] }),
  ),
  e('god', 'fantasy', 'gods', () =>
    who('god', { h: 1.9, build: 1.2, top: 'white', bottom: 'white', shoes: 'tan', hair: 'white', style: 'long', beard: 'white', acc: [face('longbeard', 'white'), wear('toga', 'white'), wear('sash', 'gold'), hat('halo'), inHand('L', (a) => [['box', [a * 0.6, a * 2.2, a * 0.4], [a * 0.3, a * 1.4, a * 0.6], 'yellow', { srot: [0, 0, 25] }], ['box', [a * 0.6, a * 2.2, a * 0.4], [a * 0.3, a * 3.2, a * 0.6], 'yellow', { srot: [0, 0, -25] }], ['cyl', [a * 0.9, a * 1.4, a * 0.4], [a * 0.5, a * 0.1, a * 0.6], 'yellow', { taper: 0, srot: [180, 0, 15] }]])] }),
  ),
  e('goddess', 'fantasy', 'gods', () =>
    who('goddess', { top: 'white', long: true, skirt: 'white', bottom: 'white', shoes: 'gold', hair: 'gold', style: 'long', acc: [wear('robe', 'white'), hat('tiara', 'gold'), wear('sash', 'gold'), wear('necklace', 'gold'), cuffs('gold'), held('staff', 'gold')] }),
  ),
  e('golfer', 'town', 'sports', () =>
    who('golfer', { top: 'white', bottom: '#c9b28a', shoes: 'white', legs: '#c9b28a', acc: [hat('cap', 'navy'), x((d) => [['torso', 'box', [d.tw * 1.06, d.torsoH * 0.5, d.td * 1.1], [0, d.torsoH * 0.55, 0], '#e86f7d', { layer: 1, round: 0.5 }]]), gloves('white'), inHand('R', (a, d) => [['capsule', [a * 0.2, d.H * 0.42, a * 0.2], [0, -d.H * 0.2, a * 0.6], 'silver', { srot: [8, 0, 0] }], ['box', [a * 1.4, a * 0.6, a * 0.7], [0, -d.H * 0.41, a * 0.95], 'darkgray', { round: 0.5 }]])] }),
  ),
  e('goth', 'town', 'subcultures', () =>
    who('goth', { skin: '#f3ece6', top: 'black', long: true, skirt: 'black', bottom: 'black', legs: 'purple', shoes: 'black', hair: 'black', style: 'long', blush: '#c9a0b0', acc: [wear('necklace', 'black'), boots('black'), wear('belt', 'silver'), wear('cloak', '#3a2a3a')] }),
  ),
  e('governor', 'town', 'politics', () =>
    who('governor', { top: 'white', long: true, bottom: 'navy', shoes: 'black', hair: 'gray', style: 'short', acc: [wear('suit', 'navy'), x((d) => [['torso', 'box', [d.tw * 0.12, d.tw * 0.08, d.td * 0.05], [d.tw * 0.3, d.torsoH * 0.78, d.td * 0.56], 'red', { layer: 6 }]]), held('briefcase'), held('flag', 'blue', 'L')] }),
  ),
  e('graduate', 'town', 'school', () =>
    who('graduate', { top: 'black', long: true, bottom: 'black', shoes: 'black', acc: [hat('grad'), wear('robe', 'black'), x((d) => [1, -1].map((s): Spec => ['torso', 'box', [d.tw * 0.18, d.torsoH * 0.9, d.td * 0.1], [s * d.tw * 0.2, d.torsoH * 0.55, d.td * 0.56], 'gold', { layer: 4 }])), held('scroll', 'paper')] }),
  ),
  e('grandfather', 'town', 'family', () =>
    who('grandfather', { h: 1.68, top: 'brown', long: true, bottom: 'gray', shoes: 'darkbrown', hair: 'lightgray', style: 'short', acc: [face('glasses', 'darkbrown'), face('mustache', 'lightgray'), wear('vest', '#c9a06a'), hat('beret', '#7a6a5a'), held('cane')] }),
  ),
  e('grandmother', 'town', 'family', () =>
    who('grandmother', { h: 1.58, top: 'purple', long: true, skirt: '#b9a3d6', shoes: 'black', legs: 'skin2', skin: 'skin2', hair: 'lightgray', style: 'bun', acc: [face('glasses', 'purple'), wear('necklace', 'white'), x((d) => [['torso', 'torus', [d.tw * 0.85, d.tw * 0.7, d.td * 0.5], [0, d.torsoH * 0.9, 0], 'pink', { srot: [80, 0, 0], tube: 0.4 }]]), inHand('L', (a) => [['ball', [a * 2, a * 2, a * 2], [0, -a * 0.8, a * 1.4], 'pink'], ['capsule', [a * 0.15, a * 3, a * 0.15], [a * 0.4, a * 0.2, a * 1.6], 'silver', { srot: [20, 0, 25] }], ['capsule', [a * 0.15, a * 3, a * 0.15], [-a * 0.4, a * 0.2, a * 1.6], 'silver', { srot: [20, 0, -25] }]])] }),
  ),
  e('gravedigger', 'town', 'trades', () =>
    who('gravedigger', { top: 'darkgray', long: true, bottom: 'black', shoes: 'black', hair: 'gray', style: 'short', acc: [hat('bowler', '#3a3a3a'), wear('coat', '#3a3530'), held('shovel'), held('lantern', 'flame', 'L')] }),
  ),
  e('groom', 'town', 'wedding', () =>
    who('groom', { h: 1.75, top: 'black', long: true, bottom: 'black', shoes: 'black', style: 'short', acc: [shirtFront(), wear('bowtie', 'black'), flower('white')] }),
  ),
  e('groomsman', 'town', 'wedding', () =>
    who('groomsman', { h: 1.75, top: 'gray', long: true, bottom: 'gray', shoes: 'black', style: 'short', acc: [wear('suit', 'gray'), flower('pink')] }),
  ),
  e('groupie', 'town', 'entertainment', () =>
    who('groupie', { top: 'black', skirt: 'denim', legs: 'black', shoes: 'black', style: 'long', hair: 'gold', acc: [chest('ROCK', 'black', 0.6), x((d) => [['torso', 'torus', [d.tw * 0.7, d.tw * 1.1, d.td * 0.06], [0, d.torsoH * 0.78, d.td * 0.2], 'red', { srot: [60, 0, 0], tube: 0.06 }], ['torso', 'box', [d.tw * 0.25, d.torsoH * 0.18, d.td * 0.06], [0, d.torsoH * 0.36, d.td * 0.6], 'lime', { layer: 6 }]]), held('sign', 'wood')] }),
  ),
  e('guerilla', 'town', 'military', () =>
    who('guerilla', { top: 'olive', long: true, bottom: 'olive', shoes: 'black', beard: 'black', acc: [hat('beret', 'black'), face('beard', 'black'), x((d) => [[0.2, 0.3, 'darkgreen'], [-0.25, 0.7, 'brown'], [0.1, 0.8, 'darkgreen'], [-0.15, 0.25, 'brown']].map(([u, v, c]): Spec => ['torso', 'ball', [d.tw * 0.25, d.torsoH * 0.18, d.td * 0.08], [d.tw * (u as number), d.torsoH * (v as number), d.td * 0.53], c as string, { noInk: true, layer: 4 }])), wear('sash', 'darkbrown'), held('blaster', 'darkgray')] }),
  ),
  e('guidance counselor', 'town', 'school', () =>
    who('guidance counselor', { top: 'teal', long: true, bottom: 'tan', shoes: 'brown', style: 'bun', acc: [face('glasses', 'darkbrown'), wear('necklace', 'blue'), held('clipboard'), held('book', 'orange', 'L')] }),
  ),
  e('guitarist', 'town', 'music', () =>
    who('guitarist', { top: 'black', long: true, bottom: 'denim', shoes: 'black', style: 'long', hair: 'darkbrown', acc: [face('sunglasses'), guitar('red')] }),
  ),
  e('guy', 'town', 'everyday people', () => who('guy', { h: 1.75, top: 'blue', bottom: 'denim', shoes: 'white', style: 'short', hair: 'brown' })),
  e('hades', 'fantasy', 'gods', () =>
    who('hades', { h: 1.9, skin: '#9aa3b0', top: '#2a2a3a', long: true, bottom: '#2a2a3a', shoes: 'black', style: 'bald', eyes: '#f6d24a', acc: [wear('toga', '#2a2a3a'), wear('sash', '#4a5a7a'), x((d) => [-0.28, 0, 0.28].map((u, i): Spec => ['head', 'cyl', [d.headW * 0.5, d.headH * (i === 1 ? 1.0 : 0.75), d.headW * 0.5], [d.headW * u, top(d) + d.headH * (i === 1 ? 0.32 : 0.2), -d.headD * 0.1], '#4fb0ff', { taper: 0, srot: [0, 0, -u * 70] }])), held('pitchfork', 'black')] }),
  ),
  e('hairdresser', 'town', 'beauty', () =>
    who('hairdresser', { top: 'black', long: true, bottom: 'black', shoes: 'black', hair: 'magenta', style: 'bun', acc: [wear('apron', 'pink'), held('scissors'), inHand('L', (a) => [['capsule', [a * 0.7, a * 1.8, a * 0.7], [0, -a * 0.3, a * 0.6], 'pink'], ['cyl', [a * 1.3, a * 2.6, a * 1.3], [0, a * 0.7, a * 1.8], 'pink', { srot: [90, 0, 0] }], ['cyl', [a * 1.0, a * 0.2, a * 1.0], [0, a * 0.7, a * 3.1], 'darkgray', { srot: [90, 0, 0] }]])] }),
  ),
  e('harlequin', 'town', 'entertainment', () =>
    who('harlequin', { top: 'red', long: true, bottom: 'red', shoes: 'black', style: 'short', hair: 'black', acc: [diamonds(['gold', 'green', 'blue', 'gold', 'green']), x2((d, _s, side) => [[`leg${side}`, 'box', [d.lw * 0.7, d.lw * 0.7, d.lw * 0.1], [0, -d.legLen * 0.25, d.lw * 0.5], side === 'L' ? 'gold' : 'green', { srot: [0, 0, 45], noInk: true, layer: 4 }], [`shin${side}`, 'box', [d.lw * 0.7, d.lw * 0.7, d.lw * 0.1], [0, -d.legLen * 0.2, d.lw * 0.47], side === 'L' ? 'blue' : 'gold', { srot: [0, 0, 45], noInk: true, layer: 4 }]]), x((d) => [['head', 'box', [d.headW * 0.85, d.headH * 0.2, d.headD * 0.12], [0, d.headY + d.headH * 0.05, d.headD * 0.46], 'black', { round: 0.6 }], ['torso', 'torus', [d.tw * 0.9, d.tw * 0.9, d.td * 0.3], [0, d.torsoH * 0.98, 0], 'white', { srot: [90, 0, 0], tube: 0.45 }]]), bicorne('black'), held('baton', 'wood')] }),
  ),
  e('harley quinn', 'town', 'comics', () =>
    who('harley quinn', { skin: '#f8f1ea', top: 'black', long: true, bottom: 'black', shoes: 'black', hair: '#f2e2b0', style: 'pigtails', acc: [x((d) => [['torso', 'box', [d.tw * 0.52, d.torsoH * 1.0, d.td * 1.1], [d.tw * 0.26, d.torsoH * 0.5, 0], 'red', { layer: 2, round: 0.5 }], ['legL', 'capsule', [d.lw * 1.08, d.legLen * 0.5, d.lw * 1.08], [0, -d.legLen * 0.23, 0], 'red', { layer: 2 }], ...[1, -1].map((s): Spec => ['head', 'ball', [d.headW * 0.3, d.headH * 0.32, d.headW * 0.3], [s * (d.headW * 0.52 + d.headH * 0.24), d.headY - d.headH * 0.42, -d.headD * 0.1], s === 1 ? 'pink' : 'blue', { layer: 1 }]), ['head', 'box', [d.headW * 0.85, d.headH * 0.18, d.headD * 0.12], [0, d.headY + d.headH * 0.05, d.headD * 0.46], 'black', { round: 0.6 }]]), held('bat', 'wood')] }),
  ),
  e('hazmat worker', 'town', 'emergency', () =>
    who('hazmat worker', { h: 1.75, build: 1.15, top: 'yellow', long: true, bottom: 'yellow', shoes: 'black', style: 'none', acc: [hat('hood', 'yellow'), x((d) => [['head', 'ball', [d.headW * 0.9, d.headH * 0.6, d.headD * 0.3], [0, d.headY + d.headH * 0.05, d.headD * 0.42], 'glass'], ['head', 'ball', [d.headW * 0.4, d.headH * 0.3, d.headD * 0.3], [0, d.headY - d.headH * 0.3, d.headD * 0.48], 'black'], ...[1, -1].map((s): Spec => ['head', 'cyl', [d.headW * 0.24, d.headW * 0.2, d.headW * 0.24], [s * d.headW * 0.25, d.headY - d.headH * 0.36, d.headD * 0.55], 'darkgray', { srot: [70, 0, s * 30] }])]), gloves('black'), boots('black'), inHand('L', (a) => [['cyl', [a * 2.6, a * 3.2, a * 2.6], [0, -a * 2.2, a * 0.6], 'yellow'], ['box', [a * 1.2, a * 1.2, a * 0.1], [0, -a * 2.2, a * 1.95], 'black', { srot: [0, 0, 45] }]])] }),
  ),
  e('head coach', 'town', 'sports', () =>
    who('head coach', { h: 1.75, top: 'navy', long: true, bottom: 'gray', shoes: 'white', style: 'short', acc: [hat('cap', 'navy'), wear('whistle'), held('clipboard'), x((d) => [['torso', 'box', [d.tw * 0.25, d.tw * 0.12, d.td * 0.05], [d.tw * 0.24, d.torsoH * 0.75, d.td * 0.54], 'white', { layer: 5 }]])] }),
  ),
  e('headless horseman', 'fantasy', 'undead', () =>
    who('headless horseman', { h: 1.8, top: 'black', long: true, bottom: '#2a2726', shoes: 'black', style: 'none', acc: [hide('head', 'face', 'earL', 'earR'), wear('cape', '#2a2a30'), x((d) => [['torso', 'cyl', [d.tw * 0.7, d.torsoH * 0.18, d.td * 1.0], [0, d.torsoH * 1.0, 0], '#4a2a3a', { taper: 1.3 }], ['torso', 'cyl', [d.tw * 0.35, d.torsoH * 0.05, d.td * 0.5], [0, d.torsoH * 1.09, 0], 'darkred']]), boots('black'), held('sword', 'silver'), inHand('L', (a) => [['ball', [a * 3.4, a * 2.9, a * 3.2], [0, -a * 0.6, a * 1.8], 'orange'], ['capsule', [a * 0.4, a * 0.9, a * 0.4], [0, a * 1.0, a * 1.8], 'darkgreen'], ['cyl', [a * 0.8, a * 0.7, a * 0.2], [-a * 0.6, -a * 0.2, a * 3.4], 'flame', { taper: 0, segs: 3 }], ['cyl', [a * 0.8, a * 0.7, a * 0.2], [a * 0.6, -a * 0.2, a * 3.4], 'flame', { taper: 0, segs: 3 }]])] }),
  ),
  e('hector', 'town', 'legends', () =>
    who('hector', { h: 1.75, build: 1.15, skin: 'skin3', top: 'darkred', bottom: 'darkred', skirt: 'bronze', shoes: 'brown', hair: 'black', style: 'short', beard: 'black', acc: [hat('helmet', 'bronze'), x((d) => [['head', 'box', [d.headW * 0.2, d.headH * 0.4, d.headD * 1.25], [0, top(d) + d.headH * 0.18, -d.headD * 0.05], 'red', { round: 0.7 }]]), wear('armor', 'bronze'), wear('cape', 'red'), boots('bronze'), held('spear'), held('shield', 'bronze', 'L')] }),
  ),
  e('hercules', 'town', 'legends', () =>
    who('hercules', { h: 2.0, build: 1.45, skin: 'skin3', top: 'tan', skirt: 'tan', bottom: 'tan', shoes: 'brown', hair: 'darkbrown', style: 'short', acc: [x((d) => [['head', 'ball', [d.headW * 1.2, d.headH * 1.05, d.headD * 1.0], [0, d.headY + d.headH * 0.14, -d.headD * 0.2], '#c98a3a', { layer: -2 }]]), wear('cape', '#c98a3a'), x((d) => [...[1, -1].map((s): Spec => ['head', 'ball', [d.headW * 0.25, d.headW * 0.25, d.headW * 0.2], [s * d.headW * 0.42, top(d) + d.headH * 0.02, d.headD * 0.1], '#c98a3a']), ['torso', 'box', [d.tw * 0.5, d.torsoH * 0.9, d.td * 1.12], [-d.tw * 0.3, d.torsoH * 0.5, 0], 'skin3', { srot: [0, 0, 25], layer: 2 }]]), wear('belt', 'brown'), held('club', 'wood')] }),
  ),
  e('hero (person)', 'town', 'comics', () =>
    who('hero (person)', { h: 1.8, build: 1.25, top: 'blue', long: true, bottom: 'blue', shoes: 'red', style: 'short', hair: 'black', acc: [wear('cape', 'red'), boots('red'), wear('belt', 'yellow'), x((d) => [['torso', 'box', [d.tw * 0.35, d.tw * 0.35, d.td * 0.08], [0, d.torsoH * 0.68, d.td * 0.52], 'yellow', { srot: [0, 0, 45], layer: 4 }], ['torso', 'box', [d.tw * 0.18, d.tw * 0.18, d.td * 0.08], [0, d.torsoH * 0.68, d.td * 0.56], 'red', { srot: [0, 0, 45], layer: 5 }], ['head', 'box', [d.headW * 0.85, d.headH * 0.16, d.headD * 0.12], [0, d.headY + d.headH * 0.05, d.headD * 0.46], 'navy', { round: 0.6 }]])] }),
  ),
  e('heroine', 'town', 'comics', () =>
    who('heroine', { h: 1.7, top: 'purple', long: true, bottom: 'purple', shoes: 'gold', hair: 'red', style: 'ponytail', acc: [wear('cape', 'pink'), boots('gold'), wear('belt', 'gold'), hat('tiara', 'gold'), x((d) => [['torso', 'box', [d.tw * 0.3, d.tw * 0.3, d.td * 0.08], [0, d.torsoH * 0.68, d.td * 0.52], 'gold', { srot: [0, 0, 45], layer: 4 }], ['head', 'box', [d.headW * 0.85, d.headH * 0.16, d.headD * 0.12], [0, d.headY + d.headH * 0.05, d.headD * 0.46], 'magenta', { round: 0.6 }]])] }),
  ),
  e('hillbilly', 'town', 'subcultures', () =>
    who('hillbilly', { top: 'red', long: true, bottom: 'denim', shoes: 'skin2', skin: 'skin2', hair: 'brown', style: 'long', beard: 'brown', acc: [hat('straw'), face('longbeard', 'brown'), wear('overalls', 'denim'), x2((d, s) => [['torso', 'box', [d.tw * 0.12, d.torsoH * 0.6, d.td * 0.08], [s * d.tw * 0.25, d.torsoH * 0.72, d.td * 0.53], 'denim', { layer: 4 }]]), inHand('L', (a) => [['ball', [a * 2.6, a * 2.8, a * 2.6], [0, -a * 2, a * 0.6], 'tan'], ['cyl', [a * 0.8, a * 1.0, a * 0.8], [0, -a * 0.4, a * 0.6], 'tan'], ['box', [a * 1.6, a * 1.0, a * 0.1], [0, -a * 2, a * 1.95], 'paper', { role: 'label', text: 'XXX' }]])] }),
  ),
  e('hippie', 'town', 'subcultures', () =>
    who('hippie', { top: 'magenta', long: true, bottom: 'denim', shoes: 'brown', hair: 'brown', style: 'long', acc: [hat('headband', 'orange'), hat('flower', 'yellow'), face('glasses', 'orange'), x((d) => [[0.25, 0.3, 'yellow'], [-0.2, 0.55, 'cyan'], [0.15, 0.8, 'lime'], [-0.25, 0.15, 'orange']].map(([u, v, c]): Spec => ['torso', 'ball', [d.tw * 0.3, d.torsoH * 0.22, d.td * 0.08], [d.tw * (u as number), d.torsoH * (v as number), d.td * 0.52], c as string, { noInk: true, layer: 4 }])), x2((d, _s, side) => [[`shin${side}`, 'cyl', [d.lw * 1.0, d.legLen * 0.25, d.lw * 1.0], [0, -d.legLen * 0.33, 0], 'denim', { taper: 1.7 }]]), wear('necklace', 'silver'), held('bouquet')] }),
  ),
  e('hipster', 'town', 'subcultures', () =>
    who('hipster', { top: 'darkred', long: true, bottom: 'darkgray', shoes: 'brown', hair: 'darkbrown', style: 'short', beard: 'darkbrown', acc: [hat('beanie', '#3f7a6a'), face('glasses', 'black'), face('beard', 'darkbrown'), bands('#2a2726', [0.25, 0.5, 0.75], 0.05), inHand('L', (a) => [['cyl', [a * 1.2, a * 1.8, a * 1.2], [0, a * 0.2, a * 1.0], 'white', { taper: 1.2 }], ['cyl', [a * 1.3, a * 0.7, a * 1.3], [0, a * 0.1, a * 1.0], 'tan', { taper: 1.15 }]])] }),
  ),
  e('historian', 'town', 'academia', () =>
    who('historian', { top: 'white', long: true, bottom: 'brown', shoes: 'darkbrown', hair: 'gray', style: 'short', acc: [wear('coat', '#8a6a4a'), shirtFront(), wear('tie', 'darkgreen'), face('glasses', 'darkbrown'), held('book', 'darkred'), held('scroll', 'paper', 'L')] }),
  ),
  e('hobo', 'town', 'everyday people', () =>
    who('hobo', { top: '#7a6a5a', long: true, bottom: '#5a5040', shoes: 'darkbrown', hair: 'darkbrown', style: 'short', beard: '#5a4a3a', acc: [hat('beanie', '#5c6166'), face('beard', '#5a4a3a'), x((d) => [['torso', 'box', [d.tw * 0.22, d.torsoH * 0.2, d.td * 0.06], [d.tw * 0.22, d.torsoH * 0.35, d.td * 0.52], '#a0522d', { layer: 4 }], ['legL', 'box', [d.lw * 0.7, d.lw * 0.7, d.lw * 0.1], [0, -d.legLen * 0.25, d.lw * 0.5], '#8a8f3a', { layer: 4 }]]), x((d) => [rod('handR', [0, -d.aw * 0.3, d.aw * 0.4], [0, d.H * 0.36, -d.td * 1.2], d.aw * 0.35, 'wood'), ['handR', 'ball', [d.aw * 3.2, d.aw * 2.8, d.aw * 3.2], [0, d.H * 0.36, -d.td * 1.2 - d.aw], 'red']])] }),
  ),
  e('hockey player', 'town', 'sports', () =>
    who('hockey player', { h: 1.8, build: 1.25, top: 'red', long: true, bottom: 'black', legs: 'red', shoes: 'black', acc: [hat('helmet', 'white'), chest('9', 'white', 0.4), bands('white', [0.15], 0.1), gloves('black', 1.35), inHand('R', (a, d) => [['capsule', [a * 0.35, d.H * 0.42, a * 0.35], [0, -d.H * 0.18, a * 0.8], 'black', { srot: [12, 0, 0] }], ['box', [a * 0.5, a * 0.8, a * 3.2], [0, -d.H * 0.4, a * 2.2], 'black', { round: 0.3 }]])] }),
  ),
  e('hostage', 'town', 'crime', () =>
    who('hostage', { top: 'white', long: true, bottom: 'gray', shoes: 'brown', acc: [x((d) => [0.4, 0.7].map((v): Spec => ['torso', 'torus', [d.tw * 1.65, d.td * 1.9, d.torsoH * 0.08], [0, d.torsoH * v, 0], 'tan', { srot: [90, 0, 0], tube: 0.12 }])), x((d) => [['head', 'torus', [d.headW * 1.04, d.headD * 1.0, d.headH * 0.14], [0, d.headY - d.headH * 0.14, 0], 'white', { srot: [90, 0, 0], tube: 0.25 }]])] }),
  ),
  e('hula dancer', 'town', 'arts', () =>
    who('hula dancer', { top: 'skin3', skin: 'skin3', skirt: '#a8b84a', legs: 'skin3', bottom: 'skin3', shoes: 'skin3', hair: 'black', style: 'long', acc: [x((d) => [...[1, -1].map((s): Spec => ['torso', 'ball', [d.tw * 0.32, d.tw * 0.3, d.td * 0.5], [s * d.tw * 0.18, d.torsoH * 0.72, d.td * 0.35], 'darkbrown']), ['torso', 'torus', [d.tw * 0.85, d.tw * 0.75, d.td * 0.5], [0, d.torsoH * 0.88, d.td * 0.15], 'pink', { srot: [70, 0, 0], tube: 0.4 }], ['hips', 'cyl', [d.tw * 1.1, d.lw * 0.5, d.td * 1.25], [0, d.lw * 0.35, 0], '#e86f7d']]), hat('flower', 'red'), cuffs('pink')] }),
  ),
  e('human', 'town', 'everyday people', () => who('human', { top: 'white', bottom: 'blue', shoes: 'gray', hair: 'brown', style: 'short' })),
  e('humpty dumpty', 'town', 'storybook', () =>
    m('humpty dumpty')
      .box([1.1, 0.7, 0.45], [0, 0.35, 0], { color: '#b5543c', round: 0.05 })
      .box([1.16, 0.06, 0.5], [0, 0.72, 0], { color: 'stone', round: 0.2 })
      .box([0.3, 0.12, 0.02], [-0.3, 0.2, 0.23], { color: '#c9704a', noInk: true })
      .box([0.3, 0.12, 0.02], [0.2, 0.45, 0.23], { color: '#c9704a', noInk: true })
      .ball([0.8, 1.0, 0.72], [0, 1.24, 0.03], { color: '#f6ecd0' })
      .torus([0.8, 0.73, 0.1], [0, 1.08, 0.03], { color: 'blue', rot: [90, 0, 0], tube: 0.18 })
      .ball([0.1, 0.12, 0.05], [0.13, 1.42, 0.37], { color: 'black', eye: true, name: 'eyeL' })
      .ball([0.1, 0.12, 0.05], [-0.13, 1.42, 0.37], { color: 'black', eye: true, name: 'eyeR' })
      .capsule([0.04, 0.22, 0.03], [0, 1.27, 0.38], { color: 'darkred', rot: [0, 0, 90] })
      .ball([0.12, 0.09, 0.06], [0.07, 1.0, 0.38], { color: 'red' })
      .ball([0.12, 0.09, 0.06], [-0.07, 1.0, 0.38], { color: 'red' })
      .rod([0.36, 1.15, 0.05], [0.5, 0.9, 0.2], 0.08, 'red')
      .rod([-0.36, 1.15, 0.05], [-0.5, 0.9, 0.2], 0.08, 'red')
      .ball(0.1, [0.52, 0.86, 0.22], { color: 'white' })
      .ball(0.1, [-0.52, 0.86, 0.22], { color: 'white' })
      .rod([0.15, 0.78, 0.22], [0.16, 0.45, 0.3], 0.09, 'navy')
      .rod([-0.15, 0.78, 0.22], [-0.16, 0.45, 0.3], 0.09, 'navy')
      .box([0.12, 0.08, 0.2], [0.16, 0.41, 0.36], { color: 'darkbrown', round: 0.6 })
      .box([0.12, 0.08, 0.2], [-0.16, 0.41, 0.36], { color: 'darkbrown', round: 0.6 })
      .done(),
  ),
  e('hunchback', 'town', 'storybook', () =>
    who('hunchback', { h: 1.6, build: 1.15, top: '#8a6a3a', long: true, bottom: '#5a4a30', shoes: 'darkbrown', hair: '#a0522d', style: 'short', acc: [lean(28), x((d) => [['torso', 'ball', [d.tw * 0.8, d.torsoH * 0.6, d.td * 0.9], [d.tw * 0.1, d.torsoH * 0.78, -d.td * 0.45], '#8a6a3a']]), wear('belt', 'darkbrown')] }),
  ),
  e('hunk', 'town', 'everyday people', () =>
    who('hunk', { h: 1.85, build: 1.45, top: 'white', bottom: 'denim', shoes: 'black', hair: 'black', style: 'short', acc: [x((d) => [1, -1].map((s): Spec => ['torso', 'ball', [d.tw * 0.36, d.torsoH * 0.22, d.td * 0.3], [s * d.tw * 0.2, d.torsoH * 0.72, d.td * 0.38], 'white'])), face('sunglasses'), wear('belt', 'darkbrown')] }),
  ),
  e('hunter', 'town', 'outdoors', () =>
    who('hunter', { top: 'olive', long: true, bottom: 'olive', shoes: 'darkbrown', beard: 'brown', acc: [hat('cap', 'orange'), wear('vest', 'orange'), boots('darkbrown'), rifle('R'), x((d) => [['torso', 'box', [d.tw * 0.15, d.torsoH * 1.1, d.td * 1.1], [0, d.torsoH * 0.5, 0], 'darkbrown', { srot: [0, 0, 35], layer: 3 }]])] }),
  ),
  e('icarus', 'town', 'legends', () =>
    who('icarus', { skin: 'skin2', top: 'white', skirt: 'white', bottom: 'white', legs: 'skin2', shoes: 'brown', hair: '#d9a441', style: 'short', acc: [body('angelwings', '#f2e6cf'), x2((d, s) => [0, 1, 2].map((i): Spec => ['torso', 'capsule', [d.tw * 0.14, d.torsoH * (0.9 - i * 0.15), d.td * 0.08], [s * d.tw * (1.0 + i * 0.25), d.torsoH * (0.5 - i * 0.05), -d.td * 0.8], 'cream', { srot: [0, 0, s * 15], layer: -4 }])), wear('belt', 'brown')] }),
  ),
  e('ice cream man', 'town', 'food service', () =>
    who('ice cream man', { h: 1.75, top: 'white', bottom: 'white', shoes: 'black', style: 'short', acc: [x((d) => [['head', 'box', [d.headW * 0.95, d.headH * 0.28, d.headD * 0.5], [0, top(d) - d.headH * 0.02, 0], 'white', { round: 0.4 }]]), wear('bowtie', 'red'), wear('apron', 'white'), held('icecream', 'tan'), x((d) => [['', 'box', [d.tw * 1.3, d.H * 0.36, d.tw * 0.9], [-d.tw * 1.55, d.H * 0.26, 0], 'white', { round: 0.2 }], ['', 'box', [d.tw * 1.32, d.H * 0.06, d.tw * 0.92], [-d.tw * 1.55, d.H * 0.33, 0], 'pink', { noInk: true }], ['', 'torus', [d.H * 0.14, d.H * 0.14, d.tw * 0.15], [-d.tw * 1.55, d.H * 0.07, d.tw * 0.5], 'rubber', { tube: 0.35 }], ['', 'ball', [d.tw * 0.3, d.tw * 0.3, d.tw * 0.3], [-d.tw * 1.55, d.H * 0.46, 0], 'pink'], ['', 'cyl', [d.tw * 0.25, d.tw * 0.35, d.tw * 0.25], [-d.tw * 1.55, d.H * 0.4, 0], 'tan', { taper: 0, srot: [180, 0, 0] }]])] }),
  ),
  e('illustrator', 'town', 'arts', () =>
    who('illustrator', { top: 'teal', long: true, bottom: 'black', shoes: 'black', style: 'short', acc: [hat('beret', 'black'), wear('apron', 'white'), x((d) => [[0.2, 0.3, 'red'], [-0.15, 0.1, 'blue'], [0.05, -0.2, 'yellow']].map(([u, v, c]): Spec => ['torso', 'ball', [d.tw * 0.12, d.tw * 0.1, d.td * 0.05], [d.tw * (u as number), d.torsoH * (v as number), d.td * 0.62], c as string, { noInk: true, layer: 5 }])), held('paintbrush'), inHand('L', (a) => [['cyl', [a * 3.6, a * 0.25, a * 2.8], [0, -a * 0.2, a * 1.8], 'lightwood', { srot: [70, 0, 0] }], ...(['red', 'blue', 'yellow', 'green'] as const).map((c, i): Hold => ['ball', [a * 0.6, a * 0.6, a * 0.3], [(i - 1.5) * a * 0.75, a * 0.3, a * 2.0], c, { noInk: true }])])] }),
  ),
  e('invisible man', 'town', 'storybook', () =>
    who('invisible man', { h: 1.75, skin: '#f2efe6', top: 'brown', long: true, bottom: 'darkbrown', shoes: 'black', style: 'none', blush: '#f2efe6', acc: [fedora('#5a3a22'), face('sunglasses'), wear('coat', '#7a5a3a'), wear('scarf', 'darkred'), gloves('black'), x((d) => [0.15, -0.15, -0.35].map((v): Spec => ['head', 'torus', [d.headW * 1.0, d.headD * 0.96, d.headH * 0.04], [0, d.headY + d.headH * v, 0], '#d4cfc0', { srot: [90, 0, 0], tube: 0.06, noInk: true }]))] }),
  ),
  e('invisible woman', 'town', 'comics', () =>
    who('invisible woman', { h: 1.68, top: '#3a6fd0', long: true, bottom: '#3a6fd0', shoes: 'black', hair: 'gold', style: 'long', acc: [wear('belt', 'black'), boots('black'), gloves('black'), chest('4', 'white', 0.3)] }),
  ),
  e('jack (brother)', 'town', 'family', () => who('jack (brother)', { h: 'kid', top: 'orange', bottom: 'denim', shoes: 'red', hair: 'brown', style: 'short', acc: [hat('cap', 'blue'), wear('backpack', 'green')] })),
  e('jack frost', 'fantasy', 'spirits', () =>
    who('jack frost', { skin: '#eef4f8', top: '#4e7fb8', long: true, bottom: 'tan', shoes: '#eef4f8', hair: 'white', style: 'spiky', eyes: '#3fa7e0', acc: [x((d) => [['torso', 'box', [d.tw * 1.08, d.torsoH * 0.12, d.td * 1.12], [0, d.torsoH * 0.95, 0], 'ice', { layer: 2, round: 0.5 }]]), inHand('R', (a, d) => [['capsule', [a * 0.3, d.H * 0.85, a * 0.3], [0, d.H * 0.12, a * 0.5], 'darkwood'], ['torus', [a * 2.2, a * 2.2, a * 0.3], [a * 1.0, d.H * 0.54, a * 0.5], 'darkwood', { tube: 0.15 }]]), x2((d, s) => [['torso', 'cyl', [d.tw * 0.14, d.torsoH * 0.25, d.tw * 0.14], [s * d.tw * 0.42, d.torsoH * 1.05, 0], 'ice', { taper: 0, srot: [0, 0, -s * 20] }]])] }),
  ),
  e('janitor', 'town', 'city workers', () =>
    who('janitor', { top: '#5a7a9a', long: true, bottom: '#5a7a9a', shoes: 'black', hair: 'gray', style: 'short', acc: [hat('cap', 'navy'), wear('belt', 'black'), x((d) => [['hips', 'torus', [d.tw * 0.25, d.tw * 0.25, d.tw * 0.05], [d.tw * 0.4, -d.lw * 0.4, d.td * 0.4], 'silver', { tube: 0.2 }], ['', 'cyl', [d.tw * 1.0, d.H * 0.22, d.tw * 1.0], [-d.tw * 1.25, d.H * 0.11, d.td * 0.5], 'yellow', { taper: 1.15 }], ['', 'box', [d.tw * 0.5, d.H * 0.1, d.tw * 0.4], [-d.tw * 1.25, d.H * 0.26, d.td * 0.2], 'darkgray']]), held('mop')] }),
  ),
  e('jockey', 'town', 'sports', () =>
    who('jockey', { h: 1.58, build: 0.85, top: 'yellow', long: true, bottom: 'white', shoes: 'black', acc: [hat('cap', 'red'), diamonds(['red']), x2((d, _s, side) => [[`arm${side}`, 'box', [d.aw * 1.2, d.aw * 0.4, d.aw * 1.2], [0, -d.upper * 0.4, 0], 'red', { noInk: true, layer: 3 }]]), boots('black'), held('whip', 'black')] }),
  ),
  e('joker (dc)', 'town', 'comics', () =>
    who('joker (dc)', { h: 1.78, build: 0.9, skin: '#f6f4ec', top: 'purple', long: true, bottom: 'purple', shoes: 'black', hair: '#4fa83a', style: 'short', blush: '#f6f4ec', acc: [wear('coat', 'purple'), x((d) => [['torso', 'box', [d.tw * 0.42, d.torsoH * 0.62, d.td * 0.1], [0, d.torsoH * 0.6, d.td * 0.52], '#4fa83a', { layer: 4 }], ['torso', 'box', [d.tw * 0.1, d.torsoH * 0.4, d.td * 0.06], [0, d.torsoH * 0.66, d.td * 0.58], 'orange', { layer: 5 }], ['head', 'capsule', [d.headW * 0.06, d.headW * 0.5, d.headW * 0.05], [0, d.headY - d.headH * 0.22, d.headD * 0.47], 'red', { srot: [0, 0, 90], layer: 6 }], ['head', 'ball', [d.headW * 1.08, d.headH * 0.5, d.headD * 1.0], [0, d.headY + d.headH * 0.3, -d.headD * 0.05], '#4fa83a', { layer: 1 }]]), gloves('purple'), inHand('L', (a) => [['box', [a * 1.4, a * 2, a * 0.1], [0, a * 0.5, a * 1.1], 'white', { role: 'label', text: 'J' }]])] }),
  ),
  e('journalist', 'town', 'media', () =>
    who('journalist', { top: 'white', long: true, bottom: 'brown', shoes: 'brown', style: 'short', acc: [fedora('#8a6a4a'), x((d) => [['head', 'box', [d.headW * 0.4, d.headH * 0.16, d.headD * 0.05], [d.headW * 0.1, top(d) + d.headH * 0.02, d.headD * 0.45], 'white', { role: 'label', text: 'PRESS', layer: 6 }]]), wear('coat', 'tan'), wear('belt', 'brown'), held('book', 'paper'), held('pointer', 'yellow', 'L')] }),
  ),
  e('jouster', 'town', 'history', () =>
    who('jouster', { h: 1.75, build: 1.2, top: 'steel', long: true, bottom: 'steel', shoes: 'steel', style: 'none', acc: [hat('helmet', 'steel'), x((d) => [['head', 'ball', [d.headW * 1.02, d.headH * 0.85, d.headD * 0.5], [0, d.headY - d.headH * 0.02, d.headD * 0.3], 'steel'], ['head', 'box', [d.headW * 0.7, d.headH * 0.06, d.headD * 0.1], [0, d.headY + d.headH * 0.08, d.headD * 0.55], 'black'], ['head', 'ball', [d.headW * 0.3, d.headH * 0.6, d.headD * 0.6], [0, top(d) + d.headH * 0.3, -d.headD * 0.1], 'red']]), wear('armor', 'silver'), x((d) => [['torso', 'box', [d.tw * 0.9, d.torsoH * 0.8, d.td * 1.15], [0, d.torsoH * 0.35, 0], 'blue', { layer: 2, round: 0.3 }]]), inHand('R', (a, d) => [['cyl', [a * 1.4, d.H * 1.0, a * 1.4], [0, d.H * 0.1, d.H * 0.32], 'red', { taper: 0.12, srot: [75, 0, 0] }], ['cyl', [a * 3, a * 1.8, a * 3], [0, a * 0.2, a * 1.4], 'silver', { taper: 0.25, srot: [75, 0, 0] }]]), held('shield', 'blue', 'L')] }),
  ),
  e('judge', 'town', 'law and order', () =>
    who('judge', { top: 'black', long: true, bottom: 'black', shoes: 'black', hair: 'white', style: 'long', acc: [wear('robe', 'black'), x((d) => [...[1, -1].map((s): Spec => ['head', 'capsule', [d.headW * 0.28, d.headH * 0.7, d.headW * 0.3], [s * d.headW * 0.5, d.headY - d.headH * 0.15, -d.headD * 0.05], 'white']), ['torso', 'box', [d.tw * 0.2, d.torsoH * 0.22, d.td * 0.06], [0, d.torsoH * 0.85, d.td * 0.54], 'white', { layer: 5 }]]), face('glasses', 'gold'), held('gavel')] }),
  ),
  e('julie', 'town', 'everyday people', () => who('julie', { h: 1.65, top: 'yellow', skirt: 'teal', shoes: 'white', hair: 'brown', style: 'ponytail', acc: [hat('bow', 'teal'), held('bag', 'pink', 'L')] })),
  e('julius caesar', 'town', 'history', () =>
    who('julius caesar', { skin: 'skin2', top: 'white', long: true, bottom: 'white', shoes: 'brown', legs: 'skin2', hair: 'gray', style: 'short', acc: [x((d) => [['head', 'torus', [d.headW * 1.08, d.headD * 1.04, d.headH * 0.12], [0, top(d) - d.headH * 0.14, 0], 'leaf', { srot: [90, 0, 0], tube: 0.35 }]]), wear('toga', 'white'), wear('sash', 'purple'), wear('cape', 'darkred'), held('scroll', 'paper')] }),
  ),
  e('justice league', 'town', 'comics', () =>
    crowd('justice league', [
      [who('superman', { h: 1.9, build: 1.25, top: 'blue', long: true, bottom: 'blue', shoes: 'red', hair: 'black', style: 'short', skin: 'skin1', acc: [wear('cape', 'red'), boots('red'), wear('belt', 'yellow'), x((d) => [['torso', 'cyl', [d.tw * 0.42, d.td * 0.08, d.tw * 0.36], [0, d.torsoH * 0.7, d.td * 0.52], 'yellow', { segs: 5, srot: [90, 0, 0], layer: 4 }], ['torso', 'box', [d.tw * 0.22, d.tw * 0.22, d.td * 0.06], [0, d.torsoH * 0.7, d.td * 0.56], 'red', { role: 'label', text: 'S', layer: 5 }]])] }), 0],
      [who('batman', { h: 1.88, build: 1.25, top: '#5c6166', long: true, bottom: '#5c6166', shoes: 'black', style: 'none', skin: 'skin2', acc: [hat('hood', '#2a2a30'), hat('catears', '#2a2a30'), wear('cape', '#2a2a30'), boots('#2a2a30'), gloves('#2a2a30'), wear('belt', 'yellow'), x((d) => [['torso', 'ball', [d.tw * 0.4, d.tw * 0.16, d.td * 0.06], [0, d.torsoH * 0.72, d.td * 0.52], 'black', { layer: 4 }]])] }), -0.75, -0.1],
      [who('wonder woman', { h: 1.8, top: 'red', skirt: 'navy', bottom: 'navy', shoes: 'red', hair: 'black', style: 'long', skin: 'skin2', acc: [hat('tiara', 'gold'), boots('red'), cuffs('silver'), wear('belt', 'gold'), held('lasso', 'gold', 'L')] }), 0.72, -0.1],
    ]),
  ),
  e('king', 'town', 'royalty', () =>
    who('king', { h: 1.75, build: 1.15, top: 'darkred', long: true, bottom: 'darkred', shoes: 'black', hair: 'brown', style: 'short', beard: 'brown', acc: [hat('crown'), face('beard', 'brown'), wear('robe', 'darkred'), wear('cape', 'red'), x((d) => [['torso', 'torus', [d.tw * 1.05, d.tw * 0.9, d.td * 0.6], [0, d.torsoH * 0.95, -d.td * 0.05], 'white', { srot: [80, 0, 0], tube: 0.45 }]]), inHand('R', (a, d) => [['capsule', [a * 0.4, d.H * 0.32, a * 0.4], [0, d.H * 0.1, a * 0.5], 'gold'], ['ball', [a * 1.1, a * 1.1, a * 1.1], [0, d.H * 0.27, a * 0.5], 'gold']]), inHand('L', (a) => [['ball', [a * 2, a * 2, a * 2], [0, a * 0.6, a * 1.4], 'gold'], ['box', [a * 0.3, a * 1, a * 0.3], [0, a * 1.9, a * 1.4], 'gold']])] }),
  ),
  e('king arthur', 'town', 'royalty', () =>
    who('king arthur', { h: 1.75, build: 1.15, top: 'steel', long: true, bottom: 'steel', shoes: 'steel', hair: 'brown', style: 'short', beard: 'brown', acc: [hat('crown', 'gold'), face('beard', 'brown'), wear('armor', 'silver'), x((d) => [['torso', 'box', [d.tw * 0.85, d.torsoH * 0.8, d.td * 1.16], [0, d.torsoH * 0.35, 0], 'red', { layer: 2, round: 0.3 }], ['torso', 'ball', [d.tw * 0.3, d.tw * 0.3, d.td * 0.06], [0, d.torsoH * 0.45, d.td * 0.6], 'gold', { layer: 4 }]]), wear('cape', 'blue'), held('sword', 'silver'), held('shield', 'red', 'L')] }),
  ),
  e('king henry', 'town', 'royalty', () =>
    who('king henry', { h: 1.8, build: 1.45, top: 'darkred', long: true, bottom: 'cream', legs: 'cream', shoes: 'black', hair: '#a0522d', style: 'short', beard: '#a0522d', acc: [face('beard', '#a0522d'), hat('beret', 'black'), x((d) => [['head', 'ball', [d.headW * 0.25, d.headW * 0.15, d.headW * 0.15], [d.headW * 0.4, top(d) + d.headH * 0.05, 0], 'white']]), bands('gold', [0.3, 0.55, 0.8], 0.04), shoulders('#5a3a22', 1.5), wear('cape', '#5a3a22'), wear('necklace', 'gold'), x((d) => [['hips', 'box', [d.tw * 1.2, d.legLen * 0.35, d.td * 1.3], [0, -d.legLen * 0.1, 0], 'darkred', { round: 0.6 }]]), inHand('L', (a) => [['capsule', [a * 0.4, a * 2.2, a * 0.4], [0, a * 0.4, a * 1.0], 'cream', { srot: [30, 0, 0] }], ['ball', [a * 1.4, a * 1.9, a * 1.4], [0, a * 1.4, a * 1.6], 'crust', { srot: [30, 0, 0] }]])] }),
  ),
  e('landlord', 'town', 'office', () =>
    who('landlord', { top: 'white', long: true, bottom: 'gray', shoes: 'brown', hair: 'gray', style: 'short', acc: [wear('vest', 'gray'), wear('tie', 'navy'), held('clipboard'), inHand('L', (a) => [['torus', [a * 1.6, a * 1.6, a * 0.2], [0, -a * 0.8, a * 0.8], 'silver', { tube: 0.12 }], ...[-1, 0, 1].map((i): Hold => ['box', [a * 0.3, a * 1.4, a * 0.1], [i * a * 0.4, -a * 2, a * 0.9], 'gold', { srot: [0, 0, i * 20] }])])] }),
  ),
  e('landscaper', 'town', 'trades', () =>
    who('landscaper', { top: 'green', bottom: 'tan', legs: 'skin3', skin: 'skin3', shoes: 'darkbrown', acc: [hat('cap', 'darkgreen'), gloves('#e8c43a'), boots('darkbrown'), held('rake'), x((d) => [['', 'box', [d.tw * 1.0, d.H * 0.18, d.tw * 1.5], [-d.tw * 1.35, d.H * 0.22, d.td * 0.6], 'red', { round: 0.4 }], ['', 'torus', [d.H * 0.16, d.H * 0.16, d.tw * 0.15], [-d.tw * 1.35, d.H * 0.08, d.td * 0.6 + d.tw * 0.8], 'rubber', { srot: [0, 90, 0], tube: 0.35 }], ['', 'ball', [d.tw * 0.9, d.H * 0.1, d.tw * 1.3], [-d.tw * 1.35, d.H * 0.32, d.td * 0.6], 'leaf']])] }),
  ),
  e('lawyer', 'town', 'law and order', () =>
    who('lawyer', { top: 'white', long: true, bottom: 'navy', shoes: 'black', style: 'short', hair: 'darkbrown', acc: [wear('suit', 'navy'), held('briefcase', 'darkbrown'), held('book', 'darkred', 'L')] }),
  ),
  e('leon', 'town', 'everyday people', () =>
    who('leon', { h: 1.75, build: 0.9, top: 'white', long: true, bottom: 'darkgray', shoes: 'black', style: 'short', hair: 'darkbrown', acc: [hat('beanie', 'black'), x((d) => [1, -1].map((s): Spec => ['head', 'cyl', [d.headW * 0.26, d.headW * 0.05, d.headW * 0.26], [s * d.headW * 0.2, d.headY + d.headH * 0.04, d.headD * 0.5], 'black', { srot: [90, 0, 0] }])), wear('coat', 'gray'), inHand('L', (a) => [['cyl', [a * 2.4, a * 2.2, a * 2.4], [0, -a * 0.2, a * 1.6], 'white', { taper: 1.2 }], ...[[0, 1.8], [-0.6, 1.4], [0.6, 1.5]].map(([u, v]): Hold => ['ball', [a * 1.0, a * 1.6, a * 0.7], [u * a, v * a, a * 1.6], 'leaf'])])] }),
  ),
  e('leonardo da vinci', 'town', 'history', () =>
    who('leonardo da vinci', { h: 1.69, top: 'darkred', long: true, bottom: 'darkred', shoes: 'darkbrown', hair: 'lightgray', style: 'long', beard: 'lightgray', acc: [face('longbeard', 'lightgray'), hat('beret', '#3a2a24'), wear('robe', '#7a2b2a'), held('paintbrush'), inHand('L', (a) => [['box', [a * 3, a * 3.8, a * 0.3], [0, -a * 0.2, a * 1.4], 'darkwood'], ['box', [a * 2.4, a * 3.2, a * 0.1], [0, -a * 0.2, a * 1.58], '#7a6a3a', { noInk: true }], ['ball', [a * 0.9, a * 1.1, a * 0.1], [0, a * 0.5, a * 1.65], 'skin2', { noInk: true }]])] }),
  ),
  e('leprechaun', 'fantasy', 'little folk', () =>
    who('leprechaun', { h: 0.9, build: 1.2, top: 'green', long: true, bottom: 'green', shoes: 'black', hair: 'orange', style: 'short', beard: 'orange', acc: [hat('top', 'green'), x((d) => [['head', 'cyl', [d.headW * 0.89, d.headH * 0.12, d.headD * 0.84], [0, top(d) + d.headH * 0.08, 0], 'black'], ['head', 'box', [d.headW * 0.25, d.headH * 0.14, d.headD * 0.05], [0, top(d) + d.headH * 0.08, d.headD * 0.42], 'gold']]), face('beard', 'orange'), wear('vest', 'darkgreen'), wear('belt', 'black'), x((d) => [['', 'ball', [d.H * 0.32, d.H * 0.26, d.H * 0.32], [d.tw * 1.6, d.H * 0.13, d.td * 0.5], 'black'], ['', 'cyl', [d.H * 0.27, d.H * 0.06, d.H * 0.27], [d.tw * 1.6, d.H * 0.26, d.td * 0.5], 'gold'], ['', 'ball', [d.H * 0.2, d.H * 0.1, d.H * 0.2], [d.tw * 1.6, d.H * 0.29, d.td * 0.5], 'gold']])] }),
  ),
  e('lex luthor', 'town', 'comics', () =>
    who('lex luthor', { h: 1.85, skin: 'skin1', top: 'darkgray', long: true, bottom: 'darkgray', shoes: 'black', style: 'bald', acc: [shirtFront(), wear('tie', 'purple'), inHand('L', (a) => [['cyl', [a * 1.0, a * 2.4, a * 1.0], [0, a * 0.5, a * 1.2], 'lime', { taper: 0, segs: 5 }], ['cyl', [a * 0.7, a * 1.6, a * 0.7], [a * 0.5, a * 0.3, a * 1.2], 'green', { taper: 0, segs: 5, srot: [0, 0, -25] }]])] }),
  ),
  e('liberal', 'town', 'politics', () =>
    who('liberal', { top: 'blue', bottom: 'denim', shoes: 'white', style: 'ponytail', acc: [hat('cap', 'blue'), held('sign'), inHand('R', (a, d) => [['box', [a * 5.2, a * 3.2, a * 0.05], [0, d.H * 0.95 * 0.65, a * 0.5], 'blue', { role: 'label', text: 'VOTE', layer: 6 }]])] }),
  ),
  e('libertarian', 'town', 'politics', () =>
    who('libertarian', { top: 'yellow', bottom: 'tan', shoes: 'brown', style: 'short', beard: 'brown', acc: [face('beard', 'brown'), hat('cowboy', 'brown'), held('flag', 'yellow'), inHand('R', (a, d) => [['ball', [a * 1.8, a * 1.0, a * 0.1], [a * 2.6, d.H * 0.95 * 0.65 - a * 1.5, a * 0.45], 'darkgreen', { noInk: true }]])] }),
  ),
  e('librarian', 'town', 'school', () =>
    who('librarian', { top: 'darkgreen', long: true, skirt: 'brown', shoes: 'black', legs: 'skin2', skin: 'skin2', hair: 'darkbrown', style: 'bun', acc: [face('glasses', 'darkred'), wear('necklace', 'silver'), inHand('L', (a) => ['red', 'blue', 'gold'].map((c, i): Hold => ['box', [a * 2.6, a * 0.7, a * 2], [0, a * (0.2 + i * 0.7), a * 1.4], c]))] }),
  ),
  e('lieutenant', 'town', 'military', () =>
    who('lieutenant', { top: 'navy', long: true, bottom: 'navy', shoes: 'black', style: 'short', acc: [hat('police', 'white'), shoulders('gold', 0.6), bands('gold', [0.08], 0.04), wear('badge', 'gold'), wear('belt', 'white')] }),
  ),
  e('lifeguard', 'town', 'emergency', () =>
    who('lifeguard', { h: 1.75, skin: 'skin3', top: 'red', bottom: 'red', legs: 'skin3', shoes: 'skin3', hair: 'gold', style: 'short', acc: [face('sunglasses'), wear('whistle'), chest('+', 'white', 0.25), inHand('R', (a, d) => [['capsule', [a * 1.4, d.H * 0.4, a * 1.1], [0, -a * 0.6, a * 1.2], 'red', { srot: [15, 0, 0] }]])] }),
  ),
  e('lighthouse keeper', 'town', 'sailors', () =>
    who('lighthouse keeper', { top: 'lightgray', long: true, bottom: 'navy', shoes: 'black', hair: 'white', style: 'short', beard: 'white', acc: [hat('police', 'navy'), face('beard', 'white'), wear('coat', 'navy'), held('lantern', 'flame'), boots('black')] }),
  ),
  e('linguist', 'town', 'academia', () =>
    who('linguist', { top: 'orange', long: true, bottom: 'brown', shoes: 'brown', style: 'long', acc: [face('glasses', 'black'), wear('scarf', 'teal'), held('book', 'blue'), inHand('L', (a) => [['box', [a * 3, a * 2, a * 0.1], [0, a * 0.6, a * 1.2], 'white', { role: 'label', text: 'A Б 文' }]])] }),
  ),
  e('link (nintendo)', 'town', 'video games', () =>
    who('link (nintendo)', { h: 1.65, skin: 'skin1', top: 'green', long: true, skirt: 'green', bottom: 'white', legs: 'white', shoes: 'brown', hair: 'gold', style: 'short', acc: [x((d) => [['head', 'cyl', [d.headW * 1.08, d.headH * 1.3, d.headD * 1.04], [0, top(d) + d.headH * 0.05, -d.headD * 0.55], 'green', { taper: 0, srot: [-70, 0, 0] }]]), pointyEars('skin1', 0.8), wear('belt', 'brown'), boots('brown'), held('sword', 'silver'), held('shield', 'blue', 'L')] }),
  ),
  e('lion tamer', 'town', 'entertainment', () =>
    who('lion tamer', { h: 1.75, top: 'red', long: true, bottom: 'white', shoes: 'black', style: 'short', hair: 'black', acc: [face('mustache', 'black'), bands('gold', [0.35, 0.5, 0.65], 0.03), shoulders('gold', 0.6), boots('black'), held('whip', 'brown'), inHand('L', (a) => [['box', [a * 3, a * 0.4, a * 3], [0, -a * 0.6, a * 2.6], 'wood'], ['box', [a * 3, a * 3, a * 0.4], [0, a * 0.9, a * 1.2], 'wood'], ...[[1, 1], [-1, 1], [1, -1], [-1, -1]].map(([u, v]): Hold => ['capsule', [a * 0.35, a * 3, a * 0.35], [u * a * 1.3, -a * 0.6 + v * a * 1.3, a * 4.1], 'darkwood', { srot: [90, 0, 0] }])])] }),
  ),
  e('little red riding hood', 'town', 'storybook', () =>
    who('little red riding hood', { h: 'kid', top: 'white', skirt: 'navy', legs: 'white', shoes: 'black', hair: 'gold', style: 'pigtails', acc: [hat('hood', 'red'), wear('cape', 'red'), held('basket', 'tan'), x((d) => [['handR', 'box', [d.aw * 2.6, d.aw * 0.4, d.aw * 1.8], [0, -d.aw * 1.0, d.aw * 0.5], '#e0473b', { noInk: true }]])] }),
  ),
  e('lobbyist', 'town', 'politics', () =>
    who('lobbyist', { top: 'white', long: true, bottom: 'darkgray', shoes: 'black', style: 'short', hair: 'black', acc: [wear('suit', '#3a3a44'), held('briefcase', 'black'), inHand('L', (a) => [0, 1, 2].map((i): Hold => ['box', [a * 2.4, a * 0.35, a * 1.2], [0, -a * 0.2 + i * a * 0.38, a * 1.3], '#7cc45a']))] }),
  ),
  e('locksmith', 'town', 'trades', () =>
    who('locksmith', { top: 'navy', long: true, bottom: 'gray', shoes: 'black', style: 'short', acc: [hat('cap', 'navy'), wear('tool belt', 'brown'), inHand('L', (a) => [['torus', [a * 2, a * 2, a * 0.35], [0, a * 1.6, a * 0.9], 'gold', { tube: 0.35 }], ['box', [a * 0.5, a * 3.2, a * 0.3], [0, -a * 0.4, a * 0.9], 'gold'], ['box', [a * 0.9, a * 0.4, a * 0.3], [a * 0.5, -a * 1.6, a * 0.9], 'gold'], ['box', [a * 0.7, a * 0.4, a * 0.3], [a * 0.4, -a * 0.9, a * 0.9], 'gold']]), held('wrench')] }),
  ),
  e('luigi', 'town', 'video games', () =>
    who('luigi', { h: 1.75, build: 0.9, skin: 'skin1', top: 'green', long: true, bottom: 'navy', shoes: 'brown', hair: 'darkbrown', style: 'short', acc: [hat('cap', 'green'), x((d) => [['head', 'cyl', [d.headW * 0.34, d.headD * 0.06, d.headW * 0.34], [0, top(d) + d.headH * 0.0, d.headD * 0.5], 'white', { srot: [80, 0, 0], layer: 6 }], ['head', 'box', [d.headW * 0.2, d.headW * 0.2, d.headD * 0.02], [0, top(d) + d.headH * 0.0, d.headD * 0.54], 'white', { role: 'label', text: 'L', layer: 7 }]]), face('mustache', 'darkbrown'), wear('overalls', 'navy'), x2((d, s) => [['torso', 'box', [d.tw * 0.14, d.torsoH * 0.55, d.td * 0.08], [s * d.tw * 0.24, d.torsoH * 0.7, d.td * 0.52], 'navy', { layer: 4 }], ['torso', 'ball', [d.tw * 0.1, d.tw * 0.1, d.td * 0.08], [s * d.tw * 0.24, d.torsoH * 0.5, d.td * 0.58], 'gold', { layer: 5 }]]), gloves('white')] }),
  ),
  e('lumberjack', 'town', 'outdoors', () =>
    who('lumberjack', { h: 1.85, build: 1.3, top: 'red', long: true, bottom: 'denim', shoes: 'darkbrown', hair: 'brown', style: 'short', beard: 'brown', acc: [hat('beanie', 'darkred'), face('beard', 'brown'), bands('#2a2726', [0.2, 0.45, 0.7], 0.05), x2((d, s) => [['torso', 'box', [d.tw * 0.07, d.torsoH * 1.0, d.td * 1.12], [s * d.tw * 0.18, d.torsoH * 0.5, 0], 'black', { layer: 4 }]]), boots('darkbrown'), held('axe')] }),
  ),
  e('mad hatter', 'town', 'storybook', () =>
    who('mad hatter', { skin: 'skin1', top: 'cream', long: true, bottom: '#b07a3a', shoes: 'brown', hair: 'orange', style: 'spiky', acc: [hat('top', '#4a7a5a'), x((d) => [['head', 'box', [d.headW * 0.3, d.headH * 0.22, d.headD * 0.04], [d.headW * 0.18, top(d) + d.headH * 0.26, d.headD * 0.44], 'white', { role: 'label', text: '10/6', layer: 6 }]]), wear('coat', 'darkgreen'), wear('bowtie', 'yellow'), x((d) => [['torso', 'ball', [d.tw * 0.5, d.tw * 0.3, d.td * 0.2], [0, d.torsoH * 0.9, d.td * 0.5], 'yellow', { layer: 5 }]]), inHand('L', (a) => [['cyl', [a * 1.6, a * 1.0, a * 1.6], [0, a * 0.2, a * 1.2], 'white', { taper: 1.4 }], ['cyl', [a * 2.4, a * 0.2, a * 2.4], [0, -a * 0.35, a * 1.2], 'white'], ['torus', [a * 0.8, a * 0.8, a * 0.2], [a * 1.0, a * 0.2, a * 1.2], 'white', { srot: [0, 90, 0] }]])] }),
  ),
  e('mad scientist', 'town', 'science', () =>
    who('mad scientist', { skin: 'skin1', top: 'white', long: true, bottom: 'darkgray', shoes: 'black', hair: 'white', style: 'spiky', acc: [x((d) => [-0.5, 0.5].map((u): Spec => ['head', 'cyl', [d.headW * 0.4, d.headH * 0.45, d.headW * 0.4], [d.headW * u, d.headY + d.headH * 0.15, -d.headD * 0.05], 'white', { taper: 0, srot: [0, 0, -u * 150] }])), face('goggles', 'green'), wear('labcoat'), gloves('#3a3633'), inHand('L', (a) => [['ball', [a * 2.4, a * 2.2, a * 2.4], [0, a * 0.3, a * 1.4], 'lime'], ['cyl', [a * 0.8, a * 1.6, a * 0.8], [0, a * 1.8, a * 1.4], 'glass'], ['ball', [a * 0.6, a * 0.6, a * 0.6], [a * 0.3, a * 3.0, a * 1.4], 'lime'], ['ball', [a * 0.4, a * 0.4, a * 0.4], [-a * 0.2, a * 3.7, a * 1.4], 'lime']]), held('syringe', 'silver')] }),
  ),
  e('magician', 'town', 'entertainment', () =>
    who('magician', { top: 'black', long: true, bottom: 'black', shoes: 'black', hair: 'black', style: 'short', acc: [hat('top', 'black'), face('mustache', 'black'), wear('cape', 'darkred'), shirtFront(), wear('bowtie', 'black'), gloves('white'), held('wand'), inHand('L', (a) => [['ball', [a * 2.2, a * 2.0, a * 1.8], [0, -a * 1.2, a * 1.4], 'white'], ['ball', [a * 1.4, a * 1.3, a * 1.3], [0, a * 0.4, a * 1.8], 'white'], ['capsule', [a * 0.5, a * 1.8, a * 0.3], [a * 0.35, a * 1.9, a * 1.7], 'white', { srot: [0, 0, -10] }], ['capsule', [a * 0.5, a * 1.8, a * 0.3], [-a * 0.35, a * 1.9, a * 1.7], 'white', { srot: [0, 0, 10] }], ['ball', [a * 0.3, a * 0.3, a * 0.2], [0, a * 0.3, a * 2.5], 'pink']])] }),
  ),
  e('magicians assistant', 'town', 'entertainment', () =>
    who('magicians assistant', { h: 1.65, top: 'magenta', bottom: 'magenta', legs: '#3a3633', shoes: 'black', hair: 'red', style: 'long', acc: [x((d) => [[0.2, 0.3], [-0.2, 0.55], [0.1, 0.8], [-0.25, 0.15]].map(([u, v]): Spec => ['torso', 'ball', [d.tw * 0.1, d.tw * 0.1, d.td * 0.06], [d.tw * u, d.torsoH * v, d.td * 0.52], 'gold', { noInk: true, layer: 4 }])), hat('headband', 'gold'), x((d) => [['head', 'capsule', [d.headW * 0.18, d.headH * 0.8, d.headW * 0.1], [d.headW * 0.25, top(d) + d.headH * 0.25, -d.headD * 0.1], 'pink', { srot: [0, 0, -15] }]]), cuffs('gold'), inHand('L', (a, d) => [['torus', [d.H * 0.3, d.H * 0.3, a * 0.3], [0, a * 0.5 + d.H * 0.12, a * 0.8], 'gold', { tube: 0.08 }]])] }),
  ),
  e('maid', 'town', 'household staff', () =>
    who('maid', { top: 'black', long: true, skirt: 'black', legs: 'white', shoes: 'black', hair: 'brown', style: 'bun', acc: [wear('apron', 'white'), hat('headband', 'white'), x((d) => [['torso', 'torus', [d.tw * 0.6, d.tw * 0.6, d.td * 0.2], [0, d.torsoH * 0.98, 0], 'white', { srot: [90, 0, 0], tube: 0.35 }]]), inHand('R', (a) => [['capsule', [a * 0.35, a * 3, a * 0.35], [0, a * 0.5, a * 0.8], 'darkwood', { srot: [20, 0, 0] }], ['ball', [a * 1.8, a * 2.4, a * 1.8], [0, a * 2.6, a * 1.5], 'pink', { srot: [20, 0, 0] }]])] }),
  ),
  e('major', 'town', 'military', () =>
    who('major', { h: 1.75, top: '#a8956a', long: true, bottom: '#a8956a', shoes: 'darkbrown', hair: 'darkbrown', style: 'short', acc: [hat('beret', 'maroon'), face('mustache', 'darkbrown'), x2((d, s) => [['torso', 'ball', [d.tw * 0.14, d.tw * 0.08, d.td * 0.3], [s * d.tw * 0.42, d.torsoH * 0.98, 0], 'gold']]), wear('sash', 'darkbrown'), wear('belt', 'darkbrown'), wear('medal'), boots('darkbrown')] }),
  ),
  e('manicurist', 'town', 'beauty', () =>
    who('manicurist', { h: 1.65, top: 'pink', long: true, bottom: 'white', shoes: 'white', hair: 'black', style: 'ponytail', acc: [wear('apron', 'white'), inHand('R', (a) => [['cyl', [a * 1.1, a * 1.3, a * 1.1], [0, -a * 0.4, a * 1.0], 'red'], ['cyl', [a * 0.5, a * 1.0, a * 0.5], [0, a * 0.7, a * 1.0], 'black']]), inHand('L', (a) => [['box', [a * 0.3, a * 2.6, a * 0.1], [0, a * 0.4, a * 1.0], 'pink', { srot: [40, 0, 0] }]])] }),
  ),
  e('mannequin', 'wardrobe', 'shop displays', () =>
    m('mannequin')
      .cyl([0.4, 0.03, 0.4], [0, 0.015, 0], { color: 'glass' })
      .cyl([0.04, 0.12, 0.04], [0.1, 0.08, 0], { color: 'silver' })
      .rod([0.1, 0.12, 0], [0.1, 0.84, 0], 0.085, '#e8dcc8')
      .rod([-0.1, 0.05, 0], [-0.1, 0.84, 0], 0.085, '#e8dcc8')
      .box([0.1, 0.04, 0.2], [-0.1, 0.03, 0.05], { color: '#e8dcc8', round: 0.8 })
      .box([0.34, 0.2, 0.2], [0, 0.88, 0], { color: '#e8dcc8', round: 0.8 })
      .cyl([0.26, 0.3, 0.17], [0, 1.08, 0], { color: '#e8dcc8', taper: 1.4 })
      .box([0.42, 0.18, 0.22], [0, 1.3, 0], { color: '#e8dcc8', round: 0.8 })
      .rod([0.22, 1.32, 0], [0.26, 0.86, 0.03], 0.065, '#e8dcc8')
      .rod([-0.22, 1.32, 0], [-0.26, 0.86, 0.03], 0.065, '#e8dcc8')
      .cyl([0.08, 0.1, 0.08], [0, 1.43, 0], { color: '#e8dcc8' })
      .ball([0.19, 0.25, 0.21], [0, 1.6, 0.01], { color: '#e8dcc8' })
      .done(),
  ),
  e('marine biologist', 'town', 'science', () =>
    who('marine biologist', { top: 'black', long: true, bottom: 'black', shoes: 'yellow', style: 'ponytail', hair: 'brown', acc: [bands('blue', [0.6], 0.12), face('goggles', 'skyblue'), face('snorkel', 'orange'), x2((d, _s, side) => [[`foot${side}`, 'box', [d.lw * 1.4, d.H * 0.02, d.lw * 3.2], [0, -d.H * 0.04, d.lw * 1.4], 'yellow', { round: 0.6 }]]), held('clipboard', 'white'), inHand('L', (a) => [['cyl', [a * 2.6, a * 0.35, a * 2.6], [0, a * 0.2, a * 1.2], 'orange', { segs: 5, srot: [90, 0, 0] }]])] }),
  ),
  e('mario', 'town', 'video games', () =>
    who('mario', { h: 1.55, build: 1.15, skin: 'skin1', top: 'red', long: true, bottom: 'blue', shoes: 'brown', hair: 'darkbrown', style: 'short', acc: [hat('cap', 'red'), x((d) => [['head', 'cyl', [d.headW * 0.34, d.headD * 0.06, d.headW * 0.34], [0, top(d) + d.headH * 0.0, d.headD * 0.5], 'white', { srot: [80, 0, 0], layer: 6 }], ['head', 'box', [d.headW * 0.2, d.headW * 0.2, d.headD * 0.02], [0, top(d) + d.headH * 0.0, d.headD * 0.54], 'white', { role: 'label', text: 'M', layer: 7 }], ['head', 'ball', [d.headW * 0.26, d.headW * 0.22, d.headW * 0.22], [0, d.headY - d.headH * 0.02, d.headD * 0.52], 'skin1', { layer: 6 }]]), face('mustache', '#2a1d16'), wear('overalls', 'blue'), x2((d, s) => [['torso', 'box', [d.tw * 0.14, d.torsoH * 0.55, d.td * 0.08], [s * d.tw * 0.24, d.torsoH * 0.7, d.td * 0.52], 'blue', { layer: 4 }], ['torso', 'ball', [d.tw * 0.1, d.tw * 0.1, d.td * 0.08], [s * d.tw * 0.24, d.torsoH * 0.5, d.td * 0.58], 'gold', { layer: 5 }]]), gloves('white')] }),
  ),
  e('massage therapist', 'town', 'beauty', () =>
    who('massage therapist', { top: 'teal', bottom: 'teal', shoes: 'white', style: 'ponytail', acc: [x((d) => [['torso', 'box', [d.tw * 0.3, d.torsoH * 0.9, d.td * 1.2], [d.tw * 0.38, d.torsoH * 0.62, 0], 'white', { round: 0.5, layer: 3 }]]), inHand('L', (a) => [['cyl', [a * 1.1, a * 2, a * 1.1], [0, a * 0.2, a * 1.0], '#c8873a'], ['cyl', [a * 0.5, a * 0.6, a * 0.5], [0, a * 1.4, a * 1.0], 'white']])] }),
  ),
  e('mathematician', 'town', 'science', () =>
    who('mathematician', { top: 'white', long: true, bottom: 'gray', shoes: 'brown', hair: 'gray', style: 'short', acc: [face('glasses', 'black'), wear('vest', '#8a6a4a'), wear('bowtie', 'navy'), held('pointer', 'white'), inHand('L', (a) => [['box', [a * 4, a * 3, a * 0.3], [0, -a * 0.2, a * 1.3], 'darkgreen', { role: 'label', text: 'π=3.14' }], ['box', [a * 4.3, a * 0.3, a * 0.4], [0, -a * 1.8, a * 1.3], 'wood']])] }),
  ),
  e('maxwell', 'town', 'video games', () =>
    who('maxwell', { h: 'kid', skin: 'skin1', top: 'black', long: true, bottom: 'brown', shoes: 'red', hair: 'brown', style: 'short', acc: [x((d) => [['head', 'ball', [d.headW * 1.15, d.headH * 0.62, d.headD * 1.12], [0, top(d) - d.headH * 0.04, 0], '#f2d36a'], ...[-0.15, 0.05, 0.25].map((z, i): Spec => ['head', 'ball', [d.headW * 0.18, d.headH * (0.3 - i * 0.04), d.headD * 0.22], [0, top(d) + d.headH * (0.24 - i * 0.02), d.headD * z], 'red']), ['head', 'cyl', [d.headW * 0.3, d.headD * 0.4, d.headW * 0.2], [0, top(d) - d.headH * 0.04, d.headD * 0.65], 'orange', { taper: 0, srot: [90, 0, 0] }], ['head', 'ball', [d.headW * 0.12, d.headW * 0.12, d.headW * 0.06], [d.headW * 0.28, top(d) + d.headH * 0.06, d.headD * 0.5], 'black']]), held('book', 'darkbrown', 'L')] }),
  ),
  e('mechanic', 'town', 'trades', () =>
    who('mechanic', { top: '#4a6fa5', long: true, bottom: '#4a6fa5', shoes: 'black', style: 'short', acc: [hat('cap', 'red'), x((d) => [['torso', 'box', [d.tw * 0.3, d.torsoH * 0.14, d.td * 0.05], [d.tw * 0.24, d.torsoH * 0.75, d.td * 0.54], 'white', { role: 'label', text: 'JOE', layer: 5 }], ['hips', 'box', [d.tw * 0.2, d.lw * 1.2, d.td * 0.1], [-d.tw * 0.3, -d.lw * 0.6, -d.td * 0.5], 'red'], ['torso', 'ball', [d.tw * 0.15, d.tw * 0.1, d.td * 0.05], [-d.tw * 0.15, d.torsoH * 0.35, d.td * 0.52], '#3a3633', { noInk: true, layer: 5 }]]), wear('belt', 'black'), held('wrench'), gloves('#3a3633', 1.05)] }),
  ),
  e('mercenary', 'town', 'military', () =>
    who('mercenary', { build: 1.25, top: 'olive', long: true, bottom: '#5a5a3a', shoes: 'black', hair: 'black', style: 'short', beard: 'black', acc: [hat('bandana', 'black'), face('beard', 'black'), face('sunglasses'), wear('vest', '#4a4a3a'), x((d) => [-0.2, 0, 0.2].map((u): Spec => ['torso', 'box', [d.tw * 0.16, d.torsoH * 0.2, d.td * 0.12], [d.tw * u, d.torsoH * 0.45, d.td * 0.6], '#5a5a3a', { layer: 4 }])), boots('black'), rifle('R', 'black', 'iron')] }),
  ),
  e('merchant', 'town', 'history', () =>
    who('merchant', { top: 'green', long: true, bottom: 'darkgreen', shoes: 'brown', hair: 'black', style: 'short', beard: 'black', acc: [hat('turban', 'orange'), face('beard', 'black'), wear('robe', 'darkgreen'), wear('sash', 'gold'), wear('necklace', 'gold'), held('bag', 'tan'), inHand('L', (a) => [['capsule', [a * 0.2, a * 3.4, a * 0.2], [0, a * 0.6, a * 1.0], 'brass', { srot: [0, 0, 90] }], ['capsule', [a * 0.2, a * 1.2, a * 0.2], [0, a * 0.0, a * 1.0], 'brass'], ...[1, -1].map((s): Hold => ['cyl', [a * 1.2, a * 0.4, a * 1.2], [s * a * 1.5, -a * 0.4, a * 1.0], 'brass', { taper: 1.5 }])])] }),
  ),
  e('mermaid', 'fantasy', 'sea folk', () =>
    who('mermaid', { skin: 'skin2', top: 'skin2', bottom: 'teal', hair: 'red', style: 'long', acc: [hide(...LEGS), x((d) => [['hips', 'cyl', [d.tw * 1.15, d.legLen * 0.86, d.td * 1.25], [0, -d.legLen * 0.42, 0], 'teal', { taper: 0.35, srot: [180, 0, 0] }], ...[1, -1].map((s): Spec => ['hips', 'ball', [d.tw * 0.9, d.legLen * 0.12, d.tw * 0.45], [s * d.tw * 0.36, -d.legLen * 0.88, d.td * 0.1], '#2f8f88', { srot: [0, 0, s * 25] }]), ...[[0.25, -0.2], [-0.2, -0.4], [0.1, -0.6], [-0.05, -0.15]].map(([u, v]): Spec => ['hips', 'ball', [d.tw * 0.16, d.tw * 0.12, d.tw * 0.05], [d.tw * u, d.legLen * v, d.td * (0.6 + v * 0.25)], '#7fd8cf', { noInk: true, layer: 4 }]), ...[1, -1].map((s): Spec => ['torso', 'ball', [d.tw * 0.32, d.tw * 0.28, d.td * 0.45], [s * d.tw * 0.18, d.torsoH * 0.7, d.td * 0.35], 'purple'])]), hat('flower', 'pink'), wear('necklace', 'white')] }),
  ),
  e('meteorologist', 'town', 'media', () =>
    who('meteorologist', { top: 'white', long: true, bottom: 'navy', shoes: 'black', style: 'short', acc: [wear('suit', 'navy'), held('pointer', 'silver'), inHand('L', (a) => [['ball', [a * 2.4, a * 2.4, a * 0.6], [a * 0.8, a * 2.6, a * 0.9], 'yellow'], ['ball', [a * 2.2, a * 1.6, a * 1.0], [-a * 0.4, a * 1.6, a * 1.2], 'white'], ['ball', [a * 1.6, a * 1.4, a * 1.0], [a * 0.9, a * 1.4, a * 1.3], 'white'], ['capsule', [a * 0.3, a * 1.2, a * 0.3], [0, a * 0.5, a * 1.0], 'gray']])] }),
  ),
  e('midget', 'town', 'everyday people', () => who('midget', { h: 1.2, build: 1.1, top: 'teal', bottom: 'denim', shoes: 'brown', hair: 'darkbrown', style: 'short', beard: 'darkbrown', acc: [face('beard', 'darkbrown'), hat('cap', 'orange')] })),
  e('milk man', 'town', 'food service', () =>
    who('milk man', { h: 1.75, top: 'white', long: true, bottom: 'white', shoes: 'black', style: 'short', acc: [hat('police', 'white'), wear('bowtie', 'black'), wear('belt', 'black'), inHand('L', (a) => [['box', [a * 3.6, a * 1.6, a * 2.4], [0, -a * 1.6, a * 0.8], 'silver', { round: 0.1 }], ...[[-0.8, 0.4], [0.8, 0.4], [-0.8, -0.4], [0.8, -0.4]].map(([u, v]): Hold => ['capsule', [a * 1.0, a * 2.6, a * 1.0], [u * a, -a * 0.8, a * (0.8 + v * 1.0)], 'milk'])])] }),
  ),
  e('milkmaid', 'town', 'farm work', () =>
    who('milkmaid', { h: 1.65, top: 'white', long: true, skirt: 'blue', legs: 'white', shoes: 'darkbrown', hair: 'gold', style: 'pigtails', acc: [hat('bandana', 'white'), wear('apron', 'white'), x((d) => [['torso', 'capsule', [d.tw * 0.14, d.tw * 2.8, d.tw * 0.14], [0, d.torsoH * 1.0, -d.td * 0.1], 'wood', { srot: [0, 0, 90] }], ...[1, -1].flatMap((s): Spec[] => [rod('torso', [s * d.tw * 1.3, d.torsoH * 1.0, -d.td * 0.1], [s * d.tw * 1.3, d.torsoH * 0.35, -d.td * 0.1], d.tw * 0.03, 'tan'), ['torso', 'cyl', [d.tw * 0.55, d.torsoH * 0.4, d.tw * 0.55], [s * d.tw * 1.3, d.torsoH * 0.18, -d.td * 0.1], 'wood', { taper: 1.2 }], ['torso', 'cyl', [d.tw * 0.58, d.torsoH * 0.02, d.tw * 0.58], [s * d.tw * 1.3, d.torsoH * 0.37, -d.td * 0.1], 'milk', { noInk: true }]])])] }),
  ),
  e('millionaire', 'town', 'office', () =>
    who('millionaire', { h: 1.75, build: 1.2, top: 'black', long: true, bottom: 'black', shoes: 'black', hair: 'white', style: 'short', acc: [hat('top', 'black'), face('monocle'), face('mustache', 'white'), shirtFront(), wear('bowtie', 'black'), held('cane', 'gold'), inHand('L', (a) => [['ball', [a * 3, a * 3.2, a * 2.6], [0, -a * 2.2, a * 0.8], 'tan'], ['cyl', [a * 1.2, a * 0.6, a * 1.2], [0, -a * 0.5, a * 0.8], 'tan'], ['box', [a * 1.4, a * 1.4, a * 0.05], [0, -a * 2.2, a * 2.1], 'tan', { role: 'label', text: '$', layer: 6 }]])] }),
  ),
  e('mime', 'town', 'arts', () =>
    who('mime', { skin: '#f8f6f0', top: 'white', long: true, bottom: 'black', shoes: 'black', hair: 'black', style: 'short', blush: '#e86a7a', acc: [hat('beret', 'black'), bands('#2a2726', [0.12, 0.3, 0.48, 0.66, 0.84], 0.07), x2((d, _s, side) => [0.3, 0.7].map((v): Spec => [`arm${side}`, 'cyl', [d.aw * 1.14, d.upper * 0.12, d.aw * 1.14], [0, -d.upper * v, 0], '#2a2726', { noInk: true }])), x2((d, s) => [['torso', 'box', [d.tw * 0.08, d.torsoH * 1.0, d.td * 1.12], [s * d.tw * 0.22, d.torsoH * 0.5, 0], 'black', { layer: 5 }]]), gloves('white')] }),
  ),
  e('miner', 'town', 'trades', () =>
    who('miner', { top: 'gray', long: true, bottom: '#3d4f7a', shoes: 'black', style: 'short', acc: [hat('hard', 'yellow'), x((d) => [['head', 'cyl', [d.headW * 0.3, d.headW * 0.2, d.headW * 0.3], [0, top(d) - d.headH * 0.05, d.headD * 0.52], 'silver', { srot: [90, 0, 0] }], ['head', 'cyl', [d.headW * 0.22, d.headW * 0.05, d.headW * 0.22], [0, top(d) - d.headH * 0.05, d.headD * 0.64], 'flame', { srot: [90, 0, 0] }], ['head', 'ball', [d.headW * 0.25, d.headH * 0.12, d.headD * 0.05], [-d.headW * 0.2, d.headY - d.headH * 0.2, d.headD * 0.47], '#3a3633', { noInk: true }]]), wear('overalls', '#3d4f7a'), held('pickaxe'), held('lantern', 'flame', 'L')] }),
  ),
  e('minotaur', 'fantasy', 'monsters', () =>
    who('minotaur', { h: 2.5, build: 1.45, skin: '#7a4a2a', top: '#7a4a2a', bottom: '#4a3020', skirt: '#5a3a22', shoes: '#3a2a20', hair: '#4a3020', style: 'short', eyes: '#d23a2a', acc: [x((d) => [['head', 'ball', [d.headW * 0.75, d.headH * 0.5, d.headD * 0.6], [0, d.headY - d.headH * 0.2, d.headD * 0.42], '#c9a07a'], ...[1, -1].flatMap((s): Spec[] => [['head', 'ball', [d.headW * 0.12, d.headW * 0.1, d.headW * 0.06], [s * d.headW * 0.15, d.headY - d.headH * 0.2, d.headD * 0.72], '#3a2a20', { noInk: true }], ['head', 'cyl', [d.headW * 0.26, d.headW * 0.55, d.headW * 0.26], [s * d.headW * 0.66, top(d) - d.headH * 0.12, 0], 'cream', { taper: 0.65, srot: [0, 0, -s * 80] }], ['head', 'cyl', [d.headW * 0.18, d.headH * 0.5, d.headW * 0.18], [s * d.headW * 0.98, top(d) + d.headH * 0.1, 0], 'cream', { taper: 0, srot: [0, 0, -s * 15] }], ['head', 'ball', [d.headW * 0.35, d.headH * 0.15, d.headW * 0.12], [s * d.headW * 0.6, d.headY + d.headH * 0.05, 0], '#7a4a2a', { srot: [0, 0, s * 20] }]]), ['head', 'torus', [d.headW * 0.25, d.headW * 0.25, d.headW * 0.05], [0, d.headY - d.headH * 0.36, d.headD * 0.7], 'gold', { tube: 0.25 }]]), wear('belt', 'darkbrown'), held('axe')] }),
  ),
  e('miser', 'town', 'storybook', () =>
    who('miser', { build: 0.85, skin: 'skin1', top: 'black', long: true, bottom: 'black', shoes: 'black', hair: 'lightgray', style: 'short', acc: [lean(14), hat('top', '#2a2a30'), wear('coat', '#2a2a30'), wear('scarf', 'gray'), inHand('L', (a) => [['ball', [a * 2.6, a * 2.8, a * 2.4], [0, -a * 1.6, a * 0.8], 'tan'], ['box', [a * 1.2, a * 1.2, a * 0.05], [0, -a * 1.6, a * 2.0], 'tan', { role: 'label', text: '$', layer: 6 }], ['cyl', [a * 0.9, a * 0.25, a * 0.9], [a * 1.4, -a * 3.0, a * 0.8], 'gold']]), inHand('R', (a) => [['cyl', [a * 2, a * 0.3, a * 2], [0, -a * 0.6, a * 1.2], 'brass'], ['cyl', [a * 0.7, a * 2, a * 0.7], [0, a * 0.5, a * 1.2], 'cream'], ['ball', [a * 0.5, a * 0.8, a * 0.5], [0, a * 1.8, a * 1.2], 'flame']])] }),
  ),
  e('mister hyde', 'town', 'storybook', () =>
    who('mister hyde', { h: 1.8, build: 1.4, skin: '#c4ad98', top: 'white', long: true, bottom: 'black', shoes: 'black', hair: '#2a2726', style: 'spiky', eyes: '#d23a2a', acc: [lean(20), hat('top', '#2a2726'), wear('coat', '#2a2a30'), x((d) => [['torso', 'wedge', [d.tw * 0.35, d.torsoH * 0.25, d.td * 1.2], [-d.tw * 0.3, -d.torsoH * 0.02, 0], '#2a2a30', { srot: [0, 0, 180] }]]), gloves('#c4ad98', 1.5), held('cane', 'black')] }),
  ),
  e('mohawk', 'wardrobe', 'hairstyles', () => {
    const b = m('mohawk')
      .cyl([0.11, 0.02, 0.11], [0, 0.01, 0], { color: 'black' })
      .cyl([0.06, 0.06, 0.06], [0, 0.05, 0], { color: 'skin2' })
      .ball([0.12, 0.14, 0.13], [0, 0.14, 0], { color: 'skin2' })
      .ball([0.025, 0.04, 0.025], [0.06, 0.135, -0.005], { color: 'skin2' })
      .ball([0.025, 0.04, 0.025], [-0.06, 0.135, -0.005], { color: 'skin2' })
      .ball(0.016, [0.025, 0.15, 0.06], { color: 'black', eye: true })
      .ball(0.016, [-0.025, 0.15, 0.06], { color: 'black', eye: true })
      .capsule([0.02, 0.008, 0.008], [0, 0.11, 0.063], { color: 'darkred', rot: [0, 0, 90] })
      .box([0.03, 0.03, 0.13], [0, 0.205, -0.005], { color: 'magenta', round: 0.5 });
    for (let i = 0; i < 5; i++) b.cone([0.03, 0.075, 0.035], [0, 0.235 - Math.abs(i - 1.5) * 0.006, 0.05 - i * 0.027], { color: 'magenta', rot: [-15 - i * 8, 0, 0] });
    return b.done();
  }),
  e('monster', 'fantasy', 'monsters', () =>
    who('monster', { h: 2.4, build: 1.35, skin: '#8fbf7a', top: '#3a3a3a', long: true, bottom: '#5c6166', shoes: 'black', hair: 'black', style: 'none', eyes: '#f6d24a', acc: [x((d) => [['head', 'box', [d.headW * 1.04, d.headH * 0.3, d.headD * 1.0], [0, top(d) - d.headH * 0.06, -d.headD * 0.02], 'black', { round: 0.2 }], ...[1, -1].map((s): Spec => ['head', 'cyl', [d.headW * 0.12, d.headW * 0.3, d.headW * 0.12], [s * d.headW * 0.5, d.headY - d.headH * 0.4, 0], 'silver', { srot: [0, 0, 90] }]), ['head', 'box', [d.headW * 0.3, d.headH * 0.03, d.headD * 0.04], [d.headW * 0.1, d.headY + d.headH * 0.3, d.headD * 0.45], '#3a3633', { noInk: true }]]), boots('black'), gloves('#8fbf7a', 1.35)] }),
  ),
  e('mother', 'town', 'family', () =>
    who('mother', { h: 1.65, top: 'pink', long: true, bottom: 'denim', shoes: 'white', hair: 'brown', style: 'ponytail', acc: [inHand('L', (a) => [['ball', [a * 2.6, a * 2.2, a * 3.6], [0, a * 0.4, a * 1.6], 'skyblue', { srot: [-20, 0, 0] }], ['ball', [a * 1.6, a * 1.6, a * 1.6], [0, a * 1.4, a * 2.8], 'skin1'], ['ball', [a * 1.9, a * 1.2, a * 1.3], [0, a * 1.9, a * 2.6], 'skyblue']]), held('bag', 'tan')] }),
  ),
  e('mountain climber', 'town', 'outdoors', () =>
    who('mountain climber', { top: 'orange', long: true, bottom: 'darkgray', shoes: 'brown', beard: 'brown', acc: [hat('helmet', 'red'), face('goggles', 'darkgray'), wear('backpack', 'blue'), x((d) => [['torso', 'torus', [d.tw * 0.9, d.tw * 1.3, d.td * 0.3], [d.tw * 0.05, d.torsoH * 0.55, d.td * 0.3], 'tan', { srot: [0, 20, 35], tube: 0.25 }]]), boots('brown'), held('pickaxe', 'silver')] }),
  ),
  e('movie star', 'town', 'entertainment', () =>
    who('movie star', { top: 'gold', skirt: 'gold', bottom: 'gold', shoes: 'red', hair: '#f2e2b0', style: 'long', acc: [wear('robe', 'gold'), face('sunglasses'), wear('necklace', 'white'), earrings('white'), inHand('L', (a) => [['box', [a * 1.2, a * 0.6, a * 1.2], [0, -a * 0.2, a * 1.0], 'black'], ['capsule', [a * 0.7, a * 2.2, a * 0.6], [0, a * 1.2, a * 1.0], 'gold'], ['ball', [a * 0.6, a * 0.6, a * 0.6], [0, a * 2.6, a * 1.0], 'gold']])] }),
  ),
  e('mozart', 'town', 'history', () =>
    who('mozart', { skin: 'skin1', top: 'red', long: true, bottom: 'cream', legs: 'white', shoes: 'black', hair: 'white', style: 'ponytail', acc: [wear('coat', 'red'), bands('gold', [0.15], 0.05), x((d) => [['torso', 'ball', [d.tw * 0.3, d.tw * 0.24, d.td * 0.3], [0, d.torsoH * 0.88, d.td * 0.52], 'white', { layer: 5 }], ...[1, -1].map((s): Spec => ['head', 'capsule', [d.headW * 0.16, d.headH * 0.3, d.headW * 0.16], [s * d.headW * 0.52, d.headY + d.headH * 0.08, -d.headD * 0.05], 'white', { srot: [0, 0, 90] }])]), held('violin'), held('baton', 'white', 'L')] }),
  ),
  e('mummy', 'fantasy', 'undead', () =>
    who('mummy', { skin: '#e8dcc0', top: '#e8dcc0', long: true, bottom: '#e8dcc0', shoes: '#d9cba8', style: 'none', eyes: '#2a2726', blush: '#e8dcc0', acc: [lean(6), bands('#c9b892', [0.15, 0.35, 0.55, 0.75, 0.92], 0.04), x((d) => [...[0.25, 0.05, -0.2, -0.38].map((v): Spec => ['head', 'torus', [d.headW * 1.0, d.headD * 0.96, d.headH * 0.04], [0, d.headY + d.headH * v, 0], '#c9b892', { srot: [90, 0, 0], tube: 0.06, noInk: true }]), ['torso', 'box', [d.tw * 0.18, d.torsoH * 0.9, d.td * 0.08], [d.tw * 0.3, -d.torsoH * 0.15, -d.td * 0.45], '#d9cba8', { srot: [0, 0, 8] }]]), x2((d, _s, side) => [0.3, 0.7].map((v): Spec => [`leg${side}`, 'cyl', [d.lw * 1.1, d.legLen * 0.04, d.lw * 1.1], [0, -d.legLen * v * 0.5, 0], '#c9b892', { noInk: true }]))] }),
  ),
  e('musician', 'town', 'music', () =>
    who('musician', { top: 'white', long: true, bottom: 'black', shoes: 'black', style: 'short', acc: [wear('vest', 'black'), wear('bowtie', 'red'), hat('bowler', 'black'), held('trumpet', 'brass')] }),
  ),
  e('musketeer (person)', 'town', 'history', () =>
    who('musketeer (person)', { top: 'blue', long: true, bottom: 'darkbrown', shoes: 'darkbrown', hair: 'darkbrown', style: 'long', beard: 'darkbrown', acc: [hat('cowboy', '#3a2a40'), x((d) => [['head', 'capsule', [d.headW * 0.2, d.headH * 0.9, d.headW * 0.08], [d.headW * 0.35, top(d) + d.headH * 0.25, -d.headD * 0.2], 'white', { srot: [-30, 0, -40] }], ['torso', 'box', [d.tw * 0.14, d.torsoH * 0.7, d.td * 0.06], [0, d.torsoH * 0.55, d.td * 0.53], 'white', { layer: 4 }], ['torso', 'box', [d.tw * 0.55, d.torsoH * 0.1, d.td * 0.06], [0, d.torsoH * 0.62, d.td * 0.53], 'white', { layer: 4 }]]), face('mustache', 'darkbrown'), wear('sash', 'darkbrown'), boots('darkbrown'), held('sword', 'silver')] }),
  ),
  e('mutant', 'town', 'comics', () =>
    who('mutant', { h: 1.75, build: 1.3, top: 'yellow', long: true, bottom: 'yellow', shoes: 'blue', hair: 'black', style: 'spiky', acc: [x2((d, s) => [['torso', 'box', [d.tw * 0.25, d.torsoH * 0.9, d.td * 1.12], [s * d.tw * 0.4, d.torsoH * 0.5, 0], 'blue', { layer: 2, round: 0.4 }]]), wear('belt', 'red'), boots('blue'), gloves('blue'), x2((d, _s, side) => [-1, 0, 1].map((i): Spec => [`hand${side}`, 'box', [d.aw * 0.15, d.H * 0.11, d.aw * 0.08], [i * d.aw * 0.35, -d.aw * 0.8 - d.H * 0.05, d.aw * 0.4], 'silver', { srot: [20, 0, 0] }]))] }),
  ),
  e('mute', 'town', 'everyday people', () =>
    who('mute', { top: 'gray', long: true, bottom: 'denim', shoes: 'white', style: 'short', acc: [x((d) => [['head', 'box', [d.headW * 0.42, d.headH * 0.06, d.headD * 0.05], [0, d.headY - d.headH * 0.22, d.headD * 0.47], 'silver', { layer: 6 }], ['head', 'box', [d.headW * 0.06, d.headH * 0.12, d.headD * 0.05], [d.headW * 0.22, d.headY - d.headH * 0.22, d.headD * 0.47], 'silver', { layer: 6 }]]), inHand('L', (a) => [['box', [a * 3.6, a * 2.6, a * 0.2], [0, a * 0.4, a * 1.2], 'white', { role: 'label', text: '...' }], ['box', [a * 3.8, a * 0.3, a * 0.3], [0, -a * 1.0, a * 1.2], 'black']])] }),
  ),
  e('napoleon bonaparte', 'town', 'history', () =>
    who('napoleon bonaparte', { h: 1.68, build: 1.1, skin: 'skin1', top: 'navy', long: true, bottom: 'white', shoes: 'black', hair: 'darkbrown', style: 'short', acc: [bicorne('black', 'blue'), wear('coat', 'navy'), x((d) => [['torso', 'box', [d.tw * 0.45, d.torsoH * 0.6, d.td * 0.1], [0, d.torsoH * 0.6, d.td * 0.56], 'white', { layer: 4 }], ['torso', 'box', [d.tw * 0.7, d.torsoH * 0.16, d.td * 0.08], [0, d.torsoH * 0.95, d.td * 0.4], 'red', { layer: 5 }]]), shoulders('gold', 0.75), boots('black'), held('sword', 'silver', 'L')] }),
  ),
  e('neanderthal', 'town', 'history', () =>
    who('neanderthal', { h: 1.65, build: 1.35, skin: 'skin3', top: 'skin3', bottom: 'tan', skirt: '#a8805a', legs: 'skin3', shoes: 'skin3', hair: 'darkbrown', style: 'long', beard: 'darkbrown', acc: [lean(10), face('beard', 'darkbrown'), x((d) => [['torso', 'box', [d.tw * 0.55, d.torsoH * 1.05, d.td * 1.15], [-d.tw * 0.1, d.torsoH * 0.45, 0], '#a8805a', { srot: [0, 0, -25], layer: 2, round: 0.4 }], ['head', 'box', [d.headW * 0.75, d.headH * 0.1, d.headD * 0.15], [0, d.headY + d.headH * 0.13, d.headD * 0.42], 'skin3', { round: 0.8 }]]), held('club', 'wood')] }),
  ),
  e('ninja', 'town', 'history', () =>
    who('ninja', { top: 'black', long: true, bottom: 'black', shoes: 'black', style: 'none', acc: [hat('hood', '#2a2726'), face('mask', 'black'), hat('headband', 'red'), wear('belt', 'red'), x((d) => [rod('torso', [d.tw * 0.45, d.torsoH * 1.1, -d.td * 0.6], [-d.tw * 0.4, d.torsoH * 0.05, -d.td * 0.6], d.tw * 0.1, 'darkgray')]), held('sword', 'silver')] }),
  ),
  e('nobleman', 'town', 'royalty', () =>
    who('nobleman', { h: 1.75, top: 'purple', long: true, bottom: 'cream', legs: 'white', shoes: 'black', hair: 'white', style: 'ponytail', acc: [wear('coat', '#6a2a4a'), bands('gold', [0.2, 0.45], 0.03), x((d) => [['torso', 'torus', [d.tw * 0.85, d.tw * 0.85, d.td * 0.35], [0, d.torsoH * 1.0, 0], 'white', { srot: [90, 0, 0], tube: 0.5 }], ['head', 'capsule', [d.headW * 0.15, d.headH * 0.7, d.headW * 0.06], [d.headW * 0.3, top(d) + d.headH * 0.25, -d.headD * 0.1], 'white', { srot: [-20, 0, -40] }]]), hat('beret', 'purple'), held('cane', 'gold')] }),
  ),
  e('noblewoman', 'town', 'royalty', () =>
    who('noblewoman', { h: 1.65, skin: 'skin1', top: 'pink', long: true, bottom: 'pink', shoes: 'pink', hair: 'gold', style: 'bun', acc: [x((d) => [['hips', 'cyl', [d.tw * 2.4, d.legLen * 0.98, d.td * 2.9], [0, -d.legLen * 0.5, 0], 'pink', { taper: 0.4 }], ['hips', 'cyl', [d.tw * 2.42, d.legLen * 0.08, d.td * 2.92], [0, -d.legLen * 0.94, 0], 'white']]), hat('tiara', 'gold'), wear('necklace', 'white'), earrings('white'), inHand('L', (a) => [['wedge', [a * 3.6, a * 2.6, a * 0.2], [0, a * 1.2, a * 1.2], 'white', { srot: [-15, 0, 180] }]])] }),
  ),
  e('nomad', 'town', 'outdoors', () =>
    who('nomad', { skin: 'skin4', top: '#c9a06a', long: true, bottom: '#c9a06a', shoes: 'brown', hair: 'black', style: 'short', beard: 'black', acc: [hat('hood', '#e8dcc0'), hat('headband', 'black'), face('beard', 'black'), wear('robe', '#c9a06a'), wear('sash', 'darkred'), wear('backpack', 'brown'), inHand('R', (a, d) => [['capsule', [a * 0.35, d.H * 0.95, a * 0.35], [0, d.H * 0.15, a * 0.5], 'wood']])] }),
  ),
  e('novelist', 'town', 'arts', () =>
    who('novelist', { top: 'white', long: true, bottom: 'brown', shoes: 'brown', hair: 'gray', style: 'short', beard: 'gray', acc: [face('beard', 'gray'), face('glasses', 'black'), wear('coat', '#7a6a5a'), wear('scarf', 'darkred'), held('book', 'navy'), held('pointer', 'black', 'L')] }),
  ),
  e('nun', 'town', 'religion', () =>
    who('nun', { h: 1.65, top: 'black', long: true, bottom: 'black', shoes: 'black', style: 'none', acc: [hat('hood', '#2a2726'), x((d) => [['head', 'torus', [d.headW * 1.0, d.headH * 1.0, d.headD * 0.18], [0, d.headY + d.headH * 0.02, d.headD * 0.35], 'white', { tube: 0.18 }], ['torso', 'ball', [d.tw * 0.7, d.torsoH * 0.3, d.td * 0.5], [0, d.torsoH * 0.9, d.td * 0.25], 'white']]), hat('veil', '#2a2726'), wear('robe', 'black'), x((d) => [['torso', 'box', [d.tw * 0.06, d.tw * 0.24, d.td * 0.05], [0, d.torsoH * 0.55, d.td * 0.58], 'silver', { layer: 6 }], ['torso', 'box', [d.tw * 0.16, d.tw * 0.06, d.td * 0.05], [0, d.torsoH * 0.58, d.td * 0.58], 'silver', { layer: 6 }]])] }),
  ),
  e('nurse', 'town', 'medical', () =>
    who('nurse', { h: 1.65, top: 'white', skirt: 'white', legs: 'white', shoes: 'white', hair: 'brown', style: 'bun', acc: [hat('nurse'), wear('stethoscope'), wear('belt', 'white'), held('clipboard'), x((d) => [['torso', 'box', [d.tw * 0.14, d.tw * 0.14, d.td * 0.05], [d.tw * 0.25, d.torsoH * 0.75, d.td * 0.54], 'red', { layer: 5 }]])] }),
  ),
  e('nutritionist', 'town', 'medical', () =>
    who('nutritionist', { h: 1.65, top: 'lime', long: true, bottom: 'tan', shoes: 'white', style: 'ponytail', acc: [wear('labcoat'), face('glasses', 'teal'), held('clipboard'), inHand('L', (a) => [['ball', [a * 2.0, a * 1.9, a * 2.0], [0, a * 0.6, a * 1.3], 'red'], ['capsule', [a * 0.2, a * 0.6, a * 0.2], [0, a * 1.7, a * 1.3], 'darkbrown'], ['ball', [a * 0.7, a * 0.3, a * 0.4], [a * 0.4, a * 1.75, a * 1.3], 'leaf']])] }),
  ),
  e('odin', 'fantasy', 'gods', () =>
    who('odin', { h: 1.95, build: 1.25, top: 'darkgray', long: true, bottom: '#4a4a44', shoes: 'darkbrown', hair: 'lightgray', style: 'long', beard: 'lightgray', acc: [face('longbeard', 'lightgray'), face('eyepatch'), hat('helmet', 'silver'), x2((d, s) => [['head', 'ball', [d.headW * 0.5, d.headH * 0.3, d.headW * 0.12], [s * d.headW * 0.6, top(d) + d.headH * 0.12, 0], 'white', { srot: [0, 0, -s * 30] }], ['torso', 'ball', [d.tw * 0.26, d.tw * 0.2, d.tw * 0.36], [s * d.tw * 0.42, d.torsoH * 1.08, -d.td * 0.1], 'black'], ['torso', 'ball', [d.tw * 0.16, d.tw * 0.16, d.tw * 0.16], [s * d.tw * 0.42, d.torsoH * 1.2, d.td * 0.1], 'black'], ['torso', 'cyl', [d.tw * 0.06, d.tw * 0.1, d.tw * 0.06], [s * d.tw * 0.42, d.torsoH * 1.19, d.td * 0.25], 'gray', { taper: 0, srot: [90, 0, 0] }]]), wear('cape', 'gray'), wear('belt', 'darkbrown'), held('spear')] }),
  ),
  e('opera singer', 'town', 'music', () =>
    who('opera singer', { build: 1.35, top: 'silver', long: true, bottom: 'darkred', skirt: 'darkred', shoes: 'brown', hair: 'gold', style: 'pigtails', acc: [hat('viking'), wear('armor', 'silver'), wear('robe', 'darkred'), x((d) => [['torso', 'box', [d.tw * 1.1, d.torsoH * 0.25, d.td * 1.15], [0, d.torsoH * 0.7, 0], 'silver', { layer: 2, round: 0.6 }]]), held('spear'), held('shield', 'gold', 'L')] }),
  ),
  e('optician', 'town', 'medical', () =>
    who('optician', { top: 'white', long: true, bottom: 'navy', shoes: 'black', style: 'short', acc: [face('glasses', 'black'), wear('labcoat'), wear('tie', 'teal'), inHand('L', (a) => [...[1, -1].map((s): Hold => ['torus', [a * 1.6, a * 1.4, a * 0.25], [s * a * 0.95, a * 0.8, a * 1.2], 'black', { tube: 0.2 }]), ['box', [a * 0.5, a * 0.2, a * 0.2], [0, a * 0.95, a * 1.2], 'black'], ...[1, -1].map((s): Hold => ['ball', [a * 1.3, a * 1.1, a * 0.1], [s * a * 0.95, a * 0.8, a * 1.2], 'glass', { noInk: true }])])] }),
  ),
  e('optometrist', 'town', 'medical', () =>
    who('optometrist', { top: 'skyblue', long: true, bottom: 'gray', shoes: 'black', style: 'bun', acc: [wear('labcoat'), face('glasses', 'navy'), held('pointer', 'black'), inHand('L', (a) => [['box', [a * 3.2, a * 4.2, a * 0.2], [0, a * 0.6, a * 1.2], 'white', { role: 'label', text: 'E' }], ...[0, 1, 2].map((i): Hold => ['box', [a * (1.6 - i * 0.45), a * 0.25, a * 0.05], [0, a * (2.2 - i * 0.55) - a * 1.0, a * 1.32], '#2a2726', { noInk: true }])])] }),
  ),
  e('orc', 'fantasy', 'monsters', () =>
    who('orc', { h: 2.0, build: 1.45, skin: '#6a8a4a', top: 'darkbrown', bottom: '#4a3a2a', shoes: 'black', hair: 'black', style: 'ponytail', eyes: '#d23a2a', acc: [pointyEars('#6a8a4a'), x2((d, s) => [['head', 'cyl', [d.headW * 0.12, d.headH * 0.22, d.headW * 0.12], [s * d.headW * 0.18, d.headY - d.headH * 0.26, d.headD * 0.47], 'cream', { taper: 0 }], ['torso', 'cyl', [d.tw * 0.2, d.tw * 0.3, d.tw * 0.2], [s * d.tw * 0.45, d.torsoH * 1.1, 0], 'silver', { taper: 0 }]]), wear('armor', '#4a4a4a'), wear('belt', 'darkbrown'), boots('black'), held('axe')] }),
  ),
  e('orphan', 'town', 'family', () =>
    who('orphan', { h: 'kid', top: '#8a7a5a', long: true, bottom: '#5a4a30', shoes: '#3a2a20', hair: 'brown', style: 'short', acc: [hat('beret', 'gray'), x((d) => [['torso', 'box', [d.tw * 0.25, d.torsoH * 0.2, d.td * 0.06], [-d.tw * 0.2, d.torsoH * 0.35, d.td * 0.52], '#a0522d', { layer: 4 }], ['legR', 'box', [d.lw * 0.7, d.lw * 0.7, d.lw * 0.1], [0, -d.legLen * 0.25, d.lw * 0.5], '#8a8f3a', { layer: 4 }]]), inHand('L', (a) => [['cyl', [a * 2.8, a * 1.0, a * 2.8], [0, a * 0.3, a * 1.4], 'lightgray', { taper: 1.6 }], ['capsule', [a * 0.25, a * 2, a * 0.25], [a * 0.6, a * 1.2, a * 1.4], 'silver', { srot: [0, 0, -20] }]])] }),
  ),
  e('page boy', 'town', 'wedding', () =>
    who('page boy', { h: 'kid', top: 'white', long: true, bottom: 'navy', shoes: 'black', hair: 'gold', style: 'short', acc: [wear('vest', 'navy'), wear('bowtie', 'navy'), inHand('L', (a) => [['box', [a * 3, a * 0.9, a * 2.4], [0, a * 0.2, a * 1.4], 'white', { round: 0.8 }], ['torus', [a * 0.8, a * 0.8, a * 0.25], [0, a * 0.9, a * 1.4], 'gold', { tube: 0.3 }]])] }),
  ),
  e('paleontologist', 'town', 'science', () =>
    who('paleontologist', { top: '#c9b07a', long: true, bottom: 'olive', shoes: 'darkbrown', hair: 'brown', style: 'ponytail', acc: [hat('cowboy', 'tan'), wear('vest', '#a8956a'), boots('darkbrown'), held('paintbrush'), inHand('L', (a) => [['capsule', [a * 0.8, a * 3.6, a * 0.8], [0, -a * 0.4, a * 1.3], 'cream', { srot: [0, 0, 70] }], ...[1, -1].flatMap((s): Hold[] => [['ball', [a * 1.0, a * 1.0, a * 0.9], [s * a * 1.7, -a * 0.4 + s * a * 0.95, a * 1.3], 'cream'], ['ball', [a * 1.0, a * 1.0, a * 0.9], [s * a * 1.95, -a * 0.4 + s * a * 0.35, a * 1.3], 'cream']])])] }),
  ),
  e('paparazzi', 'town', 'media', () =>
    who('paparazzi', { top: 'black', long: true, bottom: 'darkgray', shoes: 'black', style: 'short', beard: 'black', acc: [hat('cap', 'darkgray'), face('beard', 'black'), wear('vest', 'olive'), inHand('L', (a) => [['box', [a * 2.4, a * 1.7, a * 1.4], [0, a * 0.4, a * 1.2], 'black'], ['cyl', [a * 1.2, a * 1.8, a * 1.2], [0, a * 0.3, a * 2.6], 'darkgray', { srot: [90, 0, 0] }], ['box', [a * 1.4, a * 0.8, a * 0.8], [0, a * 1.7, a * 1.2], 'silver'], ['box', [a * 1.2, a * 0.6, a * 0.1], [0, a * 1.7, a * 1.62], 'flame', { noInk: true }]])] }),
  ),
  e('paperboy', 'town', 'media', () =>
    who('paperboy', { h: 1.5, top: 'white', long: true, bottom: 'brown', legs: 'gray', shoes: 'darkbrown', hair: 'brown', style: 'short', acc: [hat('cap', 'gray'), wear('vest', 'brown'), wear('sash', 'tan'), x((d) => [['hips', 'box', [d.tw * 0.7, d.lw * 2.2, d.td * 0.7], [d.tw * 0.55, -d.lw * 0.3, d.td * 0.2], 'tan', { round: 0.3 }], ['hips', 'box', [d.tw * 0.55, d.lw * 0.6, d.td * 0.5], [d.tw * 0.55, d.lw * 0.9, d.td * 0.2], 'paper']]), inHand('R', (a) => [['box', [a * 3.2, a * 2.4, a * 0.3], [0, a * 0.6, a * 1.2], 'paper', { role: 'label', text: 'NEWS' }]])] }),
  ),
  e('paramedic', 'town', 'medical', () =>
    who('paramedic', { top: 'darkgreen', long: true, bottom: 'darkgreen', shoes: 'black', style: 'short', acc: [bands('#e8eef0', [0.3, 0.5], 0.06), wear('stethoscope'), gloves('#6ab0e0'), boots('black'), inHand('L', (a) => [['box', [a * 3.4, a * 2.6, a * 1.8], [0, -a * 2, a * 0.6], 'red'], ['box', [a * 1.4, a * 1.4, a * 0.05], [0, -a * 2, a * 1.55], 'white', { role: 'label', text: '+' }]])] }),
  ),
  e('paratrooper', 'town', 'military', () =>
    who('paratrooper', { top: 'olive', long: true, bottom: 'olive', shoes: 'black', style: 'short', acc: [hat('military'), boots('black'), wear('belt', 'darkbrown'), wear('backpack', '#5a5a3a'), x((d) => {
      const cy = d.H * 1.65 - d.legLen;
      return [['torso', 'ball', [d.H * 1.1, d.H * 0.45, d.H * 1.1], [0, cy, -d.td * 0.5], '#8a8f3a'], ['torso', 'cyl', [d.H * 1.06, d.H * 0.04, d.H * 1.06], [0, cy - d.H * 0.04, -d.td * 0.5], '#6b6f2e'], ...[1, -1].flatMap((s): Spec[] => [rod('torso', [s * d.tw * 0.35, d.torsoH * 0.95, -d.td * 0.5], [s * d.H * 0.5, cy - d.H * 0.06, -d.td * 0.5], d.tw * 0.04, 'white'), rod('torso', [s * d.tw * 0.35, d.torsoH * 0.95, -d.td * 0.5], [s * d.H * 0.2, cy - d.H * 0.15, -d.td * 0.5], d.tw * 0.04, 'white')])];
    })] }),
  ),
  e('patient', 'town', 'medical', () =>
    who('patient', { top: '#a8d0e8', skirt: '#a8d0e8', legs: 'skin2', skin: 'skin2', shoes: 'white', hair: 'brown', style: 'short', acc: [hat('headband', 'white'), x2((d, s) => [['torso', 'ball', [d.tw * 0.08, d.tw * 0.08, d.td * 0.05], [s * d.tw * 0.15, d.torsoH * 0.5, d.td * 0.52], 'navy', { noInk: true, layer: 4 }]]), x((d) => [['', 'capsule', [d.tw * 0.07, d.H * 1.05, d.tw * 0.07], [-d.tw * 1.2, d.H * 0.55, 0], 'silver'], ['', 'cyl', [d.tw * 0.8, d.H * 0.03, d.tw * 0.8], [-d.tw * 1.2, d.H * 0.03, 0], 'darkgray', { segs: 5 }], ['', 'box', [d.tw * 0.35, d.H * 0.12, d.tw * 0.12], [-d.tw * 1.2, d.H * 0.95, d.tw * 0.1], 'glass', { round: 0.6 }], ['', 'capsule', [d.tw * 0.5, d.tw * 0.05, d.tw * 0.05], [-d.tw * 1.2 + d.tw * 0.2, d.H * 1.06, 0], 'silver', { srot: [0, 0, 90] }]]), held('cane', 'silver', 'L')] }),
  ),
  e('peasant', 'town', 'history', () =>
    who('peasant', { top: 'tan', long: true, bottom: 'brown', shoes: 'darkbrown', hair: 'brown', style: 'short', acc: [hat('hood', '#8a6a3a'), wear('belt', '#c9b28a'), x((d) => [['hips', 'cyl', [d.tw * 1.2, d.legLen * 0.35, d.td * 1.5], [0, -d.legLen * 0.1, 0], 'tan', { taper: 0.85 }]]), held('pitchfork', 'wood'), held('basket', 'tan', 'L')] }),
  ),
];
