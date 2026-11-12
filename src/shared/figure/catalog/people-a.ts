/** Catalog chunk people-a: the words in assign/people-a.tsv. */
import { e, type CatalogEntry } from './types';
import { m } from '../dsl';
import { beast, body, face, hat, held, wear, who, type Extra, type WhoOpts } from '../accessories';
import type { PersonDims } from '../kit';
import type { FigPart, Figure, Shape, Vec3 } from '../types';
import { col } from '../colors';
import { measure } from '../math';

/* ----- local helpers: custom parts in a person's joint frames ----- */

let xn = 0;
type XO = Partial<Pick<FigPart, 'srot' | 'taper' | 'segs' | 'tube' | 'round' | 'noInk' | 'layer' | 'apex' | 'text'>> & { glow?: boolean };
type XP = [parent: string, shape: Shape, size: Vec3, at: Vec3, color: string, o?: XO];
/** Extra parts: parent joint ('' = figure space), shape, size, joint position, colour. */
const X = (f: (d: PersonDims) => XP[]): Extra => (p, d) => {
  for (const [parent, shape, size, at, color, o = {}] of f(d)) {
    const { glow, ...rest } = o;
    p.add({ name: `x${xn++}`, parent: parent || undefined, at, shape, size, color: col(color, color), layer: 3, ...rest, role: glow ? 'glow' : rest.text ? 'label' : undefined });
  }
};
/** A person (names of custom parts restart for every build). */
const W = (key: string, o: WhoOpts): Figure => {
  xn = 0;
  return who(key, o);
};
type HP = [shape: Shape, size: Vec3, at: Vec3, color: string, o?: XO];
/** Something custom in a hand, positions in units of the arm width `a` from the wrist. */
const inHand = (side: 'L' | 'R', f: (a: number, d: PersonDims) => HP[]): Extra => X((d) => f(d.aw, d).map(([s, z, at, c, o]) => [`hand${side}`, s, z, at, c, o] as XP));
const hd = (d: PersonDims) => ({ W: d.headW, Hh: d.headH, D: d.headD, y: d.headY, top: d.headY + d.headH * 0.42 });
/** Change a built part (pose arms, lift the body). */
const tweak = (f: (list: FigPart[], d: PersonDims) => void): Extra => (p, d) => f(p.list, d);
const part = (list: FigPart[], n: string) => list.find((q) => q.name === n)!;
/** Arms out from the sides, degrees (0 hangs, 90 straight out, 170 overhead). */
const arms = (l: number, r = l): Extra => tweak((list) => {
  part(list, 'armL').rot = [0, 0, l];
  part(list, 'armR').rot = [0, 0, -r];
});
/** Stand the person on something dy metres high. */
const lift = (dy: number): Extra => tweak((list) => void (part(list, 'hips').at[1] += dy));

