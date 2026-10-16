import type { Anchor, Entity, PlayerState, Vec3 } from '../types';
import { PLAYER_RADIUS, WORLD_RADIUS } from '../types';
import type { Place } from '../schema';
import { DEG, add3, dir2, rotateY, scale3 } from './math';
import { footprintRadius, renderHeight } from './sizing';
import type { WorldModel } from './world';

export const DIST_M = { touch: 0.1, close: 0.8, near: 2, far: 7 } as const;
export const HEIGHT_M = { ground: 0, low: 1, high: 3, sky: 10 } as const;
const ABOVE_M = { ground: 1.5, low: 1, high: 3, sky: 10 } as const;

export interface Footprint {
  id: string;
  x: number;
  z: number;
  r: number;
}
export interface Placement {
  pos: Vec3;
  parent?: string;
  anchor?: Anchor;
}
export interface SelfInfo {
  id?: string;
  radius: number;
  heightM: number;
}

/** Forward and right unit vectors of the player in the ground plane. */
export function playerAxes(player: PlayerState): { f: Vec3; r: Vec3 } {
  return { f: [-Math.sin(player.yaw), 0, -Math.cos(player.yaw)], r: [Math.cos(player.yaw), 0, -Math.sin(player.yaw)] };
}

/** Ground-level obstacles (unattached, visible entities standing on the ground) plus the player. */
export function footprints(world: WorldModel, exclude?: Set<string>): Footprint[] {
  const out: Footprint[] = [];
  for (const e of world.entities.values()) {
    if (exclude?.has(e.id) || e.parent || e.hidden) continue;
    if (e.pos[1] > 0.05) continue;
    out.push({ id: e.id, x: e.pos[0], z: e.pos[2], r: footprintRadius(e) });
  }
  if (!exclude?.has('player')) out.push({ id: 'player', x: world.player.pos[0], z: world.player.pos[2], r: PLAYER_RADIUS });
  return out;
}

export function isFree(fps: Footprint[], x: number, z: number, r: number): boolean {
  if (Math.hypot(x, z) > WORLD_RADIUS - 1) return false;
  for (const f of fps) {
    const dx = f.x - x;
    const dz = f.z - z;
    if (dx * dx + dz * dz < (f.r + r) * (f.r + r)) return false;
  }
  return true;
}

/**
 * Nearest free spot to (x, z): the point itself, then rings of candidates 0.5m apart out to `maxRing`.
 * Within a ring the free candidate closest to the player's view direction wins. Falls back to the original point.
 */
export function findFreeSpot(fps: Footprint[], x: number, z: number, r: number, rng: () => number, player?: PlayerState, maxRing = 12): Vec3 {
  if (isFree(fps, x, z, r)) return [x, z === 0 ? 0 : 0, z] as Vec3;
  const axes = player ? playerAxes(player) : null;
  const start = rng() * Math.PI * 2;
  for (let ring = 0.5; ring <= maxRing; ring += 0.5) {
    const n = Math.max(8, Math.round(ring * 6));
    let best: Vec3 | null = null;
    let bestScore = Infinity;
    for (let i = 0; i < n; i++) {
      const a = start + (i / n) * Math.PI * 2;
      const cx = x + Math.cos(a) * ring;
      const cz = z + Math.sin(a) * ring;
      if (!isFree(fps, cx, cz, r)) continue;
      let score = ring;
      if (axes && player) {
        const dx = cx - player.pos[0];
        const dz = cz - player.pos[2];
        const ahead = dx * axes.f[0] + dz * axes.f[2];
        if (ahead < 0) score += 3; // prefer spots the player can see
      }
      if (score < bestScore) {
        bestScore = score;
        best = [cx, 0, cz];
      }
    }
    if (best) return best;
  }
  return [x, 0, z];
}

function clampToWorld(p: Vec3): Vec3 {
  const d = Math.hypot(p[0], p[2]);
  const lim = WORLD_RADIUS - 2;
  if (d <= lim) return p;
  return [(p[0] / d) * lim, p[1], (p[2] / d) * lim];
}

function defaultDist(rel: Place['rel']): keyof typeof DIST_M {
  switch (rel) {
    case 'near':
      return 'near';
    case 'at':
      return 'touch';
    default:
      return 'close';
  }
}

