/**
 * Kits for the rest of the animal kingdom: fish, bugs and snakes. Like the quadruped and bird kits, each is a
 * handful of choices; extra parts can be added by name afterwards.
 */
import type { Figure, Vec3 } from './types';
import { Parts, figure } from './kit';
import { col } from './colors';

export interface FishOpts {
  /** Nose to tail, metres. */
  length: number;
  color: string;
  belly?: string;
  fin?: string;
  /** round (goldfish), long (eel-ish), flat (flounder, ray), tall (angelfish), shark */
  shape?: 'round' | 'long' | 'flat' | 'tall' | 'shark';
  stripes?: string;
  /** Extra parts on the 'body', 'head' or 'tail'. */
  extras?: (p: Parts, d: { L: number; H: number; W: number }) => void;
}

/** A fish, side view, swimming toward +z. Joints: body, tail, finL/R, dorsal. */
export function fish(key: string, o: FishOpts): Figure {
  const L = o.length;
  const shape = o.shape ?? 'round';
  const H = L * (shape === 'tall' ? 0.75 : shape === 'long' ? 0.18 : shape === 'flat' ? 0.12 : shape === 'shark' ? 0.26 : 0.42);
  const W = L * (shape === 'flat' ? 0.7 : shape === 'long' ? 0.16 : 0.22);
  const c = col(o.color), fc = col(o.fin ?? o.color), bc = col(o.belly ?? o.color);
  const p = new Parts();
  p.add({ name: 'body', at: [0, H * 0.6 + L * 0.05, 0], shape: 'ball', size: [W, H, L * 0.78], color: c });
  if (o.belly) p.add({ name: 'belly', parent: 'body', at: [0, -H * 0.18, L * 0.04], shape: 'ball', size: [W * 0.85, H * 0.6, L * 0.6], color: bc, layer: -1, noInk: true });
  // tail fan: a thin cone pointing into the body, widest at the back and tall, not wide
  p.add({ name: 'tail', parent: 'body', at: [0, 0, -L * 0.32], shape: 'cyl', taper: 0, segs: shape === 'shark' ? 3 : 4, size: [L * 0.05, L * 0.32, H * (shape === 'flat' ? 1.6 : shape === 'long' ? 2.2 : 1.15)], srot: [90, 0, 0], off: [0, 0, -L * 0.13], color: fc, layer: -1 });
  p.add({ name: 'dorsal', parent: 'body', at: [0, H * 0.45, -L * 0.02], rot: [-20, 0, 0], shape: 'cyl', taper: 0, segs: 3, size: [L * (shape === 'shark' ? 0.22 : 0.16), H * (shape === 'shark' ? 0.55 : 0.35), L * 0.02], srot: [0, 90, 0], off: [0, H * 0.12, 0], color: fc, layer: -1 });
  p.pair({ name: 'fin', parent: 'body', at: [W * 0.42, -H * 0.12, L * 0.12], rot: [30, 0, 40], shape: 'ball', size: [L * 0.02, H * 0.3, L * 0.14], off: [0, -H * 0.1, -L * 0.04], color: fc, layer: 2 });
  p.pair({ name: 'eye', parent: 'body', at: [W * 0.36, H * 0.12, L * 0.27], shape: 'ball', size: [L * 0.05, L * 0.05, L * 0.04], color: '#1d1a17', role: 'eye', layer: 4, noInk: true });
  p.pair({ name: 'glint', parent: 'eye', at: [L * 0.012, L * 0.012, L * 0.01], shape: 'ball', size: [L * 0.018, L * 0.018, L * 0.01], color: '#ffffff', role: 'eye', layer: 5, noInk: true }, true);
  if (o.stripes) for (let i = 0; i < 3; i++) p.pair({ name: `stripe${i}`, parent: 'body', at: [W * 0.47, 0, L * (0.12 - i * 0.14)], shape: 'ball', size: [L * 0.012, H * 0.8, L * 0.05], color: col(o.stripes), layer: 3, noInk: true });
  o.extras?.(p, { L, H, W });
  return figure(key, 'animals', 'fish', 'side', p);
}

export interface BugOpts {
  /** Head to tail, metres (real bugs are tiny; the atlas enlarges them). */
  length: number;
  color: string;
  legs?: 6 | 8;
  wings?: 'none' | 'clear' | 'beetle' | 'butterfly';
  wingColor?: string;
  antennae?: boolean;
  /** Body segments: 2 (spider), 3 (ant, bee). */
  segments?: 2 | 3;
  stripes?: string;
  extras?: (p: Parts, d: { L: number }) => void;
}

