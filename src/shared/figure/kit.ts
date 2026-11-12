/**
 * Parametric builders. A person is one function of a dozen choices (height, skin, hair style, clothes, extras),
 * an animal is one function of proportions, ears, tail and markings. The long tail of the vocabulary is meant to
 * be mostly parameters of a few kits like these, plus a hand-written part list where nothing fits.
 */
import type { FaceSpec, FigPart, Figure, Rig, Vec3 } from './types';
import { measure } from './math';

export class Parts {
  readonly list: FigPart[] = [];
  add(p: FigPart): this {
    this.list.push(p);
    return this;
  }
  /** Same part on both sides of the figure (x mirrored), names suffixed L (+x) and R (-x). Rotations about y and z
   *  flip with the mirror. `parentSided` appends the suffix to the parent too. */
  pair(p: FigPart, parentSided = false): this {
    for (const [s, k] of [['L', 1], ['R', -1]] as const) {
      this.list.push({
        ...p,
        name: p.name + s,
        parent: p.parent ? p.parent + (parentSided ? s : '') : undefined,
        at: [p.at[0] * k, p.at[1], p.at[2]],
        rot: p.rot ? [p.rot[0], p.rot[1] * k, p.rot[2] * k] : undefined,
        off: p.off ? [p.off[0] * k, p.off[1], p.off[2]] : undefined,
        srot: p.srot ? [p.srot[0], p.srot[1] * k, p.srot[2] * k] : undefined,
      });
    }
    return this;
  }
}

export function figure(key: string, group: Figure['group'], rig: Rig, view: Figure['view'], parts: Parts, face?: FaceSpec): Figure {
  return measure({ key, group, rig, view, parts: parts.list, face });
}

/* ----------------------------------------------------------------------------------------------------------- */
/* people                                                                                                       */
/* ----------------------------------------------------------------------------------------------------------- */

export type HairStyle = 'short' | 'long' | 'ponytail' | 'pigtails' | 'bun' | 'bald' | 'spiky' | 'none';

export interface PersonOpts {
  height: number;
  skin: string;
  hair: string;
  hairStyle: HairStyle;
  shirt: string;
  pants: string;
  shoes: string;
  eyes?: string;
  /** Skirt or dress colour; adds a flared skirt over the legs. */
  skirt?: string;
  /** Shin colour (skin or stockings under a skirt); defaults to the trousers. */
  legs?: string;
  /** Sleeves to the wrist. */
  longSleeves?: boolean;
  /** Head size relative to an adult's (children have bigger heads). */
  headScale?: number;
  /** Shoulder width multiplier. */
  build?: number;
  blush?: string;
  beard?: string;
  glasses?: string;
  /** Extra parts: hats, belts, tools. Gets the dimensions to attach things. */
  extras?: (p: Parts, d: PersonDims) => void;
}

export interface PersonDims {
  H: number;
  headH: number;
  headW: number;
  headD: number;
  /** Head solid centre above the head joint. */
  headY: number;
  torsoH: number;
  tw: number;
  td: number;
  aw: number;
  upper: number;
  lower: number;
  lw: number;
  legLen: number;
}

/** A person, about three and a half heads tall like a paper craft doll. Joint names: hips, torso, head, armL/R,
 *  foreL/R, handL/R, legL/R, shinL/R, footL/R. */
