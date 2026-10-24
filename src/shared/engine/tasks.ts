import type { Entity, Vec3 } from '../types';
import type { AnimAction, EffectAction, MoveAction, RemoveAction, ResolvedAction, ResolvedBuild, ResolvedSet, ResolvedSpawn, SayAction } from '../schema';
import { DEG, clamp, dir2, easeIn, easeInOut, easeOut, easeOutBack, lerp } from './math';
import { footprintRadius, renderHeight, massClassFor } from './sizing';
import { resolveOverlap, resolvePlace, stopAtEdge, supportAt, walkSurfaceAt } from './place';
import type { Channel, Script, Task } from './scheduler';
import type { Engine } from './index';

const SPEED_M: Record<NonNullable<MoveAction['speed']>, number> = { slow: 0.7, walk: 1.4, run: 4, fly: 3, instant: Infinity };
const CHASE_CAP_S = 12;
const GRAVITY = 14;

abstract class BaseTask implements Task {
  entity?: string;
  channel?: Channel;
  delay: number;
  started = false;
  preempted = false;
  constructor(delay = 0) {
    this.delay = delay;
  }
  abstract start(): boolean;
  abstract update(dt: number): boolean;
}

/** Generic timed tween on one channel. */
class Tween extends BaseTask {
  private t = 0;
  constructor(
    entity: string | undefined,
    channel: Channel | undefined,
    private readonly dur: number,
    private readonly apply: (k: number) => void,
    private readonly onStart?: () => boolean,
    private readonly onEnd?: () => void,
    delay = 0,
  ) {
    super(delay);
    this.entity = entity;
    this.channel = channel;
  }
  start(): boolean {
    return this.onStart ? this.onStart() : true;
  }
  update(dt: number): boolean {
    this.t += dt;
    const k = this.dur <= 0 ? 1 : clamp(this.t / this.dur, 0, 1);
    this.apply(k);
    if (k >= 1) {
      this.onEnd?.();
      return true;
    }
    return false;
  }
  cancel(): void {
    this.onEnd?.();
  }
}

class WaitTask extends BaseTask {
  private t = 0;
  constructor(private readonly dur: number) {
    super(0);
  }
  start(): boolean {
    return true;
  }
  update(dt: number): boolean {
    this.t += dt;
    return this.t >= this.dur;
  }
}

/** Spawn: place, add, pop in. */
class SpawnTask extends BaseTask {
  private pop?: Tween;
  constructor(
    private readonly action: ResolvedSpawn,
    private readonly engine: Engine,
  ) {
    super(action.delay ?? 0);
  }
  start(): boolean {
    const e = this.engine.spawn(this.action);
    if (!e) return false;
    const target = this.action.scale ?? 1;
    e.scale = target * 0.05;
    this.pop = new Tween(e.id, 'scale', 0.45, (k) => {
      e.scale = target * lerp(0.05, 1, easeOutBack(k));
    });
    this.entity = e.id;
    this.channel = 'scale';
    this.pop.started = true;
    return true;
  }
  update(dt: number): boolean {
    return this.pop ? this.pop.update(dt) : true;
  }
  cancel(): void {
    const e = this.entity && this.engine.world.get(this.entity);
    if (e) e.scale = this.action.scale ?? 1;
  }
}

/** Build: place a structure facing the player and let it rise out of the ground. */
class BuildTask extends BaseTask {
  private rise?: Tween;
  constructor(
    private readonly action: ResolvedBuild,
    private readonly engine: Engine,
  ) {
    super(action.delay ?? 0);
  }
  start(): boolean {
    const e = this.engine.build(this.action);
    if (!e) return false;
    e.scale = 0.05;
    this.rise = new Tween(e.id, 'scale', 0.7, (k) => {
      e.scale = lerp(0.05, 1, easeOutBack(k));
    });
    this.entity = e.id;
    this.channel = 'scale';
    this.rise.started = true;
    this.engine.emit({ type: 'effect', key: `build:${e.id}:${this.engine.nextKey()}`, name: 'dust', id: e.id, dur: 0.8 });
    return true;
  }
  update(dt: number): boolean {
    return this.rise ? this.rise.update(dt) : true;
  }
  cancel(): void {
    const e = this.entity && this.engine.world.get(this.entity);
    if (e) e.scale = 1;
  }
}

