/**
 * Holes behind doors and windows, so an open one shows the inside of the building rather than a painted dark
 * square or the wall it is stuck on. A window's hole is the part its two sashes cover; a door's is the door.
 * Holes are found from where the decals sit: on a wall or a wall board (the board becomes a wall with the hole),
 * or on a side face of a big prism (a tower or lighthouse, which becomes hollow, with the bands round it cut to
 * match). Structures are cut when they are generated, and again when drawn, so older saved worlds get holes too.
 */
import { DEG, rotateY } from '../engine/math';
import type { BoxPart, DecalPart, Opening, Part, PrismOpening, PrismPart, Structure, WallPart } from './types';

/** Where the two sashes sit in the window drawing, as fractions from its top left: across, middle, and down. */
export const WINDOW_SASH = { x0: 0.15, xm: 0.5, x1: 0.848, y0: 0.119, y1: 0.82 };

/** How thick a hollowed tower's wall is, metres. */
const TOWER_WALL = 0.25;
/** Prisms narrower than this stay solid (posts, lamps, plinths seen edge-on). */
const MIN_TOWER_R = 1;

export function isWindow(p: Part): p is DecalPart {
  return p.t === 'decal' && (p.role === 'window' || (!p.role && /(^|\/)window\.webp$/.test(p.sprite.file ?? '')));
}

/** The hole's rectangle in the decal's own frame: across from its centre, up from its bottom. */
function holeRect(d: DecalPart): { l: number; r: number; b: number; t: number } {
  if (d.role === 'door') return { l: -d.w * 0.47, r: d.w * 0.47, b: 0, t: d.h * 0.97 };
  const s = WINDOW_SASH;
  return { l: (s.x0 - 0.5) * d.w, r: (s.x1 - 0.5) * d.w, b: (1 - s.y1) * d.h, t: (1 - s.y0) * d.h };
}

function angleDiff(a: number, b: number): number {
  const d = (((a - b) % 360) + 540) % 360 - 180;
  return Math.abs(d);
}

function overlaps(a: Opening, b: Opening): boolean {
  const ay = a.y ?? 0;
  const by = b.y ?? 0;
  return a.at - a.w / 2 < b.at + b.w / 2 && b.at - b.w / 2 < a.at + a.w / 2 && ay < by + b.h && by < ay + a.h;
}

/** The hole a decal needs in a wall or board it sits flat on (its outer, +z face), in the host's frame. */
function onFace(host: WallPart | BoxPart, d: DecalPart): Opening | null {
  if (host.ghost || host.hidden || angleDiff(d.rot ?? 0, host.rot ?? 0) > 1) return null;
  const rel = rotateY([d.pos[0] - host.pos[0], 0, d.pos[2] - host.pos[2]], -(host.rot ?? 0) * DEG);
  // on the outer face (or sunk into the outer half of a board, as older witch huts drew them)
  if (rel[2] < -0.01 || rel[2] > host.d / 2 + 0.07) return null;
  const r = holeRect(d);
  const l = rel[0] + r.l;
  const rr = rel[0] + r.r;
  const b = d.pos[1] - host.pos[1] + r.b;
  const t = d.pos[1] - host.pos[1] + r.t;
  if (l < -host.w / 2 - 0.02 || rr > host.w / 2 + 0.02 || b < -0.02 || t > host.h + 0.02) return null;
  const cl = Math.max(l, -host.w / 2 + 0.04);
  const cr = Math.min(rr, host.w / 2 - 0.04);
  const cb = Math.max(0, b);
  const ct = Math.min(host.h - 0.04, t);
  if (cr - cl < 0.1 || ct - cb < 0.1) return null;
  const y = cb < 0.02 ? 0 : cb;
  return { at: r3((cl + cr) / 2), w: r3(cr - cl), y: r3(y), h: r3(ct - y) };
}

function r3(v: number): number {
  return Math.round(v * 1000) / 1000;
}

function radiusAt(p: PrismPart, y: number): number {
  const k = Math.max(0, Math.min(1, y / Math.max(1e-6, p.h)));
  return p.r + ((p.rTop ?? p.r) - p.r) * k;
}

