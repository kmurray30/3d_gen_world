import { describe, expect, it } from 'vitest';
import { buildStructureMesh } from '../../src/shared/structure/geometry';
import { generate } from '../../src/shared/structure/index';
import { structureEntity } from '../../src/shared/structure/entity';
import { describeParts, findMovers, jointOn, movers, pieceParts, wantedState, windowParts } from '../../src/shared/structure/joints';
import type { Structure } from '../../src/shared/structure/types';
import { ActionSchema } from '../../src/shared/schema';
import { makeEngine, tick } from '../helpers';

const sprites = (word: string) => (word === 'door' ? { file: 'door.webp', w: 261, h: 399 } : word === 'window' ? { file: 'window.webp', w: 312, h: 373 } : null);
const build = (gen: string, params: Record<string, unknown> = {}, seed = 3): Structure => generate(gen, params as never, seed, sprites)!;

function withStructure(id: string, word: string, s: Structure, pos: [number, number, number] = [0, 0, -6]) {
  const engine = makeEngine();
  engine.world.add(structureEntity(id, word, s, pos, 0, 0));
  return engine;
}

describe('moving pieces of built things', () => {
  it('a mailbox has a door hinged along its bottom front edge and a flag; each moves as its own mesh and outline', () => {
    const s = build('mailbox', { color: 'red' });
    const door = s.joints!.find((j) => j.id === 'door')!;
    const flag = s.joints!.find((j) => j.id === 'flag')!;
    expect(door).toMatchObject({ kind: 'hinge', axis: [1, 0, 0], states: ['closed', 'open'] });
    expect(flag.states).toEqual(['down', 'up']);
    // the hinge is at the front of the box, at the bottom of the door
    const doorParts = s.parts.filter((p) => p.joint === 'door');
    expect(doorParts.length).toBeGreaterThanOrEqual(3);
    expect(door.at[2]).toBeCloseTo(Math.max(...doorParts.map((p) => p.pos[2] + (p.t === 'box' ? p.d / 2 : 0))), 1);
    expect(door.at[1]).toBeCloseTo(Math.min(...doorParts.map((p) => p.pos[1])), 3);
    const mesh = buildStructureMesh(s);
    expect(mesh.groups.some((g) => g.joint === 'door')).toBe(true);
    expect(mesh.groups.some((g) => g.joint === 'flag')).toBe(true);
    expect(mesh.jointEdges.door.length).toBeGreaterThan(0);
    expect(mesh.jointEdges.flag.length).toBeGreaterThan(0);
    // a static group never holds a moving part's faces
    const still = buildStructureMesh({ ...s, parts: s.parts.filter((p) => !p.joint) });
    const total = (m: ReturnType<typeof buildStructureMesh>) => m.groups.filter((g) => !g.joint).reduce((n, g) => n + g.mesh.pos.length, 0);
    expect(total(mesh)).toBe(total(still));
  });

  it('every prop with a moving part names it, with two states', () => {
    const want: Record<string, string[]> = { mailbox: ['door', 'flag'], trash_can: ['lid'], well: ['bucket'], lamppost: ['lamp'], fountain: ['water'] };
    for (const [gen, names] of Object.entries(want)) {
      const s = build(gen);
      const ms = movers(s).map((m) => m.name);
      for (const n of names) expect(ms, gen).toContain(n);
      for (const j of s.joints ?? []) {
        expect(s.parts.some((p) => p.joint === j.id), `${gen} ${j.id} has parts`).toBe(true);
        if (j.follow) expect(s.joints!.some((k) => k.id === j.follow)).toBe(true);
      }
    }
  });

  it('finds pieces by the words people use', () => {
    const mailbox = build('mailbox');
    expect(findMovers(mailbox, 'the door').map((m) => m.name)).toEqual(['door']);
    expect(findMovers(mailbox, 'mail flag').map((m) => m.name)).toEqual(['flag']);
    expect(findMovers(build('lamppost'), 'light').map((m) => m.name)).toEqual(['lamp']);
    expect(findMovers(build('well'), 'rope').map((m) => m.name)).toEqual(['bucket']);
    const house = build('house', { w: 7, d: 5, windows: true, shutters: true });
    const windows = windowParts(house).length;
    expect(windows).toBeGreaterThan(2);
    expect(findMovers(house, 'windows').length).toBe(windows);
    expect(findMovers(house, 'shutters').length).toBe(windows);
    expect(findMovers(house, 'window').length).toBe(1);
    expect(findMovers(house, 'front door').map((m) => m.name)).toEqual(['door']);
    const flag = movers(mailbox).find((m) => m.name === 'flag')!;
    expect(wantedState(flag, 'raise', 0)).toBe(1);
    expect(wantedState(flag, 'lowered', 1)).toBe(0);
    expect(wantedState(flag, 'toggle', 1)).toBe(0);
    expect(wantedState(flag, 'open', 0)).toBeNull();
  });

  it('clicking the mailbox door opens it, again closes it; the flag goes up on its own', () => {
    const engine = withStructure('mailbox_1', 'mailbox', build('mailbox'));
    expect(engine.poke('mailbox_1', 'door')).toBe(true);
    expect(engine.world.get('mailbox_1')!.state.open_door).toBe(true);
    tick(engine, 1);
    engine.poke('mailbox_1', 'door');
    expect(engine.world.get('mailbox_1')!.state.open_door).toBe(false);
    tick(engine, 1);
    engine.poke('mailbox_1', 'flag');
    const e = engine.world.get('mailbox_1')!;
    expect(e.state.open_flag).toBe(true);
    expect(e.state.open_door).toBe(false);
    expect(describeParts(e)).toEqual(expect.arrayContaining(['door (closed)', 'flag (up)']));
    // a click on the box itself works the door
    tick(engine, 1);
    engine.poke('mailbox_1');
    expect(engine.world.get('mailbox_1')!.state.open_door).toBe(true);
  });

  it('operate moves pieces by state name, follows joints that move with another, and couples windows and shutters', () => {
    expect(ActionSchema.safeParse({ op: 'operate', id: 'well_1', part: 'bucket', to: 'down' }).success).toBe(true);
    const engine = withStructure('well_1', 'well', build('well'));
    engine.run([{ op: 'operate', id: 'well_1', part: 'bucket', to: 'down' }]);
    tick(engine, 0.1);
    const well = engine.world.get('well_1')!;
    expect(well.state.open_bucket).toBe(true);
    const crank = well.structure!.joints!.find((j) => j.id === 'crank')!;
    expect(jointOn(well, crank)).toBe(true);
    // asking a lamp to "open" does nothing; "off" switches it off
    engine.world.add(structureEntity('lamp_1', 'lamp post', build('lamppost'), [3, 0, -6], 0, 0));
    expect(engine.operate('lamp_1', 'lamp', 'open')).toBe(false);
    expect(engine.operate('lamp_1', 'light', 'off')).toBe(true);
    expect(engine.world.get('lamp_1')!.state.open_lamp).toBe(true);
    expect(describeParts(engine.world.get('lamp_1')!)).toContain('lamp (off)');

    engine.world.add(structureEntity('house_1', 'house', build('house', { w: 7, d: 5, windows: true, shutters: true }), [-10, 0, -8], 0, 0));
    expect(engine.operate('house_1', 'windows', 'open')).toBe(true);
    const house = engine.world.get('house_1')!;
    const n = windowParts(house.structure!).length;
    for (let i = 0; i < n; i++) expect(house.state[`open_window_${i}`]).toBe(true);
    expect(describeParts(house)).toContain('windows (open)');
    // shutting the shutters shuts the window behind them; opening a window opens its shutters
    engine.operate('house_1', 'shutters_1', 'closed');
    expect(house.state.open_shutters_1).toBe(true);
    expect(house.state.open_window_1).toBe(false);
    expect(describeParts(house)).toContain(`windows (${n - 1} of ${n} open)`);
    engine.operate('house_1', 'window_1', 'open');
    expect(house.state.open_shutters_1).toBe(false);
    // the door still answers to the house's own key
    engine.operate('house_1', 'door', 'open');
    expect(house.state.door_open).toBe(true);
  });

  it("a house's roof comes off as a structure of its own, lands beside it, and goes back where it was", () => {
    const s = build('house', { w: 6, d: 5, roof: 'gable', chimney: true });
    const engine = withStructure('house_1', 'house', s);
    const before = structuredClone(s.parts);
    const roofCount = pieceParts(s, 'roof').length;
    expect(roofCount).toBeGreaterThan(0);
    engine.run([{ op: 'detach', id: 'house_1', part: 'the roof', newId: 'roof_1' }]);
    tick(engine, 0.05);
    const roof = engine.world.get('roof_1')!;
    expect(roof.structure?.gen).toBe('piece');
    expect(roof.structure!.parts.length).toBe(roofCount);
    expect(roof.word).toBe('roof');
    const house = engine.world.get('house_1')!;
    expect(house.state.off_roof).toBe(true);
    expect(house.structure!.parts.length).toBe(before.length - roofCount);
    expect(describeParts(house)).toContain('roof (off)');
    // it starts up where the roof was, then falls clear of the house
    expect(roof.pos[1]).toBeGreaterThan(2);
    tick(engine, 3);
    const landed = engine.world.get('roof_1')!;
    expect(landed.pos[1]).toBeLessThan(0.1);
    expect(Math.hypot(landed.pos[0] - 0, landed.pos[2] + 6)).toBeGreaterThan(3);
    // a poke on the loose roof puts it back exactly
    expect(engine.poke('roof_1')).toBe(true);
    tick(engine, 0.5);
    expect(engine.world.has('roof_1')).toBe(false);
    const back = engine.world.get('house_1')!;
    expect(back.state.off_roof).toBeUndefined();
    const key = (p: { t: string; pos: number[]; name?: string }) => `${p.t}:${p.name ?? ''}:${p.pos.map((v) => v.toFixed(2)).join(',')}`;
    expect(back.structure!.parts.map(key).sort()).toEqual(before.map(key).sort());
  });

  it('the mailbox door comes off too, and keeps working once it is back', () => {
    const engine = withStructure('mailbox_1', 'mailbox', build('mailbox'));
    expect(engine.detachPiece('mailbox_1', 'door', 'door_1')).toBe('door_1');
    expect(engine.world.get('mailbox_1')!.structure!.parts.some((p) => p.joint === 'door')).toBe(false);
    expect(engine.reattachPiece('mailbox_1', 'door')).toBe(true);
    expect(engine.world.get('mailbox_1')!.structure!.parts.filter((p) => p.joint === 'door').length).toBeGreaterThanOrEqual(3);
    // nothing by that name: nothing comes off
    expect(engine.detachPiece('mailbox_1', 'chimney', 'x')).toBeNull();
  });
});