export function person(key: string, o: PersonOpts): Figure {
  const H = o.height;
  const kid = o.headScale ?? 1;
  const headH = H * 0.235 * kid;
  const headW = headH * 0.93;
  const headD = headH * 0.9;
  const legLen = H * 0.37 * (kid > 1 ? 0.92 : 1);
  const torsoH = H - legLen - headH * 0.96;
  const b = o.build ?? 1;
  const tw = H * 0.2 * b;
  const td = tw * 0.62;
  const aw = H * 0.058 * b;
  const upper = H * 0.16;
  const lower = H * 0.135;
  const lw = tw * 0.4;
  const foot = H * 0.045;
  const thigh = (legLen - foot) / 2;
  const headY = headH * 0.47;
  const d: PersonDims = { H, headH, headW, headD, headY, torsoH, tw, td, aw, upper, lower, lw, legLen };
  const p = new Parts();
  const sleeve = o.longSleeves ? o.shirt : o.skin;

  p.add({ name: 'hips', at: [0, legLen, 0], shape: 'box', size: [tw * 0.96, lw * 1.1, td * 0.95], round: 0.6, color: o.pants });
  p.add({ name: 'torso', parent: 'hips', at: [0, 0, 0], shape: 'box', size: [tw, torsoH, td], off: [0, torsoH / 2, 0], round: 0.55, taper: 1, color: o.shirt });
  p.add({ name: 'head', parent: 'torso', at: [0, torsoH, 0], shape: 'ball', size: [headW, headH, headD], off: [0, headY, 0], color: o.skin, role: 'head' });
  p.add({ name: 'face', parent: 'head', at: [0, 0, 0], shape: 'ball', size: [headW, headH, headD], off: [0, headY, 0.002], color: o.skin, role: 'face', only: 'paper', side: 'front', layer: 3, noInk: true });
  p.pair({ name: 'ear', parent: 'head', at: [headW * 0.47, headY - headH * 0.04, -headD * 0.02], shape: 'ball', size: [headW * 0.16, headH * 0.22, headD * 0.14], color: o.skin, layer: -1 });

  // hair: a cap over the back of the head (it frames the face from the front and is the whole head from behind)
  // plus bangs on top; styles add tails and buns
  const hs = o.hairStyle;
  if (hs !== 'bald' && hs !== 'none') {
    p.add({ name: 'hairBack', parent: 'head', at: [0, 0, 0], shape: 'ball', size: [headW * 1.08, headH * 1.05, headD * 0.98], off: [0, headY + headH * 0.04, -headD * 0.07], color: o.hair, layer: -1 });
    p.add({ name: 'bangs', parent: 'head', at: [0, 0, 0], shape: 'ball', size: [headW * 1.05, headH * (hs === 'spiky' ? 0.62 : 0.52), headD * 1.0], off: [0, headY + headH * 0.29, headD * 0.02], color: o.hair, layer: 2, noInk: true });
  }
  if (hs === 'spiky')
    for (const [x, rz] of [[-0.28, 28], [0, 0], [0.28, -28]] as const)
      p.add({ name: `spike${x}`, parent: 'head', at: [headW * x, headY + headH * 0.42, 0], rot: [0, 0, rz], shape: 'cyl', taper: 0, segs: 4, size: [headW * 0.3, headH * 0.32, headD * 0.3], off: [0, headH * 0.12, 0], color: o.hair, layer: 1 });
  if (hs === 'long')
    p.add({ name: 'hairLong', parent: 'head', at: [0, 0, 0], shape: 'capsule', size: [headW * 1.06, headH * 1.55, headD * 0.6], off: [0, headY - headH * 0.32, -headD * 0.24], color: o.hair, layer: -2 });
  if (hs === 'ponytail')
    p.add({ name: 'tail', parent: 'head', at: [0, headY + headH * 0.2, -headD * 0.45], rot: [-35, 0, 0], shape: 'capsule', size: [headW * 0.34, headH * 0.8, headW * 0.34], off: [0, -headH * 0.38, 0], color: o.hair, layer: -2 });
  if (hs === 'pigtails')
    p.pair({ name: 'pigtail', parent: 'head', at: [headW * 0.52, headY + headH * 0.05, -headD * 0.1], rot: [0, 0, 25], shape: 'capsule', size: [headW * 0.28, headH * 0.62, headW * 0.28], off: [0, -headH * 0.26, 0], color: o.hair, layer: -1 });
  if (hs === 'bun') p.add({ name: 'bun', parent: 'head', at: [0, headY + headH * 0.5, -headD * 0.18], shape: 'ball', size: [headW * 0.42, headH * 0.38, headW * 0.42], color: o.hair, layer: -1 });

  // arms: sleeve, forearm, hand. Shoulders sit just inside the torso's top corners.
  p.pair({ name: 'arm', parent: 'torso', at: [tw / 2 + aw * 0.32, torsoH - aw * 0.55, 0], rot: [0, 0, 6], shape: 'capsule', size: [aw * 1.08, upper, aw * 1.08], off: [0, -upper / 2 + aw * 0.3, 0], color: o.shirt, layer: 1 });
  p.pair({ name: 'fore', parent: 'arm', at: [0, -upper + aw * 0.55, 0], shape: 'capsule', size: [aw * 0.92, lower, aw * 0.92], off: [0, -lower / 2 + aw * 0.3, 0], color: sleeve, layer: 1 }, true);
  p.pair({ name: 'hand', parent: 'fore', at: [0, -lower + aw * 0.5, 0], shape: 'ball', size: [aw * 1.25, aw * 1.3, aw * 1.0], off: [0, -aw * 0.25, 0], color: o.skin, layer: 1 }, true);

  // legs: thigh, shin, shoe (toes forward)
  p.pair({ name: 'leg', parent: 'hips', at: [tw * 0.24, 0, 0], shape: 'capsule', size: [lw, thigh + lw * 0.5, lw], off: [0, -thigh / 2, 0], color: o.pants });
  p.pair({ name: 'shin', parent: 'leg', at: [0, -thigh, 0], shape: 'capsule', size: [lw * 0.9, thigh + lw * 0.4, lw * 0.9], off: [0, -thigh / 2, 0], color: o.legs ?? o.pants }, true);
  p.pair({ name: 'foot', parent: 'shin', at: [0, -thigh, 0], shape: 'box', size: [lw * 1.12, foot, lw * 1.75], off: [0, -foot / 2, lw * 0.32], round: 0.8, color: o.shoes, layer: 1 }, true);
  if (o.skirt) p.add({ name: 'skirt', parent: 'hips', at: [0, lw * 0.4, 0], shape: 'cyl', taper: 0.55, size: [tw * 1.55, legLen * 0.52, td * 1.7], off: [0, -legLen * 0.24, 0], color: o.skirt, layer: 1 });

  o.extras?.(p, d);
  return figure(key, 'people', 'biped', 'front', p, { skin: o.skin, eyes: o.eyes ?? '#2b2118', brow: o.hairStyle === 'bald' ? shadeHex(o.skin, 0.6) : o.hair, blush: o.blush ?? '#f19a8f', mouth: '#7a2e2e', beard: o.beard, glasses: o.glasses });
}