/** The hole a decal needs through a prism's side face, or null when it does not sit on one. */
function onPrism(host: PrismPart, d: DecalPart): { side: number; open: Opening; yWorld: [number, number] } | null {
  if (host.lie || host.ghost || host.hidden || host.r < MIN_TOWER_R || (host.rz !== undefined && Math.abs(host.rz - host.r) > 1e-3) || host.lean) return null;
  const n = Math.max(3, Math.round(host.sides));
  if (n < 6) return null;
  const rot = (d.rot ?? 0) * DEG;
  const f = [Math.sin(rot), Math.cos(rot)];
  const rel = [d.pos[0] - host.pos[0], d.pos[2] - host.pos[2]];
  // side k's middle faces angle 2 pi (k + 1) / n
  const phi = Math.atan2(f[1], f[0]);
  const step = (Math.PI * 2) / n;
  const k = (((Math.round(phi / step) - 1) % n) + n) % n;
  const theta = step * (k + 1);
  if (angleDiff(phi / DEG, theta / DEG) > (180 / n) * 0.35) return null;
  const r = holeRect(d);
  const yb = d.pos[1] - host.pos[1];
  const y0 = yb + r.b;
  const y1 = yb + r.t;
  if (y0 < -0.02 || y1 > host.h + 0.02) return null;
  const ymid = (y0 + y1) / 2;
  const apothem = radiusAt(host, ymid) * Math.cos(Math.PI / n);
  if (Math.abs(rel[0] * f[0] + rel[1] * f[1] - apothem) > 0.12) return null;
  // across the face: the decal's own +x, signed toward corner k + 1
  const tangent = [Math.cos(rot), -Math.sin(rot)];
  const a0 = Math.PI / n + step * k;
  const a1 = a0 + step;
  const u = [Math.cos(a1) - Math.cos(a0), Math.sin(a1) - Math.sin(a0)];
  const sign = tangent[0] * u[0] + tangent[1] * u[1] < 0 ? -1 : 1;
  const across = rel[0] * tangent[0] + rel[1] * tangent[1] + (r.l + r.r) / 2;
  const len = 2 * radiusAt(host, ymid) * Math.sin(Math.PI / n);
  const w = Math.min(r.r - r.l, len - 0.2);
  const cb = Math.max(0, y0);
  const ct = Math.min(host.h - 0.04, y1);
  if (w < 0.1 || ct - cb < 0.1) return null;
  const y = cb < 0.02 ? 0 : cb;
  return { side: k, open: { at: r3(sign * across), w: r3(w), y: r3(y), h: r3(ct - y) }, yWorld: [host.pos[1] + cb, host.pos[1] + ct] };
}

/** A structure with holes behind its doors and windows (the same object when there is nothing to cut). */
export function cutOpenings(s: Structure): Structure {
  const todo = s.parts.map((p, i) => [p, i] as const).filter(([p]) => p.t === 'decal' && !p.hole && p.text === undefined && (p.role === 'door' || isWindow(p)));
  if (!todo.length) return s;
  const parts = s.parts.slice();
  let changed = false;
  const own = new Set<number>();
  const mine = (i: number): Part => {
    if (!own.has(i)) {
      parts[i] = structuredClone(parts[i]);
      own.add(i);
    }
    return parts[i];
  };
  for (const [, di] of todo) {
    const d = parts[di] as DecalPart;
    let done = false;
    for (let hi = 0; hi < parts.length && !done; hi++) {
      const host = parts[hi];
      if (host.t === 'wall' || host.t === 'box') {
        const o = onFace(host, d);
        if (!o) continue;
        done = true;
        const existing = host.t === 'wall' ? (host.openings ?? []) : [];
        if (!existing.some((e) => overlaps(e, o))) {
          // a wall board with a window becomes a wall with a hole
          const h = mine(hi) as WallPart | BoxPart;
          const wall: WallPart = h.t === 'wall' ? h : { ...h, t: 'wall', openings: [] };
          wall.openings = [...(wall.openings ?? []), o];
          parts[hi] = wall;
        }
      } else if (host.t === 'prism') {
        const found = onPrism(host, d);
        if (!found) continue;
        done = true;
        const tower = mine(hi) as PrismPart;
        tower.hole ??= r3(Math.max(0.3, tower.r - TOWER_WALL));
        tower.openings = [...(tower.openings ?? []), { side: found.side, ...found.open }];
        // bands and trims wrapped round the tower over the hole: hollow them and cut the same hole
        for (let bi = 0; bi < parts.length; bi++) {
          const band = parts[bi];
          if (bi === hi || band.t !== 'prism' || band.lie || band.ghost || band.hidden) continue;
          if (Math.round(band.sides) !== Math.round(tower.sides) || Math.hypot(band.pos[0] - tower.pos[0], band.pos[2] - tower.pos[2]) > 0.05) continue;
          const top = band.pos[1] + band.h;
          if (top <= found.yWorld[0] + 0.02 || band.pos[1] >= found.yWorld[1] - 0.02) continue;
          const ymid = (Math.max(band.pos[1], found.yWorld[0]) + Math.min(top, found.yWorld[1])) / 2;
          const gap = radiusAt(band, ymid - band.pos[1]) - radiusAt(tower, ymid - tower.pos[1]);
          if (gap < -0.05 || gap > 0.3) continue;
          const b = mine(bi) as PrismPart;
          b.hole ??= r3(Math.max(0.3, b.r - gap - TOWER_WALL * 0.6));
          const y0 = Math.max(0, found.yWorld[0] - b.pos[1]);
          const y1 = Math.min(b.h, found.yWorld[1] - b.pos[1]);
          b.openings = [...(b.openings ?? []), { side: found.side, at: found.open.at, w: found.open.w, y: r3(y0), h: r3(y1 - y0) }];
        }
      }
    }
    if (done) {
      (mine(di) as DecalPart).hole = true;
      changed = true;
    }
  }
  return changed ? { ...s, parts } : s;
}

export type { PrismOpening };