/** Move toward a place; chases entity targets; styles add bobbing or hops. */
class MoveTask extends BaseTask {
  private e!: Entity;
  private dest: Vec3 = [0, 0, 0];
  private speed = 1.4;
  private style: NonNullable<MoveAction['style']> = 'walk';
  private elapsed = 0;
  private phase = 0;
  private chase?: Entity;
  private attachOnArrive = false;
  private readonly rSelf: number = 0;
  /** Follows the ground (and bridges, patios) while moving instead of sliding in a straight line through hills. */
  private groundWalk = false;
  constructor(
    private readonly action: MoveAction,
    private readonly engine: Engine,
  ) {
    super(action.delay ?? 0);
    this.entity = action.id;
    this.channel = 'xz';
  }
  start(): boolean {
    const e = this.engine.world.get(this.action.id);
    if (!e) return false;
    this.e = e;
    this.engine.world.detach(e.id);
    const kind = e.kind;
    const defaultSpeed = kind === 'animal' ? 2.2 : kind === 'human' || kind === 'humanoid' ? 1.4 : 2.5;
    this.speed = this.action.speed ? SPEED_M[this.action.speed] : defaultSpeed;
    this.style = this.action.style ?? (kind === 'animal' || kind === 'human' || kind === 'humanoid' ? 'walk' : 'slide');
    if (this.style === 'fly' && !this.action.speed) this.speed = 3;
    const to = this.action.to;
    const target = to.of !== 'player' ? this.engine.world.get(to.of) : undefined;
    const chaseRels = new Set(['near', 'at', 'front', 'on', 'touch']);
    if (target && chaseRels.has(to.rel)) {
      this.chase = target;
      this.attachOnArrive = to.rel === 'on';
      this.dest = this.chaseDest();
    } else {
      const p = resolvePlace(to, this.engine.world, { id: e.id, radius: footprintRadius(e), heightM: renderHeight(e) }, this.engine.rng);
      this.dest = p.pos;
      if (to.of === 'player' && to.rel === 'at') this.dest = stopAtEdge(e.pos, [this.engine.world.player.pos[0], 0, this.engine.world.player.pos[2]], 0.35, footprintRadius(e), 0.3);
    }
    const w = this.engine.world;
    this.groundWalk = this.style !== 'fly' && to.height === 'ground' && Math.abs(e.pos[1] - walkSurfaceAt(w, e.pos[0], e.pos[2], e.pos[1] + 0.6)) < 0.3;
    if (this.groundWalk && !this.attachOnArrive) this.dest[1] = walkSurfaceAt(w, this.dest[0], this.dest[2], this.dest[1] + 0.6);
    if (this.speed === Infinity) {
      e.pos = [...this.dest];
      this.finish();
      return false;
    }
    return true;
  }
  private chaseDest(): Vec3 {
    const t = this.chase!;
    const tp = this.engine.world.worldPos(t);
    const pad = this.action.to.dist === 'close' ? 0.6 : this.action.to.dist === 'near' ? 1.5 : 0.1;
    const d = stopAtEdge(this.e.pos, tp, footprintRadius(t), footprintRadius(this.e), pad);
    const w = this.engine.world;
    if (this.action.to.height !== 'ground') d[1] = this.e.pos[1];
    else d[1] = this.groundWalk ? walkSurfaceAt(w, d[0], d[2], this.e.pos[1] + 0.6) : w.ground(d[0], d[2]);
    return d;
  }
  update(dt: number): boolean {
    const e = this.e;
    const w = this.engine.world;
    if (this.chase) {
      if (!w.has(this.chase.id)) {
        this.finish();
        return true;
      }
      this.dest = this.chaseDest();
    }
    this.elapsed += dt;
    const dx = this.dest[0] - e.pos[0];
    const dz = this.dest[2] - e.pos[2];
    const dist = Math.hypot(dx, dz);
    const step = this.speed * dt;
    if (dist > 0.02) e.faceDir = [dx / dist, dz / dist];
    const dy = this.dest[1] - e.pos[1];
    if (dist <= step || this.elapsed > CHASE_CAP_S) {
      e.pos[0] = this.dest[0];
      e.pos[2] = this.dest[2];
      e.pos[1] = this.dest[1];
      this.finish();
      return true;
    }
    e.pos[0] += (dx / dist) * step;
    e.pos[2] += (dz / dist) * step;
    if (this.groundWalk) e.pos[1] = walkSurfaceAt(w, e.pos[0], e.pos[2], e.pos[1] + 0.6);
    // vertical: move toward the destination height proportionally to horizontal progress
    else e.pos[1] += dy * Math.min(1, step / dist);
    const tr = w.trans(e.id);
    this.phase += dt;
    const h = renderHeight(e);
    if (this.style === 'walk') {
      tr.ofs[1] = Math.abs(Math.sin(this.phase * 9)) * Math.min(0.08, h * 0.05);
      tr.sq = 1 + Math.sin(this.phase * 18) * 0.02;
    } else if (this.style === 'hop') {
      tr.ofs[1] = Math.abs(Math.sin(this.phase * 6)) * Math.min(0.5, h * 0.6);
    } else if (this.style === 'fly') {
      tr.ofs[1] = Math.sin(this.phase * 3) * 0.2;
    }
    return false;
  }
  private finish(): void {
    const e = this.e;
    const tr = this.engine.world.trans(e.id);
    tr.ofs[1] = 0;
    tr.sq = 1;
    const w = this.engine.world;
    if (this.attachOnArrive && this.chase && w.has(this.chase.id)) {
      w.attach(e.id, this.chase.id, 'top');
    } else if (w.heightAboveGround(e) <= 0.05) {
      e.pos[1] = w.ground(e.pos[0], e.pos[2]);
      resolveOverlap(w, e, this.engine.rng);
    }
    if (this.action.face) e.facing = this.action.face;
    this.engine.emit({ type: 'arrive', id: e.id, target: this.chase?.id ?? (this.action.to.of === 'player' ? 'player' : undefined) });
  }
  cancel(): void {
    if (!this.e) return;
    const tr = this.engine.world.trans(this.e.id);
    tr.ofs[1] = 0;
    tr.sq = 1;
  }
}

