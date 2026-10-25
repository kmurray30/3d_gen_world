/**
 * Props: the small built things of streets and squares (fountains, lamp posts, mailboxes, signposts, wells,
 * benches, birdbaths, bins and columns), stacked from prisms, boxes and paper strips with the same crayon
 * materials and ink as the buildings, so they stand solid from every side. Detailed things (statues, scarecrows,
 * people, animals) stay drawn cutouts. Every prop's front faces +z.
 */
import { DEG, rotateY } from '../../engine/math';
import { Parts, pick, range, tidy } from '../build';
import type { GenContext, Structure } from '../types';

/** Stone tints: lavender, rose, pale grey, sandstone, chalk. */
const STONES = ['#d9cdea', '#f0c9d4', '#d6d9dd', '#ecdcb4', '#f1ece2'] as const;
const IRON = '#3f444c';
const WATER = '#5bc2ec';
const SPRAY = '#78d4f4';
const LAMPLIGHT = '#ffe7a3';
const MAILBOX_COLORS = ['#e8493b', '#4e8fd6', '#5aa553', '#3a3a3a'] as const;
const WOODS = ['#b8803f', '#a86f38', '#d9a05b'] as const;
const ROOFS = ['#e8493b', '#4e8fd6', '#8d5a3b', '#5aa553'] as const;

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** A hex colour made darker (k < 1) or lighter (k > 1). */
export function shade(hex: string, k: number): string {
  const n = parseInt(hex.slice(1), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => (k <= 1 ? v * k : v + (255 - v) * (k - 1)));
  return `#${c.map((v) => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0')).join('')}`;
}

/**
 * Points along a jet of water in a vertical plane: launched from (x0, y0), rising `lift` to its top a third of
 * the way out, then falling to (x1, y1), the way water leaves a spout.
 */
function jet(x0: number, y0: number, x1: number, y1: number, lift: number, n = 24): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  const peak = 0.33;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    // the horizontal run eases out so the fall steepens; the height is a parabola through the peak
    const x = x0 + (x1 - x0) * (1 - (1 - t) ** 1.25);
    const up = t <= peak ? 1 - ((peak - t) / peak) ** 2 : 1 - ((t - peak) / (1 - peak)) ** 2;
    const y = t <= peak ? y0 + lift * up : y1 + (y0 + lift - y1) * up;
    out.push([x, y]);
  }
  return out;
}

export interface FountainParams {
  /** Basin radius, metres. */
  r: number;
  /** 1: a spout throwing four arcs into the basin; 2: an upper bowl that spills over into it. */
  tiers: number;
  color: string;
  water: string;
}

