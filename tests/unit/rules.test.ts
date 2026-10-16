import { describe, expect, it } from 'vitest';
import type { EngineEvent } from '../../src/shared/engine/index';
import { footprintRadius } from '../../src/shared/engine/sizing';
import { PLAYER_RADIUS } from '../../src/shared/types';
import { makeEngine, meadowWorld, res, spawn, tick } from '../helpers';

describe('collisions and rules', () => {
  it('big solid things push the player out; small things do not block', () => {
    const engine = makeEngine(meadowWorld());
    const house = engine.world.get('house_1')!;
    engine.world.player.pos = [house.pos[0] - 0.2, 0, house.pos[2]];
    const bumps = engine.collidePlayer();
    expect(bumps.some((b) => b.id === 'house_1' && b.blocked)).toBe(true);
    const d = Math.hypot(engine.world.player.pos[0] - house.pos[0], engine.world.player.pos[2] - house.pos[2]);
    expect(d).toBeCloseTo(footprintRadius(house) + PLAYER_RADIUS, 4);
    const flower = engine.world.get('flower_1')!;
    engine.world.player.pos = [flower.pos[0] + 0.1, 0, flower.pos[2]];
    const b2 = engine.collidePlayer();
    expect(b2.some((b) => b.id === 'flower_1' && !b.blocked)).toBe(true);
    expect(engine.world.player.pos[0]).toBeCloseTo(flower.pos[0] + 0.1, 5);
  });

  it('bumping an animal makes it hop away once per cooldown', () => {
    const engine = makeEngine(meadowWorld());
    engine.run([spawn('dog_1', 'dog', { rel: 'front' }, {}, 'animal', 0.6)]);
    tick(engine, 1);
    const dog = engine.world.get('dog_1')!;
    const before: [number, number] = [dog.pos[0], dog.pos[2]];
    engine.world.player.pos = [dog.pos[0] + 0.1, 0, dog.pos[2]];
    engine.collidePlayer();
    engine.collidePlayer();
    expect(engine.scheduler.scripts.size).toBe(1);
    tick(engine, 3);
    expect(Math.hypot(dog.pos[0] - before[0], dog.pos[2] - before[1])).toBeGreaterThan(0.5);
  });

  it('bumping a light object nudges it and wobbles it', () => {
    const engine = makeEngine(meadowWorld());
    engine.run([spawn('cup_1', 'cup', { rel: 'front' }, {}, 'object', 0.12)]);
    tick(engine, 1);
    const cup = engine.world.get('cup_1')!;
    const x0 = cup.pos[0];
    const z0 = cup.pos[2];
    engine.world.player.pos = [cup.pos[0], 0, cup.pos[2] + 0.05];
    engine.collidePlayer();
    expect(Math.hypot(cup.pos[0] - x0, cup.pos[2] - z0)).toBeCloseTo(0.4, 2);
    tick(engine, 0.2);
    expect(cup.tilt).not.toBe(0);
    tick(engine, 1.5);
    expect(cup.tilt).toBeCloseTo(0, 5);
  });

  it('fire state adds persistent effects; water nearby puts it out with steam', () => {
    const engine = makeEngine(meadowWorld());
    const events: EngineEvent[] = [];
    engine.on((e) => events.push(e));
    engine.run([{ op: 'set', id: 'house_1', state: { on_fire: true } }]);
    tick(engine, 0.5);
    const house = engine.world.get('house_1')!;
    expect(house.effects).toEqual(['fire', 'smoke']);
    engine.run([spawn('cloud_1', 'cloud', { rel: 'above', of: 'house_1', height: 'high' }, { res: res('cloud', 'other', 3, false) }), { op: 'effect', name: 'rain', id: 'cloud_1', dur: 2 }]);
    tick(engine, 4);
    expect(house.state.on_fire).toBe(false);
    expect(house.effects).toEqual([]);
    expect(events.some((e) => e.type === 'effect' && e.name === 'steam' && e.id === 'house_1')).toBe(true);
  });

  it('landing puffs dust', () => {
    const engine = makeEngine(meadowWorld());
    const events: EngineEvent[] = [];
    engine.on((e) => events.push(e));
    engine.run([spawn('rock_9', 'rock', { rel: 'front', height: 'high' }, {}, 'object', 0.5), { op: 'drop', id: 'rock_9' }]);
    tick(engine, 3);
    expect(events.some((e) => e.type === 'effect' && e.name === 'dust')).toBe(true);
  });
});