/* ----------------------------------------------------------------------------------------------------------- */
/* four legs                                                                                                    */
/* ----------------------------------------------------------------------------------------------------------- */

export interface QuadOpts {
  color: string;
  /** Body: length (z), height, width. */
  body: Vec3;
  bodyShape?: 'capsule' | 'ball' | 'box';
  legL: number;
  legW: number;
  /** Lower leg / hoof colour. */
  hoof?: string;
  hoofH?: number;
  neckL: number;
  /** Degrees the neck leans forward from vertical. */
  neckLean: number;
  neckW?: number;
  head: Vec3;
  /** Muzzle: length forward, height, width, colour. */
  snout?: { len: number; h: number; w: number; color?: string; shape?: 'ball' | 'box' | 'cyl' };
  nose?: string;
  ears: 'floppy' | 'pointy' | 'long' | 'side';
  earSize: number;
  earColor?: string;
  tail: 'long' | 'curl' | 'tuft' | 'stub' | 'fluffy';
  tailColor?: string;
  belly?: string;
  /** Tail angle from straight back-up: 0 points up, 90 straight back, 150 hangs down. */
  tailAngle?: number;
  legColor?: string;
  headColor?: string;
  /** Extra parts: spots, manes, horns, wool. */
  extras?: (p: Parts, d: { body: Vec3; head: Vec3 }) => void;
}

