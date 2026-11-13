import type { Entity, Vec3 } from '../types';
import { renderHeight } from './sizing';
import { structureTopAt } from '../structure/collide';
import { getFigure } from '../figure/items';
import { socketOffset } from '../figure/pose';
import type { Figure } from '../figure/types';

/** The code-drawn figure an entity shows as (null for buildings, forced sprites and words without one). */
export function figureOfEntity(e: Entity): Figure | null {
  if (e.structure || e.look === 'sprite') return null;
  return getFigure(e.word);
}

export type EntityLookup = (id: string) => Entity | undefined;

/**
 * Anchor offset of a child relative to its parent's feet point. On a structure, "top" is the surface under the
 * child's own offset (a cat lands on the roof slope, not at the chimney's height).
 */
export function anchorOffset(parent: Entity, anchor: Entity['anchor'], childRel?: Vec3, child?: Entity): Vec3 {
  if (anchor && anchor.startsWith('@')) {
    // a socket of a code-drawn parent: the slot of a toaster, the seat of a chair
    const fig = figureOfEntity(parent);
    const off = fig ? socketOffset(parent, fig, anchor.slice(1)) : null;
    if (off) {
      // a slot takes things in most of the way (bread sticks out of a toaster); hooks hang things below them
      const kind = fig!.sockets!.find((s) => s.name === anchor.slice(1))!.kind;
      const h = child ? renderHeight(child) : 0;
      if (kind === 'slot') off[1] -= h * 0.6;
      else if (kind === 'hook') off[1] -= h;
      return off;
    }
    return [0, renderHeight(parent), 0];
  }
  switch (anchor) {
    case 'top':
      if (parent.structure && childRel) {
        const top = structureTopAt(parent.structure, parent, [0, 0, 0], childRel[0], childRel[2]);
        return [0, top ?? renderHeight(parent), 0];
      }
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
    const [ax, ay, az] = anchorOffset(parent, cur.anchor, cur.pos, cur);
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
