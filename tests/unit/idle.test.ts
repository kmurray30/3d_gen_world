import { describe, expect, it } from 'vitest';
import type { EngineEvent } from '../../src/shared/engine/index';
import { makeEngine, meadowWorld, spawn, tick } from '../helpers';

describe('idle life', () => {
  it('living things turn, wander or fidget on their own; objects never do', () => {
    const engine = makeEngine(meadowWorld(), true);
    engine.run([spawn('dog_1', 'dog', { rel: 'front' }, {}, 'animal', 0.6), spawn('cup_1', 'cup', { rel: 'left' }, {}, 'object', 0.12)]);
    tick(engine, 1);
    const dog = engine.world.get('dog_1')!;
    const cup = engine.world.get('cup_1')!;
    const start = { pos: [...dog.pos] as number[], yaw: dog.yaw, cup: [...cup.pos] as number[] };
    const idleScripts = new Set<string>();
    engine.on((ev: EngineEvent) => {
      if (ev.type === 'scriptDone' && ev.id.startsWith('idle_')) idleScripts.add(ev.id);
    });
    tick(engine, 40);
    expect(idleScripts.size).toBeGreaterThan(1);
    const moved = Math.hypot(dog.pos[0] - start.pos[0], dog.pos[2] - start.pos[2]) > 0.3 || Math.abs((dog.yaw ?? 0) - (start.yaw ?? 0)) > 10;
    expect(moved).toBe(true);
    expect(Math.hypot(dog.pos[0] - start.pos[0], dog.pos[2] - start.pos[2])).toBeLessThan(5); // stays around home
    expect(cup.pos).toEqual(start.cup);
    for (const id of idleScripts) expect(id).toMatch(/^idle_/);
  });

  it('leaves things a command just touched alone for a while', () => {
    const engine = makeEngine(meadowWorld(), true);
    engine.run([spawn('man_1', 'man', { rel: 'front' }, {}, 'human', 1.7)], 'cmd_1');
    tick(engine, 1);
    const man = engine.world.get('man_1')!;
    const pos = [...man.pos];
    const yaw = man.yaw;
    tick(engine, 9); // inside the 12 s cooldown since the command
    expect(man.pos).toEqual(pos);
    expect(man.yaw).toBe(yaw);
    tick(engine, 40);
    const changed = Math.hypot(man.pos[0] - pos[0], man.pos[2] - pos[2]) > 0.3 || Math.abs((man.yaw ?? 0) - (yaw ?? 0)) > 10;
    expect(changed).toBe(true);
  });

  it('spawned things face the player and have a world yaw', () => {
    const engine = makeEngine(meadowWorld());
    engine.world.player.pos = [3, 0, -4];
    engine.run([spawn('cat_1', 'cat', { rel: 'front' }, {}, 'animal', 0.4)]);
    tick(engine, 1);
    const cat = engine.world.get('cat_1')!;
    expect(typeof cat.yaw).toBe('number');
    const dx = engine.world.player.pos[0] - cat.pos[0];
    const dz = engine.world.player.pos[2] - cat.pos[2];
    const n = [Math.sin((cat.yaw! * Math.PI) / 180), Math.cos((cat.yaw! * Math.PI) / 180)];
    expect((n[0] * dx + n[1] * dz) / Math.hypot(dx, dz)).toBeGreaterThan(0.99);
  });
});
