/**
 * The bunker: three stacked concrete levels, each with a doorway and a patio on its roof, joined by outside stairs
 * so you (or an NPC, in theory) can walk all over it.
 */
import type { GenContext, Structure } from '../types';
import { Parts, WALL_T, tidy } from '../build';
import { CONCRETE, DARK_CONCRETE } from '../palette';

export interface BunkerParams {
  w: number;
  d: number;
  levels: number;
  color: string;
}

export const DEFAULT_BUNKER: BunkerParams = { w: 14, d: 10, levels: 3, color: CONCRETE };

const LEVEL_H = 3;
const SLAB = 0.35;
const PARAPET_H = 0.6;
const STAIR_W = 1.6;

interface Level {
  x: number;
  z: number;
  w: number;
  d: number;
  y: number;
}

export function bunker(params: Partial<BunkerParams>, _ctx: GenContext, decals: Parts['decals']): Structure {
  const p: BunkerParams = { ...DEFAULT_BUNKER, ...params };
  p.w = Math.max(10, Math.min(24, p.w));
  p.d = Math.max(8, Math.min(18, p.d));
  p.levels = Math.max(1, Math.min(4, Math.round(p.levels)));
  const b = new Parts(decals);
  const dark = DARK_CONCRETE;
  const levels: Level[] = [];
  let cur: Level = { x: 0, z: 0, w: p.w, d: p.d, y: 0 };
  for (let i = 0; i < p.levels; i++) {
    levels.push(cur);
    const nw = cur.w * 0.65;
    const nd = cur.d * 0.72;
    // each level sits toward the back-left of the one below, leaving a patio in front and to the right
    cur = { x: cur.x - (cur.w - nw) / 2, z: cur.z - (cur.d - nd) / 2, w: nw, d: nd, y: cur.y + LEVEL_H + SLAB };
  }
  for (let i = 0; i < levels.length; i++) {
    const L = levels[i];
    const top = L.y + LEVEL_H;
    const hw = L.w / 2;
    const hd = L.d / 2;
    const t = WALL_T + 0.1;
    const door = { at: 0, w: 1.4, h: 2.3 };
    b.wall(L.x, L.y, L.z + hd - t / 2, L.w, LEVEL_H, 0, 'concrete', p.color, [door], t);
    b.wall(L.x, L.y, L.z - hd + t / 2, L.w, LEVEL_H, 180, 'concrete', p.color, [], t);
    b.wall(L.x + hw - t / 2, L.y, L.z, L.d - 2 * t, LEVEL_H, 90, 'concrete', p.color, [], t);
    b.wall(L.x - hw + t / 2, L.y, L.z, L.d - 2 * t, LEVEL_H, -90, 'concrete', p.color, [], t);
    // door frame in darker concrete
    b.box(L.x, L.y + door.h, L.z + hd - t / 2, door.w + 0.5, 0.25, t + 0.1, 'concrete', dark);
    for (const s of [-1, 1]) b.box(L.x + s * (door.w / 2 + 0.12), L.y, L.z + hd - t / 2, 0.25, door.h, t + 0.1, 'concrete', dark);
    // slit windows
    for (const s of [-1, 1]) {
      for (let k = 0; k < Math.floor(L.w / 4); k++) {
        const x = L.x - hw + 1.5 + k * 4 + (s > 0 ? 1 : 0);
        if (Math.abs(x - L.x) < 1.6) continue;
        b.box(x, L.y + 1.7, L.z + s * (hd + 0.02), 0.9, 0.3, 0.08, 'flat', '#3b3f44', { ghost: true, noInk: true });
      }
      for (let k = 0; k < Math.floor(L.d / 4); k++) {
        const z = L.z - hd + 1.6 + k * 4;
        b.box(L.x + s * (hw + 0.02), L.y + 1.7, z, 0.08, 0.3, 0.9, 'flat', '#3b3f44', { ghost: true, noInk: true });
      }
    }
    // roof slab = the patio of this level
    b.box(L.x, top, L.z, L.w + 0.5, SLAB, L.d + 0.5, 'concrete', dark);
    const patioY = top + SLAB;
    const next = levels[i + 1];
    // parapet along the slab edges, with gaps where stairs land and where the next level stands
    const ex = hw + 0.25;
    const ez = hd + 0.25;
    const stairLandingZ: [number, number] = [L.z - hd + 0.8, L.z - hd + 0.8 + STAIR_W + 0.3];
    parapet(b, L.x - ex, L.x + ex, L.z + ez, 0, patioY, p.color, next ? [[next.x - next.w / 2 - 0.3, next.x + next.w / 2 + 0.3]] : [], 'x'); // front
    parapet(b, L.z - ez, L.z + ez, L.x - ex, 0, patioY, p.color, next ? [[next.z - next.d / 2 - 0.3, next.z + next.d / 2 + 0.3]] : [], 'z'); // left
    parapet(b, L.z - ez, L.z + ez, L.x + ex, 0, patioY, p.color, [stairLandingZ], 'z'); // right
    parapet(b, L.x - ex, L.x + ex, L.z - ez, 0, patioY, p.color, next ? [[next.x - next.w / 2 - 0.3, next.x + next.w / 2 + 0.3]] : [], 'x'); // back
    // stairs up to this patio, along the right wall, climbing toward the back
    const sx = L.x + hw + 0.25 + STAIR_W / 2 + 0.02;
    const sd = Math.min(L.d - 1, 5.5);
    const sz = stairLandingZ[0] + STAIR_W / 2 - 0.3 + sd / 2 - 0.2;
    b.stairs(sx, L.y, sz, STAIR_W, LEVEL_H + SLAB, sd, 12, 'concrete', p.color, { rot: 180 });
    b.box(sx + STAIR_W / 2 + 0.06, L.y, sz, 0.12, LEVEL_H + SLAB + PARAPET_H, sd, 'concrete', dark); // outer stair wall
    b.box(sx, L.y + LEVEL_H + SLAB, sz - sd / 2 - 0.08, STAIR_W + 0.24, PARAPET_H + 0.3, 0.16, 'concrete', dark); // landing wall: turn left onto the patio
    // a vent pipe on each patio
    b.prism(L.x + hw - 1.2, patioY, L.z + hd - 1.0, 8, 0.28, 0.7, 'metal', '#6f7378');
    b.prism(L.x + hw - 1.2, patioY + 0.7, L.z + hd - 1.0, 8, 0.42, 0.18, 'metal', '#4a4e52');
  }
  // antenna on the top level
  const topL = levels[levels.length - 1];
  const topY = topL.y + LEVEL_H + SLAB;
  b.prism(topL.x, topY, topL.z, 6, 0.08, 3.2, 'metal', '#4a4e52', { noInk: true });
  for (let k = 0; k < 3; k++) b.box(topL.x, topY + 1.4 + k * 0.6, topL.z, 1.6 - k * 0.4, 0.05, 0.05, 'metal', '#4a4e52', { noInk: true, ghost: true });
  b.prism(topL.x, topY + 3.2, topL.z, 8, 0.12, 0.12, 'flat', '#ff4f4f', { noInk: true });
  return tidy(b.finish('bunker', { ...p }));
}

/** Low wall from `a` to `b` along `axis` at the fixed other coordinate, skipping the `gaps` ranges. */
function parapet(b: Parts, a0: number, a1: number, fixed: number, _unused: number, y: number, color: string, gaps: Array<[number, number]>, axis: 'x' | 'z'): void {
  const segs: Array<[number, number]> = [];
  let cursor = a0;
  for (const [g0, g1] of [...gaps].sort((p, q) => p[0] - q[0])) {
    if (g0 > cursor) segs.push([cursor, Math.min(g0, a1)]);
    cursor = Math.max(cursor, g1);
  }
  if (cursor < a1) segs.push([cursor, a1]);
  for (const [s0, s1] of segs) {
    const len = s1 - s0;
    if (len < 0.3) continue;
    const mid = (s0 + s1) / 2;
    if (axis === 'x') b.box(mid, y, fixed, len, PARAPET_H, 0.25, 'concrete', color);
    else b.box(fixed, y, mid, 0.25, PARAPET_H, len, 'concrete', color);
  }
}
