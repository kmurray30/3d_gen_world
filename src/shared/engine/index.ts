import type { Entity, Vec3, World } from '../types';
import type { ResolvedBuild, ResolvedSpawn, ResolvedStep } from '../schema';
import { makeRng } from './math';
import { footprintRadius, massClassFor } from './sizing';
import { resolvePlace } from './place';
import { Scheduler, type Script } from './scheduler';
import { FallTask, makeTasks } from './tasks';
import { WorldModel } from './world';
import { Rules } from './rules';
import { Idle } from './idle';
import { yawFacing } from './facing';
import { YawTask } from './tasks';
import { resolvePlayerCollisions, resolvePlayerVsStructures, type Bump } from './collide';
import { structureRadius } from '../structure/collide';
import { seatOnTerrain, structureEntity, yawToward } from '../structure/entity';

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
  | { type: 'sky'; time: string }
  | { type: 'poke'; id: string }
  | { type: 'warn'; msg: string };

/**
 * Headless simulation: world model + scheduler + events. No rendering, no DOM; the client renders `world` every
 * frame and the server can run it for tests.
 */
export class Engine {
  readonly world: WorldModel;
  readonly scheduler: Scheduler;
  readonly rules: Rules;
  readonly idle: Idle;
  rng: () => number;
  time = 0;
  private listeners: Array<(e: EngineEvent) => void> = [];
  private keySeq = 0;
  private idSeq = 0;
  private readonly pokeUntil = new Map<string, number>();

  constructor(world: World, seed = 1) {
    this.world = new WorldModel(world);
    this.rng = makeRng(seed);
    this.scheduler = new Scheduler((action, script) => {
      // remember what commands touched so idle life leaves it alone for a while
      if (!script.id.startsWith('idle_') && !script.id.startsWith('rule_')) {
        const target = (action as { id?: string }).id;
        if (target) this.idle.lastScripted.set(target, this.time);
      }
      return makeTasks(action, script, this);
    });
    this.rules = new Rules(this);
    this.idle = new Idle(this);
  }

  /** Turn an entity's paper to a yaw (degrees) over a moment, optionally hopping while it turns. */
  turn(id: string, yaw: number, flip: boolean | undefined, hop: 'hop' | undefined, scriptId?: string): void {
    const s = this.scheduler.start(scriptId);
    s.running.push(new YawTask(id, yaw, 0.35, this, flip));
    this.scheduler.seal(s);
    if (hop) this.run([{ op: 'anim', id, name: 'hop', times: 1 }], `${scriptId ?? 'turn'}_hop`);
  }

  /** The player clicked or tapped a thing: a small reaction by kind; buildings with a door open or close it. */
  poke(id: string): boolean {
    const e = this.world.get(id);
    if (!e || e.hidden) return false;
    const key = `poke:${id}`;
    if ((this.pokeUntil.get(key) ?? -1) > this.time) return false;
    this.pokeUntil.set(key, this.time + 0.6);
    const sid = `rule_poke_${this.nextKey()}`;
    const toward = yawFacing(this.world.worldPos(e), this.world.player.pos);
    const pick = (arr: string[]) => arr[Math.floor(this.rng() * arr.length)];
    if (e.structure) {
      const hasDoor = e.structure.parts.some((p) => p.t === 'decal' && p.role === 'door');
      if (hasDoor) {
        const open = e.state.door_open !== true;
        e.state.door_open = open;
        this.emit({ type: 'stateChange', id, key: 'door_open', value: open });
      } else {
        this.run([{ op: 'anim', id, name: 'shake', times: 1 }], sid);
      }
    } else if (e.kind === 'animal') {
      this.turn(id, toward, undefined, undefined, `${sid}_t`);
      this.run([{ op: 'par', do: [{ op: 'anim', id, name: 'hop', times: 1 }, { op: 'say', id, text: pick(['!', '?', '!!']), dur: 1 }] }], sid);
    } else if (e.kind === 'human' || e.kind === 'humanoid') {
      this.turn(id, toward, undefined, undefined, `${sid}_t`);
      this.run([{ op: 'par', do: [{ op: 'anim', id, name: 'nod', times: 1 }, { op: 'say', id, text: pick(['Hello!', 'Yes?', 'Oh, hi.', 'Hm?', 'Nice day.', 'Can I help you?']), dur: 1.8 }] }], sid);
    } else {
      this.run([{ op: 'anim', id, name: e.massClass === 'heavy' ? 'shake' : 'wobble', times: 1 }], sid);
    }
    this.emit({ type: 'poke', id });
    return true;
  }

  /** Height of whatever the player stood on after the last `collidePlayer` (0 = the meadow). */
  playerGround = 0;

  /**
   * Move the player out of big solid things and structure walls, and let the rules react to whatever was touched.
   * Also records the height the player can stand on where they ended up in `playerGround`.
   */
  collidePlayer(pos: Vec3 = this.world.player.pos): Bump[] {
    const bumps = resolvePlayerCollisions(this.world, pos);
    if (bumps.length) this.rules.bumps(bumps);
    this.playerGround = resolvePlayerVsStructures(this.world, pos, this.world.ground(pos[0], pos[2])).support;
    return bumps;
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
    this.idle.tick();
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
      yaw: Math.round(yawFacing(placement.pos, this.world.player.pos)),
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

  /** Create and place a structure from a resolved build action, facing the player. Null when the world is full. */
  build(action: ResolvedBuild): Entity | null {
    const s = action.structure;
    const id = this.uniqueId(action.id);
    const radius = structureRadius(s);
    let placement = resolvePlace(action.at, this.world, { id, radius, heightM: s.bounds.h }, this.rng);
    if (placement.parent || placement.pos[1] - this.world.ground(placement.pos[0], placement.pos[2]) > 0.05) {
      // structures stand on the ground; "on the house" means next to it
      placement = resolvePlace({ ...action.at, rel: 'near', height: 'ground' }, this.world, { id, radius, heightM: s.bounds.h }, this.rng);
    }
    const pos: Vec3 = [placement.pos[0], 0, placement.pos[2]];
    const yaw = Math.round(yawToward(pos, this.world.player.pos));
    const seated = seatOnTerrain(s, pos, yaw, (x, z) => this.world.ground(x, z));
    pos[1] = seated.base;
    const e = structureEntity(id, action.word, seated.structure, pos, yaw, this.time, action.label);
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
export type { Bump } from './collide';