// headwear
const tophat = (c: string, band?: string) => X((d) => {
  const { W: w, Hh, D, top } = hd(d);
  const r: XP[] = [['head', 'cyl', [w * 1.45, Hh * 0.05, D * 1.35], [0, top, 0], c], ['head', 'cyl', [w * 0.84, Hh * 0.85, D * 0.8], [0, top + Hh * 0.43, 0], c]];
  if (band) r.push(['head', 'cyl', [w * 0.86, Hh * 0.1, D * 0.82], [0, top + Hh * 0.08, 0], band]);
  return r;
});
const fedora = (c: string, band = 'black') => X((d) => {
  const { W: w, Hh, D, top } = hd(d);
  return [['head', 'cyl', [w * 1.6, Hh * 0.04, D * 1.5], [0, top - Hh * 0.03, 0], c], ['head', 'cyl', [w * 0.86, Hh * 0.38, D * 0.8], [0, top + Hh * 0.14, 0], c, { taper: 0.8 }], ['head', 'cyl', [w * 0.88, Hh * 0.08, D * 0.82], [0, top + Hh * 0.01, 0], band]];
});
const bicorne = (c: string, trim = 'gold') => X((d) => {
  const { W: w, Hh, D, top } = hd(d);
  return [['head', 'wedge', [w * 2.0, Hh * 0.55, D * 0.7], [0, top + Hh * 0.12, 0], c], ['head', 'ball', [w * 0.2, w * 0.2, w * 0.08], [0, top + Hh * 0.12, D * 0.36], trim]];
});
const cap0 = (c: string) => X((d) => {
  const { W: w, Hh, D, top } = hd(d);
  return [['head', 'ball', [w * 1.1, Hh * 0.56, D * 1.06], [0, top - Hh * 0.08, 0], c]];
});
const bucket = (c: string) => X((d) => {
  const { W: w, Hh, D, top } = hd(d);
  return [['head', 'cyl', [w * 0.98, Hh * 0.32, D * 0.94], [0, top + Hh * 0.04, 0], c, { taper: 0.9 }], ['head', 'cyl', [w * 1.55, Hh * 0.12, D * 1.5], [0, top - Hh * 0.1, 0], c, { taper: 0.65 }]];
});
const pillbox = (c: string) => X((d) => {
  const { W: w, Hh, D, top } = hd(d);
  return [['head', 'cyl', [w * 0.62, Hh * 0.22, D * 0.6], [0, top + Hh * 0.02, D * 0.05], c]];
});
const crest = (c: string) => X((d) => {
  const { W: w, Hh, D, top } = hd(d);
  return [['head', 'ball', [w * 0.18, Hh * 0.5, D * 1.25], [0, top + Hh * 0.18, -D * 0.05], c]];
});
const feather = (c: string, x = 0.35) => X((d) => {
  const { W: w, Hh, top } = hd(d);
  return [['head', 'ball', [w * 0.12, Hh * 0.55, w * 0.2], [w * x, top + Hh * 0.2, -w * 0.1], c, { srot: [0, 0, -30] }]];
});
const greathelm = (c: string, slit = 'black') => X((d) => {
  const { W: w, Hh, D, y } = hd(d);
  return [['head', 'cyl', [w * 1.12, Hh * 1.12, D * 1.1], [0, y + Hh * 0.02, 0], c], ['head', 'box', [w * 0.75, Hh * 0.07, D * 0.1], [0, y + Hh * 0.08, D * 0.52], slit, { layer: 6 }]];
});
// face
const eyemask = (c: string) => X((d) => {
  const { W: w, Hh, D, y } = hd(d);
  const r: XP[] = [['head', 'ball', [w * 1.03, Hh * 0.26, D * 1.0], [0, y + Hh * 0.06, D * 0.02], c, { layer: 5 }]];
  for (const s of [1, -1]) r.push(['head', 'ball', [w * 0.18, Hh * 0.09, w * 0.06], [s * w * 0.19, y + Hh * 0.06, D * 0.5], 'white', { layer: 6, noInk: true }]);
  return r;
});
const cowl = (c: string, ears = true) => X((d) => {
  const { W: w, Hh, D, y, top } = hd(d);
  const r: XP[] = [['head', 'ball', [w * 1.1, Hh * 0.72, D * 1.07], [0, y + Hh * 0.2, -D * 0.02], c, { layer: 4 }], ['head', 'ball', [w * 1.05, Hh * 0.6, D * 0.9], [0, y - Hh * 0.05, -D * 0.12], c, { layer: -2 }]];
  for (const s of [1, -1]) {
    r.push(['head', 'ball', [w * 0.2, Hh * 0.08, w * 0.06], [s * w * 0.19, y + Hh * 0.04, D * 0.53], 'white', { layer: 6, noInk: true }]);
    if (ears) r.push(['head', 'cyl', [w * 0.24, Hh * 0.38, w * 0.12], [s * w * 0.3, top + Hh * 0.08, 0], c, { taper: 0, segs: 3, srot: [0, 0, -s * 8] }]);
  }
  return r;
});
const capBack = (c: string) => X((d) => {
  const { W: w, Hh, D, top } = hd(d);
  return [['head', 'ball', [w * 1.08, Hh * 0.5, D * 1.04], [0, top - Hh * 0.08, 0], c], ['head', 'cyl', [w * 0.8, Hh * 0.04, D * 0.55], [0, top - Hh * 0.2, -D * 0.42], c]];
});
const montera = (c = 'black') => X((d) => {
  const { W: w, Hh, D, top } = hd(d);
  return [['head', 'ball', [w * 1.0, Hh * 0.35, D * 0.85], [0, top - Hh * 0.02, 0], c], ...[1, -1].map((s) => ['head', 'ball', [w * 0.45, Hh * 0.35, D * 0.5], [s * w * 0.48, top - Hh * 0.08, 0], c] as XP)];
});
const pacifier = () => X((d) => {
  const { W: w, Hh, D, y } = hd(d);
  return [['head', 'cyl', [w * 0.32, w * 0.07, w * 0.26], [0, y - Hh * 0.2, D * 0.5], 'pink', { srot: [90, 0, 0], layer: 6 }], ['head', 'torus', [w * 0.2, w * 0.2, w * 0.05], [0, y - Hh * 0.22, D * 0.56], 'skyblue', { layer: 7 }]];
});
const glowEyes = (c: string) => X((d) => {
  const { W: w, Hh, D, y } = hd(d);
  return [1, -1].map((s) => ['head', 'ball', [w * 0.16, Hh * 0.08, w * 0.06], [s * w * 0.18, y + Hh * 0.04, D * 0.5], c, { glow: true }] as XP);
});
const binoculars = () => X((d) => [1, -1].map((s) => ['torso', 'cyl', [d.tw * 0.24, d.td * 0.75, d.tw * 0.24], [s * d.tw * 0.13, d.torsoH * 0.62, d.td * 0.8], 'black', { srot: [90, 0, 0], layer: 5 }] as XP));
const muscles = (c: string) => X((d) => [
  ...[1, -1].map((s) => [`arm${s > 0 ? 'L' : 'R'}`, 'ball', [d.aw * 1.6, d.upper * 0.6, d.aw * 1.5], [0, -d.upper * 0.45, d.aw * 0.1], c] as XP),
  ...[1, -1].map((s) => ['torso', 'ball', [d.tw * 0.5, d.torsoH * 0.28, d.td * 0.5], [s * d.tw * 0.22, d.torsoH * 0.72, d.td * 0.3], c] as XP),
]);
const tails = (c: string) => X((d) => [['torso', 'box', [d.tw * 0.9, d.legLen * 0.62, d.td * 0.15], [0, -d.legLen * 0.22, -d.td * 0.5], c, { layer: -2 }]]);
const gown = (c: string, k = 1) => X((d) => [['hips', 'cyl', [d.tw * 2.0 * k, d.legLen * 0.95, d.td * 2.6 * k], [0, -d.legLen * 0.47, 0], c, { taper: 0.45, layer: 2 }]]);
const sideHair = (c: string) => X((d) => {
  const { W: w, Hh, D, y } = hd(d);
  return [['head', 'capsule', [w * 1.1, Hh * 0.95, D * 0.62], [0, y - Hh * 0.05, -D * 0.22], c, { layer: -2 }]];
});
const wristbands = (c: string) => X((d) => [1, -1].map((s) => [`fore${s > 0 ? 'L' : 'R'}`, 'torus', [d.aw * 1.6, d.aw * 1.6, d.aw * 0.6], [0, -d.lower * 0.75, 0], c, { srot: [90, 0, 0], tube: 0.35 }] as XP));
const koopa = (shell: string, spikes = 'white') => X((d) => {
  const { tw, td, torsoH: t } = d;
  const r: XP[] = [['torso', 'ball', [tw * 1.55, t * 1.25, td * 1.7], [0, t * 0.5, -td * 0.55], shell, { layer: -3 }], ['torso', 'torus', [tw * 1.5, t * 1.2, td * 0.4], [0, t * 0.5, -td * 0.25], 'cream', { tube: 0.12, layer: -3 }]];
  for (const [x, y] of [[0.3, 0.8], [-0.3, 0.8], [0, 1.0], [0.42, 0.42], [-0.42, 0.42], [0, 0.55], [0, 0.15]]) r.push(['torso', 'cyl', [tw * 0.24, td * 0.8, tw * 0.24], [tw * x, t * y, -td * 1.35], spikes, { taper: 0, srot: [-90, 0, 0], layer: -4 }]);
  return r;
});
const muzzle = (c: string, k = 1) => X((d) => {
  const { W: w, Hh, D, y } = hd(d);
  return [['head', 'ball', [w * 0.85 * k, Hh * 0.42 * k, D * 0.55 * k], [0, y - Hh * 0.2, D * 0.4], c, { layer: 5 }], ...[1, -1].map((s) => ['head', 'ball', [w * 0.08, w * 0.08, w * 0.05], [s * w * 0.12, y - Hh * 0.08, D * (0.4 + 0.27 * k)], 'black', { layer: 6, noInk: true }] as XP)];
});
const horns2 = (c: string, k = 1) => X((d) => {
  const { W: w, Hh, D, top } = hd(d);
  return [1, -1].map((s) => ['head', 'cyl', [w * 0.22 * k, Hh * 0.5 * k, w * 0.22 * k], [s * w * 0.42, top + Hh * 0.05, D * 0.05], c, { taper: 0, srot: [0, 0, -s * 35] }] as XP);
});
/** Reach both arms forward (degrees from hanging). */
const reach = (deg: number, inward = 8): Extra => tweak((list) => {
  part(list, 'armL').rot = [-deg, 0, -inward];
  part(list, 'armR').rot = [-deg, 0, inward];
});
/** Scale a whole figure (a doll with child proportions at any size). */
function shrink(f: Figure, k: number): Figure {
  const sc = (v: Vec3): Vec3 => [v[0] * k, v[1] * k, v[2] * k];
  return measure({ ...f, parts: f.parts.map((p) => ({ ...p, at: sc(p.at), off: p.off ? sc(p.off) : undefined, size: sc(p.size) })) });
}
/** A rod in a plane of constant x, from (y1, z1) to (y2, z2). */
const rodYZ = (x: number, y1: number, z1: number, y2: number, z2: number, t: number, c: string): [Shape, Vec3, Vec3, string, XO] => {
  const len = Math.hypot(y2 - y1, z2 - z1);
  return ['capsule', [t, len + t, t], [x, (y1 + y2) / 2, (z1 + z2) / 2], c, { srot: [(Math.atan2(z2 - z1, y2 - y1) * 180) / Math.PI, 0, 0] }];
};
const openJacket = (c: string) => X((d) => [1, -1].map((s) => ['torso', 'box', [d.tw * 0.4, d.torsoH * 1.02, d.td * 1.1], [s * d.tw * 0.33, d.torsoH * 0.5, 0], c, { round: 0.4, layer: 2 }] as XP));
const crossShield = (bg = 'white', cross = 'red') => inHand('L', (a) => [['box', [a * 0.35, a * 5.2, a * 4.2], [a * 0.8, -a * 0.8, a * 0.5], bg, { round: 0.3 }], ['box', [a * 0.12, a * 4.2, a * 0.8], [a * 1.0, -a * 0.8, a * 0.5], cross], ['box', [a * 0.12, a * 0.8, a * 3.2], [a * 1.0, -a * 0.2, a * 0.5], cross]]);
const tabard = (c: string, cross?: string) => X((d) => {
  const { tw, td, torsoH: t, legLen: l } = d;
  const r: XP[] = [['torso', 'box', [tw * 0.9, t * 0.95 + l * 0.45, td * 1.12], [0, t * 0.5 - l * 0.22, 0], c, { round: 0.3, layer: 2 }]];
  if (cross) r.push(['torso', 'box', [tw * 0.16, t * 0.6, td * 0.08], [0, t * 0.55, td * 0.58], cross, { layer: 5 }], ['torso', 'box', [tw * 0.55, t * 0.14, td * 0.08], [0, t * 0.65, td * 0.58], cross, { layer: 5 }]);
  return r;
});
const ushanka = (c: string, star?: string) => X((d) => {
  const { W: w, Hh, D, y, top } = hd(d);
  const r: XP[] = [['head', 'ball', [w * 1.2, Hh * 0.6, D * 1.15], [0, top - Hh * 0.04, 0], c], ...[1, -1].map((s) => ['head', 'ball', [w * 0.3, Hh * 0.5, D * 0.6], [s * w * 0.55, y, -D * 0.05], c] as XP)];
  if (star) r.push(['head', 'ball', [w * 0.18, w * 0.18, w * 0.06], [0, top - Hh * 0.02, D * 0.58], star, { layer: 6 }]);
  return r;
});
const deerstalker = (c: string) => X((d) => {
  const { W: w, Hh, D, top } = hd(d);
  return [['head', 'ball', [w * 1.1, Hh * 0.58, D * 1.06], [0, top - Hh * 0.08, 0], c], ['head', 'cyl', [w * 0.7, Hh * 0.04, D * 0.4], [0, top - Hh * 0.22, D * 0.5], c], ['head', 'cyl', [w * 0.7, Hh * 0.04, D * 0.4], [0, top - Hh * 0.22, -D * 0.5], c], ['head', 'ball', [w * 0.1, w * 0.1, w * 0.1], [0, top + Hh * 0.2, 0], c]];
});
const headMirror = () => X((d) => {
  const { W: w, Hh, D, y } = hd(d);
  return [['head', 'torus', [w * 1.06, D * 1.02, Hh * 0.08], [0, y + Hh * 0.28, 0], 'darkgray', { srot: [90, 0, 0], tube: 0.1 }], ['head', 'cyl', [w * 0.32, w * 0.05, w * 0.32], [w * 0.1, y + Hh * 0.32, D * 0.55], 'silver', { srot: [80, 0, 0], layer: 6 }]];
});
const pipe = () => X((d) => {
  const { W: w, Hh, D, y } = hd(d);
  return [['head', 'capsule', [w * 0.06, w * 0.35, w * 0.06], [w * 0.12, y - Hh * 0.22, D * 0.62], 'darkbrown', { srot: [80, 0, 0], layer: 6 }], ['head', 'cyl', [w * 0.13, w * 0.16, w * 0.13], [w * 0.12, y - Hh * 0.18, D * 0.8], 'darkbrown', { layer: 6 }]];
});
const pointyCap = (c: string, k = 1) => X((d) => {
  const { W: w, Hh, D, top } = hd(d);
  return [['head', 'cyl', [w * 1.0, Hh * 1.2 * k, D * 0.95], [0, top + Hh * 0.45 * k, -D * 0.05], c, { taper: 0, srot: [-8, 0, 0] }]];
});
const divingHelmet = () => X((d) => {
  const { W: w, Hh, D, y } = hd(d);
  return [['head', 'ball', [w * 1.5, Hh * 1.4, D * 1.5], [0, y, 0], 'brass'], ['head', 'cyl', [w * 0.62, w * 0.12, w * 0.62], [0, y, D * 0.72], 'glass', { srot: [90, 0, 0], layer: 6 }], ['head', 'torus', [w * 0.7, w * 0.7, w * 0.12], [0, y, D * 0.76], 'brass', { tube: 0.2, layer: 7 }], ...[1, -1].map((s) => ['head', 'cyl', [w * 0.32, w * 0.1, w * 0.32], [s * w * 0.72, y, 0], 'glass', { srot: [0, 0, 90], layer: 6 }] as XP), ['torso', 'cyl', [d.tw * 1.25, d.torsoH * 0.18, d.td * 1.5], [0, d.torsoH * 0.95, 0], 'brass']];
});
const cuffs = () => X((d) => [1, -1].map((s) => [`fore${s > 0 ? 'L' : 'R'}`, 'torus', [d.aw * 1.5, d.aw * 1.5, d.aw * 0.4], [0, -d.lower * 0.8, 0], 'silver', { srot: [90, 0, 0], tube: 0.3 }] as XP));
const trayCups = (side: 'L' | 'R' = 'L') => inHand(side, (a) => [['cyl', [a * 4.5, a * 0.25, a * 4.5], [0, a * 0.5, a * 1.6], 'silver'], ...[-1, 1].flatMap((x) => [['cyl', [a * 0.9, a * 1.0, a * 0.9], [x * a * 1.1, a * 1.6, a * 1.6], 'glass', { taper: 1.3 }], ['capsule', [a * 0.15, a * 0.8, a * 0.15], [x * a * 1.1, a * 0.9, a * 1.6], 'glass']] as HP[])]);
const elfEars = (c: string) => X((d) => [1, -1].map((s) => ['head', 'cyl', [d.headW * 0.14, d.headH * 0.3, d.headW * 0.1], [s * d.headW * 0.55, d.headY + d.headH * 0.05, -d.headD * 0.02], c, { taper: 0, srot: [0, 0, -s * 55] }] as XP));
const raven = () => X((d) => {
  const { tw, torsoH: t } = d;
  const x = tw * 0.7, y = t * 1.0 + tw * 0.22;
  return [['torso', 'ball', [tw * 0.4, tw * 0.45, tw * 0.7], [x, y, 0], '#1d1d1d'], ['torso', 'ball', [tw * 0.28, tw * 0.28, tw * 0.28], [x, y + tw * 0.34, tw * 0.2], '#1d1d1d'], ['torso', 'cyl', [tw * 0.1, tw * 0.22, tw * 0.1], [x, y + tw * 0.31, tw * 0.42], 'darkgray', { taper: 0, srot: [90, 0, 0] }], ['torso', 'box', [tw * 0.2, tw * 0.07, tw * 0.42], [x, y - tw * 0.08, -tw * 0.45], '#1d1d1d', { srot: [20, 0, 0] }]];
});
const gasMask = (c = '#3a3a3a') => X((d) => {
  const { W: w, Hh, D, y } = hd(d);
  return [['head', 'ball', [w * 0.85, Hh * 0.75, D * 0.4], [0, y - Hh * 0.02, D * 0.33], c, { layer: 5 }], ...[1, -1].map((s) => ['head', 'ball', [w * 0.22, w * 0.18, w * 0.06], [s * w * 0.18, y + Hh * 0.08, D * 0.55], 'glass', { layer: 6 }] as XP), ...[1, -1].map((s) => ['head', 'cyl', [w * 0.24, w * 0.18, w * 0.24], [s * w * 0.28, y - Hh * 0.25, D * 0.5], 'darkgray', { srot: [90, 0, -s * 30], layer: 6 }] as XP)];
});
const fencingMask = () => X((d) => {
  const { W: w, Hh, D, y } = hd(d);
  return [['head', 'ball', [w * 1.0, Hh * 0.9, D * 0.55], [0, y - Hh * 0.02, D * 0.3], '#3a3a3a', { layer: 5 }], ['head', 'box', [w * 0.7, Hh * 0.3, D * 0.2], [0, y - Hh * 0.5, D * 0.3], 'white', { layer: 4 }]];
});
const fireHelmet = (c = 'red') => X((d) => {
  const { W: w, Hh, D, top } = hd(d);
  return [['head', 'ball', [w * 1.15, Hh * 0.7, D * 1.12], [0, top - Hh * 0.05, 0], c], ['head', 'ball', [w * 1.4, Hh * 0.1, D * 1.7], [0, top - Hh * 0.22, -D * 0.15], c], ['head', 'box', [w * 0.35, Hh * 0.35, w * 0.05], [0, top + Hh * 0.05, D * 0.58], 'gold', { round: 0.4, layer: 6 }]];
});
const flowerCrown = (c = 'pink') => X((d) => {
  const { W: w, Hh, D, top } = hd(d);
  const r: XP[] = [['head', 'torus', [w * 1.06, D * 1.02, Hh * 0.08], [0, top - Hh * 0.15, 0], 'leaf', { srot: [90, 0, 0], tube: 0.2 }]];
  for (let i = 0; i < 6; i++) {
    const t = (i / 6) * Math.PI * 2;
    r.push(['head', 'ball', [w * 0.16, w * 0.16, w * 0.16], [Math.sin(t) * w * 0.53, top - Hh * 0.12, Math.cos(t) * D * 0.51], i % 2 ? 'white' : c]);
  }
  return r;
});
/** A big mop of hair behind the face (yarn hair, wild hair). */
const mop = (c: string, k = 1) => X((d) => {
  const { W: w, Hh, D, y } = hd(d);
  return [['head', 'ball', [w * 1.5 * k, Hh * 1.2 * k, D * 1.0], [0, y + Hh * 0.1, -D * 0.28], c, { layer: -2 }]];
});
const bigEye = (c = 'white', iris = 'navy') => X((d) => {
  const { W: w, Hh, D, y } = hd(d);
  return [['head', 'ball', [w * 0.42, Hh * 0.34, w * 0.2], [0, y + Hh * 0.08, D * 0.42], c, { layer: 5 }], ['head', 'ball', [w * 0.18, w * 0.18, w * 0.08], [0, y + Hh * 0.08, D * 0.52], iris, { layer: 6, noInk: true }]];
});
const nose = (c: string, sz = 0.2) => X((d) => {
  const { W: w, Hh, D, y } = hd(d);
  return [['head', 'ball', [w * sz, w * sz, w * sz], [0, y - Hh * 0.05, D * 0.5], c, { layer: 6 }]];
});
// clothes
const suitX = (c: string, tie: string | null = 'red', bow = false, shirt = 'white') => X((d) => {
  const { tw, td, torsoH: t } = d;
  const r: XP[] = [['torso', 'box', [tw * 1.06, t * 1.02, td * 1.08], [0, t * 0.5, 0], c, { round: 0.5, layer: 1 }], ['torso', 'box', [tw * 0.26, t * 0.5, td * 0.1], [0, t * 0.72, td * 0.52], shirt]];
  if (tie && !bow) r.push(['torso', 'box', [tw * 0.09, t * 0.42, td * 0.08], [0, t * 0.68, td * 0.58], tie, { layer: 4 }]);
  if (tie && bow) for (const s of [1, -1]) r.push(['torso', 'ball', [tw * 0.18, tw * 0.12, td * 0.1], [s * tw * 0.08, t * 0.92, td * 0.55], tie, { layer: 4 }]);
  return r;
});
/** A text card on the chest (ink picks itself). */
const chest = (text: string, bg: string, w = 0.5, h = 0.28, y = 0.66) => X((d) => [['torso', 'box', [d.tw * w, d.torsoH * h, d.td * 0.08], [0, d.torsoH * y, d.td * 0.54], bg, { text, round: 0.2, layer: 5 }]]);
const patch = (c: string, w = 0.3, h = 0.22, y = 0.66, x = 0) => X((d) => [['torso', 'ball', [d.tw * w, d.torsoH * h, d.td * 0.1], [d.tw * x, d.torsoH * y, d.td * 0.52], c, { layer: 5 }]]);
const bands = (c: string, ys = [0.3, 0.62], on = 'torso') => X((d) => ys.map((y) => [on, 'torus', [d.tw * 1.08, d.td * 1.16, d.torsoH * 0.07], [0, d.torsoH * y, 0], c, { srot: [90, 0, 0], tube: 0.12, layer: 4 }] as XP));
const epaul = (c = 'gold') => X((d) => [1, -1].map((s) => ['torso', 'ball', [d.aw * 1.7, d.aw * 0.55, d.td * 0.75], [s * d.tw * 0.5, d.torsoH * 0.98, 0], c, { layer: 4 }] as XP));
const buttons = (c = 'gold', n = 3, x = 0) => X((d) => Array.from({ length: n }, (_, i) => ['torso', 'ball', [d.tw * 0.07, d.tw * 0.07, d.td * 0.08], [d.tw * x, d.torsoH * (0.25 + (i * 0.5) / Math.max(1, n - 1)), d.td * 0.56], c, { layer: 5 }] as XP));
const ruff = (c = 'white') => X((d) => [['torso', 'torus', [d.tw * 0.95, d.td * 1.6, d.torsoH * 0.12], [0, d.torsoH * 0.98, 0], c, { srot: [90, 0, 0], tube: 0.45, layer: 4 }]]);
const collar = (c: string) => X((d) => [['torso', 'torus', [d.tw * 0.7, d.td * 1.0, d.torsoH * 0.07], [0, d.torsoH * 0.97, 0], c, { srot: [90, 0, 0], tube: 0.3, layer: 4 }]]);
const gloves = (c: string, k = 1) => X((d) => [1, -1].map((s) => [`hand${s > 0 ? 'L' : 'R'}`, 'ball', [d.aw * 1.4 * k, d.aw * 1.45 * k, d.aw * 1.15 * k], [0, -d.aw * 0.25, 0], c, { layer: 2 }] as XP));
const boots = (c: string, k = 1) => X((d) => [1, -1].map((s) => [`foot${s > 0 ? 'L' : 'R'}`, 'box', [d.lw * 1.25 * k, d.H * 0.06, d.lw * 1.9 * k], [0, -d.H * 0.016, d.lw * 0.32 * k], c, { round: 0.7, layer: 2 }] as XP));
const quiver = (c = 'brown') => X((d) => {
  const { tw, td, torsoH: t } = d;
  const r: XP[] = [['torso', 'cyl', [tw * 0.3, t * 0.8, tw * 0.3], [tw * 0.15, t * 0.6, -td * 0.75], c, { srot: [0, 0, 20], layer: -3 }]];
  for (const x of [0, 0.1]) r.push(['torso', 'cyl', [tw * 0.12, t * 0.18, tw * 0.04], [tw * (0.32 + x), t * 1.1, -td * 0.75], 'white', { srot: [0, 0, 20], taper: 0, layer: -3 }]);
  return r;
});
// held things
const candle = (side: 'L' | 'R' = 'R') => inHand(side, (a) => [['cyl', [a * 0.7, a * 2.4, a * 0.7], [0, a * 0.5, a * 0.6], 'cream'], ['ball', [a * 0.45, a * 0.8, a * 0.45], [0, a * 2.1, a * 0.6], 'flame', { glow: true }]]);
const flask = (liquid: string, side: 'L' | 'R' = 'R') => inHand(side, (a) => [['cyl', [a * 1.7, a * 1.5, a * 1.7], [0, -a * 0.3, a * 1.1], 'glass', { taper: 0.3 }], ['cyl', [a * 1.4, a * 0.7, a * 1.4], [0, -a * 0.6, a * 1.1], liquid, { taper: 0.6, glow: true }], ['cyl', [a * 0.5, a * 0.9, a * 0.5], [0, a * 0.8, a * 1.1], 'glass']]);
const tube = (liquid: string, side: 'L' | 'R' = 'R') => inHand(side, (a) => [['capsule', [a * 0.6, a * 2.6, a * 0.6], [0, a * 0.4, a * 0.9], 'glass'], ['capsule', [a * 0.5, a * 1.2, a * 0.5], [0, -a * 0.2, a * 0.9], liquid, { glow: true }]]);
const fishH = (c = 'orange', side: 'L' | 'R' = 'L') => inHand(side, (a) => [['ball', [a * 0.9, a * 1.2, a * 2.8], [0, -a * 1.2, a * 1.0], c, { srot: [80, 0, 0] }], ['wedge', [a * 1.2, a * 1.0, a * 0.3], [0, -a * 2.9, a * 1.3], c, { srot: [180, 90, 0] }]]);
const potplant = (side: 'L' | 'R' = 'L', bloom = 'pink') => inHand(side, (a) => [['cyl', [a * 2, a * 1.8, a * 2], [0, -a * 1.0, a * 1.2], '#c8693a', { taper: 1.3 }], ['ball', [a * 2.6, a * 2.2, a * 2.6], [0, a * 0.9, a * 1.2], 'leaf'], ['ball', [a * 0.8, a * 0.8, a * 0.8], [a * 0.6, a * 1.9, a * 1.6], bloom]]);
const cleaver = (side: 'L' | 'R' = 'R') => inHand(side, (a) => [['box', [a * 0.25, a * 2.2, a * 2.6], [0, -a * 1.6, a * 1.6], 'silver', { round: 0.1 }], ['capsule', [a * 0.4, a * 1.4, a * 0.4], [0, -a * 0.2, a * 0.5], 'darkwood']]);
const sack = (c: string, text?: string, side: 'L' | 'R' = 'L') => inHand(side, (a) => {
  const r: HP[] = [['ball', [a * 3, a * 3.2, a * 2.6], [0, -a * 2.4, a * 0.6], c], ['cyl', [a * 1.0, a * 0.8, a * 1.0], [0, -a * 0.6, a * 0.6], c, { taper: 1.4 }]];
  if (text) r.push(['box', [a * 1.4, a * 1.2, a * 0.1], [0, -a * 2.4, a * 1.95], c, { text, layer: 6 }]);
  return r;
});
const card = (text: string, bg: string, side: 'L' | 'R' = 'L', w = 4, h = 3) => inHand(side, (a) => [['box', [a * w, a * h, a * 0.2], [0, a * 0.2, a * 1.3], bg, { text, round: 0.15, srot: [-10, 0, 0] }]]);
const poleSign = (text: string, bg: string, side: 'L' | 'R' = 'R', octagon = false) => inHand(side, (a, d) => {
  const r: HP[] = [['capsule', [a * 0.3, d.H * 0.75, a * 0.3], [0, d.H * 0.18, a * 0.4], 'silver']];
  if (octagon) r.push(['cyl', [a * 5, a * 0.3, a * 5], [0, d.H * 0.58, a * 0.6], bg, { segs: 8, srot: [90, 22.5, 0] }]);
  r.push(['box', [a * (octagon ? 3.6 : 5), a * (octagon ? 1.6 : 3.5), a * 0.2], [0, d.H * 0.58, a * 0.85], octagon ? bg : bg, { text, round: 0.1, layer: 6 }]);
  return r;
});
const cupH = (c: string, drink = 'coffee', side: 'L' | 'R' = 'R') => inHand(side, (a) => [['cyl', [a * 1.2, a * 1.6, a * 1.2], [0, a * 0.3, a * 1.0], c, { taper: 1.2 }], ['cyl', [a * 1.25, a * 0.2, a * 1.25], [0, a * 1.15, a * 1.0], drink]]);
const trayDome = (side: 'L' | 'R' = 'L') => inHand(side, (a) => [['cyl', [a * 4.5, a * 0.25, a * 4.5], [0, a * 0.5, a * 1.6], 'silver'], ['ball', [a * 3.2, a * 2.4, a * 3.2], [0, a * 0.9, a * 1.6], 'silver'], ['ball', [a * 0.5, a * 0.5, a * 0.5], [0, a * 2.1, a * 1.6], 'silver']]);
const pompoms = (c: string) => X((d) => [1, -1].map((s) => [`hand${s > 0 ? 'L' : 'R'}`, 'ball', [d.aw * 3.2, d.aw * 3.2, d.aw * 3.2], [0, -d.aw * 0.6, 0], c, { layer: 5 }] as XP));
const skullH = (side: 'L' | 'R' = 'R') => inHand(side, (a) => [['ball', [a * 1.8, a * 1.8, a * 1.8], [0, a * 1.4, a * 1.4], 'cream'], ['box', [a * 1.1, a * 0.7, a * 1.0], [0, a * 0.5, a * 1.8], 'cream'], ['ball', [a * 0.45, a * 0.5, a * 0.2], [a * 0.4, a * 1.4, a * 2.25], 'black', { noInk: true, layer: 6 }], ['ball', [a * 0.45, a * 0.5, a * 0.2], [-a * 0.4, a * 1.4, a * 2.25], 'black', { noInk: true, layer: 6 }]]);
const palette = (side: 'L' | 'R' = 'L') => inHand(side, (a) => [['ball', [a * 3.6, a * 2.6, a * 0.3], [a * 0.6, -a * 0.2, a * 1.2], 'lightwood', { srot: [-20, 0, 0] }], ...(['red', 'blue', 'yellow', 'green'] as const).map((c, i) => ['ball', [a * 0.6, a * 0.6, a * 0.3], [a * (-0.4 + i * 0.6), a * (0.3 - (i % 2) * 0.4), a * 1.4], c, { noInk: true, layer: 6 }] as HP)]);
const dumbbell = (side: 'L' | 'R') => inHand(side, (a) => [['capsule', [a * 0.35, a * 3.2, a * 0.35], [0, -a * 0.2, a * 0.4], 'iron', { srot: [90, 0, 0] }], ['cyl', [a * 1.8, a * 0.5, a * 1.8], [0, -a * 0.2, a * 1.8], 'black', { srot: [90, 0, 0] }], ['cyl', [a * 1.8, a * 0.5, a * 1.8], [0, -a * 0.2, -a * 1.0], 'black', { srot: [90, 0, 0] }]]);
const spyglass = (side: 'L' | 'R' = 'L') => inHand(side, (a) => [['cyl', [a * 0.8, a * 3, a * 0.8], [0, -a * 0.3, a * 1.2], 'brass', { srot: [90, 0, 0], taper: 0.7 }], ['cyl', [a * 0.9, a * 0.4, a * 0.9], [0, -a * 0.3, a * 2.7], 'darkbrown', { srot: [90, 0, 0] }]]);
const kite = (c = 'red', side: 'L' | 'R' = 'L') => inHand(side, (a, d) => [['capsule', [a * 0.1, d.H * 0.6, a * 0.1], [d.H * 0.12, d.H * 0.28, a * 0.4], 'white', { noInk: true, srot: [0, 0, -25] }], ['box', [a * 3.4, a * 3.4, a * 0.2], [d.H * 0.25, d.H * 0.58, a * 0.4], c, { srot: [0, 0, 45], round: 0.05 }], ['ball', [a * 0.5, a * 0.5, a * 0.5], [d.H * 0.235, d.H * 0.58 - a * 2.6, a * 0.4], 'gold']]);
const coil = (c: string, side: 'L' | 'R' = 'L') => inHand(side, (a) => [['torus', [a * 2.6, a * 2.6, a * 0.6], [0, -a * 1.4, a * 0.6], c, { tube: 0.25 }], ['torus', [a * 2.2, a * 2.2, a * 0.6], [0, -a * 1.4, a * 0.9], c, { tube: 0.25 }]]);
const hairdryer = (side: 'L' | 'R' = 'R') => inHand(side, (a) => [['capsule', [a * 0.6, a * 1.6, a * 0.6], [0, -a * 0.3, a * 0.5], 'magenta'], ['cyl', [a * 1.2, a * 2.4, a * 1.2], [0, a * 0.7, a * 1.3], 'magenta', { srot: [90, 0, 0], taper: 0.7 }]]);
const comb = (side: 'L' | 'R' = 'L') => inHand(side, (a) => [['box', [a * 0.3, a * 3, a * 0.7], [0, a * 0.6, a * 0.8], 'black', { round: 0.3 }]]);
const megaphone = (side: 'L' | 'R' = 'L') => inHand(side, (a) => [['cyl', [a * 2, a * 3, a * 2], [0, a * 0.2, a * 2.0], 'white', { taper: 0.35, srot: [-90, 0, 0] }], ['cyl', [a * 2.05, a * 0.4, a * 2.05], [0, a * 0.2, a * 3.4], 'red', { srot: [90, 0, 0] }]]);
const clapper = (side: 'L' | 'R' = 'R') => inHand(side, (a) => [['box', [a * 3.2, a * 2.4, a * 0.3], [0, a * 0.2, a * 1.2], 'black', { text: 'TAKE 1', round: 0.05 }], ['box', [a * 3.3, a * 0.6, a * 0.35], [0, a * 1.8, a * 1.2], 'white', { srot: [0, 0, 12], round: 0.05 }]]);
const heartH = (side: 'L' | 'R' = 'L', c = 'red') => inHand(side, (a) => [['ball', [a * 1.4, a * 1.4, a * 1.0], [a * 0.55, a * 0.5, a * 1.3], c], ['ball', [a * 1.4, a * 1.4, a * 1.0], [-a * 0.55, a * 0.5, a * 1.3], c], ['cyl', [a * 2.1, a * 1.7, a * 1.0], [0, -a * 0.4, a * 1.3], c, { taper: 0, segs: 4, srot: [180, 45, 0] }]]);
const bomb = (side: 'L' | 'R' = 'L') => inHand(side, (a) => [['ball', [a * 2.6, a * 2.6, a * 2.6], [0, -a * 0.6, a * 1.6], 'black'], ['capsule', [a * 0.25, a * 1.2, a * 0.25], [0, a * 1.0, a * 1.6], 'tan'], ['ball', [a * 0.6, a * 0.6, a * 0.6], [0, a * 1.7, a * 1.6], 'flame', { glow: true }]]);
const toothH = (side: 'L' | 'R' = 'L') => inHand(side, (a) => [['ball', [a * 2.2, a * 1.7, a * 1.6], [0, a * 0.9, a * 1.3], 'white'], ['capsule', [a * 0.7, a * 1.6, a * 0.7], [a * 0.5, -a * 0.1, a * 1.3], 'white', { srot: [0, 0, 10] }], ['capsule', [a * 0.7, a * 1.6, a * 0.7], [-a * 0.5, -a * 0.1, a * 1.3], 'white', { srot: [0, 0, -10] }]]);
const fork = (side: 'L' | 'R' = 'R') => inHand(side, (a, d) => [['capsule', [a * 0.3, d.H * 0.2, a * 0.3], [0, d.H * 0.08, a * 0.4], 'silver'], ...[-1, 0, 1].map((x) => ['capsule', [a * 0.15, a * 1.4, a * 0.15], [x * a * 0.35, d.H * 0.18 + a * 0.6, a * 0.4], 'silver'] as HP), ['box', [a * 1.0, a * 0.3, a * 0.2], [0, d.H * 0.18, a * 0.4], 'silver']]);
const scythe = (side: 'L' | 'R' = 'R') => inHand(side, (a, d) => [['capsule', [a * 0.35, d.H * 1.05, a * 0.35], [0, d.H * 0.2, a * 0.4], 'darkwood'], ['wedge', [d.H * 0.4, a * 1.0, a * 0.2], [-d.H * 0.18, d.H * 0.68, a * 0.4], 'silver', { srot: [0, 0, -12], apex: -0.45 }]]);
const hourglass = (side: 'L' | 'R' = 'L') => inHand(side, (a) => [['cyl', [a * 1.6, a * 1.2, a * 1.6], [0, a * 1.3, a * 1.3], 'sand', { taper: 0.1, srot: [180, 0, 0] }], ['cyl', [a * 1.6, a * 1.2, a * 1.6], [0, a * 0.1, a * 1.3], 'sand', { taper: 0.1 }], ['cyl', [a * 2, a * 0.3, a * 2], [0, a * 2.0, a * 1.3], 'wood'], ['cyl', [a * 2, a * 0.3, a * 2], [0, -a * 0.6, a * 1.3], 'wood']]);