/** Fall under gravity until something solid or the ground; land with a squash, attach to what was landed on. */
export class FallTask extends BaseTask {
  private vy = 0;
  private landing = -1;
  private e!: Entity;
  constructor(
    private readonly id: string,
    private readonly engine: Engine,
    delay = 0,
  ) {
    super(delay);
    this.entity = id;
    this.channel = 'y';
  }
  start(): boolean {
    const w = this.engine.world;
    const e = w.get(this.id);
    if (!e) return false;
    this.e = e;
    if (e.parent) {
      // Dropping something that sits on a parent means it falls off: nudge it just past the parent's footprint
      // edge on the player's side, then let gravity do the rest.
      const parent = w.get(e.parent);
      w.detach(e.id);
      if (parent) {
        const pp = w.worldPos(parent);
        const toPlayer = dir2(pp, [w.player.pos[0], 0, w.player.pos[2]]);
        const dist = footprintRadius(parent) + footprintRadius(e) + 0.15;
        e.pos[0] = pp[0] + toPlayer[0] * dist;
        e.pos[2] = pp[2] + toPlayer[2] * dist;
      }
    }
    return true;
  }
  update(dt: number): boolean {
    const e = this.e;
    const w = this.engine.world;
    const tr = w.trans(e.id);
    if (this.landing >= 0) {
      this.landing += dt;
      const k = clamp(this.landing / 0.3, 0, 1);
      tr.sq = lerp(0.72, 1, easeOut(k));
      if (k >= 1) {
        tr.sq = 1;
        return true;
      }
      return false;
    }
    this.vy -= GRAVITY * dt;
    e.pos[1] += this.vy * dt;
    const exclude = new Set([e.id, ...this.engine.descendants(e.id)]);
    const support = supportAt(w, e.pos[0], e.pos[2], exclude);
    if (e.pos[1] <= support.y) {
      e.pos[1] = support.y;
      this.vy = 0;
      this.landing = 0;
      if (support.id) {
        const parent = w.get(support.id)!;
        const rel: Vec3 = [e.pos[0] - parent.pos[0], 0, e.pos[2] - parent.pos[2]];
        if (w.attach(e.id, parent.id, 'top')) e.pos = rel;
      } else {
        resolveOverlap(w, e, this.engine.rng);
      }
      this.engine.emit({ type: 'land', id: e.id, on: support.id, height: support.y });
    }
    return false;
  }
  cancel(): void {
    if (this.e) this.engine.world.trans(this.e.id).sq = 1;
  }
}

