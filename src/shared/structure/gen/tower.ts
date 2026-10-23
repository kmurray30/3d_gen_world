/** Round things: towers with cone roofs or battlements, and the lighthouse with its keeper's cottage. */
import type { GenContext, MaterialName, Structure } from '../types';
import { Parts, pick, tidy } from '../build';
import { DEG } from '../../engine/math';
import { ROOF_COLORS } from '../palette';
import { DEFAULT_HOUSE, houseBody } from './house';

export interface TowerParams {
  r: number;
  h: number;
  sides: number;
  mat: MaterialName;
  color: string;
  cap: 'cone' | 'battlements' | 'flat';
  capColor: string;
  flag: boolean;
}

export const DEFAULT_TOWER: TowerParams = { r: 2.2, h: 8, sides: 12, mat: 'stone', color: '#c9c4b8', cap: 'cone', capColor: '#4e8fd6', flag: true };

/** Facing angle (degrees) for a decal whose outward direction is (cos a, sin a) in the ground plane. */
function facing(a: number): number {
  return Math.atan2(Math.cos(a), Math.sin(a)) / DEG;
}

export function tower(params: Partial<TowerParams>, ctx: GenContext, decals: Parts['decals']): Structure {
  const p: TowerParams = { ...DEFAULT_TOWER, ...params };
  p.r = Math.max(1, Math.min(6, p.r));
  p.h = Math.max(3, Math.min(30, p.h));
  p.sides = Math.max(6, Math.min(16, Math.round(p.sides / 4) * 4));
  const b = new Parts(decals);
  const apothem = p.r * Math.cos(Math.PI / p.sides);
  b.prism(0, 0, 0, p.sides, p.r, p.h, p.mat, p.color);
  b.prism(0, 0, 0, p.sides, p.r + 0.25, 0.35, p.mat, p.color); // plinth
  // door on the front face and a few windows up the sides
  if (!b.sticker('door', 0, 0.35, apothem, 2.0, 0)) b.box(0, 0.35, apothem + 0.03, 1.0, 2.0, 0.08, 'plank', '#6a3d2a');
  b.box(0, 0, apothem + 0.45, 1.5, 0.35, 0.8, 'stone', '#b9bcb6');
  const rows = Math.max(1, Math.floor((p.h - 3) / 2.6));
  for (let k = 0; k < rows; k++) {
    const y = 3 + k * 2.6;
    for (const a of [Math.PI / 2 + Math.PI / 2, Math.PI / 2 + Math.PI, Math.PI / 2 + (Math.PI * 3) / 2]) {
      const x = Math.cos(a) * apothem;
      const z = Math.sin(a) * apothem;
      if (!b.sticker('window', x, y, z, 0.9, facing(a))) b.box(x, y, z, 0.6, 0.9, 0.06, 'glass', '#bfe9ff', { rot: facing(a), ghost: true, noInk: true });
    }
  }
  if (p.cap === 'cone') {
    b.prism(0, p.h - 0.05, 0, p.sides, p.r + 0.45, (p.r + 0.45) * 1.5, 'shingle', p.capColor, { rTop: 0 });
    if (p.flag) flag(b, 0, p.h - 0.05 + (p.r + 0.45) * 1.5 - 0.1, 0, ctx);
  } else if (p.cap === 'battlements') {
    b.prism(0, p.h - 0.05, 0, p.sides, p.r + 0.35, 0.4, p.mat, p.color);
    const n = p.sides;
    const rr = p.r + 0.2;
    for (let i = 0; i < n; i += 2) {
      const a = Math.PI / n + (i / n) * Math.PI * 2 + Math.PI / n;
      b.box(Math.cos(a) * rr, p.h + 0.35, Math.sin(a) * rr, 0.6, 0.6, 0.3, p.mat, p.color, { rot: facing(a) });
    }
    if (p.flag) flag(b, 0, p.h + 0.35, 0, ctx);
  } else {
    b.prism(0, p.h - 0.05, 0, p.sides, p.r + 0.3, 0.35, p.mat, p.color);
  }
  return tidy(b.finish('tower', { ...p }));
}

function flag(b: Parts, x: number, y: number, z: number, ctx: GenContext): void {
  b.prism(x, y, z, 6, 0.05, 1.6, 'flat', '#5a4632', { noInk: true });
  b.box(x + 0.38, y + 1.1, z, 0.72, 0.42, 0.03, 'flat', pick(ctx.rng, ROOF_COLORS), { ghost: true });
}