/** A town fountain: an octagonal basin on a low step, a column rising out of the water, paper water arcs. */
export function fountain(params: Partial<FountainParams>, ctx: GenContext): Structure {
  const b = new Parts();
  const R = clamp(params.r ?? 2.4, 1.2, 5);
  const tiers = params.tiers === 1 || params.tiers === 2 ? params.tiers : ctx.rng() < 0.5 ? 1 : 2;
  const stone = params.color ?? pick(ctx.rng, STONES);
  const water = params.water ?? WATER;
  const cap = shade(stone, 1.35);
  const dark = shade(stone, 0.88);
  const S = 8;
  const step = 0.16;
  // a low step all round, the basin wall on it, and a lip that overhangs both sides of the wall
  b.prism(0, 0, 0, S, R + 0.5, step, 'stone', dark);
  const wallH = 0.5;
  const t = clamp(R * 0.12, 0.22, 0.4);
  b.prism(0, step, 0, S, R, wallH, 'stone', stone, { hole: R - t });
  b.prism(0, step + wallH, 0, S, R + 0.08, 0.1, 'stone', cap, { hole: R - t - 0.06 });
  const level = step + wallH * 0.75;
  b.prism(0, level - 0.02, 0, S, R - t + 0.02, 0.02, 'water', water, { ghost: true });
  // the column: a plinth out of the water, a shaft and a collar
  const cr = clamp(R * 0.17, 0.3, 0.7);
  b.prism(0, step, 0, S, cr * 1.4, level - step + 0.2, 'stone', dark);
  let y = level + 0.2;
  b.prism(0, y, 0, S, cr * 1.6, 0.08, 'stone', cap);
  y += 0.08;
  const shaft = tiers === 2 ? 0.75 : 1.0;
  b.prism(0, y, 0, S, cr, shaft, 'stone', stone);
  y += shaft;
  b.prism(0, y, 0, S, cr * 1.3, 0.1, 'stone', cap);
  y += 0.1;
  const basinIn = R - t - 0.25;
  if (tiers === 2) {
    // an upper bowl flaring out from the column, a short spout in it, small arcs into it, falls over its rim
    const br = clamp(R * 0.42, 0.8, 2);
    b.prism(0, y, 0, S, cr * 1.2, 0.3, 'stone', stone, { rTop: br });
    y += 0.3;
    b.prism(0, y, 0, S, br, 0.18, 'stone', cap, { hole: br - 0.14 });
    const bowlWater = y + 0.11;
    b.prism(0, bowlWater - 0.02, 0, S, br - 0.12, 0.02, 'water', water, { ghost: true });
    b.prism(0, y, 0, S, cr * 0.5, 0.42, 'stone', stone);
    b.prism(0, y + 0.42, 0, S, cr * 0.75, 0.08, 'stone', cap);
    const spout = y + 0.5;
    b.prism(0, spout, 0, S, cr * 0.4, 0.18, 'stone', cap, { rTop: cr * 0.12 });
    for (let i = 0; i < 4; i++) b.ribbon(0, 0, 0, jet(0.05, spout + 0.1, br - 0.25, bowlWater - 0.04, 0.32), 0.14, 'water', SPRAY, { rot: 45 + i * 90, wEnd: 0.22 });
    for (let i = 0; i < 8; i++) b.ribbon(0, 0, 0, jet(br - 0.04, y + 0.14, (br + basinIn) / 2 + 0.15, level - 0.05, 0.1, 16), 0.2, 'water', SPRAY, { rot: 22.5 + i * 45, wEnd: 0.3 });
  } else {
    // a spout block on the column throwing four big arcs into the basin
    b.prism(0, y, 0, S, cr * 0.7, 0.28, 'stone', stone);
    b.prism(0, y + 0.28, 0, S, cr * 0.9, 0.08, 'stone', cap);
    const spout = y + 0.36;
    b.prism(0, spout, 0, S, cr * 0.35, 0.16, 'stone', cap, { rTop: cr * 0.1 });
    const lift = clamp(R * 0.2, 0.35, 0.8);
    for (let i = 0; i < 4; i++) b.ribbon(0, 0, 0, jet(0.06, spout + 0.08, basinIn * 0.78, level - 0.05, lift), 0.24, 'water', SPRAY, { rot: 45 + i * 90, wEnd: 0.42 });
  }
  return tidy(b.finish('fountain', { r: R, tiers, color: stone, water }));
}

export interface LamppostParams {
  h: number;
  color: string;
  light: string;
}