function setTasks(action: ResolvedSet, engine: Engine): Task[] {
  const tasks: Task[] = [];
  const dur = action.dur ?? 0.5;
  const delay = action.delay ?? 0;
  const w = engine.world;
  if (action.state || action.face || action.res) {
    tasks.push(
      new Tween(
        action.id,
        action.res ? 'sprite' : undefined,
        action.res ? 0.5 : 0,
        (k) => {
          if (!action.res) return;
          const e = w.get(action.id);
          if (!e) return;
          // morph: pop out, swap at the midpoint, settle back
          const punch = k < 0.5 ? 1 + k * 0.5 : 1.25 - (k - 0.5) * 0.5;
          w.trans(e.id).sq = punch;
          if (k >= 0.5 && e.word !== action.res.word) {
            e.word = action.res.word;
            e.label = action.res.placeholder ? action.word ?? action.res.word : action.res.word;
            e.sprite = { ...action.res.sprite };
            e.kind = action.res.kind;
            e.heightM = action.res.heightM;
            e.solid = action.res.solid;
            e.huge = action.res.huge;
            e.massClass = massClassFor(e.kind, e.heightM);
            engine.emit({ type: 'morph', id: e.id, word: e.word });
          }
        },
        () => {
          const e = w.get(action.id);
          if (!e) return false;
          if (action.face) e.facing = action.face;
          if (action.state) {
            for (const [key, value] of Object.entries(action.state)) {
              const prev = e.state[key];
              e.state[key] = value;
              if (prev !== value) engine.emit({ type: 'stateChange', id: e.id, key, value });
            }
          }
          return true;
        },
        () => {
          const e = w.get(action.id);
          if (e) w.trans(e.id).sq = 1;
        },
        delay,
      ),
    );
  }
  if (action.scale !== undefined) {
    let from = 1;
    const to = action.scale;
    tasks.push(
      new Tween(
        action.id,
        'scale',
        dur,
        (k) => {
          const e = w.get(action.id);
          if (e) e.scale = lerp(from, to, easeInOut(k));
        },
        () => {
          const e = w.get(action.id);
          if (!e) return false;
          from = e.scale;
          return true;
        },
        undefined,
        delay,
      ),
    );
  }
  if (action.tilt !== undefined) {
    let from = 0;
    const to = action.tilt;
    tasks.push(
      new Tween(
        action.id,
        'tilt',
        dur,
        (k) => {
          const e = w.get(action.id);
          if (e) e.tilt = lerp(from, to, easeInOut(k));
        },
        () => {
          const e = w.get(action.id);
          if (!e) return false;
          from = e.tilt;
          return true;
        },
        undefined,
        delay,
      ),
    );
  }
  return tasks;
}

