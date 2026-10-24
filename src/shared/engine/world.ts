import type { Entity, PlayerState, Vec3, World } from '../types';
import { MAX_ENTITIES } from '../types';
import { worldPos } from './transform';

export const ATTACH_MAX_DEPTH = 4;

/** Transient per-entity render state that is never saved: additive position offset from wobbles and nudges. */
export interface Transient {
  ofs: Vec3;
  /** Vertical squash multiplier for bounces and landings (1 = none). */
  sq: number;
}

/**
 * Mutable world state with entity bookkeeping. The engine mutates entities in place (tweens write pos/scale/tilt
 * directly); `toWorld()` produces the saveable snapshot.
 */
export class WorldModel {
  readonly entities = new Map<string, Entity>();
  readonly transient = new Map<string, Transient>();
  player: PlayerState;
  slug: string;
  rev: number;
  createdAt: number;

  constructor(world: World) {
    this.slug = world.slug;
    this.rev = world.rev;
    this.createdAt = world.createdAt;
    this.player = { pos: [...world.player.pos], yaw: world.player.yaw, pitch: world.player.pitch };
    for (const e of world.entities) this.entities.set(e.id, cloneEntity(e));
    this.ensureYaw();
  }

  /** Older saves have no yaw on sprites: face the player, like a fresh spawn. */
  ensureYaw(): void {
    const p = this.player.pos;
    for (const e of this.entities.values()) {
      if (e.yaw === undefined) e.yaw = Math.round((Math.atan2(p[0] - e.pos[0], p[2] - e.pos[2]) * 180) / Math.PI);
    }
  }

  get(id: string): Entity | undefined {
    return this.entities.get(id);
  }

  has(id: string): boolean {
    return this.entities.has(id);
  }

  list(): Entity[] {
    return [...this.entities.values()];
  }

  get size(): number {
    return this.entities.size;
  }

  add(e: Entity): boolean {
    if (this.entities.has(e.id) || this.entities.size >= MAX_ENTITIES) return false;
    this.entities.set(e.id, e);
    return true;
  }

  /** Remove an entity. Children are detached (their world position baked in) and returned so the engine can drop them. */
  remove(id: string): Entity[] {
    const e = this.entities.get(id);
    if (!e) return [];
    const orphans: Entity[] = [];
    for (const other of this.entities.values()) {
      if (other.parent === id) {
        this.detach(other.id);
        orphans.push(other);
      }
    }
    this.entities.delete(id);
    this.transient.delete(id);
    return orphans;
  }

  children(id: string): Entity[] {
    return this.list().filter((e) => e.parent === id);
  }

  worldPos(e: Entity): Vec3 {
    return worldPos(e, (id) => this.entities.get(id));
  }

  /** Rendered position: world position plus the transient offset. */
  renderPos(e: Entity): Vec3 {
    const p = this.worldPos(e);
    const t = this.transient.get(e.id);
    return t ? [p[0] + t.ofs[0], p[1] + t.ofs[1], p[2] + t.ofs[2]] : p;
  }

  trans(id: string): Transient {
    let t = this.transient.get(id);
    if (!t) {
      t = { ofs: [0, 0, 0], sq: 1 };
      this.transient.set(id, t);
    }
    return t;
  }

  offset(id: string): Vec3 {
    let t = this.transient.get(id);
    if (!t) {
      t = { ofs: [0, 0, 0], sq: 1 };
      this.transient.set(id, t);
    }
    return t.ofs;
  }

  /** Attach child to parent at an anchor. Rejects cycles, self-attachment and chains deeper than ATTACH_MAX_DEPTH. */
  attach(childId: string, parentId: string, anchor: Entity['anchor'] = 'top'): boolean {
    const child = this.entities.get(childId);
    const parent = this.entities.get(parentId);
    if (!child || !parent || childId === parentId) return false;
    let depth = 1;
    for (let cur: Entity | undefined = parent; cur?.parent; cur = this.entities.get(cur.parent)) {
      if (cur.parent === childId) return false;
      if (++depth > ATTACH_MAX_DEPTH) return false;
    }
    if (this.subtreeDepth(childId) + depth > ATTACH_MAX_DEPTH) return false;
    this.detach(childId);
    child.parent = parentId;
    child.anchor = anchor;
    child.pos = [0, 0, 0];
    return true;
  }

  /** Detach, keeping the current world position. */
  detach(id: string): void {
    const e = this.entities.get(id);
    if (!e?.parent) return;
    e.pos = this.worldPos(e);
    delete e.parent;
    delete e.anchor;
  }

  private subtreeDepth(id: string): number {
    let max = 0;
    for (const c of this.children(id)) max = Math.max(max, 1 + this.subtreeDepth(c.id));
    return max;
  }

  toWorld(): World {
    return {
      slug: this.slug,
      rev: this.rev,
      player: { pos: [...this.player.pos], yaw: this.player.yaw, pitch: this.player.pitch },
      entities: this.list().map(cloneEntity),
      createdAt: this.createdAt,
    };
  }

  /** Replace all state from a snapshot (undo/reset). */
  load(world: World): void {
    this.entities.clear();
    this.transient.clear();
    for (const e of world.entities) this.entities.set(e.id, cloneEntity(e));
    this.player.pos = [...world.player.pos];
    this.player.yaw = world.player.yaw;
    this.player.pitch = world.player.pitch;
    this.rev = Math.max(this.rev, world.rev);
    this.ensureYaw();
  }
}

export function cloneEntity(e: Entity): Entity {
  return { ...e, pos: [...e.pos], sprite: { ...e.sprite }, state: { ...e.state }, effects: [...e.effects] };
}
