import { describe, expect, it } from 'vitest';
import type { EngineEvent } from '../../src/shared/engine/index';
import { generate } from '../../src/shared/structure/index';
import { structureEntity } from '../../src/shared/structure/entity';
import { makeEngine, meadowWorld, spawn, tick } from '../helpers';
import { REACTION_LINES } from '../../src/shared/figure/anim';
import { getFigure, registerFigure } from '../../src/shared/figure/items';

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
    // a click on a wall does nothing; a click on the door works it
    expect(engine.poke('hut_1')).toBe(true);
    expect(engine.world.get('hut_1')!.state.door_open).toBeUndefined();
    tick(engine, 1);
    expect(engine.poke('hut_1', 'door')).toBe(true);
    expect(engine.world.get('hut_1')!.state.door_open).toBe(true);
    expect(events.some((ev) => ev.type === 'stateChange' && ev.id === 'hut_1' && ev.key === 'door_open' && ev.value === true)).toBe(true);
    expect(engine.poke('hut_1', 'door')).toBe(false); // cooldown
    tick(engine, 1);
    expect(engine.poke('hut_1', 'door')).toBe(true);
    expect(engine.world.get('hut_1')!.state.door_open).toBe(false);
  });

  it('a lighthouse has two doors that open one at a time', () => {
    const engine = makeEngine(meadowWorld());
    const s = generate('lighthouse', { cottage: true }, 3, decals)!;
    engine.world.add(structureEntity('lh_1', 'lighthouse', s, [0, 0, 12], 0, 0));
    engine.poke('lh_1', 'door_1');
    const e = engine.world.get('lh_1')!;
    expect(e.state.open_door_1).toBe(true);
    expect(e.state.door_open).toBeUndefined();
    tick(engine, 1);
    expect(engine.operate('lh_1', 'doors', 'open')).toBe(true);
    expect(e.state.door_open).toBe(true);
  });

  it('code-drawn things react with a clip and a line that fits it, and look at you; plain drawings wobble', () => {
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
    // the man's act: he waves and says a line that goes with a wave, at the same time
    const manSay = events.find((ev) => ev.type === 'say' && ev.id === 'man_1') as Extract<EngineEvent, { type: 'say' }>;
    expect(events.some((ev) => ev.type === 'anim' && ev.id === 'man_1' && ev.name === 'wave')).toBe(true);
    expect(REACTION_LINES.wave).toContain(manSay.text);
    // something with no act of its own reacts with a clip, and what it says belongs to that clip
    registerFigure({ ...getFigure('man')!, key: 'plain man', act: undefined });
    engine.run([spawn('pm_1', 'plain man', { rel: 'behind' }, {}, 'human', 1.7)]);
    tick(engine, 1);
    expect(engine.poke('pm_1')).toBe(true);
    tick(engine, 0.3);
    const pmPoke = events.find((ev) => ev.type === 'poke' && ev.id === 'pm_1') as Extract<EngineEvent, { type: 'poke' }>;
    const pmSay = events.find((ev) => ev.type === 'say' && ev.id === 'pm_1') as Extract<EngineEvent, { type: 'say' }>;
    expect(pmPoke.clip).toBeTruthy();
    expect(REACTION_LINES[pmPoke.clip!]).toContain(pmSay.text);
    // living things look at you for a while (front toward you, whatever way they were standing), then let go
    expect(engine.world.get('dog_1')!.facing).toBe('player');
    tick(engine, 4);
    expect(engine.world.get('dog_1')!.facing).toBeUndefined();
    expect(engine.world.get('dog_1')!.yaw).toBe(90);
  });
});
