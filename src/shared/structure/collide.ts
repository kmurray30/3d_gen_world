/**
 * Collision against structure parts, in structure-local space. Every solid part answers two questions: what
 * vertical span of solid sits in the column through a point (`partSpan`), and whether a circle on the ground
 * plane overlaps its footprint, with the push that frees it and the solid span it touched (`partContact`). The
 * player resolver and the engine's support lookup are built on those.
 */
import type { Entity, Vec3 } from '../types';
import { DEG, clamp, rotateY } from '../engine/math';
import type { Part, PrismPart, RoofPart, Structure, WallPart } from './types';

export interface Span {
  bottom: number;
  top: number;
}

export interface Contact {
  /** Part-local push (before the part's own rotation is undone). */
  push: [number, number];
  span: Span;
}

/** Highest point of a roof over local (x, z) inside its footprint, relative to the roof's base. */
export function roofHeightAt(part: RoofPart, x: number, z: number): number {
  const hx = part.w / 2;
  const hz = part.d / 2;
  if (part.style === 'gable') return part.h * (1 - Math.min(1, Math.abs(z) / hz));
  if (part.style === 'shed') return part.h * clamp((hz - z) / part.d, 0, 1);
  if (part.w >= part.d) {
    const r = Math.max(0, (part.w - part.d) / 2);
    const dx = Math.max(0, Math.abs(x) - r);
    return part.h * (1 - Math.min(1, Math.max(dx, Math.abs(z)) / hz));
  }
  const r = Math.max(0, (part.d - part.w) / 2);
  const dz = Math.max(0, Math.abs(z) - r);
  return part.h * (1 - Math.min(1, Math.max(dz, Math.abs(x)) / hx));
}

/** Part-local coordinates of a structure-local point. */
function toLocal(part: Part, x: number, z: number): [number, number] {
  const dx = x - part.pos[0];
  const dz = z - part.pos[2];
  if (!part.rot) return [dx, dz];
  const r = rotateY([dx, 0, dz], -part.rot * DEG);
  return [r[0], r[2]];
}

function fromLocal(part: Part, v: [number, number]): [number, number] {
  if (!part.rot) return v;
  const w = rotateY([v[0], 0, v[1]], part.rot * DEG);
  return [w[0], w[2]];
}

function prismRadius(part: PrismPart): { rx: number; rz: number } {
  const r = Math.max(part.r, part.rTop ?? 0);
  return { rx: r, rz: (part.rz ?? part.r) * (r / part.r) };
}

/** Solid x-ranges of a wall at floor level (between the doorways). */
function wallSegments(part: WallPart): Array<[number, number]> {
  const segs: Array<[number, number]> = [];
  let cursor = -part.w / 2;
  for (const o of [...(part.openings ?? [])].sort((a, b) => a.at - b.at)) {
    if (o.at - o.w / 2 > cursor) segs.push([cursor, o.at - o.w / 2]);
    cursor = Math.max(cursor, o.at + o.w / 2);
  }
  if (cursor < part.w / 2) segs.push([cursor, part.w / 2]);
  return segs;
}

/** Height of a part's solid in its own local column, relative to its base, given the local point is inside. */
function localTop(part: Part, lx: number, lz: number): number {
  switch (part.t) {
    case 'box':
      return part.h;
    case 'wall':
      return part.h;
    case 'prism': {
      const rTop = part.rTop ?? part.r;
      if (rTop > 1e-4) return part.h;
      const { rx, rz } = prismRadius(part);
      return part.h * (1 - Math.min(1, Math.hypot(lx / rx, lz / rz)));
    }
    case 'roof':
      return roofHeightAt(part, lx, lz);
    case 'stairs': {
      const k = clamp((lz + part.d / 2) / part.d, 0, 1);
      return part.h * Math.max(k, 1 / Math.max(1, part.steps));
    }
    default:
      return 0;
  }
}

