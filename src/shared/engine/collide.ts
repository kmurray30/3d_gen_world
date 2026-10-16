import type { Vec3 } from '../types';
import { PLAYER_RADIUS } from '../types';
import { blocksPlayer, footprintRadius } from './sizing';
import type { WorldModel } from './world';

export interface Bump {
  id: string;
  /** Unit normal from the entity centre toward the player. */
  nx: number;
  nz: number;
  depth: number;
  blocked: boolean;
}

/**
 * Circle-vs-circle in the ground plane. Big solid things push the player out along the contact normal, which
 * gives sliding for free; everything else is only reported so the rules layer can react.
 */
export function resolvePlayerCollisions(world: WorldModel, pos: Vec3): Bump[] {
  const bumps: Bump[] = [];
  for (const e of world.entities.values()) {
    if (e.hidden || e.parent || e.pos[1] > 0.5) continue;
    const r = footprintRadius(e) + PLAYER_RADIUS;
    const dx = pos[0] - e.pos[0];
    const dz = pos[2] - e.pos[2];
    const d = Math.hypot(dx, dz);
    if (d >= r) continue;
    const nx = d > 1e-6 ? dx / d : 1;
    const nz = d > 1e-6 ? dz / d : 0;
    const blocked = blocksPlayer(e);
    bumps.push({ id: e.id, nx, nz, depth: r - d, blocked });
    if (blocked) {
      pos[0] = e.pos[0] + nx * r;
      pos[2] = e.pos[2] + nz * r;
    }
  }
  return bumps;
}