function animTask(action: AnimAction, engine: Engine): Task {
  const w = engine.world;
  const times = Math.max(1, Math.round(action.times ?? 1));
  const cycle: Record<AnimAction['name'], number> = { hop: 0.5, wobble: 0.8, shake: 0.5, spin: 0.8, bounce: 0.5, nod: 0.8, fall_over: 0.6, pulse: 0.5 };
  const dur = cycle[action.name] * times;
  let baseTilt = 0;
  let baseScale = 1;
  const usesTilt = action.name === 'wobble' || action.name === 'spin' || action.name === 'nod' || action.name === 'fall_over';
  const usesScale = action.name === 'pulse';
  return new Tween(
    action.id,
    usesTilt ? 'tilt' : usesScale ? 'scale' : undefined,
    dur,
    (k) => {
      const e = w.get(action.id);
      if (!e) return;
      const tr = w.trans(e.id);
      const h = renderHeight(e);
      const c = (k * times) % 1; // progress within the current cycle
      switch (action.name) {
        case 'hop':
          tr.ofs[1] = Math.sin(c * Math.PI) * Math.min(0.6, Math.max(0.15, h * 0.4));
          break;
        case 'wobble':
          e.tilt = baseTilt + Math.sin(c * Math.PI * 4) * 12 * (1 - c);
          break;
        case 'shake':
          tr.ofs[0] = Math.sin(c * Math.PI * 12) * Math.min(0.15, h * 0.06) * (1 - c);
          break;
        case 'spin':
          e.tilt = baseTilt + easeInOut(c) * 360;
          break;
        case 'bounce':
          tr.sq = 1 - Math.sin(c * Math.PI) * 0.25;
          tr.ofs[1] = Math.sin(c * Math.PI) * 0.05;
          break;
        case 'nod':
          e.tilt = baseTilt + Math.sin(c * Math.PI * 2) * 8;
          break;
        case 'fall_over':
          e.tilt = lerp(baseTilt, 85, easeIn(k));
          break;
        case 'pulse':
          e.scale = baseScale * (1 + Math.sin(c * Math.PI) * 0.15);
          break;
      }
    },
    () => {
      const e = w.get(action.id);
      if (!e) return false;
      baseTilt = e.tilt;
      baseScale = e.scale;
      return true;
    },
    () => {
      const e = w.get(action.id);
      if (!e) return;
      const tr = w.trans(e.id);
      tr.ofs[0] = 0;
      tr.ofs[1] = 0;
      tr.sq = 1;
      if (action.name === 'spin' || action.name === 'wobble' || action.name === 'nod') e.tilt = baseTilt;
      if (action.name === 'pulse') e.scale = baseScale;
    },
    action.delay ?? 0,
  );
}

function removeTasks(action: RemoveAction, engine: Engine): Task[] {
  const w = engine.world;
  const ids = action.id === 'all' ? w.list().map((e) => e.id) : [action.id];
  const how = action.how ?? 'pop';
  const delay = action.delay ?? 0;
  return ids.map((id) => {
    let h = 1;
    let y0 = 0;
    let s0 = 1;
    const dur = how === 'fade' ? 0.6 : how === 'sink' ? 0.8 : how === 'fly_away' ? 1.2 : how === 'explode' ? 0.25 : 0.4;
    return new Tween(
      id,
      how === 'fade' || how === 'fly_away' ? 'alpha' : how === 'sink' ? 'y' : 'scale',
      dur,
      (k) => {
        const e = w.get(id);
        if (!e) return;
        switch (how) {
          case 'fade':
            e.alpha = 1 - k;
            break;
          case 'sink':
            e.pos[1] = y0 - h * easeIn(k);
            break;
          case 'fly_away':
            e.pos[1] = y0 + 10 * easeIn(k);
            e.alpha = 1 - k;
            break;
          case 'explode':
            e.scale = s0 * (1 + k * 0.6);
            e.alpha = 1 - easeIn(k);
            break;
          case 'pop':
          default:
            e.scale = s0 * (k < 0.35 ? 1 + k : Math.max(0.001, 1.35 * (1 - (k - 0.35) / 0.65)));
            break;
        }
      },
      () => {
        const e = w.get(id);
        if (!e) return false;
        h = renderHeight(e);
        y0 = e.pos[1];
        s0 = e.scale;
        if (how === 'explode') engine.emit({ type: 'effect', key: `explode:${id}:${engine.time.toFixed(2)}`, name: 'explosion', pos: w.worldPos(e), dur: 1.2 });
        return true;
      },
      () => {
        engine.removeEntity(id, how);
      },
      delay,
    );
  });
}

