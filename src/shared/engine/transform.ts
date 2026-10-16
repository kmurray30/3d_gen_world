import type { Entity, Vec3 } from '../types';
import { renderHeight } from './sizing';

export type EntityLookup = (id: string) => Entity | undefined;

/** Anchor offset of a child relative to its parent's feet point. */
export function anchorOffset(parent: Entity, anchor: Entity['anchor']): Vec3 {
  switch (anchor) {
    case 'top':
      return [0, renderHeight(parent), 0];
    case 'held':
      return [0, renderHeight(parent) * 0.45, 0];
    case 'front':
    case 'inside':
    default:
      return [0, 0, 0];
  }
}

/** World-space feet position, following the parent chain (cycles are rejected at attach time; depth is capped anyway). */
export function worldPos(e: Entity, lookup: EntityLookup): Vec3 {
  let x = e.pos[0];
  let y = e.pos[1];
  let z = e.pos[2];
  let cur = e;
  for (let depth = 0; depth < 6 && cur.parent; depth++) {
    const parent = lookup(cur.parent);
    if (!parent) break;
    const [ax, ay, az] = anchorOffset(parent, cur.anchor);
    x += parent.pos[0] + ax;
    y += parent.pos[1] + ay;
    z += parent.pos[2] + az;
    cur = parent;
  }
  return [x, y, z];
}

export function topOf(e: Entity, lookup: EntityLookup): number {
  return worldPos(e, lookup)[1] + renderHeight(e);
}

export function dist2D(a: Vec3, b: Vec3): number {
  const dx = a[0] - b[0];
  const dz = a[2] - b[2];
  return Math.hypot(dx, dz);
}