/** Solid span of a part in the column through structure-local (x, z), or null when the column misses the part. */
export function partSpan(part: Part, x: number, z: number): Span | null {
  if (part.ghost || part.t === 'decal') return null;
  const [lx, lz] = toLocal(part, x, z);
  const y0 = part.pos[1];
  switch (part.t) {
    case 'box':
    case 'roof':
    case 'stairs':
      if (Math.abs(lx) > part.w / 2 || Math.abs(lz) > part.d / 2) return null;
      return { bottom: y0, top: y0 + localTop(part, lx, lz) };
    case 'wall': {
      if (Math.abs(lx) > part.w / 2 || Math.abs(lz) > part.d / 2) return null;
      const o = part.openings?.find((op) => Math.abs(lx - op.at) <= op.w / 2);
      return o ? { bottom: y0 + o.h, top: y0 + part.h } : { bottom: y0, top: y0 + part.h };
    }
    case 'prism': {
      const { rx, rz } = prismRadius(part);
      if (Math.hypot(lx / rx, lz / rz) > 1) return null;
      return { bottom: y0, top: y0 + localTop(part, lx, lz) };
    }
    default:
      return null;
  }
}

/** Circle (radius r) vs an axis-aligned rectangle [x0,x1]x[z0,z1] in part-local space: push and contact point. */
function rectContact(lx: number, lz: number, r: number, x0: number, x1: number, z0: number, z1: number): { push: [number, number]; cx: number; cz: number } | null {
  const inside = lx > x0 && lx < x1 && lz > z0 && lz < z1;
  if (inside) {
    const dl = lx - x0;
    const dr = x1 - lx;
    const dn = lz - z0;
    const df = z1 - lz;
    const m = Math.min(dl, dr, dn, df);
    const push: [number, number] = m === dl ? [-(dl + r), 0] : m === dr ? [dr + r, 0] : m === dn ? [0, -(dn + r)] : [0, df + r];
    return { push, cx: lx, cz: lz };
  }
  const cx = clamp(lx, x0, x1);
  const cz = clamp(lz, z0, z1);
  const dx = lx - cx;
  const dz = lz - cz;
  const d = Math.hypot(dx, dz);
  if (d >= r || d < 1e-9) return null;
  return { push: [(dx / d) * (r - d), (dz / d) * (r - d)], cx, cz };
}

/** Overlap of a circle at structure-local (x, z) with the part's footprint, or null. */
export function partContact(part: Part, x: number, z: number, r: number): Contact | null {
  if (part.ghost || part.t === 'decal') return null;
  const [lx, lz] = toLocal(part, x, z);
  const y0 = part.pos[1];
  const eps = 1e-4;
  switch (part.t) {
    case 'prism': {
      const { rx, rz } = prismRadius(part);
      const d = Math.hypot(lx, lz);
      const a = Math.atan2(lz, lx);
      const rad = Math.hypot(rx * Math.cos(a), rz * Math.sin(a));
      if (d >= rad + r) return null;
      const nx = d > 1e-6 ? lx / d : 1;
      const nz = d > 1e-6 ? lz / d : 0;
      const k = Math.min(1, d / Math.max(rad, 1e-6)) * (1 - eps);
      const top = localTop(part, nx * rad * k, nz * rad * k);
      return { push: fromLocal(part, [nx * (rad + r - d), nz * (rad + r - d)]), span: { bottom: y0, top: y0 + top } };
    }
    case 'wall': {
      // the solid pieces between doorways; the lintel is overhead and never pushes
      let best: Contact | null = null;
      for (const [x0, x1] of wallSegments(part)) {
        const c = rectContact(lx, lz, r, x0, x1, -part.d / 2, part.d / 2);
        if (!c) continue;
        const mag = Math.hypot(c.push[0], c.push[1]);
        if (!best || mag < Math.hypot(best.push[0], best.push[1])) best = { push: c.push, span: { bottom: y0, top: y0 + part.h } };
      }
      return best ? { push: fromLocal(part, best.push), span: best.span } : null;
    }
    case 'box':
    case 'roof':
    case 'stairs': {
      const c = rectContact(lx, lz, r, -part.w / 2, part.w / 2, -part.d / 2, part.d / 2);
      if (!c) return null;
      const ix = clamp(c.cx, -part.w / 2 + eps, part.w / 2 - eps);
      const iz = clamp(c.cz, -part.d / 2 + eps, part.d / 2 - eps);
      return { push: fromLocal(part, c.push), span: { bottom: y0, top: y0 + localTop(part, ix, iz) } };
    }
    default:
      return null;
  }
}