function sayTask(action: SayAction, engine: Engine): Task {
  const dur = action.dur ?? 2.5;
  return new Tween(
    undefined,
    undefined,
    Math.min(dur, 0.8),
    () => undefined,
    () => {
      if (action.id && !engine.world.has(action.id)) return false;
      engine.emit({ type: 'say', id: action.id, text: action.text, dur });
      return true;
    },
    undefined,
    action.delay ?? 0,
  );
}

function effectTask(action: EffectAction, engine: Engine): Task {
  const dur = action.loop ? 0 : (action.dur ?? 2);
  const key = `${action.name}:${action.id ?? 'pos'}:${engine.nextKey()}`;
  return new Tween(
    undefined,
    undefined,
    dur,
    () => undefined,
    () => {
      const w = engine.world;
      let pos: Vec3 | undefined;
      if (action.id) {
        const e = w.get(action.id);
        if (!e) return false;
        if (action.loop) {
          if (!e.effects.includes(action.name)) e.effects.push(action.name);
        }
      } else {
        const p = action.at ? resolvePlace(action.at, w, { radius: 0.3, heightM: 1 }, engine.rng) : null;
        pos = p ? p.pos : [w.player.pos[0] - Math.sin(w.player.yaw) * 3, 0, w.player.pos[2] - Math.cos(w.player.yaw) * 3];
      }
      engine.emit({ type: 'effect', key, name: action.name, id: action.id, pos, dur: action.loop ? undefined : dur, loop: action.loop });
      return true;
    },
    () => {
      if (!action.loop) engine.emit({ type: 'effectStop', key });
    },
    action.delay ?? 0,
  );
}

export function makeTasks(action: ResolvedAction, _script: Script, engine: Engine): Task[] {
  switch (action.op) {
    case 'spawn':
      return [new SpawnTask(action as ResolvedSpawn, engine)];
    case 'build':
      return [new BuildTask(action as ResolvedBuild, engine)];
    case 'move':
      return [new MoveTask(action, engine)];
    case 'set':
      return setTasks(action as ResolvedSet, engine);
    case 'anim':
      return [animTask(action, engine)];
    case 'attach':
      return [
        new Tween(
          action.id,
          undefined,
          0,
          () => undefined,
          () => {
            const ok = engine.world.attach(action.id, action.to, action.where ?? 'top');
            if (ok) engine.emit({ type: 'attach', id: action.id, to: action.to });
            return ok;
          },
          undefined,
          action.delay ?? 0,
        ),
      ];
    case 'drop':
      return [new FallTask(action.id, engine, action.delay ?? 0)];
    case 'remove':
      return removeTasks(action, engine);
    case 'say':
      return [sayTask(action, engine)];
    case 'effect':
      return [effectTask(action, engine)];
    case 'wait':
      return [new WaitTask(action.dur)];
    case 'sky':
      return [
        new Tween(
          undefined,
          undefined,
          0,
          () => undefined,
          () => {
            engine.world.sky = action.time;
            engine.emit({ type: 'sky', time: action.time });
            return true;
          },
          undefined,
          action.delay ?? 0,
        ),
      ];
    default:
      return [];
  }
}

export { Tween, WaitTask };
export const _test = { SPEED_M, DEG, dir2 };
