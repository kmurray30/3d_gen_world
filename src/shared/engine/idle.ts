/**
 * Idle life: living things that nobody is scripting occasionally turn, wander a few steps around where they
 * stand, or fidget. Turns and wanders prefer orientations the player can see. Anything a command touched is left
 * alone for a while so "the dog sits" does not get wandered away from.
 */
import type { Entity, Vec3 } from '../types';
import { WORLD_RADIUS } from '../types';
import type { Engine } from './index';
import { footprints, findFreeSpot } from './place';
import { footprintRadius } from './sizing';
import { visibleYaw, wrapDeg } from './facing';

const SCRIPTED_COOLDOWN_S = 12;
const WANDER_RADIUS_M = 3;
const MAX_PER_TICK = 2;

export class Idle {
  private readonly next = new Map<string, number>();
  private readonly home = new Map<string, Vec3>();
  readonly lastScripted = new Map<string, number>();
  enabled = true;

  constructor(private readonly engine: Engine) {}

  private living(e: Entity): boolean {
    return (e.kind === 'animal' || e.kind === 'human' || e.kind === 'humanoid') && !e.hidden && !e.parent && e.pos[1] < 0.05;
  }

  tick(): void {
    if (!this.enabled) return;
    const engine = this.engine;
    const now = engine.time;
    let started = 0;
    for (const e of engine.world.entities.values()) {
      if (!this.living(e)) continue;
      if (!this.home.has(e.id)) this.home.set(e.id, [...e.pos]);
      const due = this.next.get(e.id);
      if (due === undefined) {
        this.next.set(e.id, now + 2 + engine.rng() * 6);
        continue;
      }
      if (now < due || started >= MAX_PER_TICK) continue;
      this.next.set(e.id, now + 4 + engine.rng() * 8);
      if (engine.scheduler.isClaimed(e.id, 'xz') || engine.scheduler.isClaimed(e.id, 'y') || engine.scheduler.isClaimed(e.id, 'facing')) continue;
      if (now - (this.lastScripted.get(e.id) ?? -1e9) < SCRIPTED_COOLDOWN_S) continue;
      started++;
      const roll = engine.rng();
      if (roll < 0.4) this.turn(e);
      else if (roll < 0.75) this.wander(e);
      else this.fidget(e);
    }
    for (const id of [...this.next.keys()]) if (!engine.world.has(id)) this.forget(id);
  }

  forget(id: string): void {
    this.next.delete(id);
    this.home.delete(id);
    this.lastScripted.delete(id);
  }

  private turn(e: Entity): void {
    const engine = this.engine;
    const sign = engine.rng() < 0.5 ? -1 : 1;
    const want = wrapDeg((e.yaw ?? 0) + sign * (60 + engine.rng() * 90));
    const yaw = visibleYaw(want, e.pos, engine.world.player.pos, 0.75);
    const flip = engine.rng() < 0.5;
    engine.turn(e.id, yaw, flip, e.kind === 'animal' ? 'hop' : undefined, `idle_${engine.nextKey()}`);
  }

  private wander(e: Entity): void {
    const engine = this.engine;
    const home = this.home.get(e.id) ?? e.pos;
    const a = engine.rng() * Math.PI * 2;
    const r = 0.8 + engine.rng() * (WANDER_RADIUS_M - 0.8);
    let tx = home[0] + Math.cos(a) * r;
    let tz = home[2] + Math.sin(a) * r;
    const lim = WORLD_RADIUS - 3;
    const dist = Math.hypot(tx, tz);
    if (dist > lim) {
      tx *= lim / dist;
      tz *= lim / dist;
    }
    const spot = findFreeSpot(footprints(engine.world, new Set([e.id])), tx, tz, footprintRadius(e), engine.rng, engine.world.player, 3);
    if (Math.hypot(spot[0] - home[0], spot[2] - home[2]) > WANDER_RADIUS_M + 1.5) return;
    if (Math.hypot(spot[0] - e.pos[0], spot[2] - e.pos[2]) < 0.4) return;
    const style = e.kind === 'animal' ? (engine.rng() < 0.5 ? 'hop' : 'walk') : 'walk';
    engine.run([{ op: 'move', id: e.id, to: { rel: 'near', of: 'player', height: 'ground' }, speed: 'slow', style, dest: [spot[0], 0, spot[2]] }], `idle_${engine.nextKey()}`);
  }

  private fidget(e: Entity): void {
    const engine = this.engine;
    const name = e.kind === 'animal' ? (engine.rng() < 0.6 ? 'hop' : 'wobble') : engine.rng() < 0.5 ? 'nod' : 'bounce';
    engine.run([{ op: 'anim', id: e.id, name, times: 1 }], `idle_${engine.nextKey()}`);
  }
}