/** A street lamp: a flared iron foot, a slim pole, a glass lantern with a pyramid cap that lights up at night. */
export function lamppost(params: Partial<LamppostParams>, _ctx: GenContext): Structure {
  const b = new Parts();
  const H = clamp(params.h ?? 3.2, 2, 6);
  const iron = params.color ?? IRON;
  const light = params.light ?? LAMPLIGHT;
  b.prism(0, 0, 0, 8, 0.2, 0.3, 'metal', iron, { rTop: 0.13 });
  b.prism(0, 0.3, 0, 8, 0.11, 0.1, 'metal', iron);
  const head = H - 0.78;
  b.prism(0, 0.4, 0, 8, 0.06, head - 0.4, 'metal', iron);
  b.prism(0, head, 0, 8, 0.1, 0.06, 'metal', iron);
  let y = head + 0.06;
  // a tray flaring out, the glass, corner posts, a pyramid cap and a finial
  b.prism(0, y, 0, 4, 0.12, 0.09, 'metal', iron, { rTop: 0.25 });
  y += 0.09;
  const g = 0.3;
  const gh = 0.36;
  b.box(0, y, 0, g, gh, g, 'flat', light, { glow: true, halo: true });
  for (const [sx, sz] of [
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, 1],
  ])
    b.box((sx * g) / 2, y, (sz * g) / 2, 0.04, gh, 0.04, 'metal', iron);
  y += gh;
  b.prism(0, y, 0, 4, 0.27, 0.2, 'metal', iron, { rTop: 0.03 });
  b.prism(0, y + 0.2, 0, 8, 0.045, 0.12, 'metal', iron, { rTop: 0 });
  return tidy(b.finish('lamppost', { h: H, color: iron, light }));
}

export interface MailboxParams {
  color: string;
  flag: boolean;
}

/** A roadside mailbox: a box with a domed top on a wooden post, its door toward the road and a flag on the side. */
export function mailbox(params: Partial<MailboxParams>, ctx: GenContext): Structure {
  const b = new Parts();
  const color = params.color ?? pick(ctx.rng, MAILBOX_COLORS);
  const wood = pick(ctx.rng, WOODS);
  const post = 0.95;
  b.box(0, 0, 0, 0.1, post, 0.1, 'plank', wood);
  b.box(0, post, 0, 0.2, 0.04, 0.44, 'plank', shade(wood, 0.85));
  const y = post + 0.04;
  const w = 0.24;
  const L = 0.46;
  const body = 0.13;
  b.box(0, y, 0, w, body, L, 'flat', color);
  b.prism(0, y + body, 0, 12, w / 2, L, 'flat', color, { lie: true, half: true, rz: 0.11 });
  // the door handle on the front, the flag on the right
  b.box(0, y + body + 0.02, L / 2, 0.05, 0.03, 0.03, 'metal', IRON);
  if (params.flag !== false) {
    const flag = color === '#e8493b' ? '#f6e27a' : '#e8493b';
    b.box(w / 2 + 0.015, y + 0.03, 0.02, 0.02, 0.26, 0.03, 'metal', flag);
    b.box(w / 2 + 0.015, y + 0.2, 0.09, 0.02, 0.09, 0.12, 'metal', flag);
  }
  return tidy(b.finish('mailbox', { color, flag: params.flag !== false }));
}

export interface SignpostParams {
  arms: number;
  color: string;
}

/** A wooden signpost: a post with a pointed cap and arrow boards pointing different ways. */
export function signpost(params: Partial<SignpostParams>, ctx: GenContext): Structure {
  const b = new Parts();
  const wood = params.color ?? pick(ctx.rng, WOODS);
  const arms = clamp(Math.round(params.arms ?? 2 + Math.floor(ctx.rng() * 2)), 1, 3);
  const H = 2.1;
  b.box(0, 0, 0, 0.12, H, 0.12, 'plank', wood);
  b.prism(0, H, 0, 4, 0.1, 0.12, 'plank', shade(wood, 0.8), { rTop: 0 });
  const boards = [shade(wood, 1.25), shade(wood, 1.1), shade(wood, 1.35)];
  for (let i = 0; i < arms; i++) {
    const side = i % 2 ? -1 : 1;
    const yaw = (side > 0 ? 0 : 180) + range(ctx.rng, -35, 35);
    const y = H - 0.38 - i * 0.32;
    const len = 0.78;
    const bh = 0.2;
    const at = (x: number): [number, number] => {
      const p = rotateY([x, 0, 0], yaw * DEG);
      return [p[0], p[2]];
    };
    const [bx, bz] = at(0.06 + len / 2);
    b.box(bx, y, bz, len, bh, 0.045, 'plank', boards[i], { rot: yaw });
    // the arrow's tip: a flat triangle at the board's end, pointing away from the post
    const r = bh / (2 * Math.sin(Math.PI / 3));
    const [tx, tz] = at(0.06 + len + r * 0.5);
    b.prism(tx, y - (r - (bh / 2)), tz, 3, r, 0.045, 'plank', boards[i], { lie: true, rot: yaw + 180 });
  }
  return tidy(b.finish('signpost', { arms, color: wood }));
}

