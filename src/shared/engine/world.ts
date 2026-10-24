import type { Entity, PlayerState, TimeOfDay, Vec3, World } from '../types';
import { MAX_ENTITIES } from '../types';
import { worldPos } from './transform';
import { terrainField, type TerrainField, type TerrainSpec } from '../terrain/field';

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
  preset?: string;
  seed?: number;
  sky: TimeOfDay;
  /** The recipe and its baked heights; null = the flat meadow at y 0. */
  terrainSpec?: TerrainSpec;
  terrain: TerrainField | null = null;

  constructor(world: World) {
    this.slug = world.slug;
    this.rev = world.rev;
    this.createdAt = world.createdAt;
    this.player = { pos: [...world.player.pos], yaw: world.player.yaw, pitch: world.player.pitch };
    for (const e of world.entities) this.entities.set(e.id, cloneEntity(e));
    this.preset = world.preset;
    this.seed = world.seed;
    this.sky = world.sky ?? 'day';
    this.setTerrain(world.terrain);
    this.ensureYaw();
  }

  /** Older saves have no yaw on sprites: face the player, like a fresh spawn. */
  ensureYaw(): void {
    const p = this.player.pos;
    for (const e of this.entities.values()) {
      if (e.yaw === undefined) e.yaw = Math.round((Math.atan2(p[0] - e.pos[0], p[2] - e.pos[2]) * 180) / Math.PI);
    }
  }

  setTerrain(spec: TerrainSpec | undefined): void {
    this.terrainSpec = spec;
    this.terrain = terrainField(spec);
  }

  /** Height of the ground (terrain, not structures) at (x, z). */
  ground(x: number, z: number): number {
    return this.terrain ? this.terrain.height(x, z) : 0;
  }

  /** Whether a circle of radius r at (x, z) touches water. */
  wet(x: number, z: number, r = 0): boolean {
    return this.terrain ? this.terrain.wetWithin(x, z, r) : false;
  }

  /** How far an entity's feet are above the ground under it (unattached entities only; 0 for attached ones). */
  heightAboveGround(e: Entity): number {
    if (e.parent) return 0;
    return e.pos[1] - this.ground(e.pos[0], e.pos[2]);
  }

  /** Standing on the ground (structures always count: they are built on it). */
  onGround(e: Entity, tolerance = 0.05): boolean {
    if (e.parent) return false;
    if (e.structure) return true;
    return Math.abs(e.pos[1] - this.ground(e.pos[0], e.pos[2])) <= tolerance;
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
      ...(this.preset ? { preset: this.preset } : {}),
      ...(this.seed !== undefined ? { seed: this.seed } : {}),
      ...(this.terrainSpec ? { terrain: this.terrainSpec } : {}),
      ...(this.sky !== 'day' ? { sky: this.sky } : {}),
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
    this.preset = world.preset;
    this.seed = world.seed;
    this.sky = world.sky ?? 'day';
    if (JSON.stringify(world.terrain ?? null) !== JSON.stringify(this.terrainSpec ?? null)) this.setTerrain(world.terrain);
    this.ensureYaw();
  }
}

export function cloneEntity(e: Entity): Entity {
  return { ...e, pos: [...e.pos], sprite: { ...e.sprite }, state: { ...e.state }, effects: [...e.effects] };
}
