import { describe, expect, it } from 'vitest';
import type { EngineEvent } from '../../src/shared/engine/index';
import { generate } from '../../src/shared/structure/index';
import { structureEntity } from '../../src/shared/structure/entity';
import { makeEngine, meadowWorld, spawn, tick } from '../helpers';

const decals = (word: string) => (word === 'door' ? { file: 'door.webp', w: 300, h: 600 } : null);

describe('poking things', () => {
  it('a house with a door opens and closes it', () => {
    const engine = makeEngine(meadowWorld());
    const events: EngineEvent[] = [];
    engine.on((e) => events.push(e));
    const s = generate('house', { stories: 1, w: 5, d: 4 }, 3, decals)!;
    expect(s.parts.some((p) => p.t === 'decal' && p.role === 'door')).toBe(true);
    const e = structureEntity('hut_1', 'hut', s, [0, 0, 6], 180, 0);
    engine.world.add(e);
    expect(engine.poke('hut_1')).toBe(true);
    expect(engine.world.get('hut_1')!.state.door_open).toBe(true);
    expect(events.some((ev) => ev.type === 'stateChange' && ev.id === 'hut_1' && ev.key === 'door_open' && ev.value === true)).toBe(true);
    expect(engine.poke('hut_1')).toBe(false); // cooldown
    tick(engine, 1);
    expect(engine.poke('hut_1')).toBe(true);
    expect(engine.world.get('hut_1')!.state.door_open).toBe(false);
  });

  it('animals turn to you and yelp; people greet; objects wobble', () => {
    const engine = makeEngine(meadowWorld());
    engine.run([spawn('dog_1', 'dog', { rel: 'front' }, {}, 'animal', 0.6), spawn('man_1', 'man', { rel: 'left' }, {}, 'human', 1.7), spawn('cup_1', 'cup', { rel: 'right' }, {}, 'object', 0.12)]);
    tick(engine, 1);
    const events: EngineEvent[] = [];
    engine.on((e) => events.push(e));
    engine.world.get('dog_1')!.yaw = 90;
    expect(engine.poke('dog_1')).toBe(true);
    expect(engine.poke('man_1')).toBe(true);
    expect(engine.poke('cup_1')).toBe(true);
    tick(engine, 0.6);
    expect(events.filter((ev) => ev.type === 'poke').length).toBe(3);
    expect(events.some((ev) => ev.type === 'say' && ev.id === 'dog_1')).toBe(true);
    expect(events.some((ev) => ev.type === 'say' && ev.id === 'man_1' && ev.text.length > 1)).toBe(true);
    expect(engine.world.trans('cup_1').ofs[0] !== 0 || engine.world.trans('cup_1').ofs[1] !== 0 || engine.world.get('cup_1')!.tilt !== 0).toBe(true);
    tick(engine, 2);
    const dog = engine.world.get('dog_1')!;
    const dx = engine.world.player.pos[0] - dog.pos[0];
    const dz = engine.world.player.pos[2] - dog.pos[2];
    const n = [Math.sin((dog.yaw! * Math.PI) / 180), Math.cos((dog.yaw! * Math.PI) / 180)];
    expect((n[0] * dx + n[1] * dz) / Math.hypot(dx, dz)).toBeGreaterThan(0.95); // turned to face the player
  });
});