/* ----- things standing beside a person (figure space) ----- */
const beside = (f: (d: PersonDims) => [Shape, Vec3, Vec3, string, XO?][]) => X((d) => f(d).map(([s, z, at, c, o]) => ['', s, z, at, c, o] as XP));
const easelBoard = (text: string, x = 0.55) => beside((d) => {
  const k = d.H / 1.7;
  return [['box', [0.7 * k, 0.5 * k, 0.04], [x * k, 1.15 * k, -0.05], '#2f3a33', { text }], ['box', [0.74 * k, 0.04 * k, 0.08], [x * k, 0.88 * k, 0], 'wood'], ['capsule', [0.04 * k, 1.4 * k, 0.04 * k], [(x - 0.25) * k, 0.68 * k, 0], 'wood', { srot: [-6, 0, 8] }], ['capsule', [0.04 * k, 1.4 * k, 0.04 * k], [(x + 0.25) * k, 0.68 * k, 0], 'wood', { srot: [-6, 0, -8] }]];
});

/** Two (or more) built figures side by side as one figure; later ones get prefixed part names. */
function together(key: string, figs: [Figure, number, number?][]): Figure {
  const parts: FigPart[] = [];
  figs.forEach(([f, dx, dz = 0], i) => {
    const pre = i ? `${String.fromCharCode(97 + i)}_` : '';
    for (const p of f.parts) parts.push({ ...p, name: pre + p.name, parent: p.parent ? pre + p.parent : undefined, at: p.parent ? p.at : [p.at[0] + dx, p.at[1], p.at[2] + dz] });
  });
  return measure({ ...figs[0][0], key, parts });
}