export interface WellParams {
  color: string;
  roofColor: string;
}

/** A wishing well: a round stone wall with water deep inside, two posts, a little gable roof, a bucket on a rope. */
export function well(params: Partial<WellParams>, ctx: GenContext): Structure {
  const b = new Parts();
  const stone = params.color ?? pick(ctx.rng, ['#c9c4b8', '#d6d9dd', '#ecdcb4'] as const);
  const roof = params.roofColor ?? pick(ctx.rng, ROOFS);
  const wood = pick(ctx.rng, WOODS);
  const R = 0.95;
  const wallH = 0.75;
  b.prism(0, 0, 0, 10, R, wallH, 'stone', stone, { hole: R - 0.24 });
  b.prism(0, wallH, 0, 10, R + 0.06, 0.1, 'stone', shade(stone, 1.3), { hole: R - 0.3 });
  b.prism(0, 0.28, 0, 10, R - 0.22, 0.02, 'water', '#4f86b8', { ghost: true });
  const top = wallH + 0.1;
  const postH = 1.35;
  for (const sx of [-1, 1]) b.box(sx * (R - 0.12), top, 0, 0.12, postH, 0.12, 'plank', wood);
  b.roof(0, top + postH, 0, 'gable', R * 2 + 0.5, 0.6, 1.4, 'shingle', roof, { endMat: 'plank', endColor: shade(wood, 1.2) });
  // the winch: an axle between the posts with a crank, a rope and a bucket
  const axle = top + postH - 0.32;
  b.prism(0, axle - 0.045, 0, 8, 0.045, R * 2 + 0.1, 'plank', shade(wood, 0.8), { lie: true, rot: 90 });
  b.box(R + 0.02, axle - 0.2, 0, 0.04, 0.24, 0.04, 'plank', shade(wood, 0.8));
  b.box(0, axle - 0.5, 0, 0.02, 0.48, 0.02, 'flat', '#d9c08a', { noInk: true, ghost: true });
  b.prism(0, axle - 0.76, 0, 8, 0.13, 0.24, 'plank', wood, { rTop: 0.16, ghost: true });
  return tidy(b.finish('well', { color: stone, roofColor: roof }));
}

export interface BenchParams {
  w: number;
  color: string;
  frame: string;
}

/** A park bench: wooden slats for the seat and back on two iron side frames with armrests. Front faces +z. */
export function bench(params: Partial<BenchParams>, ctx: GenContext): Structure {
  const b = new Parts();
  const W = clamp(params.w ?? 1.6, 0.8, 4);
  const wood = params.color ?? pick(ctx.rng, WOODS);
  const frame = params.frame ?? IRON;
  const seat = 0.42;
  const D = 0.46;
  for (const sx of [-1, 1]) {
    const x = sx * (W / 2 - 0.08);
    b.box(x, 0, 0.16, 0.06, seat, 0.06, 'metal', frame);
    b.box(x, 0, -0.17, 0.06, seat + 0.5, 0.06, 'metal', frame);
    b.box(x, seat + 0.18, 0.01, 0.07, 0.05, D - 0.02, 'metal', frame);
    b.box(x, seat + 0.03, 0.16, 0.05, 0.15, 0.05, 'metal', frame);
  }
  for (let i = 0; i < 3; i++) b.box(0, seat, -D / 2 + 0.08 + i * 0.15, W, 0.05, 0.12, 'plank', i % 2 ? shade(wood, 0.92) : wood);
  for (const [y, k] of [
    [seat + 0.16, 1],
    [seat + 0.34, 0.92],
  ] as const)
    b.box(0, y, -0.21, W - 0.1, 0.12, 0.04, 'plank', shade(wood, k));
  return tidy(b.finish('bench', { w: W, color: wood, frame }));
}