export interface LighthouseParams {
  h: number;
  r: number;
  bands: number;
  bandColor: string;
  cottage: boolean;
}

export const DEFAULT_LIGHTHOUSE: LighthouseParams = { h: 11, r: 2.6, bands: 3, bandColor: '#e8493b', cottage: true };

export function lighthouse(params: Partial<LighthouseParams>, ctx: GenContext, decals: Parts['decals']): Structure {
  const p: LighthouseParams = { ...DEFAULT_LIGHTHOUSE, ...params };
  p.h = Math.max(6, Math.min(30, p.h));
  p.r = Math.max(1.5, Math.min(5, p.r));
  const b = new Parts(decals);
  const sides = 12;
  const rTop = p.r * 0.72;
  const radiusAt = (y: number) => p.r + (rTop - p.r) * (y / p.h);
  b.prism(0, 0, 0, sides, p.r, p.h, 'plaster', '#fafafa', { rTop });
  b.prism(0, 0, 0, sides, p.r + 0.4, 0.45, 'stone', '#b9bcb6'); // base
  const bandH = 1.3;
  for (let i = 0; i < p.bands; i++) {
    const y = 1.8 + (i * (p.h - 4)) / Math.max(1, p.bands - 1);
    b.prism(0, y, 0, sides, radiusAt(y) + 0.045, bandH, 'flat', p.bandColor, { rTop: radiusAt(y + bandH) + 0.045, noInk: true });
  }
  // door and a window on the seaward side
  const apothem = p.r * Math.cos(Math.PI / sides);
  if (!b.sticker('door', 0, 0.45, apothem + 0.02, 2.0, 0)) b.box(0, 0.45, apothem + 0.02, 1, 2, 0.08, 'plank', '#6a3d2a');
  b.box(0, 0, apothem + 0.5, 1.6, 0.45, 0.9, 'stone', '#b9bcb6');
  const wy = p.h * 0.55;
  if (!b.sticker('window', 0, wy, radiusAt(wy) * Math.cos(Math.PI / sides) + 0.02, 0.9, 0)) b.box(0, wy, radiusAt(wy) * Math.cos(Math.PI / sides), 0.6, 0.9, 0.06, 'glass', '#bfe9ff', { ghost: true, noInk: true });
  // gallery with a railing
  const gy = p.h;
  const gr = rTop + 0.9;
  b.prism(0, gy, 0, sides, gr, 0.3, 'concrete', '#8f938d');
  for (let i = 0; i < sides; i++) {
    const a = Math.PI / sides + (i / sides) * Math.PI * 2;
    b.box(Math.cos(a) * (gr - 0.12), gy + 0.3, Math.sin(a) * (gr - 0.12), 0.08, 1.0, 0.08, 'flat', '#3a3a3a', { noInk: true, ghost: true });
  }
  b.ring(0, gy + 1.25, 0, sides, gr - 0.12, 0.07, 'flat', '#3a3a3a', [], 0.07);
  // lantern room, lamp, cap
  const lr = rTop + 0.15;
  b.prism(0, gy + 0.3, 0, 8, lr, 2.3, 'glass', '#d6f0ff');
  b.prism(0, gy + 0.5, 0, 8, lr * 0.4, 1.3, 'flat', '#ffe066', { noInk: true });
  b.prism(0, gy + 2.6, 0, 8, lr + 0.35, 1.5, 'metal', p.bandColor, { rTop: 0 });
  b.prism(0, gy + 4.05, 0, 6, 0.08, 0.7, 'flat', '#3a3a3a', { noInk: true });
  if (p.cottage) {
    const hp = { ...DEFAULT_HOUSE, w: 4.2, d: 3.4, stories: 1, wallMat: 'plaster' as const, wallColor: '#fafafa', roof: 'gable' as const, roofMat: 'shingle' as const, roofColor: p.bandColor, pitch: 0.8, chimney: true, doorAt: -0.6, trimColor: '#3a3a3a' };
    houseBody(b, hp, p.r + hp.w / 2 - 0.3, 0.2);
  }
  return tidy(b.finish('lighthouse', { ...p }));
}