export const ENTRIES: CatalogEntry[] = [
  e('abraham lincoln', 'town', 'history', () => W('abraham lincoln', { h: 1.93, skin: 'skin2', hair: '#1d1d1d', style: 'short', top: 'black', long: true, bottom: 'black', shoes: 'black', build: 0.9, acc: [suitX('black', 'black', true), tophat('black'), face('beard', '#1d1d1d')] })),
  e('acrobat', 'town', 'entertainment', () => W('acrobat', { top: 'red', bottom: 'red', legs: 'white', shoes: 'white', hair: 'darkbrown', style: 'bun', acc: [wear('belt', 'gold'), wear('sash', 'yellow'), arms(150), lift(0.5), beside(() => [['ball', [0.62, 0.52, 0.62], [0, 0.26, 0], 'blue'], ['torus', [0.64, 0.64, 0.12], [0, 0.26, 0], 'yellow', { srot: [90, 0, 0], tube: 0.15 }], ['torus', [0.6, 0.5, 0.1], [0, 0.26, 0], 'red', { tube: 0.15 }]])] })),
  e('action figure', 'toys', 'dolls and figures', () => W('action figure', { h: 0.15, build: 1.25, skin: 'skin2', hair: 'darkbrown', style: 'short', top: 'olive', long: true, bottom: 'olive', shoes: 'black', acc: [hat('military', 'darkgreen'), wear('belt', 'black'), wear('backpack', 'olive'), held('blaster', 'black'), beside((d) => [['cyl', [d.H * 0.55, d.H * 0.04, d.H * 0.45], [0, d.H * 0.02, 0], 'black']])] })),
  e('actor', 'town', 'entertainment', () => W('actor', { top: 'purple', long: true, bottom: 'black', shoes: 'black', hair: 'darkbrown', style: 'short', acc: [wear('cape', 'darkred'), ruff(), wear('belt', 'gold'), skullH()] })),
  e('actress', 'town', 'entertainment', () => W('actress', { top: 'red', skirt: 'red', legs: 'red', shoes: 'red', hair: 'gold', style: 'long', skin: 'skin1', acc: [wear('necklace', 'white'), face('sunglasses'), held('bag', 'gold', 'L')] })),
  e('admiral', 'town', 'military', () => W('admiral', { top: 'navy', long: true, bottom: 'navy', shoes: 'black', hair: 'white', style: 'short', acc: [bicorne('black'), epaul(), buttons('gold', 4, 0.22), buttons('gold', 4, -0.22), wear('medal'), held('sword')] })),
  e('agent diana prince', 'town', 'superheroes', () => W('agent diana prince', { h: 1.8, skin: 'skin2', hair: '#1d1d1d', style: 'long', top: 'red', bottom: 'navy', skirt: 'navy', legs: 'red', shoes: 'red', acc: [hat('tiara', 'gold'), wear('belt', 'gold'), patch('gold', 0.55, 0.14, 0.82), coil('gold', 'R'), held('shield', 'silver', 'L')] })),
  e('alexander the great', 'town', 'history', () => W('alexander the great', { skin: 'skin2', hair: 'gold', style: 'short', top: 'white', skirt: 'white', legs: 'skin2', shoes: 'brown', acc: [wear('armor', 'bronze'), wear('cape', 'red'), hat('helmet', 'bronze'), crest('red'), held('spear'), held('shield', 'bronze', 'L')] })),
  e('alien', 'fantasy', 'aliens', () => W('alien', { h: 1.5, skin: '#8fe36b', style: 'bald', eyes: '#1d1d1d', top: 'silver', long: true, bottom: 'silver', shoes: 'silver', build: 0.85, acc: [hat('antennae', '#8fe36b'), X((d) => [1, -1].map((s) => ['head', 'ball', [d.headW * 0.32, d.headH * 0.26, d.headW * 0.1], [s * d.headW * 0.2, d.headY + d.headH * 0.03, d.headD * 0.45], 'black', { srot: [0, 0, s * 25], layer: 6 }] as XP)), wear('belt', 'purple'), held('blaster', 'lime')] })),
  e('altar boy', 'town', 'religion', () => W('altar boy', { h: 'kid', top: 'white', long: true, bottom: 'red', skirt: 'red', legs: 'red', shoes: 'black', style: 'short', acc: [collar('white'), candle()] })),
  e('amazon (person)', 'town', 'warriors', () => W('amazon (person)', { h: 1.85, skin: 'skin3', hair: '#1d1d1d', style: 'long', top: 'gold', skirt: 'darkred', legs: 'skin3', shoes: 'brown', build: 1.1, acc: [hat('headband', 'gold'), wear('belt', 'gold'), held('spear'), held('shield', 'bronze', 'L')] })),
  e('ambassador', 'town', 'politics', () => W('ambassador', { top: 'black', long: true, bottom: 'black', shoes: 'black', hair: 'gray', style: 'short', acc: [suitX('black', 'navy'), wear('sash', 'skyblue'), wear('medal'), held('flag', 'blue', 'L'), held('briefcase')] })),
  e('anarchist', 'town', 'crime', () => W('anarchist', { top: 'black', long: true, bottom: 'black', shoes: 'black', acc: [hat('hood', 'black'), face('mask', 'black'), chest('A', 'red', 0.4, 0.3), held('flag', 'black'), wear('backpack', 'darkgray')] })),
  e('anchorman', 'town', 'media', () => W('anchorman', { top: 'white', long: true, bottom: 'maroon', shoes: 'black', hair: 'darkbrown', style: 'short', skin: 'skin1', acc: [suitX('maroon', 'navy'), face('mustache', 'darkbrown'), held('mic'), held('letter', 'paper', 'L')] })),
  e('android', 'fantasy', 'robots', () => W('android', { skin: '#d4d7da', style: 'none', eyes: '#3fc8e8', top: 'white', long: true, bottom: 'white', shoes: 'silver', acc: [X((d) => [1, -1].map((s) => ['head', 'cyl', [d.headW * 0.3, d.headW * 0.14, d.headW * 0.3], [s * d.headW * 0.52, d.headY, 0], 'steel', { srot: [0, 0, 90] }] as XP)), patch('cyan', 0.25, 0.18, 0.7), X((d) => [['torso', 'ball', [d.tw * 0.2, d.tw * 0.2, d.td * 0.1], [0, d.torsoH * 0.7, d.td * 0.56], 'cyan', { glow: true }]]), bands('steel', [0.05]), gloves('steel')] })),
  e('anesthesiologist', 'town', 'medical', () => W('anesthesiologist', { top: 'teal', bottom: 'teal', shoes: 'white', acc: [cap0('teal'), face('mask', 'skyblue'), wear('stethoscope'), held('syringe'), held('clipboard', 'wood', 'L')] })),
  e('angel', 'fantasy', 'spirits', () => W('angel', { top: 'white', bottom: 'white', skirt: 'white', legs: 'white', long: true, hair: 'gold', style: 'long', skin: 'skin1', acc: [hat('halo'), body('angelwings'), wear('belt', 'gold'), held('trumpet', 'gold')] })),
  e('angler', 'town', 'outdoors', () => W('angler', { top: 'tan', bottom: 'darkgreen', shoes: 'darkgreen', acc: [bucket('olive'), wear('vest', 'olive'), held('fishing rod'), fishH('orange')] })),
  e('ann', 'town', 'storybook', () => W('ann', { h: 'kid', skin: 'skin1', hair: 'red', style: 'short', top: 'skyblue', skirt: 'skyblue', legs: 'white', shoes: 'black', blush: 'red', acc: [mop('red'), wear('apron', 'white'), nose('red', 0.14)] })),
  e('aquaman', 'town', 'superheroes', () => W('aquaman', { h: 1.85, build: 1.2, skin: 'skin2', top: 'orange', long: true, bottom: 'darkgreen', shoes: 'darkgreen', hair: 'gold', style: 'long', acc: [face('beard', 'gold'), wear('belt', 'gold'), gloves('darkgreen'), held('trident', 'gold')] })),
  e('archaeologist', 'town', 'science', () => W('archaeologist', { top: 'tan', bottom: '#a08a5a', shoes: 'brown', acc: [hat('helmet', 'beige'), wear('vest', '#8a6a3a'), wear('scarf', 'red'), held('shovel'), held('magnifier', 'gold', 'L')] })),
  e('archer', 'town', 'warriors', () => W('archer', { top: 'darkgreen', long: true, bottom: 'brown', shoes: 'darkbrown', hair: 'brown', style: 'short', acc: [hat('beret', 'darkgreen'), feather('red'), wear('belt', 'brown'), quiver(), held('bow', 'wood', 'L')] })),
  e('architect', 'town', 'office', () => W('architect', { top: 'black', long: true, bottom: 'gray', shoes: 'black', acc: [hat('hard', 'white'), face('glasses', 'black'), held('scroll', 'skyblue'), inHand('L', (a) => [['wedge', [a * 3, a * 2.4, a * 0.2], [0, a * 0.2, a * 1.2], 'skyblue', { apex: -0.5 }]])] })),
  e('arsonist', 'town', 'crime', () => W('arsonist', { top: 'darkgray', long: true, bottom: 'black', shoes: 'black', acc: [hat('beanie', 'black'), held('torch'), inHand('L', (a) => [['box', [a * 2.4, a * 2.8, a * 1.2], [0, -a * 2.2, a * 0.6], 'red'], ['cyl', [a * 0.4, a * 1.0, a * 0.4], [a * 0.8, -a * 0.6, a * 0.6], 'black', { srot: [0, 0, -30] }]])] })),
  e('artist', 'town', 'arts', () => W('artist', { top: 'white', long: true, bottom: 'black', shoes: 'black', hair: '#1d1d1d', style: 'short', acc: [hat('beret', 'black'), face('mustache', '#1d1d1d'), held('paintbrush'), palette(), patch('blue', 0.14, 0.08, 0.4, 0.2), patch('red', 0.12, 0.08, 0.3, -0.25), patch('yellow', 0.12, 0.08, 0.55, -0.1)] })),
  e('assassin', 'town', 'crime', () => W('assassin', { top: 'black', long: true, bottom: 'black', shoes: 'black', acc: [wear('cloak', 'black'), hat('hood', 'black'), face('mask', 'black'), wear('belt', 'darkred'), held('knife')] })),
  e('astronaut', 'town', 'science', () => W('astronaut', { h: 1.75, build: 1.2, top: 'white', long: true, bottom: 'white', shoes: 'white', acc: [hat('astronaut'), wear('backpack', 'white'), gloves('white'), boots('white'), patch('navy', 0.4, 0.2, 0.6), patch('red', 0.12, 0.08, 0.85, 0.3)] })),
  e('astronomer', 'town', 'science', () => W('astronomer', { top: 'navy', long: true, bottom: 'darkgray', shoes: 'black', acc: [face('glasses'), card('★', 'navy', 'L'), beside(() => [['cyl', [0.12, 0.8, 0.12], [0.6, 1.28, 0.05], 'brass', { srot: [20, 0, -35], taper: 0.7 }], ['capsule', [0.03, 1.1, 0.03], [0.68, 0.52, 0], 'darkwood', { srot: [0, 0, 12] }], ['capsule', [0.03, 1.1, 0.03], [0.52, 0.52, 0], 'darkwood', { srot: [0, 0, -12] }], ['capsule', [0.03, 1.1, 0.03], [0.6, 0.52, -0.12], 'darkwood', { srot: [-12, 0, 0] }]])] })),
  e('atheist', 'town', 'religion', () => W('atheist', { top: 'teal', bottom: 'denim', shoes: 'white', acc: [face('glasses'), held('book', 'navy', 'L'), inHand('R', (a) => [['ball', [a * 1, a * 1, a * 1], [0, a * 1.6, a * 1.4], 'red'], ['torus', [a * 4, a * 1.6, a * 0.2], [0, a * 1.6, a * 1.4], 'blue', { srot: [0, 0, 30], tube: 0.1 }], ['torus', [a * 4, a * 1.6, a * 0.2], [0, a * 1.6, a * 1.4], 'blue', { srot: [0, 0, -30], tube: 0.1 }], ['capsule', [a * 0.3, a * 1.6, a * 0.3], [0, a * 0.3, a * 1.4], 'gray']])] })),
  e('athlete', 'sports', 'athletes', () => W('athlete', { skin: 'skin4', top: 'red', bottom: 'navy', legs: 'skin4', shoes: 'white', hair: '#1d1d1d', style: 'short', acc: [hat('headband', 'white'), chest('7', 'white', 0.45, 0.25, 0.55), wear('medal')] })),
  e('baby', 'town', 'family', () => W('baby', { h: 'baby', skin: 'skin1', hair: 'gold', style: 'short', top: 'skyblue', long: true, bottom: 'skyblue', shoes: 'skyblue', acc: [pacifier(), inHand('R', (a) => [['capsule', [a * 0.5, a * 2, a * 0.5], [0, a * 0.3, a * 0.6], 'pink'], ['ball', [a * 1.6, a * 1.6, a * 1.6], [0, a * 1.6, a * 0.6], 'yellow']])] })),
  e('babysitter', 'town', 'family', () => together('babysitter', [[W('babysitter', { top: 'pink', bottom: 'denim', shoes: 'white', style: 'ponytail', acc: [held('phone', 'black', 'L'), inHand('R', (a) => [['cyl', [a * 1.1, a * 2.2, a * 1.1], [0, a * 0.4, a * 0.8], 'white'], ['cyl', [a * 0.7, a * 0.8, a * 0.7], [0, a * 1.8, a * 0.8], 'skyblue', { taper: 0.4 }]])] }), -0.25], [W('babysitter baby', { h: 'baby', top: 'yellow', long: true, bottom: 'yellow', shoes: 'white', style: 'short', acc: [pacifier()] }), 0.4]])),
  e('baker', 'town', 'food service', () => W('baker', { top: 'white', long: true, bottom: 'gray', shoes: 'black', acc: [hat('chef'), wear('apron', 'cream'), inHand('L', (a) => [['capsule', [a * 1.1, a * 6, a * 1.1], [0, a * 1.2, a * 0.9], 'bread', { srot: [-25, 0, 0] }]]), inHand('R', (a) => [['capsule', [a * 1.0, a * 4.5, a * 1.0], [0, -a * 0.4, a * 0.8], 'lightwood', { srot: [90, 0, 0] }], ['capsule', [a * 0.4, a * 1.4, a * 0.4], [0, -a * 0.4, -a * 1.9], 'wood', { srot: [90, 0, 0] }], ['capsule', [a * 0.4, a * 1.4, a * 0.4], [0, -a * 0.4, a * 3.5], 'wood', { srot: [90, 0, 0] }]])] })),
  e('banker', 'town', 'office', () => W('banker', { top: 'white', long: true, bottom: '#3a3a4a', shoes: 'black', hair: 'white', style: 'short', acc: [suitX('#3a3a4a', 'gold'), hat('bowler', 'black'), face('monocle'), face('mustache', 'white'), sack('#c8a46a', '$'), held('briefcase', 'black')] })),
  e('barbarian', 'town', 'warriors', () => W('barbarian', { h: 1.9, build: 1.35, skin: 'skin3', top: 'skin3', bottom: '#6b4a2e', legs: 'skin3', shoes: 'brown', hair: '#1d1d1d', style: 'long', acc: [hat('viking', 'iron'), face('beard', '#1d1d1d'), wear('belt', 'brown'), wear('sash', '#6b4a2e'), boots('#6b4a2e'), held('axe')] })),
  e('barber', 'town', 'beauty', () => W('barber', { top: 'white', bottom: 'black', shoes: 'black', hair: '#1d1d1d', style: 'short', acc: [wear('vest', 'black'), wear('bowtie', 'red'), face('mustache', '#1d1d1d'), held('scissors'), comb(), beside(() => [['cyl', [0.15, 0.9, 0.15], [0.6, 0.95, 0], 'white'], ...[0.65, 0.9, 1.15].map((y) => ['torus', [0.16, 0.16, 0.035], [0.6, y, 0], 'red', { srot: [65, 0, 0], tube: 0.3 }] as HP), ['ball', [0.17, 0.12, 0.17], [0.6, 1.42, 0], 'silver'], ['cyl', [0.17, 0.05, 0.17], [0.6, 0.48, 0], 'silver'], ['cyl', [0.05, 0.46, 0.05], [0.6, 0.23, 0], 'silver'], ['cyl', [0.3, 0.03, 0.3], [0.6, 0.015, 0], 'silver']] as HP[])] })),
  e('barista', 'town', 'food service', () => W('barista', { top: 'black', bottom: 'black', shoes: 'black', style: 'bun', acc: [wear('apron', 'darkgreen'), cupH('white', 'coffee')] })),
  e('baseball player', 'sports', 'athletes', () => W('baseball player', { top: 'white', bottom: 'white', legs: 'navy', shoes: 'black', acc: [hat('cap', 'navy'), chest('12', 'white', 0.4, 0.25), held('bat'), inHand('L', (a) => [['ball', [a * 2.4, a * 2.8, a * 1.4], [0, -a * 0.4, a * 0.4], 'brown']])] })),
  e('basketball player', 'sports', 'athletes', () => W('basketball player', { h: 1.98, skin: 'skin5', top: 'purple', bottom: 'purple', legs: 'skin5', shoes: 'white', hair: '#1d1d1d', style: 'short', acc: [chest('23', 'yellow', 0.4, 0.25), hat('headband', 'white'), wristbands('white'), held('ball', 'orange')] })),
  e('batman', 'town', 'superheroes', () => W('batman', { h: 1.88, build: 1.2, skin: 'skin1', top: 'darkgray', long: true, bottom: 'darkgray', shoes: 'black', style: 'none', acc: [cowl('black'), wear('cape', 'black'), wear('belt', 'yellow'), patch('yellow', 0.46, 0.2, 0.72), X((d) => [['torso', 'wedge', [d.tw * 0.36, d.torsoH * 0.12, d.td * 0.05], [0, d.torsoH * 0.72, d.td * 0.58], 'black', { srot: [0, 0, 180], layer: 6 }]]), gloves('black'), boots('black')] })),
  e('beautician', 'town', 'beauty', () => W('beautician', { top: 'pink', bottom: 'white', shoes: 'white', hair: '#a0522d', style: 'long', acc: [wear('apron', 'magenta'), hairdryer(), comb()] })),
  e('beethoven', 'town', 'history', () => W('beethoven', { skin: 'skin2', hair: '#8f969e', style: 'long', top: 'darkgreen', long: true, bottom: 'black', shoes: 'black', acc: [mop('#8f969e', 1.1), wear('scarf', 'white'), held('scroll', 'paper'), held('baton', 'black', 'L')] })),
  e('beggar', 'town', 'street', () => W('beggar', { top: '#8a7a5a', long: true, bottom: '#6b5a3a', shoes: 'darkbrown', hair: 'gray', style: 'short', acc: [hat('beanie', 'darkgray'), face('beard', 'gray'), wear('scarf', 'darkred'), patch('#a08a5a', 0.2, 0.16, 0.35, 0.2), cupH('steel', 'steel'), card('PLEASE HELP', '#d9b98a', 'L')] })),
  e('bellhop', 'town', 'hotel', () => W('bellhop', { top: 'red', long: true, bottom: 'black', shoes: 'black', acc: [pillbox('red'), epaul('gold'), buttons('gold', 4, 0.15), buttons('gold', 4, -0.15), held('briefcase', 'brown'), held('bag', 'tan', 'L')] })),
  e('benjamin franklin', 'town', 'history', () => W('benjamin franklin', { skin: 'skin1', hair: '#d4d7da', style: 'bald', top: 'brown', long: true, bottom: 'brown', legs: 'white', shoes: 'black', build: 1.15, acc: [sideHair('#d4d7da'), face('glasses', '#5a3a22'), wear('vest', 'tan'), kite('red')] })),
  e('bigfoot', 'fantasy', 'cryptids', () => W('bigfoot', { h: 2.4, build: 1.4, skin: '#9a7458', hair: '#5a3a22', style: 'long', top: '#5a3a22', long: true, bottom: '#5a3a22', shoes: '#3b2a1e', eyes: '#1d1d1d', acc: [mop('#5a3a22', 0.95), boots('#3b2a1e', 1.4), gloves('#5a3a22', 1.25)] })),
  e('biker', 'town', 'drivers', () => W('biker', { top: 'black', long: true, bottom: 'denim', shoes: 'black', hair: 'gray', acc: [hat('bandana', '#2a2726'), face('sunglasses'), face('beard', 'gray'), wear('vest', '#2a2726'), wear('belt', 'silver'), inHand('L', (a) => [['ball', [a * 3, a * 3, a * 3], [0, -a * 1.4, a * 1.0], 'red'], ['ball', [a * 2.2, a * 1.2, a * 1], [0, -a * 1.2, a * 2.2], 'black']])] })),
  e('biologist', 'town', 'science', () => W('biologist', { top: 'white', bottom: 'darkgray', shoes: 'black', acc: [wear('labcoat'), face('glasses'), tube('lime'), inHand('L', (a) => [['ball', [a * 2, a * 1.3, a * 1.8], [0, a * 0.5, a * 1.2], 'green'], ...[1, -1].map((s) => ['ball', [a * 0.6, a * 0.6, a * 0.6], [s * a * 0.55, a * 1.1, a * 1.7], 'lime'] as HP)])] })),
  e('birdwatcher', 'town', 'outdoors', () => W('birdwatcher', { top: 'tan', bottom: 'olive', shoes: 'brown', acc: [bucket('tan'), wear('vest', 'olive'), binoculars(), held('book', 'darkgreen', 'L')] })),
  e('black knight', 'town', 'warriors', () => W('black knight', { top: 'black', long: true, bottom: 'black', shoes: 'black', build: 1.15, acc: [wear('armor', '#3a3a3a'), greathelm('#3a3a3a'), crest('black'), gloves('#3a3a3a'), boots('#3a3a3a'), held('sword'), held('shield', 'black', 'L')] })),
  e('blacksmith', 'town', 'trades', () => W('blacksmith', { build: 1.3, top: 'gray', bottom: 'darkbrown', shoes: 'black', hair: '#1d1d1d', style: 'short', acc: [wear('apron', 'leather'), face('beard', '#1d1d1d'), held('hammer'), beside(() => [['box', [0.22, 0.26, 0.18], [0.6, 0.13, 0.1], 'iron'], ['box', [0.46, 0.14, 0.22], [0.6, 0.33, 0.1], 'iron', { round: 0.1 }], ['cyl', [0.12, 0.22, 0.12], [0.92, 0.35, 0.1], 'iron', { taper: 0, srot: [0, 0, -90] }]])] })),
  e('bodybuilder', 'sports', 'athletes', () => W('bodybuilder', { build: 1.5, skin: 'skin3', top: 'skin3', bottom: 'red', legs: 'skin3', shoes: 'black', hair: '#1d1d1d', style: 'short', acc: [muscles('skin3'), dumbbell('R'), dumbbell('L')] })),
  e('bogeyman', 'fantasy', 'monsters', () => W('bogeyman', { h: 1.9, build: 0.8, skin: '#4a4a55', eyes: '#1d1d1d', style: 'none', top: 'black', long: true, bottom: 'black', shoes: 'black', acc: [wear('cloak', 'black'), hat('hood', '#1d1d1d'), glowEyes('yellow'), sack('#5a4a3a')] })),
  e('bomb disposal expert', 'town', 'military', () => W('bomb disposal expert', { build: 1.4, top: 'darkgreen', long: true, bottom: 'darkgreen', shoes: 'black', acc: [hat('astronaut', 'darkgreen'), wear('armor', 'olive'), gloves('black'), bomb(), held('scissors')] })),
  e('bookie', 'town', 'crime', () => W('bookie', { top: 'white', long: true, bottom: 'brown', shoes: 'black', acc: [suitX('#a0522d', 'yellow'), fedora('tan'), card('5 TO 1', 'paper', 'R', 3, 3.6), inHand('L', (a) => [['box', [a * 2.4, a * 1.0, a * 1.2], [0, -a * 0.4, a * 1.0], 'green']])] })),
  e('boss', 'town', 'office', () => W('boss', { hair: 'gray', style: 'short', top: 'white', long: true, bottom: 'black', shoes: 'black', acc: [suitX('#2a2726', 'red'), cupH('white'), held('phone', 'black', 'L')] })),
  e('botanist', 'town', 'science', () => W('botanist', { top: 'green', bottom: 'tan', shoes: 'brown', acc: [hat('straw'), wear('vest', 'darkgreen'), potplant('L', 'yellow'), held('magnifier', 'gold')] })),
  e('bouncer', 'town', 'law and order', () => W('bouncer', { h: 1.9, build: 1.45, skin: 'skin4', style: 'bald', top: 'black', bottom: 'black', shoes: 'black', acc: [face('sunglasses'), chest('SECURITY', 'black', 0.8, 0.14, 0.75), held('clipboard', 'wood', 'L')] })),
  e('bounty hunter', 'town', 'law and order', () => W('bounty hunter', { top: '#8a6a3a', long: true, bottom: 'darkbrown', shoes: 'black', acc: [hat('cowboy', '#3a2a20'), wear('vest', '#6b4a2e'), face('beard', '#5a3a22'), wear('belt', 'black'), card('WANTED', '#e8d29a', 'L', 4, 5), held('blaster', 'darkgray')] })),
  e('bowler (person)', 'sports', 'athletes', () => W('bowler (person)', { top: 'teal', bottom: 'tan', shoes: 'red', acc: [bands('white', [0.62]), held('ball', 'black'), beside(() => [['ball', [0.13, 0.26, 0.13], [0.55, 0.13, 0.1], 'white'], ['capsule', [0.06, 0.16, 0.06], [0.55, 0.3, 0.1], 'white'], ['ball', [0.08, 0.09, 0.08], [0.55, 0.4, 0.1], 'white'], ['torus', [0.075, 0.075, 0.02], [0.55, 0.31, 0.1], 'red', { srot: [90, 0, 0], tube: 0.35 }]])] })),
  e('bowser', 'fantasy', 'game characters', () => W('bowser', { h: 2.5, build: 1.45, skin: '#e8b83a', hair: 'red', style: 'none', top: '#f6e08a', bottom: '#e8b83a', shoes: '#e8b83a', eyes: '#c0392b', acc: [koopa('darkgreen'), horns2('cream', 1.5), mop('red', 0.7), muzzle('#f6e08a'), wristbands('black'), bands('#e8b83a', [0.3, 0.5])] })),
  e('boxer (person)', 'sports', 'athletes', () => W('boxer (person)', { build: 1.2, skin: 'skin4', top: 'skin4', bottom: 'red', legs: 'skin4', shoes: 'white', hair: '#1d1d1d', style: 'short', acc: [gloves('red', 2.0), wear('belt', 'gold')] })),
  e('boyfriend', 'town', 'family', () => W('boyfriend', { top: 'blue', long: true, bottom: 'denim', shoes: 'white', style: 'short', acc: [held('bouquet'), heartH('L')] })),
  e('bride', 'town', 'wedding', () => W('bride', { skin: 'skin1', top: 'white', long: true, skirt: 'white', legs: 'white', shoes: 'white', hair: '#a0522d', style: 'bun', acc: [hat('veil', 'white'), hat('tiara', 'silver'), gown('white'), wear('necklace', 'white'), held('bouquet')] })),
  e('bridesmaid', 'town', 'wedding', () => W('bridesmaid', { top: '#c9a0dc', skirt: '#c9a0dc', legs: '#c9a0dc', shoes: '#c9a0dc', style: 'long', acc: [hat('flower', 'white'), wear('necklace', 'silver'), held('bouquet')] })),
  e('bruce wayne', 'town', 'superheroes', () => W('bruce wayne', { h: 1.88, skin: 'skin1', hair: '#1d1d1d', style: 'short', top: 'white', long: true, bottom: 'black', shoes: 'black', acc: [suitX('black', 'black', true), cupH('glass', 'gold'), patch('black', 0.12, 0.06, 0.8, 0.3)] })),
  e('bullfighter', 'town', 'entertainment', () => W('bullfighter', { top: 'gold', long: true, bottom: 'gold', legs: 'pink', shoes: 'black', hair: '#1d1d1d', style: 'short', acc: [montera(), epaul('gold'), wear('belt', 'red'), inHand('R', (a) => [['capsule', [a * 0.3, a * 5.4, a * 0.3], [-a * 2.2, -a * 0.3, a * 1.2], 'wood', { srot: [0, 0, 90] }], ['box', [a * 5.2, a * 4.8, a * 0.2], [-a * 2.2, -a * 2.7, a * 1.3], 'red', { round: 0.2 }]])] })),
  e('bully', 'town', 'school', () => W('bully', { h: 1.55, build: 1.35, top: 'darkgray', bottom: 'denim', shoes: 'black', acc: [capBack('red'), inHand('R', (a) => [['capsule', [a * 0.4, a * 1.6, a * 0.4], [0, a * 0.3, a * 0.8], 'wood'], ...[1, -1].map((s) => ['capsule', [a * 0.35, a * 1.4, a * 0.35], [s * a * 0.45, a * 1.6, a * 0.8], 'wood', { srot: [0, 0, -s * 25] }] as HP)])] })),
  e('bureaucrat', 'town', 'office', () => W('bureaucrat', { hair: 'gray', style: 'short', top: 'white', long: true, bottom: 'gray', shoes: 'black', acc: [suitX('gray', 'navy'), face('glasses'), inHand('R', (a) => [['capsule', [a * 0.7, a * 1.6, a * 0.7], [0, a * 0.6, a * 0.7], 'darkwood'], ['box', [a * 1.8, a * 0.6, a * 1.2], [0, -a * 0.3, a * 0.7], 'red']]), inHand('L', (a) => [['box', [a * 2.6, a * 2.6, a * 1.8], [0, a * 0.4, a * 1.2], 'paper']])] })),
  e('businessman', 'town', 'office', () => W('businessman', { top: 'white', long: true, bottom: 'navy', shoes: 'black', hair: 'darkbrown', style: 'short', acc: [suitX('navy', 'red'), held('briefcase', 'black')] })),
  e('businesswoman', 'town', 'office', () => W('businesswoman', { skin: 'skin1', top: 'white', long: true, skirt: 'navy', bottom: 'navy', legs: 'skin1', shoes: 'black', hair: '#3b2a1e', style: 'bun', acc: [suitX('navy', null), wear('necklace', 'white'), held('briefcase', 'black'), held('phone', 'black', 'L')] })),
  e('butcher', 'town', 'food service', () => W('butcher', { top: 'white', bottom: 'darkgray', shoes: 'black', acc: [pillbox('white'), wear('apron', 'white'), bands('navy', [0.3, 0.45]), face('mustache', '#3b2a1e'), cleaver(), inHand('L', (a) => [['ball', [a * 2.2, a * 3, a * 2], [0, -a * 1.8, a * 0.9], 'meat'], ['capsule', [a * 0.5, a * 1.6, a * 0.5], [0, -a * 0.1, a * 0.9], 'cream']])] })),
  e('butler', 'town', 'hotel', () => W('butler', { hair: 'gray', style: 'short', top: 'white', long: true, bottom: 'black', shoes: 'black', acc: [suitX('black', 'black', true), tails('black'), gloves('white', 0.9), trayDome()] })),
  e('cab driver', 'town', 'drivers', () => W('cab driver', { top: 'white', bottom: 'darkgray', shoes: 'black', acc: [hat('cap', 'darkgray'), wear('vest', 'black'), card('TAXI', 'yellow', 'L', 4.4, 2.2), inHand('R', (a) => [['torus', [a * 1.2, a * 1.2, a * 0.2], [0, -a * 0.6, a * 0.8], 'silver', { tube: 0.2 }], ['box', [a * 0.4, a * 1.0, a * 0.15], [0, -a * 1.4, a * 0.8], 'gold']])] })),
  e('cable guy', 'town', 'trades', () => W('cable guy', { top: 'navy', bottom: 'tan', shoes: 'brown', acc: [hat('cap', 'navy'), wear('tool belt'), coil('black'), held('wrench')] })),
  e('cafeteria worker', 'town', 'food service', () => W('cafeteria worker', { top: 'white', bottom: 'darkgray', shoes: 'white', style: 'bun', acc: [cap0('#eef2f4'), wear('apron', 'skyblue'), gloves('skyblue', 0.9), inHand('R', (a, d) => [['capsule', [a * 0.3, d.H * 0.22, a * 0.3], [0, d.H * 0.06, a * 0.6], 'silver'], ['ball', [a * 1.4, a * 0.9, a * 1.4], [0, -d.H * 0.05, a * 0.9], 'silver']]), inHand('L', (a) => [['box', [a * 4.4, a * 0.3, a * 3.4], [0, a * 0.4, a * 1.6], 'lightgray', { round: 0.3 }], ['ball', [a * 1.2, a * 0.6, a * 1.2], [-a * 1, a * 0.8, a * 1.2], 'lettuce'], ['ball', [a * 1.2, a * 0.6, a * 1.2], [a * 1, a * 0.8, a * 1.2], 'cheese'], ['ball', [a * 1.2, a * 0.6, a * 1.2], [0, a * 0.8, a * 2.4], 'meat']])] })),
  e('camera man', 'town', 'media', () => W('camera man', { top: 'black', bottom: 'denim', shoes: 'black', acc: [capBack('black'), hat('headphones', 'darkgray'), X((d) => [['torso', 'box', [d.tw * 0.55, d.tw * 0.5, d.tw * 1.2], [d.tw * 0.62, d.torsoH * 1.12, d.td * 0.4], 'darkgray', { round: 0.2 }], ['torso', 'cyl', [d.tw * 0.35, d.tw * 0.5, d.tw * 0.35], [d.tw * 0.62, d.torsoH * 1.12, d.td * 0.4 + d.tw * 0.8], 'black', { srot: [90, 0, 0] }], ['torso', 'box', [d.tw * 0.1, d.tw * 0.25, d.tw * 0.5], [d.tw * 0.62, d.torsoH * 1.12 + d.tw * 0.35, d.td * 0.4], 'black']])] })),
  e('camp counselor', 'town', 'outdoors', () => W('camp counselor', { skin: 'skin2', top: 'darkgreen', bottom: 'tan', legs: 'skin2', shoes: 'brown', style: 'ponytail', acc: [hat('cap', 'darkgreen'), chest('CAMP', 'darkgreen', 0.5, 0.14, 0.72), wear('whistle'), held('clipboard')] })),
  e('cannibal', 'town', 'villains', () => W('cannibal', { skin: 'skin1', hair: '#5a3a22', style: 'short', top: 'gray', long: true, bottom: 'gray', shoes: 'black', acc: [face('mask', '#8a5a35'), X((d) => [-0.16, 0, 0.16].map((x) => ['head', 'box', [d.headW * 0.05, d.headH * 0.32, d.headW * 0.05], [d.headW * x, d.headY - d.headH * 0.18, d.headD * 0.55], 'darkbrown', { layer: 6 }] as XP)), patch('white', 0.55, 0.42, 0.65), fork(), held('knife', 'silver', 'L')] })),
  e('captain', 'town', 'sailors', () => W('captain', { top: 'navy', long: true, bottom: 'white', shoes: 'black', hair: 'white', style: 'short', acc: [hat('police', 'white'), face('beard', 'white'), buttons('gold', 3, 0.18), buttons('gold', 3, -0.18), pipe(), inHand('L', (a) => [['torus', [a * 5, a * 5, a * 0.5], [a * 0.6, -a * 0.6, a * 1.4], 'darkwood', { srot: [0, 90, 0], tube: 0.12 }], ['capsule', [a * 0.3, a * 6.4, a * 0.3], [a * 0.6, -a * 0.6, a * 1.4], 'wood'], ['capsule', [a * 0.3, a * 6.4, a * 0.3], [a * 0.6, -a * 0.6, a * 1.4], 'wood', { srot: [90, 0, 0] }], ['cyl', [a * 0.9, a * 0.6, a * 0.9], [a * 0.6, -a * 0.6, a * 1.4], 'brass', { srot: [0, 0, 90] }]])] })),
  e('cardiologist', 'town', 'medical', () => W('cardiologist', { top: 'skyblue', bottom: 'skyblue', shoes: 'white', acc: [wear('labcoat'), wear('stethoscope'), face('glasses'), heartH('L')] })),
  e('carpenter', 'town', 'trades', () => W('carpenter', { top: 'red', long: true, bottom: 'denim', shoes: 'brown', acc: [hat('cap', 'tan'), bands('darkred', [0.25, 0.5, 0.75]), wear('tool belt'), held('hammer'), X((d) => [['torso', 'box', [d.tw * 0.35, d.tw * 0.14, d.H * 0.8], [d.tw * 0.6, d.torsoH * 1.06, 0], 'lightwood', { round: 0.1 }]])] })),
  e('cat burglar', 'town', 'crime', () => W('cat burglar', { top: 'black', long: true, bottom: 'black', shoes: 'black', acc: [hat('beanie', 'black'), eyemask('black'), bands('white', [0.25, 0.5, 0.75]), sack('gray', '$'), inHand('R', (a) => [['cyl', [a * 0.7, a * 2.2, a * 0.7], [0, -a * 0.2, a * 1.2], 'black', { srot: [90, 0, 0] }], ['cyl', [a * 0.75, a * 0.2, a * 0.75], [0, -a * 0.2, a * 2.35], 'yellow', { srot: [90, 0, 0], glow: true }]])] })),
  e('catwoman', 'town', 'superheroes', () => W('catwoman', { skin: 'skin1', hair: '#1d1d1d', style: 'long', top: 'black', long: true, bottom: 'black', shoes: 'black', acc: [hat('catears', 'black'), face('goggles', 'silver'), gloves('black'), body('cattail', 'black'), held('whip', 'black')] })),
  e('cellist', 'town', 'music', () => W('cellist', { top: 'black', long: true, bottom: 'black', shoes: 'black', style: 'bun', acc: [inHand('R', (a) => [['capsule', [a * 0.15, a * 7, a * 0.15], [a * 1.5, a * 0.2, a * 1.0], 'darkwood', { srot: [0, 0, 70] }]]), beside((d) => {
    const k = d.H / 1.7;
    return [['ball', [0.44 * k, 0.44 * k, 0.2 * k], [0.4 * k, 0.42 * k, 0.15], 'wood'], ['ball', [0.36 * k, 0.36 * k, 0.2 * k], [0.4 * k, 0.74 * k, 0.15], 'wood'], ['box', [0.06 * k, 0.6 * k, 0.05 * k], [0.4 * k, 1.18 * k, 0.15], 'darkwood'], ['ball', [0.08 * k, 0.1 * k, 0.08 * k], [0.4 * k, 1.5 * k, 0.15], 'darkwood'], ['cyl', [0.02 * k, 0.24 * k, 0.02 * k], [0.4 * k, 0.12 * k, 0.15], 'silver']];
  })] })),
  e('centaur', 'fantasy', 'myths', () => beast('centaur', { color: '#a0623a', body: [1.5, 0.72, 0.58], legL: 0.92, legW: 0.13, hoof: 'darkbrown', neckL: 0.72, neckLean: 0, neckW: 0.18, head: [0.27, 0.3, 0.26], headColor: '#e2ac83', ears: 'side', earSize: 0.06, tail: 'long', tailColor: 'darkbrown', acc: [(p) => {
    const add = (name: string, parent: string, shape: Shape, size: Vec3, at: Vec3, color: string, o: Partial<FigPart> = {}) => p.add({ name, parent, shape, size, at, color: col(color, color), layer: 2, ...o });
    const skin = '#e2ac83';
    add('chest', 'neck', 'box', [0.44, 0.5, 0.26], [0, 0.36, 0], skin, { round: 0.6 });
    add('sash', 'neck', 'box', [0.1, 0.6, 0.28], [0, 0.36, 0], 'red', { srot: [0, 0, 35], layer: 3 });
    add('hair', 'head', 'ball', [0.3, 0.3, 0.27], [0, 0.07, -0.03], '#5a3a22', { layer: 1 });
    add('beard', 'head', 'ball', [0.2, 0.13, 0.1], [0, -0.05, 0.12], '#5a3a22', { layer: 4 });
    add('belt', 'neck', 'torus', [0.46, 0.46, 0.08], [0, 0.1, 0], '#e2b23a', { srot: [90, 0, 0], tube: 0.25 });
    for (const [n, s] of [['L', 1], ['R', -1]] as const) {
      add(`shoulder${n}`, 'neck', 'ball', [0.13, 0.13, 0.13], [s * 0.25, 0.56, 0], skin);
      add(`arm${n}`, 'neck', 'capsule', [0.1, 0.5, 0.1], [s * 0.29, 0.34, 0.04], skin, { srot: [-12, 0, s * 8] });
      add(`hand${n}`, 'neck', 'ball', [0.1, 0.11, 0.1], [s * 0.32, 0.1, 0.1], skin);
    }
    add('bow', 'neck', 'torus', [0.08, 0.8, 0.04], [0.38, 0.2, 0.12], 'wood', { tube: 0.15 });
    add('quiver', 'neck', 'cyl', [0.1, 0.42, 0.1], [-0.1, 0.42, -0.2], 'brown', { srot: [0, 0, 25] });
  }] })),
  e('cerberus', 'fantasy', 'myths', () => beast('cerberus', { color: '#3a3330', body: [1.6, 0.8, 0.72], legL: 0.75, legW: 0.18, neckL: 0.32, neckLean: 30, neckW: 0.3, head: [0.42, 0.34, 0.32], snout: { len: 0.22, h: 0.16, w: 0.18, color: '#2a2420' }, nose: 'black', ears: 'pointy', earSize: 0.14, tail: 'long', acc: [(p) => {
    const add = (name: string, parent: string, shape: Shape, size: Vec3, at: Vec3, color: string, o: Partial<FigPart> = {}) => p.add({ name, parent, shape, size, at, color: col(color, color), layer: 2, ...o });
    add('collar', 'neck', 'torus', [0.36, 0.36, 0.08], [0, 0.12, 0], 'red', { srot: [90, 0, 0], tube: 0.3 });
    for (const [n, s] of [['L', 1], ['R', -1]] as const) {
      add(`neck${n}`, 'body', 'capsule', [0.26, 0.5, 0.26], [s * 0.28, 0.32, 0.62], '#3a3330', { srot: [40, 0, -s * 30] });
      add(`head${n}`, 'body', 'ball', [0.3, 0.32, 0.4], [s * 0.42, 0.52, 0.78], '#3a3330');
      add(`snout${n}`, 'body', 'ball', [0.17, 0.15, 0.24], [s * 0.45, 0.47, 0.98], '#2a2420');
      add(`nose${n}`, 'body', 'ball', [0.07, 0.06, 0.04], [s * 0.45, 0.51, 1.1], 'black');
      add(`eyeX${n}`, 'body', 'ball', [0.06, 0.06, 0.04], [s * 0.38, 0.6, 0.95], 'red', { role: 'glow' });
      add(`eyeY${n}`, 'body', 'ball', [0.06, 0.06, 0.04], [s * 0.52, 0.6, 0.93], 'red', { role: 'glow' });
      add(`ear${n}1`, 'body', 'cyl', [0.1, 0.16, 0.05], [s * 0.34, 0.72, 0.74], '#3a3330', { taper: 0, segs: 3 });
      add(`ear${n}2`, 'body', 'cyl', [0.1, 0.16, 0.05], [s * 0.52, 0.72, 0.74], '#3a3330', { taper: 0, segs: 3 });
      add(`collar${n}`, 'body', 'torus', [0.3, 0.3, 0.07], [s * 0.34, 0.4, 0.66], 'red', { srot: [50, 0, -s * 30], tube: 0.3 });
    }
  }] })),
  e('champion', 'sports', 'athletes', () => W('champion', { top: 'white', bottom: 'navy', shoes: 'white', acc: [X((d) => [['head', 'torus', [d.headW * 1.08, d.headD * 1.04, d.headH * 0.12], [0, d.headY + d.headH * 0.25, 0], 'green', { srot: [90, 0, 0], tube: 0.25 }]]), wear('medal'), wear('sash', 'red'), arms(165, 8), inHand('L', (a) => [['cyl', [a * 2, a * 2, a * 2], [0, -a * 2.6, 0], 'gold', { taper: 0.6, srot: [180, 0, 0] }], ['cyl', [a * 0.6, a * 1.2, a * 0.6], [0, -a * 1.2, 0], 'gold'], ['cyl', [a * 1.4, a * 0.4, a * 1.4], [0, -a * 0.5, 0], 'darkwood']])] })),
  e('charles darwin', 'town', 'science', () => W('charles darwin', { skin: 'skin1', hair: 'white', style: 'bald', top: 'black', long: true, bottom: 'darkgray', shoes: 'black', acc: [face('longbeard', 'white'), wear('vest', 'darkgray'), held('book', 'darkgreen'), beside(() => [['ball', [0.34, 0.2, 0.42], [0.55, 0.12, 0.1], 'olive'], ['ball', [0.12, 0.1, 0.14], [0.55, 0.14, 0.36], 'stone'], ...[[0.13, 0.22], [-0.13, 0.22], [0.13, -0.05], [-0.13, -0.05]].map(([x, z]) => ['capsule', [0.07, 0.1, 0.07], [0.55 + x, 0.05, 0.1 + z], 'stone'] as HP)])] })),
  e('cheerleader', 'sports', 'athletes', () => W('cheerleader', { skin: 'skin1', hair: 'gold', style: 'ponytail', top: 'red', skirt: 'red', legs: 'skin1', shoes: 'white', acc: [hat('bow', 'white'), chest('GO', 'white', 0.4, 0.2), pompoms('yellow'), arms(140)] })),
  e('chef', 'town', 'food service', () => W('chef', { top: 'white', long: true, bottom: 'darkgray', shoes: 'black', hair: '#1d1d1d', style: 'short', acc: [hat('chef'), wear('scarf', 'red'), buttons('black', 3, 0.15), buttons('black', 3, -0.15), face('mustache', '#1d1d1d'), held('pan'), held('spatula', 'silver', 'L')] })),
  e('chemist', 'town', 'science', () => W('chemist', { top: 'white', bottom: 'navy', shoes: 'black', acc: [wear('labcoat'), face('goggles', 'teal'), flask('lime'), tube('magenta', 'L')] })),
  e('chief', 'town', 'law and order', () => W('chief', { top: 'navy', long: true, bottom: 'navy', shoes: 'black', hair: 'gray', style: 'short', acc: [hat('police', 'white'), epaul('gold'), wear('badge'), wear('medal'), chest('CHIEF', 'gold', 0.5, 0.13, 0.86), held('clipboard')] })),
  e('child', 'town', 'family', () => W('child', { h: 'kid', top: 'yellow', bottom: 'denim', shoes: 'red', style: 'pigtails', acc: [wear('backpack', 'red'), held('balloon', 'red')] })),
  e('chimney sweeper', 'town', 'trades', () => W('chimney sweeper', { skin: 'skin2', top: 'black', long: true, bottom: 'black', shoes: 'black', acc: [tophat('#2a2726'), wear('scarf', 'red'), patch('darkgray', 0.15, 0.1, 0.4, 0.2), inHand('R', (a, d) => [['capsule', [a * 0.3, d.H * 0.9, a * 0.3], [-d.H * 0.1, d.H * 0.185, a * 0.4], 'wood', { srot: [0, 0, 13] }], ['ball', [a * 3.2, a * 3.2, a * 3.2], [-d.H * 0.2, d.H * 0.64, a * 0.4], 'black'], ...[0, 60, 120].map((r) => ['capsule', [a * 0.3, a * 4.4, a * 0.3], [-d.H * 0.2, d.H * 0.64, a * 0.4], 'black', { srot: [r, 0, 90] }] as HP)])] })),
  e('chinese dragon', 'fantasy', 'dragons', () => {
    const b = m('chinese dragon', { view: 'side' });
    const seg = (i: number): Vec3 => [0, 1.35 + 0.95 * Math.sin(i * 0.75), 3.6 - i * 0.55];
    for (let i = 0; i < 15; i++) {
      const [x, y, z] = seg(i);
      const r = 0.8 - i * 0.04;
      b.ball([r, r, 0.75], [x, y, z], { color: 'red' });
      b.ball([r * 0.6, r * 0.5, 0.6], [x, y - r * 0.3, z], { color: 'gold', noInk: true });
      b.cone([0.14, 0.32, 0.25], [x, y + r * 0.5, z], { color: 'gold', rot: [-30, 0, 0] });
    }
    for (const i of [1, 9]) {
      const [, y, z] = seg(i);
      b.pair((s) => b.rod([s * 0.25, y - 0.2, z], [s * 0.35, 0.05, z + 0.2], 0.14, 'red').ball([0.18, 0.1, 0.24], [s * 0.35, 0.05, z + 0.28], { color: 'gold' }));
    }
    b.ball([0.95, 0.8, 1.0], [0, 2.75, 4.2], { color: 'red', name: 'head' })
      .box([0.6, 0.38, 0.7], [0, 2.6, 4.85], { color: 'red', round: 0.6 })
      .box([0.5, 0.14, 0.6], [0, 2.32, 4.75], { color: 'darkred', round: 0.6 })
      .cone([0.4, 0.5, 0.25], [0, 2.1, 4.4], { color: 'gold', rot: [160, 0, 0] })
      .pair((s) => b.ball([0.2, 0.2, 0.12], [s * 0.3, 2.95, 4.6], { color: 'white' }).ball(0.09, [s * 0.32, 2.95, 4.67], { color: 'black', noInk: true })
        .rod([s * 0.2, 3.1, 4.0], [s * 0.45, 3.75, 3.55], 0.08, 'gold').rod([s * 0.35, 3.45, 3.75], [s * 0.6, 3.6, 3.95], 0.06, 'gold')
        .rod([s * 0.2, 2.6, 5.15], [s * 0.9, 2.9, 5.6], 0.04, 'gold').ball([0.2, 0.12, 0.12], [s * 0.15, 2.8, 5.2], { color: 'darkred' }))
      .cone([0.5, 0.9, 0.12], [0, 1.0, -4.6], { color: 'gold', rot: [-110, 0, 0] });
    return b.done();
  }),
  e('choir boy', 'town', 'religion', () => W('choir boy', { h: 'kid', top: 'white', long: true, bottom: 'red', skirt: 'red', legs: 'red', shoes: 'black', style: 'short', acc: [ruff('white'), held('book', 'red'), held('book', 'red', 'L')] })),
  e('clark', 'town', 'superheroes', () => W('clark', { h: 1.8, skin: 'skin1', hair: '#1d1d1d', style: 'short', top: 'blue', long: true, bottom: 'gray', shoes: 'black', acc: [openJacket('gray'), patch('yellow', 0.3, 0.24, 0.68), chest('S', 'red', 0.2, 0.16, 0.68), face('glasses', 'black'), held('briefcase', 'brown')] })),
  e('cleopatra', 'town', 'history', () => W('cleopatra', { skin: 'skin3', hair: '#1d1d1d', style: 'long', top: 'white', skirt: 'white', legs: 'white', shoes: 'gold', acc: [hat('headband', 'gold'), X((d) => [['head', 'capsule', [d.headW * 0.1, d.headH * 0.25, d.headW * 0.1], [0, d.headY + d.headH * 0.3, d.headD * 0.55], 'gold', { layer: 6 }], ['torso', 'torus', [d.tw * 1.05, d.td * 1.6, d.torsoH * 0.06], [0, d.torsoH * 0.95, 0], 'teal', { srot: [80, 0, 0], tube: 0.35, layer: 4 }]]), wear('belt', 'gold'), held('cane', 'gold')] })),
  e('cleric', 'town', 'religion', () => W('cleric', { top: 'black', long: true, bottom: 'black', skirt: 'black', legs: 'black', shoes: 'black', hair: 'gray', style: 'short', acc: [X((d) => [['torso', 'box', [d.tw * 0.14, d.torsoH * 0.07, d.td * 0.08], [0, d.torsoH * 0.95, d.td * 0.53], 'white', { layer: 5 }]]), wear('necklace', 'gold'), held('book', 'black')] })),
  e('clerk', 'town', 'shops', () => W('clerk', { top: 'white', bottom: 'black', shoes: 'black', acc: [wear('vest', 'red'), wear('badge', 'white'), beside((d) => {
    const k = d.H / 1.7;
    return [['box', [0.55, 0.9 * k, 0.45], [-0.6, 0.45 * k, 0.1], 'wood', { round: 0.1 }], ['box', [0.36, 0.2, 0.3], [-0.6, 0.9 * k + 0.1, 0.1], 'darkgray'], ['box', [0.24, 0.14, 0.04], [-0.6, 0.9 * k + 0.27, 0.05], 'lime', { srot: [-20, 0, 0] }]];
  })] })),
  e('clone', 'fantasy', 'sci-fi', () => together('clone', [[W('clone', { top: 'lightgray', long: true, bottom: 'lightgray', shoes: 'white', hair: 'darkbrown', style: 'short', acc: [chest('01', 'white', 0.4, 0.2)] }), -0.3], [W('clone', { top: 'lightgray', long: true, bottom: 'lightgray', shoes: 'white', hair: 'darkbrown', style: 'short', acc: [chest('02', 'white', 0.4, 0.2)] }), 0.3]])),
  e('clown', 'town', 'entertainment', () => W('clown', { skin: 'skin1', top: 'yellow', bottom: 'red', shoes: 'red', acc: [mop('orange', 1.3), face('clownnose'), hat('party', 'blue'), wear('bowtie', 'blue'), buttons('red', 3), patch('blue', 0.12, 0.08, 0.3, 0.3), patch('green', 0.12, 0.08, 0.5, -0.3), boots('red', 1.6), held('balloon', 'blue')] })),
  e('colonel', 'town', 'military', () => W('colonel', { top: 'olive', long: true, bottom: 'olive', shoes: 'black', hair: 'gray', style: 'short', acc: [hat('police', '#6b6f3a'), face('mustache', 'gray'), epaul('gold'), wear('medal'), buttons('gold', 3), held('baton', 'darkwood')] })),
  e('columbus', 'town', 'history', () => W('columbus', { skin: 'skin1', hair: 'white', style: 'long', top: 'darkred', long: true, bottom: 'black', shoes: 'black', acc: [hat('beret', 'black'), wear('cape', 'black'), wear('belt', 'gold'), spyglass(), held('map', 'paper')] })),
  e('comedian', 'town', 'entertainment', () => W('comedian', { top: 'white', long: true, bottom: 'black', shoes: 'black', acc: [suitX('purple', null), held('mic'), beside(() => [['cyl', [0.35, 0.05, 0.35], [0.55, 0.7, 0.1], 'red'], ...[[0.12, 0.12], [-0.12, 0.12], [0.12, -0.12], [-0.12, -0.12]].map(([x, z]) => ['capsule', [0.03, 0.7, 0.03], [0.55 + x, 0.35, 0.1 + z], 'silver'] as HP)])] })),
  e('communist (person)', 'town', 'politics', () => W('communist (person)', { top: 'olive', long: true, bottom: 'darkgray', shoes: 'black', acc: [ushanka('#5a3a22', 'red'), wear('belt', 'black'), held('flag', 'red')] })),
  e('con artist', 'town', 'crime', () => W('con artist', { top: 'white', long: true, bottom: 'black', shoes: 'white', acc: [suitX('#4a4a6a', 'pink'), fedora('white'), face('mustache', '#1d1d1d'), inHand('L', (a) => [-25, 0, 25].map((r, i) => ['box', [a * 1.4, a * 2, a * 0.1], [0, a * 0.6, a * (1.1 + i * 0.05)], i === 1 ? 'red' : 'white', { srot: [0, 0, r], round: 0.1 }] as HP))] })),
  e('congressman', 'town', 'politics', () => W('congressman', { hair: 'gray', style: 'short', top: 'white', long: true, bottom: 'navy', shoes: 'black', acc: [suitX('navy', 'blue'), patch('red', 0.08, 0.06, 0.82, 0.3), card('BILL', 'paper', 'L', 3, 4), held('briefcase', 'black')] })),
  e('conjoined twins', 'town', 'family', () => together('conjoined twins', [[W('conjoined twins', { h: 1.6, top: 'teal', bottom: 'denim', shoes: 'white', style: 'short', acc: [] }), -0.14], [W('conjoined twins', { h: 1.6, top: 'teal', bottom: 'denim', shoes: 'white', style: 'short', acc: [] }), 0.14]])),
  e('conservative', 'town', 'politics', () => W('conservative', { hair: 'gray', style: 'short', top: 'white', long: true, bottom: 'gray', shoes: 'black', acc: [suitX('#4a5a4a', 'navy'), hat('bowler', 'black'), held('cane', 'black'), held('letter', 'paper', 'L')] })),
  e('construction worker', 'town', 'trades', () => W('construction worker', { top: 'gray', bottom: 'denim', shoes: 'brown', acc: [hat('hard'), wear('vest', 'orange'), bands('silver', [0.35, 0.6]), wear('tool belt'), boots('brown'), held('shovel')] })),
  e('corporal', 'town', 'military', () => W('corporal', { top: 'olive', long: true, bottom: 'olive', shoes: 'black', acc: [hat('military'), X((d) => [1, -1].flatMap((s) => [0, 1].map((i) => [`arm${s > 0 ? 'L' : 'R'}`, 'box', [d.aw * 0.3, d.aw * 0.18, d.aw * 0.9], [s * d.aw * 0.5, -d.upper * (0.3 + i * 0.14), 0], 'gold', { srot: [0, 0, s * 6] }] as XP))), wear('belt', 'black'), wear('backpack', 'olive'), held('blaster', 'darkgreen')] })),
  e('cowboy', 'town', 'western', () => W('cowboy', { top: 'red', long: true, bottom: 'denim', shoes: 'brown', acc: [hat('cowboy'), wear('vest', 'brown'), wear('scarf', 'yellow'), wear('belt', 'darkbrown'), boots('brown'), coil('tan')] })),
  e('cowgirl', 'town', 'western', () => W('cowgirl', { top: 'pink', skirt: 'brown', legs: 'brown', shoes: 'brown', hair: 'gold', style: 'pigtails', acc: [hat('cowboy', 'tan'), wear('vest', '#c8955a'), wear('scarf', 'red'), coil('tan', 'R')] })),
  e('crash test dummy', 'tech', 'robots', () => W('crash test dummy', { skin: 'yellow', eyes: '#1d1d1d', style: 'none', top: 'yellow', long: true, bottom: 'yellow', shoes: 'black', acc: [X((d) => [1, -1].flatMap((s) => [['head', 'cyl', [d.headW * 0.36, d.headW * 0.06, d.headW * 0.36], [s * d.headW * 0.48, d.headY, 0], 'black', { srot: [0, 0, 90] }], ['head', 'box', [d.headW * 0.08, d.headW * 0.18, d.headW * 0.18], [s * d.headW * 0.52, d.headY + d.headW * 0.09, d.headW * 0.09], 'yellow']] as XP[])), patch('black', 0.25, 0.2, 0.7), wear('belt', 'black'), wristbands('black')] })),
  e('crossing guard', 'town', 'law and order', () => W('crossing guard', { top: 'darkgray', long: true, bottom: 'navy', shoes: 'black', acc: [hat('cap', 'navy'), wear('vest', 'yellow'), bands('silver', [0.4]), wear('whistle'), poleSign('STOP', 'red', 'R', true)] })),
  e('crusader', 'town', 'warriors', () => W('crusader', { top: 'gray', long: true, bottom: 'gray', shoes: 'gray', acc: [tabard('white', 'red'), greathelm('steel'), wear('belt', 'brown'), held('sword'), crossShield()] })),
  e('cupid', 'fantasy', 'myths', () => W('cupid', { h: 'kid', build: 1.2, skin: 'skin1', hair: 'gold', style: 'short', top: 'skin1', bottom: 'white', legs: 'skin1', shoes: 'skin1', blush: 'pink', acc: [body('angelwings'), held('bow', 'gold', 'L'), inHand('R', (a) => [['capsule', [a * 0.2, a * 5, a * 0.2], [0, a * 0.5, a * 0.8], 'wood', { srot: [0, 0, 70] }], ['ball', [a * 0.7, a * 0.7, a * 0.5], [-a * 2.5, a * 1.4, a * 0.8], 'red'], ['ball', [a * 0.7, a * 0.7, a * 0.5], [-a * 2.6, a * 1.0, a * 0.8], 'red']])] })),
  e('cyclist', 'sports', 'athletes', () => W('cyclist', { skin: 'skin2', top: 'yellow', bottom: 'black', legs: 'skin2', shoes: 'white', acc: [hat('helmet', 'red'), face('sunglasses'), beside(() => [
    ['torus', [0.62, 0.62, 0.04], [0.6, 0.31, -0.48], 'black', { srot: [0, 90, 0], tube: 0.12 }], ['torus', [0.62, 0.62, 0.04], [0.6, 0.31, 0.48], 'black', { srot: [0, 90, 0], tube: 0.12 }],
    rodYZ(0.6, 0.31, -0.48, 0.85, -0.18, 0.035, 'blue'), rodYZ(0.6, 0.85, -0.18, 0.33, -0.05, 0.04, 'blue'), rodYZ(0.6, 0.33, -0.05, 0.31, -0.48, 0.035, 'blue'), rodYZ(0.6, 0.85, -0.18, 0.88, 0.35, 0.04, 'blue'), rodYZ(0.6, 0.88, 0.35, 0.33, -0.05, 0.045, 'blue'), rodYZ(0.6, 0.98, 0.33, 0.31, 0.48, 0.035, 'silver'),
    ['box', [0.08, 0.05, 0.24], [0.6, 0.92, -0.2], 'black'], ['capsule', [0.035, 0.4, 0.035], [0.6, 1.0, 0.33], 'black', { srot: [0, 0, 90] }],
  ])] })),
  e('cyclops', 'fantasy', 'monsters', () => W('cyclops', { h: 3.0, build: 1.45, skin: '#b8b06a', eyes: '#b8b06a', style: 'bald', top: '#b8b06a', bottom: '#8a6a3a', legs: '#b8b06a', shoes: '#8a6a3a', acc: [bigEye(), wear('sash', '#8a6a3a'), wear('belt', 'brown'), held('club')] })),
  e('dale', 'town', 'cartoon characters', () => shrink(W('dale', { h: 'kid', skin: '#b5814e', hair: '#8c5a2b', style: 'none', top: 'red', bottom: '#b5814e', shoes: '#b5814e', acc: [X((d) => [1, -1].map((s) => ['head', 'ball', [d.headW * 0.3, d.headW * 0.3, d.headW * 0.12], [s * d.headW * 0.4, d.headY + d.headH * 0.42, 0], '#8c5a2b'] as XP)), nose('red', 0.24), X((d) => [['head', 'box', [d.headW * 0.16, d.headH * 0.12, d.headW * 0.05], [0, d.headY - d.headH * 0.25, d.headD * 0.48], 'white', { layer: 6 }], ['hips', 'capsule', [d.tw * 0.55, d.H * 0.4, d.tw * 0.55], [0, d.H * 0.1, -d.td * 1.0], '#8c5a2b', { srot: [-15, 0, 0], layer: -3 }]]), patch('yellow', 0.12, 0.1, 0.4, 0.2), patch('yellow', 0.12, 0.1, 0.7, -0.25)] }), 0.6)),
  e('dancer', 'town', 'arts', () => W('dancer', { skin: 'skin1', top: 'pink', bottom: 'pink', legs: 'pink', shoes: 'pink', hair: '#3b2a1e', style: 'bun', acc: [wear('tutu', 'pink'), arms(150)] })),
  e('daredevil', 'town', 'entertainment', () => W('daredevil', { top: 'white', long: true, bottom: 'white', shoes: 'white', acc: [hat('helmet', 'white'), bands('blue', [0.5]), bands('red', [0.38]), wear('cape', 'white'), wear('belt', 'gold'), X((d) => [['torso', 'cyl', [d.tw * 0.25, d.td * 0.08, d.tw * 0.25], [0, d.torsoH * 0.75, d.td * 0.55], 'blue', { segs: 5, srot: [90, 0, 0] }]])] })),
  e('dark knight', 'town', 'superheroes', () => W('dark knight', { h: 1.85, build: 1.25, skin: 'skin1', top: '#2a2726', long: true, bottom: '#2a2726', shoes: 'black', style: 'none', acc: [cowl('#1d1d1d'), wear('cape', '#1d1d1d'), wear('armor', '#3a3a3a'), wear('belt', '#5c6166'), X((d) => [['torso', 'wedge', [d.tw * 0.5, d.torsoH * 0.14, d.td * 0.05], [0, d.torsoH * 0.72, d.td * 0.66], '#1d1d1d', { srot: [0, 0, 180], layer: 6 }]]), gloves('#1d1d1d'), boots('#1d1d1d')] })),
  e('deep sea diver', 'town', 'sailors', () => W('deep sea diver', { build: 1.3, top: '#c8b88a', long: true, bottom: '#c8b88a', shoes: 'iron', style: 'none', acc: [divingHelmet(), boots('iron', 1.3), gloves('#5a3a22'), wear('belt', 'iron')] })),
  e('defendant', 'town', 'law and order', () => W('defendant', { top: 'orange', long: true, bottom: 'orange', shoes: 'white', acc: [reach(35, 20), cuffs(), chest('7031', 'white', 0.5, 0.14, 0.82)] })),
  e('delivery man', 'town', 'drivers', () => W('delivery man', { top: '#6b4a2e', bottom: '#6b4a2e', shoes: 'black', acc: [hat('cap', '#6b4a2e'), reach(60, 6), X((d) => [['torso', 'box', [d.tw * 1.3, d.tw * 0.9, d.tw * 0.9], [0, d.torsoH * 0.62, d.td * 0.5 + d.tw * 0.55], '#c8955a', { round: 0.08, layer: 7 }], ['torso', 'box', [d.tw * 1.32, d.tw * 0.1, d.tw * 0.25], [0, d.torsoH * 0.62 + d.tw * 0.42, d.td * 0.5 + d.tw * 0.55], '#e8d29a', { layer: 8 }]])] })),
  e('dentist', 'town', 'medical', () => W('dentist', { top: 'white', bottom: 'skyblue', shoes: 'white', acc: [wear('labcoat'), face('mask', 'skyblue'), headMirror(), toothH(), inHand('R', (a) => [['capsule', [a * 0.3, a * 3, a * 0.3], [0, a * 0.6, a * 1.0], 'cyan', { srot: [30, 0, 0] }], ['box', [a * 0.5, a * 0.6, a * 0.8], [0, a * 1.9, a * 1.8], 'white']])] })),
  e('detective', 'town', 'law and order', () => W('detective', { top: 'tan', long: true, bottom: 'darkbrown', shoes: 'black', acc: [deerstalker('#a08a5a'), wear('cloak', '#a08a5a'), pipe(), held('magnifier', 'gold')] })),
  e('dictator', 'town', 'politics', () => W('dictator', { top: '#8a8f6a', long: true, bottom: '#8a8f6a', shoes: 'black', hair: '#1d1d1d', style: 'short', acc: [hat('police', '#6b6f4a'), face('sunglasses'), face('mustache', '#1d1d1d'), epaul('gold'), wear('sash', 'red'), ...[-0.3, -0.18, -0.06].map((x) => patch('gold', 0.08, 0.06, 0.7, x))] })),
  e('director', 'town', 'media', () => W('director', { top: 'black', bottom: 'tan', shoes: 'black', acc: [hat('beret', 'black'), face('sunglasses'), wear('scarf', 'red'), megaphone(), clapper()] })),
  e('dj', 'music', 'musicians', () => W('dj', { top: 'black', bottom: 'denim', shoes: 'white', acc: [capBack('black'), hat('headphones', 'red'), face('sunglasses'), inHand('R', (a) => [['cyl', [a * 4, a * 0.15, a * 4], [0, a * 0.6, a * 1.4], 'black', { srot: [90, 0, 0] }], ['cyl', [a * 1.2, a * 0.2, a * 1.2], [0, a * 0.6, a * 1.45], 'red', { srot: [90, 0, 0] }]]), beside(() => [['cyl', [0.08, 0.85, 0.08], [0.6, 0.42, 0.1], 'silver'], ['box', [0.55, 0.1, 0.4], [0.6, 0.9, 0.1], 'black'], ['cyl', [0.3, 0.02, 0.3], [0.52, 0.96, 0.1], 'darkgray'], ['ball', [0.05, 0.05, 0.05], [0.8, 0.97, 0.2], 'lime', { glow: true }]])] })),
  e('doctor', 'town', 'medical', () => W('doctor', { top: 'skyblue', bottom: 'navy', shoes: 'black', acc: [wear('labcoat'), wear('stethoscope'), headMirror(), face('glasses'), held('clipboard')] })),
  e('doctor jekyll', 'town', 'storybook', () => W('doctor jekyll', { hair: '#3b2a1e', style: 'short', top: 'white', long: true, bottom: 'black', shoes: 'black', acc: [suitX('#2a2726', 'black', true), tophat('#2a2726'), flask('lime'), held('cane', 'black', 'L')] })),
  e('dog catcher', 'town', 'law and order', () => W('dog catcher', { top: 'tan', bottom: 'olive', shoes: 'black', acc: [hat('cap', 'olive'), wear('badge'), wear('belt', 'black'), held('net')] })),
  e('dog trainer', 'town', 'pets and animals', () => together('dog trainer', [[W('dog trainer', { top: 'red', bottom: 'tan', shoes: 'brown', style: 'ponytail', acc: [hat('cap', 'red'), wear('whistle'), wear('belt', 'brown'), held('leash', 'red', 'L')] }), -0.15], [beast('dog trainer dog', { color: '#c8955a', body: [0.6, 0.3, 0.26], legL: 0.28, legW: 0.08, neckL: 0.12, neckLean: 30, head: [0.22, 0.2, 0.17], snout: { len: 0.1, h: 0.09, w: 0.1 }, ears: 'floppy', earSize: 0.11, earColor: '#8c5a2b', tail: 'long', tailAngle: 40 }), 0.55, 0.2]])),
  e('dolly', 'toys', 'dolls and figures', () => shrink(W('dolly', { h: 'kid', skin: 'skin1', hair: 'gold', style: 'pigtails', top: 'pink', skirt: 'pink', legs: 'white', shoes: 'black', blush: 'red', acc: [hat('bow', 'red'), wear('apron', 'white')] }), 0.3 / 1.35)),
  e('don quixote', 'town', 'storybook', () => W('don quixote', { h: 1.85, build: 0.8, skin: 'skin2', hair: 'gray', style: 'short', top: 'tan', long: true, bottom: 'brown', shoes: 'brown', acc: [wear('armor', '#a08a6a'), X((d) => [['head', 'cyl', [d.headW * 1.15, d.headH * 0.22, d.headD * 1.1], [0, d.headY + d.headH * 0.45, 0], 'brass', { taper: 0.7 }]]), face('beard', 'gray'), face('mustache', 'gray'), held('spear'), held('shield', 'bronze', 'L')] })),
  e('dressmaker', 'town', 'trades', () => W('dressmaker', { top: 'purple', long: true, bottom: 'gray', shoes: 'black', style: 'bun', acc: [wear('scarf', 'yellow'), face('glasses'), held('scissors'), X((d) => [['foreL', 'ball', [d.aw * 1.4, d.aw * 0.9, d.aw * 1.4], [0, -d.lower * 0.6, 0], 'red']]), beside((d) => {
    const k = d.H / 1.7;
    return [['box', [0.34 * k, 0.45 * k, 0.24 * k], [0.62 * k, 1.25 * k, 0], 'cream', { round: 0.6 }], ['cyl', [0.5 * k, 0.5 * k, 0.4 * k], [0.62 * k, 0.85 * k, 0], 'pink', { taper: 0.55 }], ['ball', [0.1 * k, 0.08 * k, 0.1 * k], [0.62 * k, 1.52 * k, 0], 'wood'], ['cyl', [0.04, 0.6 * k, 0.04], [0.62 * k, 0.3 * k, 0], 'darkwood'], ['cyl', [0.3, 0.03, 0.3], [0.62 * k, 0.015, 0], 'darkwood']];
  })] })),
  e('drill sergeant', 'town', 'military', () => W('drill sergeant', { top: 'olive', bottom: 'olive', shoes: 'black', acc: [hat('cowboy', '#6b5a3a'), wear('belt', 'black'), wear('whistle'), held('clipboard', 'wood', 'L'), megaphone('R')] })),
  e('driving instructor', 'town', 'drivers', () => W('driving instructor', { top: 'skyblue', bottom: 'gray', shoes: 'black', acc: [face('glasses'), held('clipboard'), card('L', 'white', 'L', 3, 3)] })),
  e('drummer', 'music', 'musicians', () => W('drummer', { top: 'black', bottom: 'denim', shoes: 'black', style: 'long', acc: [hat('headband', 'red'), held('drumsticks'), held('drumsticks', 'wood', 'L'), beside((d) => {
    const k = d.H / 1.7;
    return [['cyl', [0.42 * k, 0.2 * k, 0.42 * k], [0, 0.72 * k, 0.4 * k], 'red'], ['cyl', [0.43 * k, 0.03 * k, 0.43 * k], [0, 0.835 * k, 0.4 * k], 'white'], ['cyl', [0.03, 0.62 * k, 0.03], [0, 0.31 * k, 0.4 * k], 'silver'], ['cyl', [0.3 * k, 0.02, 0.3 * k], [0, 0.01, 0.4 * k], 'silver']];
  })] })),
  e('dummy (doll)', 'toys', 'dolls and figures', () => shrink(W('dummy (doll)', { h: 'kid', skin: 'skin1', hair: '#3b2a1e', style: 'short', top: 'white', long: true, bottom: 'black', shoes: 'black', blush: 'red', acc: [suitX('red', 'black', true), X((d) => [1, -1].map((s) => ['head', 'box', [d.headW * 0.03, d.headH * 0.22, d.headW * 0.03], [s * d.headW * 0.16, d.headY - d.headH * 0.3, d.headD * 0.47], 'black', { layer: 6, noInk: true }] as XP))] }), 0.62 / 1.35)),
  e('dunce', 'town', 'school', () => W('dunce', { h: 'kid', top: 'gray', bottom: 'denim', shoes: 'brown', style: 'short', acc: [pointyCap('white', 1.3), X((d) => [['head', 'box', [d.headW * 0.3, d.headW * 0.3, d.headW * 0.05], [0, d.headY + d.headH * 0.75, d.headD * 0.3], 'white', { text: 'D', layer: 6, srot: [-10, 0, 0] }]])] })),
  e('dwarf', 'fantasy', 'fairy tale', () => W('dwarf', { h: 1.25, build: 1.35, skin: 'skin1', top: 'red', long: true, bottom: 'brown', shoes: 'darkbrown', hair: 'white', style: 'short', acc: [pointyCap('#3f7a3a'), face('longbeard', 'white'), wear('belt', 'black'), held('pickaxe'), held('lantern', 'flame', 'L')] })),
  e('easter bunny', 'fantasy', 'holiday', () => W('easter bunny', { skin: 'white', eyes: '#1d1d1d', blush: 'pink', style: 'none', top: 'white', long: true, bottom: 'white', shoes: 'white', acc: [hat('bunnyears', 'white'), nose('pink', 0.14), X((d) => [['hips', 'ball', [d.tw * 0.45, d.tw * 0.45, d.tw * 0.45], [0, 0, -d.td * 0.6], 'white'], ['head', 'box', [d.headW * 0.14, d.headH * 0.1, d.headW * 0.04], [0, d.headY - d.headH * 0.2, d.headD * 0.49], 'white', { layer: 7 }]]), wear('vest', '#c9a0dc'), wear('bowtie', 'yellow'), held('basket', 'tan', 'L'), inHand('L', (a) => (['pink', 'cyan', 'yellow'] as const).map((c, i) => ['ball', [a * 0.9, a * 1.15, a * 0.9], [(i - 1) * a * 0.8, -a * 0.8, a * 0.5], c] as HP))] })),
  e('edgar', 'town', 'arts', () => W('edgar', { skin: 'skin1', hair: '#1d1d1d', style: 'short', top: 'white', long: true, bottom: 'black', shoes: 'black', acc: [suitX('black', 'black', true), face('mustache', '#1d1d1d'), raven(), held('book', 'darkred')] })),
  e('edwin', 'town', 'everyday people', () => W('edwin', { top: 'white', long: true, bottom: 'tan', shoes: 'brown', hair: '#a0522d', style: 'short', acc: [wear('vest', 'darkgreen'), wear('bowtie', 'red'), face('glasses', 'black'), held('book', 'navy')] })),
  e('einstein', 'town', 'science', () => W('einstein', { skin: 'skin1', hair: 'white', style: 'short', top: 'gray', long: true, bottom: 'darkgray', shoes: 'black', acc: [mop('white', 1.25), face('mustache', 'white'), held('pointer', 'white'), easelBoard('E=mc²', 0.62)] })),
  e('elf (holiday)', 'fantasy', 'holiday', () => W('elf (holiday)', { h: 'kid', skin: 'skin1', hair: '#a0522d', style: 'short', top: 'green', long: true, bottom: 'red', shoes: 'green', blush: 'red', acc: [hat('santa', 'green'), elfEars('skin1'), collar('red'), wear('belt', 'black'), held('gift', 'red')] })),
  e('empress', 'town', 'royalty', () => W('empress', { skin: 'skin1', hair: '#1d1d1d', style: 'bun', top: 'gold', long: true, skirt: 'darkred', legs: 'darkred', shoes: 'gold', acc: [hat('crown', 'gold'), wear('cloak', 'darkred'), collar('white'), gown('darkred', 0.9), wear('necklace', 'gold'), inHand('R', (a, d) => [['capsule', [a * 0.35, d.H * 0.28, a * 0.35], [0, a * 0.8, a * 0.6], 'gold'], ['ball', [a * 1.1, a * 1.1, a * 1.1], [0, a * 0.8 + d.H * 0.14, a * 0.6], 'red']])] })),
  e('engineer', 'town', 'trades', () => W('engineer', { top: 'skyblue', bottom: 'navy', shoes: 'black', acc: [hat('hard', 'blue'), face('glasses'), patch('white', 0.12, 0.14, 0.72, 0.25), held('wrench'), held('clipboard', 'wood', 'L')] })),
  e('exterminator', 'town', 'trades', () => W('exterminator', { top: 'gray', long: true, bottom: 'gray', shoes: 'black', acc: [hat('cap', 'red'), gasMask(), X((d) => [['torso', 'cyl', [d.tw * 0.55, d.torsoH * 0.75, d.tw * 0.55], [0, d.torsoH * 0.5, -d.td * 0.95], 'yellow', { layer: -3 }], ['torso', 'ball', [d.tw * 0.55, d.tw * 0.3, d.tw * 0.55], [0, d.torsoH * 0.88, -d.td * 0.95], 'yellow', { layer: -3 }]]), inHand('R', (a) => [['capsule', [a * 0.3, a * 6, a * 0.3], [0, -a * 0.4, a * 2.6], 'black', { srot: [80, 0, 0] }], ['cyl', [a * 0.6, a * 0.8, a * 0.6], [0, -a * 0.1, a * 5.6], 'silver', { srot: [80, 0, 0] }]])] })),
  e('fairy', 'fantasy', 'fairy tale', () => shrink(W('fairy', { h: 'kid', skin: 'skin1', hair: 'gold', style: 'bun', top: 'pink', skirt: 'pink', legs: 'skin1', shoes: 'pink', acc: [body('fairywings'), hat('flower', 'pink'), held('wand')] }), 0.22 / 1.35)),
  e('fairy godmother', 'fantasy', 'fairy tale', () => W('fairy godmother', { h: 1.6, build: 1.25, skin: 'skin1', hair: 'white', style: 'bun', top: 'skyblue', long: true, skirt: 'skyblue', legs: 'skyblue', shoes: 'skyblue', acc: [hat('hood', 'blue'), wear('cloak', 'blue'), wear('bowtie', 'pink'), held('wand')] })),
  e('farmer', 'town', 'farming', () => W('farmer', { top: 'red', long: true, bottom: 'denim', shoes: 'brown', acc: [hat('straw'), bands('darkred', [0.3, 0.6, 0.85]), wear('overalls', 'denim'), X((d) => [['head', 'capsule', [d.headW * 0.04, d.headW * 0.4, d.headW * 0.04], [d.headW * 0.2, d.headY - d.headH * 0.22, d.headD * 0.55], '#e8cf7a', { srot: [0, 0, 70], layer: 6 }]]), held('pitchfork')] })),
  e('father', 'town', 'family', () => W('father', { top: 'navy', bottom: 'tan', shoes: 'brown', hair: 'darkbrown', style: 'short', acc: [face('mustache', 'darkbrown'), wear('apron', 'red'), chest('DAD', 'white', 0.4, 0.14, 0.45), held('spatula', 'silver')] })),
  e('father time', 'fantasy', 'myths', () => W('father time', { h: 1.9, skin: 'skin1', hair: 'white', style: 'bald', top: '#c9ccd1', long: true, skirt: '#c9ccd1', legs: '#c9ccd1', shoes: 'tan', acc: [wear('robe', '#c9ccd1'), face('longbeard', 'white'), wear('belt', 'gold'), scythe(), hourglass()] })),
  e('fencer', 'sports', 'athletes', () => W('fencer', { top: 'white', long: true, bottom: 'white', legs: 'white', shoes: 'white', acc: [fencingMask(), gloves('white'), inHand('R', (a, d) => [['capsule', [a * 0.12, d.H * 0.5, a * 0.12], [0, -a * 0.6, d.H * 0.26], 'silver', { srot: [90, 0, 0] }], ['cyl', [a * 1.6, a * 0.5, a * 1.6], [0, -a * 0.6, a * 0.9], 'silver', { srot: [90, 0, 0], taper: 0.6 }]])] })),
  e('fighter pilot', 'town', 'military', () => W('fighter pilot', { top: 'olive', long: true, bottom: 'olive', shoes: 'black', acc: [hat('helmet', 'white'), X((d) => [['head', 'ball', [d.headW * 0.95, d.headH * 0.3, d.headD * 0.35], [0, d.headY + d.headH * 0.08, d.headD * 0.4], '#2b3f66', { layer: 6 }]]), face('mask', 'olive'), wear('vest', '#5a5f2a'), patch('red', 0.12, 0.1, 0.8, 0.3), gloves('#5a3a22')] })),
  e('figure skater', 'sports', 'athletes', () => W('figure skater', { skin: 'skin1', top: 'purple', long: true, skirt: 'purple', legs: 'peach', shoes: 'white', hair: '#3b2a1e', style: 'bun', acc: [lift(0.03), X((d) => [1, -1].map((s) => [`foot${s > 0 ? 'L' : 'R'}`, 'box', [d.lw * 0.15, d.H * 0.025, d.lw * 2.2], [0, -d.H * 0.045 - d.H * 0.012, d.lw * 0.32], 'silver', { round: 0.3 }] as XP)), patch('white', 0.1, 0.07, 0.7, 0.2), patch('white', 0.1, 0.07, 0.5, -0.2), arms(75)] })),
  e('fireman', 'town', 'law and order', () => W('fireman', { top: '#c8a24a', long: true, bottom: '#c8a24a', shoes: 'black', acc: [fireHelmet(), bands('yellow', [0.3, 0.55]), boots('black'), gloves('#5a3a22'), wear('backpack', 'silver'), held('axe')] })),
  e('first lady', 'town', 'politics', () => W('first lady', { skin: 'skin1', top: 'pink', long: true, skirt: 'pink', legs: 'skin1', shoes: 'pink', hair: '#3b2a1e', style: 'short', acc: [mop('#3b2a1e', 0.85), pillbox('pink'), wear('necklace', 'white'), buttons('pink', 3), gloves('white', 0.8), held('bag', 'pink', 'L')] })),
  e('fisherman', 'town', 'sailors', () => W('fisherman', { top: 'yellow', long: true, bottom: 'yellow', shoes: 'black', acc: [bucket('yellow'), face('beard', 'gray'), pipe(), boots('black'), held('net'), fishH('silver')] })),
  e('flamenco dancer', 'town', 'arts', () => W('flamenco dancer', { skin: 'skin2', top: 'red', long: true, skirt: 'red', legs: 'red', shoes: 'black', hair: '#1d1d1d', style: 'bun', acc: [hat('flower', 'red'), gown('red', 0.95), X((d) => [0.55, 0.8].map((k) => ['hips', 'torus', [d.tw * 2.0 * (0.6 + k * 0.5), d.td * 2.6 * (0.6 + k * 0.5), d.legLen * 0.1], [0, -d.legLen * k, 0], k > 0.7 ? 'black' : 'white', { srot: [90, 0, 0], tube: 0.25, layer: 3 }] as XP)), arms(130, 30), inHand('R', (a) => [['ball', [a * 3.6, a * 2.4, a * 0.2], [0, a * 1.0, a * 1.2], 'black']])] })),
  e('flash', 'town', 'superheroes', () => W('flash', { skin: 'skin1', style: 'none', top: 'red', long: true, bottom: 'red', shoes: 'yellow', acc: [cowl('red', false), X((d) => [1, -1].map((s) => ['head', 'wedge', [d.headW * 0.35, d.headH * 0.22, d.headW * 0.06], [s * d.headW * 0.56, d.headY + d.headH * 0.1, 0], 'yellow', { srot: [0, s * 90, s * 60] }] as XP)), patch('white', 0.36, 0.28, 0.7), X((d) => [['torso', 'box', [d.tw * 0.06, d.torsoH * 0.24, d.td * 0.06], [0, d.torsoH * 0.7, d.td * 0.6], 'yellow', { srot: [0, 0, 30], layer: 6 }]]), wear('belt', 'yellow'), boots('yellow')] })),
  e('flight attendant', 'town', 'travel', () => W('flight attendant', { skin: 'skin1', top: 'navy', long: true, skirt: 'navy', legs: 'skin1', shoes: 'navy', hair: '#a0522d', style: 'bun', acc: [pillbox('navy'), wear('scarf', 'red'), wear('badge', 'gold'), trayCups('R'), inHand('L', (a) => [['capsule', [a * 0.25, a * 4, a * 0.25], [0, -a * 1.0, a * 0.5], 'silver'], ['box', [a * 3, a * 4, a * 1.6], [0, -a * 4.6, a * 0.8], 'red', { round: 0.2 }]])] })),
  e('florist', 'town', 'shops', () => W('florist', { top: 'white', bottom: 'tan', shoes: 'brown', style: 'ponytail', acc: [wear('apron', 'darkgreen'), held('bouquet'), potplant('L', 'red')] })),
  e('flower girl', 'town', 'wedding', () => W('flower girl', { h: 'kid', skin: 'skin1', hair: 'gold', style: 'long', top: 'white', skirt: 'white', legs: 'white', shoes: 'white', acc: [flowerCrown(), wear('sash', 'pink'), held('basket', 'tan'), inHand('R', (a) => [0, 1, 2].map((i) => ['ball', [a * 0.7, a * 0.4, a * 0.7], [(i - 1) * a * 0.8, -a * 0.9, a * 0.5], 'pink'] as HP))] })),
  e('food service worker', 'town', 'food service', () => W('food service worker', { top: 'white', long: true, bottom: 'black', shoes: 'black', style: 'short', acc: [wear('vest', 'black'), wear('bowtie', 'black'), X((d) => [['foreR', 'box', [d.aw * 1.3, d.lower * 0.6, d.aw * 0.4], [0, -d.lower * 0.45, d.aw * 0.55], 'white']]), trayCups('L')] })),
];