export interface BirdbathParams {
  color: string;
}

/** A garden birdbath: a stone bowl of water on a turned pedestal. */
export function birdbath(params: Partial<BirdbathParams>, ctx: GenContext): Structure {
  const b = new Parts();
  const stone = params.color ?? pick(ctx.rng, STONES);
  const cap = shade(stone, 1.3);
  b.prism(0, 0, 0, 8, 0.3, 0.1, 'stone', shade(stone, 0.88), { rTop: 0.24 });
  b.prism(0, 0.1, 0, 8, 0.12, 0.08, 'stone', cap);
  b.prism(0, 0.18, 0, 8, 0.09, 0.5, 'stone', stone, { rTop: 0.07 });
  b.prism(0, 0.68, 0, 8, 0.12, 0.06, 'stone', cap);
  b.prism(0, 0.74, 0, 8, 0.12, 0.12, 'stone', stone, { rTop: 0.46 });
  b.prism(0, 0.86, 0, 8, 0.48, 0.06, 'stone', cap, { hole: 0.4 });
  b.prism(0, 0.88, 0, 8, 0.41, 0.02, 'water', WATER, { ghost: true });
  return tidy(b.finish('birdbath', { color: stone }));
}

export interface BinParams {
  color: string;
}

/** A metal bin with a lid and a handle. */
export function trashCan(params: Partial<BinParams>, ctx: GenContext): Structure {
  const b = new Parts();
  const color = params.color ?? pick(ctx.rng, ['#9da3a8', '#5aa553', '#4e8fd6'] as const);
  b.prism(0, 0, 0, 12, 0.28, 0.72, 'metal', color, { rTop: 0.31 });
  b.prism(0, 0.72, 0, 12, 0.34, 0.06, 'metal', shade(color, 0.85));
  b.prism(0, 0.78, 0, 12, 0.3, 0.08, 'metal', shade(color, 1.15), { rTop: 0.14 });
  b.box(0, 0.86, 0, 0.18, 0.05, 0.05, 'metal', shade(color, 0.7));
  return tidy(b.finish('trash_can', { color }));
}

export interface PillarParams {
  h: number;
  color: string;
}

/** A classical column: a square plinth, a round base, a fluted-looking shaft, a capital and a square top. */
export function pillar(params: Partial<PillarParams>, ctx: GenContext): Structure {
  const b = new Parts();
  const H = clamp(params.h ?? 3, 1, 10);
  const stone = params.color ?? pick(ctx.rng, ['#f1ece2', '#d6d9dd', '#ecdcb4'] as const);
  const cap = shade(stone, 1.3);
  b.box(0, 0, 0, 0.8, 0.2, 0.8, 'stone', shade(stone, 0.9));
  b.prism(0, 0.2, 0, 12, 0.36, 0.12, 'stone', cap, { rTop: 0.3 });
  const shaft = H - 0.58;
  b.prism(0, 0.32, 0, 12, 0.28, shaft, 'stone', stone, { rTop: 0.25 });
  b.prism(0, 0.32 + shaft, 0, 12, 0.27, 0.12, 'stone', cap, { rTop: 0.38 });
  b.box(0, 0.44 + shaft, 0, 0.86, 0.14, 0.86, 'stone', shade(stone, 0.95));
  return tidy(b.finish('pillar', { h: H, color: stone }));
}
