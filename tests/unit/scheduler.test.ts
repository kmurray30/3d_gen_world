import { describe, expect, it } from 'vitest';
import { Scheduler, type Task } from '../../src/shared/engine/scheduler';
import type { ResolvedAction, ResolvedStep } from '../../src/shared/schema';

interface Log {
  started: string[];
  finished: string[];
}

function fakeTask(name: string, dur: number, log: Log, entity?: string, channel?: Task['channel'], delay = 0): Task {
  let t = 0;
  return {
    entity,
    channel,
    delay,
    started: false,
    preempted: false,
    start() {
      log.started.push(name);
      return true;
    },
    update(dt) {
      t += dt;
      if (t >= dur) {
        log.finished.push(name);
        return true;
      }
      return false;
    },
    cancel() {
      log.finished.push(`${name}!`);
    },
  };
}

/** Each fake action is a `wait` carrying metadata in `dur`; the factory maps it to a fake task. */
function makeFactory(log: Log, spec: Record<string, { dur: number; entity?: string; channel?: Task['channel']; delay?: number }>) {
  return (action: ResolvedAction): Task[] => {
    const a = action as unknown as { name: string };
    const s = spec[a.name];
    return [fakeTask(a.name, s.dur, log, s.entity, s.channel, s.delay)];
  };
}
const act = (name: string): ResolvedAction => ({ op: 'wait', dur: 0, name } as unknown as ResolvedAction);
const par = (...names: string[]): ResolvedStep => ({ op: 'par', do: names.map(act) });

function run(s: Scheduler, seconds: number, step = 0.1): string[] {
  const done: string[] = [];
  for (let t = 0; t < seconds - 1e-9; t += step) done.push(...s.update(step));
  return done;
}

describe('Scheduler', () => {
  it('runs steps in order and par steps together', () => {
    const log: Log = { started: [], finished: [] };
    const s = new Scheduler(makeFactory(log, { a: { dur: 0.3 }, b: { dur: 0.2 }, c: { dur: 0.5 }, d: { dur: 0.1 } }));
    const script = s.run([act('a'), par('b', 'c'), act('d')]);
    run(s, 0.25);
    expect(log.started).toEqual(['a']);
    run(s, 0.1);
    expect(log.finished).toEqual(['a']);
    expect(log.started).toEqual(['a', 'b', 'c']);
    run(s, 0.3);
    expect(log.finished).toEqual(['a', 'b']);
    expect(log.started).not.toContain('d');
    const finished = run(s, 0.4);
    expect(log.started).toContain('d');
    run(s, 0.2);
    expect(script.finished).toBe(true);
    expect(finished.concat(run(s, 0.1))).toContain(script.id);
  });

  it('honours delays inside a par group', () => {
    const log: Log = { started: [], finished: [] };
    const s = new Scheduler(makeFactory(log, { a: { dur: 0.1 }, b: { dur: 0.1, delay: 0.5 } }));
    s.run([par('a', 'b')]);
    run(s, 0.3);
    expect(log.started).toEqual(['a']);
    run(s, 0.4);
    expect(log.started).toEqual(['a', 'b']);
  });

  it('a newer claim on the same channel preempts the older task and marks the entity lost for the older script', () => {
    const log: Log = { started: [], finished: [] };
    const s = new Scheduler(
      makeFactory(log, {
        walk: { dur: 2, entity: 'dog', channel: 'xz' },
        sit: { dur: 0.1, entity: 'dog', channel: 'tilt' },
        bark: { dur: 0.1 },
        run: { dur: 0.5, entity: 'dog', channel: 'xz' },
      }),
    );
    const older = s.run([act('walk'), act('sit'), act('bark')]);
    run(s, 0.3);
    const newer = s.run([act('run')]);
    run(s, 0.2);
    expect(log.finished).toContain('walk!'); // cancelled
    expect(older.lost.has('dog')).toBe(true);
    run(s, 1);
    // older script continues: 'sit' targets the lost dog so it is skipped, 'bark' (no entity) still runs
    expect(log.started).not.toContain('sit');
    expect(log.started).toContain('bark');
    expect(older.finished).toBe(true);
    expect(newer.finished).toBe(true);
  });

  it('streams: idles between appended steps and finishes only after seal', () => {
    const log: Log = { started: [], finished: [] };
    const s = new Scheduler(makeFactory(log, { a: { dur: 0.1 }, b: { dur: 0.1 } }));
    const script = s.start('stream');
    s.append(script, act('a'));
    run(s, 0.5);
    expect(log.finished).toEqual(['a']);
    expect(script.finished).toBe(false);
    expect(s.busy).toBe(false);
    s.append(script, act('b'));
    run(s, 0.3);
    expect(log.finished).toEqual(['a', 'b']);
    expect(script.finished).toBe(false);
    s.seal(script);
    const done = run(s, 0.1);
    expect(done).toEqual(['stream']);
    expect(script.finished).toBe(true);
  });

  it('cancelAll stops every task and empties the scheduler', () => {
    const log: Log = { started: [], finished: [] };
    const s = new Scheduler(makeFactory(log, { a: { dur: 5, entity: 'x', channel: 'xz' } }));
    s.run([act('a')]);
    run(s, 0.2);
    s.cancelAll();
    expect(log.finished).toEqual(['a!']);
    expect(s.busy).toBe(false);
    expect(s.scripts.size).toBe(0);
  });
});
