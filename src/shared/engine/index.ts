import type { Entity, Vec3, World } from '../types';
import type { ResolvedSpawn, ResolvedStep } from '../schema';
import { makeRng } from './math';
import { footprintRadius, massClassFor } from './sizing';
import { resolvePlace } from './place';
import { Scheduler, type Script } from './scheduler';
import { FallTask, makeTasks } from './tasks';
import { WorldModel } from './world';

export type EngineEvent =
  | { type: 'spawn'; id: string }
  | { type: 'remove'; id: string; how?: string }
  | { type: 'morph'; id: string; word: string }
  | { type: 'attach'; id: string; to: string }
  | { type: 'say'; id?: string; text: string; dur: number }
  | { type: 'effect'; key: string; name: string; id?: string; pos?: Vec3; dur?: number; loop?: boolean }
  | { type: 'effectStop'; key: string }
  | { type: 'land'; id: string; on?: string; height: number }
  | { type: 'arrive'; id: string; target?: string }
  | { type: 'stateChange'; id: string; key: string; value: boolean | number | string }
  | { type: 'scriptDone'; id: string }
  | { type: 'warn'; msg: string };

/**
 * Headless simulation: world model + scheduler + events. No rendering, no DOM; the client renders `world` every
 * frame and the server can run it for tests.
 */
export class Engine {
  readonly world: WorldModel;
  readonly scheduler: Scheduler;
  rng: () => number;
  time = 0;
  private listeners: Array<(e: EngineEvent) => void> = [];
  private keySeq = 0;
  private idSeq = 0;

  constructor(world: World, seed = 1) {
    this.world = new WorldModel(world);
    this.rng = makeRng(seed);
    this.scheduler = new Scheduler((action, script) => makeTasks(action, script, this));
  }

  on(fn: (e: EngineEvent) => void): () => void {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== fn);
    };
  }

  emit(e: EngineEvent): void {
    for (const l of this.listeners) l(e);
  }

  nextKey(): string {
    return `${++this.keySeq}`;
  }

  get busy(): boolean {
    return this.scheduler.busy;
  }

  update(dt: number): void {
    this.time += dt;
    for (const id of this.scheduler.update(dt)) this.emit({ type: 'scriptDone', id });
    for (const e of this.world.list()) {
      if (e.ttl !== undefined && this.time - e.createdAt > e.ttl) this.removeEntity(e.id, 'fade');
    }
  }

  /** Run a fully known script. */
  run(steps: ResolvedStep[], id?: string): Script {
    return this.scheduler.run(steps, id);
  }

  /** Streaming entry points: open, append steps as they arrive, seal when the stream ends. */
  open(id?: string): Script {
    return this.scheduler.start(id);
  }
  append(script: Script, step: ResolvedStep): void {
    this.scheduler.append(script, step);
  }
  seal(script: Script): void {
    this.scheduler.seal(script);
  }

  cancelAll(): void {
    this.scheduler.cancelAll();
    for (const t of this.world.transient.values()) {
      t.ofs = [0, 0, 0];
      t.sq = 1;
    }
  }

  uniqueId(base: string): string {
    if (!this.world.has(base)) return base;
    const stem = base.replace(/_\d+$/, '');
    for (let n = 2; n < 10000; n++) {
      const cand = `${stem}_${n}`;
      if (!this.world.has(cand)) return cand;
    }
    return `${stem}_${++this.idSeq}`;
  }

  /** Create and place an entity from a resolved spawn action. Returns null when the world is full. */
  spawn(action: ResolvedSpawn): Entity | null {
    const res = action.res;
    const scale = action.scale ?? 1;
    const id = this.uniqueId(action.id);
    const proto = { heightM: res.heightM, scale, sprite: res.sprite };
    const placement = resolvePlace(action.at, this.world, { id, radius: footprintRadius(proto), heightM: res.heightM * scale }, this.rng);
    const e: Entity = {
      id,
      word: res.word,
      label: res.placeholder ? action.word : res.word,
      sprite: { ...res.sprite },
      pos: placement.pos,
      flip: false,
      facing: action.face,
      scale,
      heightM: res.heightM,
      tilt: 0,
      state: {},
      effects: [],
      kind: res.kind,
      solid: res.solid,
      massClass: massClassFor(res.kind, res.heightM),
      huge: res.huge,
      createdAt: this.time,
    };
    if (placement.parent) {
      e.parent = placement.parent;
      e.anchor = placement.anchor ?? 'top';
    }
    if (!this.world.add(e)) {
      this.emit({ type: 'warn', msg: `world is full (${this.world.size})` });
      return null;
    }
    this.emit({ type: 'spawn', id: e.id });
    return e;
  }

  /** Remove an entity now; anything attached to it falls. */
  removeEntity(id: string, how?: string): void {
    const orphans = this.world.remove(id);
    if (!orphans.length && !this.world.has(id)) {
      // removed (or never existed)
    }
    this.emit({ type: 'remove', id, how });
    for (const o of orphans) {
      const s = this.scheduler.start();
      s.running.push(new FallTask(o.id, this));
      this.scheduler.seal(s);
    }
  }

  descendants(id: string): string[] {
    const out: string[] = [];
    const walk = (pid: string, depth: number) => {
      if (depth > 6) return;
      for (const c of this.world.children(pid)) {
        out.push(c.id);
        walk(c.id, depth + 1);
      }
    };
    walk(id, 0);
    return out;
  }

  /** Saveable snapshot. */
  snapshot(): World {
    return this.world.toWorld();
  }
}

export { WorldModel } from './world';
export type { Script } from './scheduler';