/** An animal on four legs, body along z, head forward. Joint names: body, neck, head, legFL/FR/BL/BR, tail, earL/R. */
export function quadruped(key: string, o: QuadOpts): Figure {
  const [L, Hb, W] = o.body;
  const p = new Parts();
  const shape = o.bodyShape ?? 'capsule';
  const bodySize: Vec3 = shape === 'capsule' ? [W, L, Hb] : [W, Hb, L];
  p.add({ name: 'body', at: [0, o.legL + Hb * 0.42, 0], shape, size: bodySize, srot: shape === 'capsule' ? [90, 0, 0] : undefined, round: 0.75, color: o.color });
  if (o.belly) p.add({ name: 'belly', parent: 'body', at: [0, -Hb * 0.16, 0], shape: 'ball', size: [W * 0.86, Hb * 0.7, L * 0.78], color: o.belly, layer: -1, noInk: true });
  // legs: front pair forward, back pair back; each a rod with a hoof or paw
  const hoofH = o.hoofH ?? o.legW * 0.7;
  for (const [n, z] of [['F', L * 0.31], ['B', -L * 0.31]] as const)
    for (const [s, k] of [['L', 1], ['R', -1]] as const) {
      const name = `leg${n}${s}`;
      const len = o.legL + Hb * 0.3;
      p.add({ name, parent: 'body', at: [k * W * 0.27, -Hb * 0.12, z], shape: 'capsule', size: [o.legW, len, o.legW], off: [0, -len / 2, 0], color: o.legColor ?? o.color, layer: k < 0 ? -2 : 1 });
      p.add({ name: `paw${n}${s}`, parent: name, at: [0, -len + hoofH * 0.5, 0], shape: o.hoof ? 'cyl' : 'ball', size: [o.legW * 1.12, hoofH, o.legW * 1.25], off: [0, 0, o.hoof ? 0 : o.legW * 0.2], color: o.hoof ?? o.legColor ?? o.color, layer: k < 0 ? -2 : 1 });
    }
  // neck up and forward from the chest; the head counter-rotates to stay level
  const nw = o.neckW ?? Math.min(W, Hb) * 0.55;
  p.add({ name: 'neck', parent: 'body', at: [0, Hb * 0.12, L * 0.4], rot: [o.neckLean, 0, 0], shape: 'capsule', size: [nw, o.neckL + nw, nw], off: [0, o.neckL / 2, 0], color: o.headColor ?? o.color, layer: 1 });
  const [hl, hh, hw] = o.head;
  const hc = o.headColor ?? o.color;
  p.add({ name: 'head', parent: 'neck', at: [0, o.neckL, 0], rot: [-o.neckLean, 0, 0], shape: 'ball', size: [hw, hh, hl], off: [0, hh * 0.15, hl * 0.12], color: hc, layer: 2 });
  if (o.snout) {
    const s = o.snout;
    p.add({ name: 'snout', parent: 'head', at: [0, 0, 0], shape: s.shape ?? 'ball', size: s.shape === 'cyl' ? [s.w, s.len, s.h] : [s.w, s.h, s.len], off: [0, -hh * 0.12, hl * 0.35 + s.len * 0.3], round: 0.8, taper: 1, srot: s.shape === 'cyl' ? [90, 0, 0] : undefined, color: s.color ?? hc, layer: 3 });
    p.add({ name: 'nose', parent: 'head', at: [0, 0, 0], shape: 'ball', size: [s.w * 0.45, s.h * 0.38, s.len * 0.2], off: [0, -hh * 0.12 + s.h * 0.22, hl * 0.35 + s.len * 0.78], color: o.nose ?? '#2b2420', layer: 4, noInk: true });
  }
  // eyes on the sides of the head, a little forward; a white glint so they read at a distance
  p.pair({ name: 'eye', parent: 'head', at: [hw * 0.36, hh * 0.28, hl * 0.3], shape: 'ball', size: [hw * 0.2, hh * 0.24, hl * 0.17], color: '#1d1a17', role: 'eye', layer: 4, noInk: true });
  p.pair({ name: 'glint', parent: 'eye', at: [hw * 0.04, hh * 0.05, hl * 0.04], shape: 'ball', size: [hw * 0.07, hh * 0.08, hl * 0.05], color: '#ffffff', role: 'eye', layer: 5, noInk: true }, true);
  const ec = o.earColor ?? hc;
  const es = o.earSize;
  if (o.ears === 'pointy') p.pair({ name: 'ear', parent: 'head', at: [hw * 0.3, hh * 0.45, -hl * 0.05], rot: [0, 0, -12], shape: 'cyl', taper: 0, segs: 3, size: [es * 0.8, es, es * 0.35], off: [0, es * 0.4, 0], color: ec, layer: 1 });
  if (o.ears === 'floppy') p.pair({ name: 'ear', parent: 'head', at: [hw * 0.42, hh * 0.35, -hl * 0.08], rot: [0, 0, 18], shape: 'ball', size: [es * 0.4, es, es * 0.6], off: [0, -es * 0.4, 0], color: ec, layer: 3 });
  if (o.ears === 'long') p.pair({ name: 'ear', parent: 'head', at: [hw * 0.25, hh * 0.45, -hl * 0.12], rot: [-10, 0, -10], shape: 'ball', size: [es * 0.38, es, es * 0.32], off: [0, es * 0.42, 0], color: ec, layer: 1 });
  if (o.ears === 'side') p.pair({ name: 'ear', parent: 'head', at: [hw * 0.45, hh * 0.25, -hl * 0.1], rot: [0, 0, -70], shape: 'ball', size: [es * 0.45, es, es * 0.25], off: [0, es * 0.42, 0], color: ec, layer: 3 });
  // tail from the rump
  const tc = o.tailColor ?? o.color;
  const tailAt: Vec3 = [0, Hb * 0.25, -L * 0.48];
  const ta = -(o.tailAngle ?? { long: 150, tuft: 165, curl: 60, stub: 110, fluffy: 50 }[o.tail]);
  if (o.tail === 'long') p.add({ name: 'tail', parent: 'body', at: tailAt, rot: [ta, 0, 0], shape: 'capsule', size: [W * 0.13, L * 0.55, W * 0.13], off: [0, L * 0.25, 0], color: tc, layer: -1 });
  if (o.tail === 'tuft') {
    p.add({ name: 'tail', parent: 'body', at: tailAt, rot: [ta, 0, 0], shape: 'capsule', size: [W * 0.07, L * 0.5, W * 0.07], off: [0, L * 0.25, 0], color: tc, layer: -1 });
    p.add({ name: 'tailTuft', parent: 'tail', at: [0, L * 0.5, 0], shape: 'ball', size: [W * 0.15, L * 0.18, W * 0.15], color: o.tailColor ?? '#3a2a20', layer: -1 });
  }
  if (o.tail === 'curl') p.add({ name: 'tail', parent: 'body', at: tailAt, rot: [ta, 0, 0], shape: 'torus', tube: 0.3, size: [W * 0.3, W * 0.3, W * 0.08], srot: [0, 90, 0], off: [0, W * 0.13, 0], color: tc, layer: -1 });
  if (o.tail === 'stub') p.add({ name: 'tail', parent: 'body', at: tailAt, rot: [ta, 0, 0], shape: 'ball', size: [W * 0.3, W * 0.36, W * 0.3], off: [0, W * 0.08, 0], color: tc, layer: -1 });
  if (o.tail === 'fluffy') p.add({ name: 'tail', parent: 'body', at: tailAt, rot: [ta, 0, 0], shape: 'capsule', size: [W * 0.3, L * 0.48, W * 0.3], off: [0, L * 0.22, 0], color: tc, layer: -1 });
  o.extras?.(p, { body: o.body, head: o.head });
  return figure(key, 'animals', 'quad', 'side', p);
}