/** Resolve a relation to a concrete placement for an entity of the given size. */
export function resolvePlace(place: Place, world: WorldModel, self: SelfInfo, rng: () => number): Placement {
  const player = world.player;
  const { f, r } = playerAxes(player);
  const P: Vec3 = [player.pos[0], 0, player.pos[2]];
  const target = place.of !== 'player' ? world.get(place.of) : undefined;
  const anchorPos: Vec3 = target ? world.worldPos(target) : P;
  const anchorR = target ? footprintRadius(target) : PLAYER_RADIUS;
  // Unit vector pointing from the anchor toward the player (for an entity) or the player's forward (for the player).
  const toward: Vec3 = target ? dir2(anchorPos, P) : f;
  const gap = DIST_M[place.dist ?? defaultDist(place.rel)];
  let d = anchorR + gap + self.radius;
  if (!target) d = Math.max(d, self.radius + 1 + self.heightM * 0.8);

  let pos: Vec3;
  let parent: string | undefined;
  let anchor: Anchor | undefined;
  const jitter = (deg: number) => (rng() - 0.5) * deg * DEG;

  switch (place.rel) {
    case 'on':
      if (target) {
        return { pos: [0, 0, 0], parent: target.id, anchor: 'top' };
      }
      pos = add3(P, scale3(f, d));
      break;
    case 'above': {
      const topY = target ? world.worldPos(target)[1] + renderHeight(target) : 0;
      return { pos: [anchorPos[0], topY + ABOVE_M[place.height], anchorPos[2]] };
    }
    case 'at':
      pos = target ? [anchorPos[0], 0, anchorPos[2]] : add3(P, scale3(f, d));
      break;
    case 'front':
      pos = add3([anchorPos[0], 0, anchorPos[2]], scale3(toward, d));
      break;
    case 'behind':
      pos = add3([anchorPos[0], 0, anchorPos[2]], scale3(toward, -d));
      break;
    case 'left':
      pos = add3([anchorPos[0], 0, anchorPos[2]], scale3(r, -d));
      break;
    case 'right':
      pos = add3([anchorPos[0], 0, anchorPos[2]], scale3(r, d));
      break;
    case 'away':
      pos = target ? add3([anchorPos[0], 0, anchorPos[2]], scale3(toward, -Math.max(d, 4))) : add3(P, scale3(rotateY(f, jitter(80)), Math.max(d, 8)));
      break;
    case 'offscreen': {
      const side = rng() < 0.5 ? -1 : 1;
      pos = add3(P, scale3(rotateY(f, side * 72 * DEG), Math.max(8, d)));
      break;
    }
    case 'far':
      pos = add3(P, scale3(rotateY(f, jitter(40)), Math.max(14, d)));
      break;
    case 'random':
      pos = add3(P, scale3(rotateY(f, jitter(100)), 3 + rng() * 8 + self.radius));
      break;
    case 'near':
    default:
      pos = target
        ? add3([anchorPos[0], 0, anchorPos[2]], scale3(rotateY(toward, jitter(90)), d))
        : add3(P, scale3(rotateY(f, jitter(60)), d));
      break;
  }

  pos[1] = HEIGHT_M[place.height];
  pos = clampToWorld(pos);
  if (pos[1] === 0 && !parent) {
    const exclude = new Set<string>(self.id ? [self.id] : []);
    pos = findFreeSpot(footprints(world, exclude), pos[0], pos[2], self.radius, rng, player);
  }
  return { pos, parent, anchor };
}

/** Where a mover of radius rSelf should stop to touch a target of radius rTarget, approaching from `from`. */
export function stopAtEdge(from: Vec3, targetPos: Vec3, rTarget: number, rSelf: number, pad = 0.1): Vec3 {
  const dir = dir2(targetPos, from);
  const dist = rTarget + rSelf + pad;
  return [targetPos[0] + dir[0] * dist, targetPos[1], targetPos[2] + dir[2] * dist];
}

/** Highest solid thing under (x, z): its top height and id, or the ground (y 0, no id). */
export function supportAt(world: WorldModel, x: number, z: number, exclude: Set<string>): { y: number; id?: string } {
  let best: { y: number; id?: string } = { y: 0 };
  for (const e of world.entities.values()) {
    if (exclude.has(e.id) || e.hidden || !e.solid || e.parent) continue;
    const p = e.pos;
    const r = footprintRadius(e);
    if (Math.hypot(p[0] - x, p[2] - z) <= r) {
      const top = p[1] + renderHeight(e);
      if (top > best.y) best = { y: top, id: e.id };
    }
  }
  return best;
}

export function supportHeightAt(world: WorldModel, x: number, z: number, exclude: Set<string>): number {
  return supportAt(world, x, z, exclude).y;
}

/** After an entity arrives somewhere, restore the no-overlap invariant for ground-level entities. */
export function resolveOverlap(world: WorldModel, e: Entity, rng: () => number): void {
  if (e.parent || e.hidden || e.pos[1] > 0.05) return;
  const r = footprintRadius(e);
  const fps = footprints(world, new Set([e.id]));
  if (isFree(fps, e.pos[0], e.pos[2], r)) return;
  const spot = findFreeSpot(fps, e.pos[0], e.pos[2], r, rng, world.player, 6);
  e.pos[0] = spot[0];
  e.pos[2] = spot[2];
}