/** World point -> structure-local. */
export function structureLocal(e: Pick<Entity, 'yaw' | 'scale'>, origin: Vec3, p: Vec3): Vec3 {
  const s = e.scale || 1;
  const d: Vec3 = [(p[0] - origin[0]) / s, (p[1] - origin[1]) / s, (p[2] - origin[2]) / s];
  return e.yaw ? rotateY(d, -e.yaw * DEG) : d;
}

export function structureWorldDir(e: Pick<Entity, 'yaw' | 'scale'>, v: [number, number]): [number, number] {
  const s = e.scale || 1;
  const r = e.yaw ? rotateY([v[0] * s, 0, v[1] * s], e.yaw * DEG) : [v[0] * s, 0, v[1] * s];
  return [r[0], r[2]];
}

/** Top of the highest solid part at world (x, z) whose top is at or below `maxY`; null when none. */
export function structureTopAt(s: Structure, e: Pick<Entity, 'yaw' | 'scale'>, origin: Vec3, x: number, z: number, maxY = Infinity): number | null {
  const l = structureLocal(e, origin, [x, 0, z]);
  const sc = e.scale || 1;
  let best: number | null = null;
  for (const part of s.parts) {
    const span = partSpan(part, l[0], l[2]);
    if (!span) continue;
    const top = origin[1] + span.top * sc;
    if (top <= maxY && (best === null || top > best)) best = top;
  }
  return best;
}

export interface BodyContact {
  /** Height the body can stand on (ground or a part top), in world metres. */
  support: number;
  /** Whether a part pushed the body sideways this frame. */
  blocked: boolean;
}

/** How high a body can step up onto something without jumping. */
export const STEP_UP_M = 0.55;

/**
 * Resolve a vertical cylinder (feet at pos, radius r, height h) against one structure: the part top under the
 * body's centre becomes support when it is within a step; parts the body's circle overlaps push it out sideways
 * unless they are below the step height or above the head. `pos` is mutated; `support` carries between calls.
 */
export function resolveBodyVsStructure(s: Structure, e: Pick<Entity, 'yaw' | 'scale'>, origin: Vec3, pos: Vec3, r: number, h: number, support: number): BodyContact {
  const sc = e.scale || 1;
  let blocked = false;
  const feet = pos[1];
  for (const part of s.parts) {
    if (part.ghost || part.t === 'decal') continue;
    const l = structureLocal(e, origin, pos);
    const centre = partSpan(part, l[0], l[2]);
    if (centre) {
      const top = origin[1] + centre.top * sc;
      if (top <= feet + STEP_UP_M && top > support) support = top;
    }
    const c = partContact(part, l[0], l[2], r / sc);
    if (!c) continue;
    const top = origin[1] + c.span.top * sc;
    const bottom = origin[1] + c.span.bottom * sc;
    if (top <= feet + STEP_UP_M || bottom >= feet + h) continue;
    const w = structureWorldDir(e, c.push);
    pos[0] += w[0];
    pos[2] += w[1];
    blocked = true;
  }
  return { support, blocked };
}

/** Radius of the circle around the structure's footprint, for coarse placement and picking. */
export function structureRadius(s: Structure, scale = 1): number {
  return (Math.hypot(s.bounds.w, s.bounds.d) / 2) * scale;
}
