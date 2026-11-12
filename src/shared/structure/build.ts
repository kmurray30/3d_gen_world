/**
 * Small helpers the generators share: a parts collector with a bounds tracker, wall runs with openings, and a
 * ring of wall segments for round buildings.
 */
import { DEG } from '../engine/math';
import type { SpriteRef } from '../types';
import type { BoxPart, DecalPart, DecalResolver, Joint, MaterialName, Opening, Part, PrismPart, RibbonPart, RoofPart, StairsPart, Structure, WallPart } from './types';

export const INK = '#2b2b2b';
export const WALL_T = 0.24;

export class Parts {
  readonly parts: Part[] = [];
  readonly joints: Joint[] = [];
  private minX = Infinity;
  private maxX = -Infinity;
  private minZ = Infinity;
  private maxZ = -Infinity;
  private maxY = 0;

  constructor(readonly decals: DecalResolver = () => null) {}

  private track(x: number, y: number, z: number, hw: number, hd: number, rot = 0): void {
    // bounding rectangle of a rotated footprint
    const c = Math.abs(Math.cos(rot * DEG));
    const s = Math.abs(Math.sin(rot * DEG));
    const ex = hw * c + hd * s;
    const ez = hw * s + hd * c;
    this.minX = Math.min(this.minX, x - ex);
    this.maxX = Math.max(this.maxX, x + ex);
    this.minZ = Math.min(this.minZ, z - ez);
    this.maxZ = Math.max(this.maxZ, z + ez);
    this.maxY = Math.max(this.maxY, y);
  }

  add<T extends Part>(p: T): T {
    this.parts.push(p);
    const [x, y, z] = p.pos;
    switch (p.t) {
      case 'box':
      case 'wall':
      case 'roof':
      case 'stairs':
        this.track(x, y + p.h, z, p.w / 2, p.d / 2, p.rot);
        break;
      case 'prism':
        if (p.lie) this.track(x, y + (p.half ? 1 : 2) * (p.rz ?? p.r), z, p.r, p.h / 2, p.rot);
        else this.track(x, y + p.h, z, Math.max(p.r, p.rTop ?? 0), Math.max(p.rz ?? p.r, p.rTop ?? 0), 0);
        break;
      case 'decal':
        this.track(x, y + p.h, z, p.w / 2, 0.02, p.rot);
        break;
      case 'ribbon': {
        const reach = Math.max(...p.path.map((q) => Math.abs(q[0]))) + Math.max(p.w, p.wEnd ?? p.w) / 2;
        this.track(x, y + Math.max(...p.path.map((q) => q[1])) + p.w / 2, z, reach, reach, 0);
        break;
      }
    }
    return p;
  }

  /** A moving piece; parts added with `joint: j.id` move with it. */
  joint(j: Joint): Joint {
    this.joints.push(j);
    return j;
  }

  box(x: number, y: number, z: number, w: number, h: number, d: number, mat: MaterialName, color: string, extra: Partial<BoxPart> = {}): BoxPart {
    return this.add({ t: 'box', pos: [x, y, z], w, h, d, mat, color, ...extra });
  }

  prism(x: number, y: number, z: number, sides: number, r: number, h: number, mat: MaterialName, color: string, extra: Partial<PrismPart> = {}): PrismPart {
    return this.add({ t: 'prism', pos: [x, y, z], sides, r, h, mat, color, ...extra });
  }

  ribbon(x: number, y: number, z: number, path: Array<[number, number]>, w: number, mat: MaterialName, color: string, extra: Partial<RibbonPart> = {}): RibbonPart {
    return this.add({ t: 'ribbon', pos: [x, y, z], path, w, mat, color, ghost: true, ...extra });
  }

  roof(x: number, y: number, z: number, style: RoofPart['style'], w: number, h: number, d: number, mat: MaterialName, color: string, extra: Partial<RoofPart> = {}): RoofPart {
    return this.add({ t: 'roof', pos: [x, y, z], style, w, h, d, mat, color, ...extra });
  }

  stairs(x: number, y: number, z: number, w: number, h: number, d: number, steps: number, mat: MaterialName, color: string, extra: Partial<StairsPart> = {}): StairsPart {
    return this.add({ t: 'stairs', pos: [x, y, z], w, h, d, steps, mat, color, ...extra });
  }

  decal(x: number, y: number, z: number, sprite: SpriteRef, w: number, h: number, rot = 0, extra: Partial<DecalPart> = {}): DecalPart {
    return this.add({ t: 'decal', pos: [x, y, z], sprite, w, h, rot, mat: 'flat', color: '#ffffff', noInk: true, ghost: true, ...extra });
  }

  /** A sprite from the vocabulary stuck on a surface; height given, width from the sprite's aspect. Null when unavailable. */
  sticker(word: string, x: number, y: number, z: number, h: number, rot = 0, extra: Partial<DecalPart> = {}): DecalPart | null {
    const sprite = this.decals(word);
    if (!sprite?.file) return null;
    const w = h * (sprite.w / Math.max(1, sprite.h));
    const role = word === 'door' ? { role: 'door' as const, name: 'door' } : word === 'window' ? { role: 'window' as const } : {};
    return this.decal(x, y, z, sprite, w, h, rot, { ...role, ...extra });
  }