/* ----------------------------------------------------------------------------------------------------------- */
/* birds                                                                                                        */
/* ----------------------------------------------------------------------------------------------------------- */

export interface BirdOpts {
  height: number;
  color: string;
  wing: string;
  beak: string;
  legs: string;
  comb?: string;
  tail?: string[];
}

/** A plump bird standing on two legs. Joints: body, head, wingL/R, legL/R, tail. */
export function bird(key: string, o: BirdOpts): Figure {
  const H = o.height;
  const p = new Parts();
  const legL = H * 0.28;
  const bw = H * 0.42;
  const bh = H * 0.42;
  const bl = H * 0.52;
  p.add({ name: 'body', at: [0, legL + bh * 0.42, 0], rot: [-12, 0, 0], shape: 'ball', size: [bw, bh, bl], color: o.color });
  p.add({ name: 'head', parent: 'body', at: [0, bh * 0.38, bl * 0.34], rot: [12, 0, 0], shape: 'ball', size: [H * 0.24, H * 0.26, H * 0.26], off: [0, H * 0.12, 0], color: o.color, layer: 2 });
  p.add({ name: 'beak', parent: 'head', at: [0, H * 0.11, H * 0.12], rot: [90, 0, 0], shape: 'cyl', taper: 0, segs: 4, size: [H * 0.09, H * 0.12, H * 0.07], off: [0, H * 0.05, 0], color: o.beak, layer: 3 });
  if (o.comb) {
    for (const [i, z] of [[0, 0.06], [1, -0.02], [2, -0.1]] as const) p.add({ name: `comb${i}`, parent: 'head', at: [0, H * 0.24, H * z], shape: 'ball', size: [H * 0.05, H * 0.1, H * 0.07], color: o.comb, layer: 1 });
    p.add({ name: 'wattle', parent: 'head', at: [0, H * 0.02, H * 0.12], shape: 'ball', size: [H * 0.05, H * 0.1, H * 0.06], color: o.comb, layer: 3 });
  }
  p.pair({ name: 'eye', parent: 'head', at: [H * 0.09, H * 0.16, H * 0.06], shape: 'ball', size: [H * 0.045, H * 0.055, H * 0.04], color: '#1d1a17', role: 'eye', layer: 4, noInk: true });
  p.pair({ name: 'wing', parent: 'body', at: [bw * 0.44, bh * 0.15, 0], rot: [8, 0, 4], shape: 'ball', size: [bw * 0.2, bh * 0.62, bl * 0.72], off: [0, -bh * 0.08, -bl * 0.05], color: o.wing, layer: 3 });
  p.add({ name: 'tail', parent: 'body', at: [0, bh * 0.1, -bl * 0.42], rot: [-35, 0, 0], shape: 'ball', size: [bw * 0.3, bh * 0.3, bl * 0.2], color: o.color, layer: -1 });
  (o.tail ?? [o.color]).forEach((c, i, a) => {
    const spread = a.length > 1 ? (i / (a.length - 1) - 0.5) * 50 : 0;
    p.add({ name: `feather${i}`, parent: 'tail', at: [0, 0, 0], rot: [spread, 0, 0], shape: 'capsule', size: [bw * 0.16, H * 0.4, bw * 0.3], off: [0, H * 0.2, 0], color: c, layer: -1 - i });
  });
  p.pair({ name: 'leg', parent: 'body', at: [bw * 0.18, -bh * 0.35, 0], rot: [12, 0, 0], shape: 'capsule', size: [H * 0.04, legL + H * 0.06, H * 0.04], off: [0, -legL / 2, 0], color: o.legs, layer: -1 });
  p.pair({ name: 'toes', parent: 'leg', at: [0, -legL, 0], shape: 'box', size: [H * 0.08, H * 0.025, H * 0.13], off: [0, 0, H * 0.04], round: 0.9, color: o.legs, layer: -1 }, true);
  return figure(key, 'animals', 'bird', 'side', p);
}

export function shadeHex(hex: string, k: number): string {
  const n = parseInt(hex.slice(1), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.max(0, Math.min(255, Math.round(v * k))));
  return `#${c.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}