/** An insect or spider, side view, facing +z. Joints: body, head, wingL/R, legs leg0L..leg3R. */
export function bug(key: string, o: BugOpts): Figure {
  const L = o.length;
  const c = col(o.color);
  const seg = o.segments ?? 3;
  const p = new Parts();
  const legH = L * 0.22;
  p.add({ name: 'body', at: [0, legH + L * 0.12, 0], shape: 'ball', size: [L * 0.3, L * 0.26, L * (seg === 2 ? 0.34 : 0.26)], color: c });
  p.add({ name: 'abdomen', parent: 'body', at: [0, L * 0.02, -L * 0.14], shape: 'ball', size: [L * 0.36, L * 0.32, L * 0.48], off: [0, 0, -L * 0.16], color: c, layer: -1 });
  if (o.stripes) for (let i = 0; i < 3; i++) p.add({ name: `stripe${i}`, parent: 'abdomen', at: [0, 0, -L * (0.05 + i * 0.1)], shape: 'torus', tube: 0.3, size: [L * 0.36, L * 0.32, L * 0.05], color: col(o.stripes), layer: 1, noInk: true });
  if (seg === 3) p.add({ name: 'head', parent: 'body', at: [0, L * 0.03, L * 0.14], shape: 'ball', size: [L * 0.22, L * 0.2, L * 0.2], off: [0, 0, L * 0.06], color: c, layer: 1 });
  const head = seg === 3 ? 'head' : 'body';
  const hz = seg === 3 ? L * 0.12 : L * 0.14;
  p.pair({ name: 'eye', parent: head, at: [L * 0.07, L * 0.04, hz], shape: 'ball', size: [L * 0.07, L * 0.08, L * 0.06], color: '#1d1a17', role: 'eye', layer: 4, noInk: true });
  if (o.antennae !== false) p.pair({ name: 'antenna', parent: head, at: [L * 0.04, L * 0.08, hz], rot: [-40, 0, -20], shape: 'capsule', size: [L * 0.015, L * 0.3, L * 0.015], off: [0, L * 0.14, 0], color: '#2a2726', layer: 2 });
  const n = o.legs === 8 ? 4 : 3;
  for (let i = 0; i < n; i++) {
    const z = L * (0.08 - i * (0.16 / Math.max(1, n - 1)));
    p.pair({ name: `leg${i}`, parent: 'body', at: [L * 0.1, -L * 0.04, z], rot: [0, (i - 1) * 25, -55], shape: 'capsule', size: [L * 0.025, L * 0.36, L * 0.025], off: [0, -L * 0.16, 0], color: '#2a2726', layer: 2 });
  }
  const w = o.wings ?? 'clear';
  if (w !== 'none') {
    const wc = col(o.wingColor ?? (w === 'clear' ? '#e6f4fb' : w === 'beetle' ? o.color : '#f6a33a'));
    const big = w === 'butterfly' ? 1.9 : 1;
    p.pair({ name: 'wing', parent: 'body', at: [L * 0.06, L * 0.12, -L * 0.02], rot: [-15, 0, 35], shape: 'ball', size: [L * 0.5 * big, L * 0.02, L * 0.3 * big], off: [L * 0.24 * big, 0, -L * 0.05], color: wc, layer: 3 });
  }
  o.extras?.(p, { L });
  return figure(key, 'animals', 'bug', 'side', p);
}

export interface SnakeOpts {
  length: number;
  color: string;
  belly?: string;
  bands?: string;
  /** cobra hood */
  hood?: boolean;
  /** Body thickness as a fraction of length (default 0.05). */
  girth?: number;
}

/** A snake coiled in an S on the ground with its head raised. Joints: seg0..seg7, head. */
export function snake(key: string, o: SnakeOpts): Figure {
  const L = o.length;
  const t = L * (o.girth ?? 0.075);
  const c = col(o.color);
  const p = new Parts();
  const n = 8;
  const segL = (L * 0.85) / n;
  let parent: string | undefined;
  for (let i = 0; i < n; i++) {
    const name = `seg${i}`;
    // a lazy S: alternate turns, the first segments lying flat and the last two rising
    const turn = i === 0 ? 0 : (i % 2 ? 38 : -38);
    const rise = i >= n - 2 ? -38 : 0;
    p.add({ name, parent, at: parent ? [0, segL, 0] : [0, t * 0.5, -L * 0.25], rot: parent ? [rise, 0, turn] : [90, 0, 0], shape: 'capsule', size: [t * (1 - i * 0.04), segL + t, t * (1 - i * 0.04)], off: [0, segL / 2, 0], color: i % 2 && o.bands ? col(o.bands) : c, layer: 0 });
    parent = name;
  }
  p.add({ name: 'head', parent, at: [0, segL, 0], rot: [-50, 0, 0], shape: 'ball', size: [t * 1.4, t * 1.1, t * 1.8], off: [0, t * 0.4, t * 0.2], color: c, layer: 2 });
  if (o.hood) p.add({ name: 'hood', parent, at: [0, segL * 0.6, 0], shape: 'ball', size: [t * 3.2, t * 2.4, t * 0.5], color: c, layer: 1 });
  p.pair({ name: 'eye', parent: 'head', at: [t * 0.45, t * 0.75, t * 0.5], shape: 'ball', size: [t * 0.3, t * 0.3, t * 0.3], color: '#1d1a17', role: 'eye', layer: 4, noInk: true });
  p.add({ name: 'tongue', parent: 'head', at: [0, t * 0.2, t * 1.05], rot: [60, 0, 0], shape: 'capsule', size: [t * 0.12, t * 0.8, t * 0.12], off: [0, t * 0.35, 0], color: '#d6453a', layer: 3 });
  return figure(key, 'animals', 'snake', 'front', p);
}

export const _vec: Vec3 = [0, 0, 0];