  /** A paper sign with text. */
  sign(text: string, x: number, y: number, z: number, h: number, rot = 0, color = '#fff3c4'): DecalPart {
    const chars = Math.max(4, text.length);
    const w = Math.min(h * 6, h * (0.55 * chars + 0.8));
    return this.decal(x, y, z, { file: null, w: Math.round(w * 100), h: Math.round(h * 100) }, w, h, rot, { text, color });
  }

  /** A wall of length `len` along its local x, centred at (x, z) and turned by `rot`, with doorways cut out of it. */
  wall(x: number, y: number, z: number, len: number, h: number, rot: number, mat: MaterialName, color: string, openings: Opening[] = [], t = WALL_T): WallPart {
    const clean = openings
      .map((o) => ({ at: o.at, w: Math.min(o.w, len - 0.2), h: Math.min(o.h, h - 0.05) }))
      .filter((o) => o.w > 0.1 && o.h > 0.1 && Math.abs(o.at) + o.w / 2 < len / 2)
      .sort((a, b) => a.at - b.at);
    return this.add({ t: 'wall', pos: [x, y, z], w: len, h, d: t, rot, mat, color, ...(clean.length ? { openings: clean } : {}) });
  }

  /** `sides` wall segments around a circle of radius r; `skip` leaves that segment out (a doorway). */
  ring(x: number, y: number, z: number, sides: number, r: number, h: number, mat: MaterialName, color: string, skip: number[] = [], t = WALL_T): void {
    const seg = 2 * r * Math.sin(Math.PI / sides);
    const apothem = r * Math.cos(Math.PI / sides);
    for (let i = 0; i < sides; i++) {
      if (skip.includes(i)) continue;
      const a = Math.PI / sides + (i / sides) * Math.PI * 2 + Math.PI / sides; // segment centre angle
      const cx = Math.cos(a) * apothem;
      const cz = Math.sin(a) * apothem;
      // a box's +z face should point outward: outward direction is (cos a, sin a); rotateY([0,0,1], rot) = [sin rot, 0, cos rot]
      const rot = Math.atan2(Math.cos(a), Math.sin(a)) / DEG;
      this.box(x + cx, y, z + cz, seg + t * 0.6, h, t, mat, color, { rot });
    }
  }

  /** The footprint rectangle and top so far. */
  get extent(): { minX: number; maxX: number; minZ: number; maxZ: number; maxY: number } {
    return { minX: this.minX, maxX: this.maxX, minZ: this.minZ, maxZ: this.maxZ, maxY: this.maxY };
  }

  get bounds(): Structure['bounds'] {
    if (!this.parts.length) return { w: 1, h: 1, d: 1 };
    return { w: this.maxX - this.minX, h: this.maxY, d: this.maxZ - this.minZ };
  }

  /** Centre the footprint on the origin and return the structure. */
  finish(gen: string, params: Structure['params'], ink?: string): Structure {
    const cx = (this.minX + this.maxX) / 2;
    const cz = (this.minZ + this.maxZ) / 2;
    if (Math.abs(cx) > 1e-6 || Math.abs(cz) > 1e-6) {
      for (const p of this.parts) {
        p.pos = [p.pos[0] - cx, p.pos[1], p.pos[2] - cz];
      }
      for (const j of this.joints) j.at = [j.at[0] - cx, j.at[1], j.at[2] - cz];
      this.minX -= cx;
      this.maxX -= cx;
      this.minZ -= cz;
      this.maxZ -= cz;
    }
    const b = this.bounds;
    return { gen, params, parts: this.parts, bounds: { w: round(b.w), h: round(b.h), d: round(b.d) }, ...(ink ? { ink } : {}), ...(this.joints.length ? { joints: this.joints } : {}) };
  }
}

export function round(v: number, places = 3): number {
  const k = 10 ** places;
  return Math.round(v * k) / k;
}

export function pick<T>(rng: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length) % arr.length];
}

export function range(rng: () => number, lo: number, hi: number, step = 0): number {
  const v = lo + rng() * (hi - lo);
  return step ? Math.round(v / step) * step : v;
}

/** Rounds every part's numbers so saved worlds stay small. */
export function tidy(s: Structure): Structure {
  for (const p of s.parts) {
    p.pos = [round(p.pos[0]), round(p.pos[1]), round(p.pos[2])];
    if (p.rot !== undefined) p.rot = round(p.rot, 2);
    for (const k of ['w', 'h', 'd', 'r', 'rz', 'rTop', 'hole', 'wEnd'] as const) {
      const v = (p as unknown as Record<string, unknown>)[k];
      if (typeof v === 'number') (p as unknown as Record<string, number>)[k] = round(v);
    }
    if (p.t === 'ribbon') p.path = p.path.map(([a, b]) => [round(a), round(b)]);
  }
  for (const j of s.joints ?? []) {
    j.at = [round(j.at[0]), round(j.at[1]), round(j.at[2])];
    j.axis = [round(j.axis[0], 4), round(j.axis[1], 4), round(j.axis[2], 4)];
    j.amount = round(j.amount);
  }
  return s;
}
