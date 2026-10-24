import type { Vec3 } from '../types';
import { PLAYER_RADIUS } from '../types';
import { blocksPlayer, footprintRadius } from './sizing';
import type { WorldModel } from './world';
import { resolveBodyVsStructure, structureRadius, type BodyContact } from '../structure/collide';

export interface Bump {
  id: string;
  /** Unit normal from the entity centre toward the player. */
  nx: number;
  nz: number;
  depth: number;
  blocked: boolean;
}

/** The player's body for structure collision: feet to head, minus a little so low ceilings do not snag. */
export const PLAYER_BODY_H = 1.5;

/**
 * Circle-vs-circle in the ground plane. Big solid things push the player out along the contact normal, which
 * gives sliding for free; everything else is only reported so the rules layer can react. Structures are skipped
 * here and handled wall by wall in `resolvePlayerVsStructures`.
 */
export function resolvePlayerCollisions(world: WorldModel, pos: Vec3): Bump[] {
  const bumps: Bump[] = [];
  for (const e of world.entities.values()) {
    if (e.hidden || e.parent || e.structure) continue;
    // things on the meadow only bump a player on the meadow; a player up on a roof walks over them
    if (Math.abs(e.pos[1] - pos[1]) > 0.5) continue;
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

/** Walls push the player out; patios, stairs and roofs within a step become the ground under them. */
export function resolvePlayerVsStructures(world: WorldModel, pos: Vec3, ground = 0): BodyContact {
  let support = ground;
  let blocked = false;
  for (const e of world.entities.values()) {
    if (!e.structure || e.hidden) continue;
    const reach = structureRadius(e.structure, e.scale) + PLAYER_RADIUS + 1;
    if (Math.hypot(pos[0] - e.pos[0], pos[2] - e.pos[2]) > reach) continue;
    const c = resolveBodyVsStructure(e.structure, e, e.pos, pos, PLAYER_RADIUS, PLAYER_BODY_H, support);
    support = c.support;
    blocked = blocked || c.blocked;
  }
  return { support, blocked };
}
