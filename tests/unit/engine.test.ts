import { describe, expect, it } from 'vitest';
import type { EngineEvent } from '../../src/shared/engine/index';
import { footprintRadius } from '../../src/shared/engine/sizing';
import { emptyWorld, makeEngine, meadowWorld, set, spawn, tick } from '../helpers';

describe('Engine', () => {
  it('spawns with a pop-in and ends at the requested scale', () => {
    const engine = makeEngine(emptyWorld());
    engine.run([spawn('dog_1', 'dog', { rel: 'front' }, { scale: 1.5 }, 'animal', 0.6)]);
    tick(engine, 0.1);
    const dog = engine.world.get('dog_1')!;
    expect(dog.scale).toBeLessThan(1.5);
    tick(engine, 1);
    expect(dog.scale).toBeCloseTo(1.5, 5);
    expect(engine.busy).toBe(false);
  });

  it('moves to the edge of a target and emits arrive', () => {
    const engine = makeEngine(meadowWorld());
    const events: EngineEvent[] = [];
    engine.on((e) => events.push(e));
    engine.run([spawn('dog_1', 'dog', { rel: 'offscreen' }, {}, 'animal', 0.6), { op: 'move', id: 'dog_1', to: { rel: 'near', of: 'house_1', height: 'ground' }, speed: 'run' }]);
    tick(engine, 15);
    const dog = engine.world.get('dog_1')!;
    const house = engine.world.get('house_1')!;
    const d = Math.hypot(dog.pos[0] - house.pos[0], dog.pos[2] - house.pos[2]);
    expect(d).toBeGreaterThanOrEqual(footprintRadius(dog) + footprintRadius(house) - 1e-6);
    expect(d).toBeLessThan(footprintRadius(dog) + footprintRadius(house) + 2.5);
    expect(events.some((e) => e.type === 'arrive' && e.id === 'dog_1' && e.target === 'house_1')).toBe(true);
    expect(engine.world.trans('dog_1').ofs[1]).toBe(0);
  });

  it('a dropped thing lands on the ground or on top of a solid thing and attaches', () => {
    const engine = makeEngine(meadowWorld());
    const events: EngineEvent[] = [];
    engine.on((e) => events.push(e));
    engine.run([spawn('ball_1', 'ball', { rel: 'above', of: 'house_1' }, {}, 'object', 0.3), { op: 'drop', id: 'ball_1' }]);
    tick(engine, 4);
    const ball = engine.world.get('ball_1')!;
    expect(ball.parent).toBe('house_1');
    expect(engine.world.worldPos(ball)[1]).toBeCloseTo(5, 3);
    expect(events.some((e) => e.type === 'land' && e.on === 'house_1')).toBe(true);
    engine.run([spawn('rock_2', 'rock', { rel: 'front', height: 'high' }, {}, 'object', 0.5), { op: 'drop', id: 'rock_2' }]);
    tick(engine, 4);
    expect(engine.world.get('rock_2')!.pos[1]).toBe(0);
  });

  it('dropping something that sits on a parent makes it fall off the edge', () => {
    const engine = makeEngine(meadowWorld());
    engine.run([spawn('cat_1', 'cat', { rel: 'on', of: 'house_1' }, {}, 'animal', 0.3), { op: 'drop', id: 'cat_1' }]);
    tick(engine, 5);
    const cat = engine.world.get('cat_1')!;
    const house = engine.world.get('house_1')!;
    expect(cat.parent).toBeUndefined();
    expect(cat.pos[1]).toBe(0);
    expect(Math.hypot(cat.pos[0] - house.pos[0], cat.pos[2] - house.pos[2])).toBeGreaterThan(footprintRadius(house));
  });

  it('removing a parent drops its children', () => {
    const engine = makeEngine(meadowWorld());
    engine.run([spawn('cat_1', 'cat', { rel: 'on', of: 'house_1' }, {}, 'animal', 0.3), { op: 'remove', id: 'house_1', how: 'pop' }]);
    tick(engine, 6);
    expect(engine.world.has('house_1')).toBe(false);
    const cat = engine.world.get('cat_1')!;
    expect(cat.parent).toBeUndefined();
    expect(cat.pos[1]).toBe(0);
  });

  it('set morphs the sprite, tweens scale and tilt, and reports state changes', () => {
    const engine = makeEngine(meadowWorld());
    const events: EngineEvent[] = [];
    engine.on((e) => events.push(e));
    engine.run([
      set('flower_1', { scale: 2, tilt: -30, dur: 0.5, state: { on_fire: true } }),
      set('flower_1', { word: 'sunflower', res: { word: 'sunflower', sprite: { file: null, w: 256, h: 512 }, kind: 'object', heightM: 1.5, solid: true, huge: false, placeholder: false } }),
    ]);
    tick(engine, 2);
    const f = engine.world.get('flower_1')!;
    expect(f.scale).toBeCloseTo(2, 5);
    expect(f.tilt).toBeCloseTo(-30, 5);
    expect(f.word).toBe('sunflower');
    expect(f.heightM).toBe(1.5);
    expect(events.some((e) => e.type === 'stateChange' && e.key === 'on_fire' && e.value === true)).toBe(true);
    expect(events.some((e) => e.type === 'morph')).toBe(true);
  });

  it('par steps run together; say and effect events fire; scriptDone is emitted', () => {
    const engine = makeEngine(meadowWorld());
    const events: EngineEvent[] = [];
    engine.on((e) => events.push(e));
    engine.run([
      { op: 'par', do: [{ op: 'say', id: 'tree_1', text: 'hello' }, { op: 'effect', name: 'sparkle', id: 'tree_1', dur: 0.5 }, { op: 'anim', id: 'rock_1', name: 'hop' }] },
      { op: 'wait', dur: 0.2 },
    ]);
    tick(engine, 0.05);
    expect(events.filter((e) => e.type === 'say').length).toBe(1);
    expect(events.filter((e) => e.type === 'effect').length).toBe(1);
    tick(engine, 2);
    expect(events.some((e) => e.type === 'effectStop')).toBe(true);
    expect(events.some((e) => e.type === 'scriptDone')).toBe(true);
    expect(engine.world.trans('rock_1').ofs[1]).toBe(0);
  });

  it('a newer script takes over an entity mid-move and the older one skips its later actions on it', () => {
    const engine = makeEngine(meadowWorld());
    const events: EngineEvent[] = [];
    engine.on((e) => events.push(e));
    engine.run([spawn('dog_1', 'dog', { rel: 'front' }, {}, 'animal', 0.6)]);
    tick(engine, 1);
    engine.run([{ op: 'move', id: 'dog_1', to: { rel: 'near', of: 'house_1', height: 'ground' }, speed: 'slow' }, { op: 'say', id: 'dog_1', text: 'made it' }], 'older');
    tick(engine, 0.5);
    engine.run([{ op: 'move', id: 'dog_1', to: { rel: 'near', of: 'tree_1', height: 'ground' }, speed: 'run' }], 'newer');
    tick(engine, 12);
    const dog = engine.world.get('dog_1')!;
    const tree = engine.world.get('tree_1')!;
    expect(Math.hypot(dog.pos[0] - tree.pos[0], dog.pos[2] - tree.pos[2])).toBeLessThan(6);
    expect(events.some((e) => e.type === 'say')).toBe(false);
    expect(engine.busy).toBe(false);
  });

  it('remove all clears the world', () => {
    const engine = makeEngine(meadowWorld());
    engine.run([{ op: 'remove', id: 'all', how: 'fade' }]);
    tick(engine, 2);
    expect(engine.world.size).toBe(0);
  });
});
