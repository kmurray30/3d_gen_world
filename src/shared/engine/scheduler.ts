import type { ResolvedAction, ResolvedStep } from '../schema';

export type Channel = 'xz' | 'y' | 'facing' | 'scale' | 'tilt' | 'sprite' | 'alpha' | 'gesture';

/** A unit of work advanced by the scheduler every frame. `update` returns true when complete. */
export interface Task {
  entity?: string;
  channel?: Channel;
  /** Seconds to wait before `start` is called. */
  delay: number;
  started: boolean;
  preempted: boolean;
  /** Called once when the delay elapses. Return false to finish immediately (e.g. the entity is gone). */
  start(): boolean;
  update(dt: number): boolean;
  cancel?(): void;
}

export class Script {
  steps: ResolvedStep[] = [];
  cursor = 0;
  running: Task[] = [];
  sealed = false;
  finished = false;
  /** Entities a *different* script took over; later actions on them are skipped. */
  readonly lost = new Set<string>();
  constructor(readonly id: string) {}

  get idle(): boolean {
    return this.running.length === 0 && this.cursor >= this.steps.length;
  }
}

export type TaskFactory = (action: ResolvedAction, script: Script) => Task[];

/**
 * Runs scripts concurrently. Each script executes its steps in order; a step's tasks all run together and the next
 * step starts when they are all done or preempted. Tweens claim an (entity, channel) slot; a newer claim preempts
 * the older task so motion never fights.
 */
export class Scheduler {
  readonly scripts = new Map<string, Script>();
  private readonly channels = new Map<string, { task: Task; script: Script }>();
  private seq = 0;

  constructor(private readonly factory: TaskFactory) {}

  start(id = `s${++this.seq}`): Script {
    const s = new Script(id);
    this.scripts.set(id, s);
    return s;
  }

  append(script: Script, step: ResolvedStep): void {
    if (script.finished) return;
    script.steps.push(step);
  }

  seal(script: Script): void {
    script.sealed = true;
  }

  /** Run a complete script at once. */
  run(steps: ResolvedStep[], id?: string): Script {
    const s = this.start(id);
    for (const st of steps) this.append(s, st);
    this.seal(s);
    return s;
  }

  /** Whether a command's script is still playing. Idle life and bump reactions never count: they never stop. */
  get busy(): boolean {
    for (const s of this.scripts.values()) {
      if (s.id.startsWith('idle_') || s.id.startsWith('rule_')) continue;
      if (!s.finished && (s.running.length || s.cursor < s.steps.length)) return true;
    }
    return false;
  }

  /** Whether some task currently owns this channel of an entity. */
  isClaimed(entity: string, channel: Channel): boolean {
    return this.channels.has(`${entity}:${channel}`);
  }

  /** Called by a task when it starts. Preempts whatever held the channel. */
  claim(task: Task, script: Script): void {
    if (!task.entity || !task.channel) return;
    const key = `${task.entity}:${task.channel}`;
    const prev = this.channels.get(key);
    if (prev && prev.task !== task) {
      prev.task.preempted = true;
      prev.task.cancel?.();
      if (prev.script !== script) prev.script.lost.add(task.entity);
    }
    this.channels.set(key, { task, script });
  }

  private release(task: Task): void {
    if (!task.entity || !task.channel) return;
    const key = `${task.entity}:${task.channel}`;
    if (this.channels.get(key)?.task === task) this.channels.delete(key);
  }

  /** Advance all scripts. Returns the ids of scripts that finished this tick. */
  update(dt: number): string[] {
    const finished: string[] = [];
    for (const script of this.scripts.values()) {
      if (script.finished) continue;
      if (script.running.length === 0 && script.cursor < script.steps.length) this.beginStep(script);
      if (script.running.length) {
        const keep: Task[] = [];
        for (const task of script.running) {
          if (task.preempted) {
            this.release(task);
            continue;
          }
          if (!task.started) {
            task.delay -= dt;
            if (task.delay > 0) {
              keep.push(task);
              continue;
            }
            task.started = true;
            if (task.entity && script.lost.has(task.entity)) continue;
            this.claim(task, script);
            if (!task.start()) {
              this.release(task);
              continue;
            }
          }
          if (task.update(dt)) this.release(task);
          else keep.push(task);
        }
        script.running = keep;
      }
      if (script.running.length === 0 && script.cursor >= script.steps.length && script.sealed) {
        script.finished = true;
        finished.push(script.id);
      }
    }
    for (const id of finished) this.scripts.delete(id);
    return finished;
  }

  private beginStep(script: Script): void {
    const step = script.steps[script.cursor++];
    const actions: ResolvedAction[] = step.op === 'par' ? step.do : [step];
    for (const action of actions) {
      const entity = (action as { id?: string }).id;
      if (entity && script.lost.has(entity)) continue;
      for (const task of this.factory(action, script)) script.running.push(task);
    }
  }

  cancel(scriptId: string): void {
    const s = this.scripts.get(scriptId);
    if (!s) return;
    for (const t of s.running) {
      t.preempted = true;
      t.cancel?.();
      this.release(t);
    }
    s.running = [];
    s.finished = true;
    this.scripts.delete(scriptId);
  }

  cancelAll(): void {
    for (const id of [...this.scripts.keys()]) this.cancel(id);
    this.channels.clear();
  }
}
