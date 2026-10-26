import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { RigSchema, findPiece, rigOrder, type Rig } from '../../src/shared/rig';
import { GESTURES, GESTURE_SECONDS } from '../../src/shared/gestures';
import { ActionSchema } from '../../src/shared/schema';
import type { Entity } from '../../src/shared/types';
import { makeEngine, tick } from '../helpers';

const RIGS = path.resolve('assets/rigs');
const rigs = new Map<string, Rig>(
  fs
    .readdirSync(RIGS)
    .filter((f) => f.endsWith('.json') && f !== 'index.json')
    .map((f) => {
      const rig = RigSchema.parse(JSON.parse(fs.readFileSync(path.join(RIGS, f), 'utf8')));
      return [rig.file, rig] as const;
    }),
);

function character(id: string, file: string, kind: Entity['kind'], heightM: number): Entity {
  return { id, word: file.replace('.webp', ''), label: id, sprite: { file, w: 100, h: 300 }, pos: [0, 0, -3], flip: false, scale: 1, heightM, tilt: 0, state: {}, effects: [], kind, solid: true, massClass: 'medium', huge: false, createdAt: 0, yaw: 0 };
}

describe('rigs', () => {
  it('every shipped rig is valid: pieces hang from pieces that exist, joints and boxes inside the drawing', () => {
    const index = JSON.parse(fs.readFileSync(path.join(RIGS, 'index.json'), 'utf8')) as { files: string[] };
    expect(index.files.length).toBe(rigs.size);
    expect(rigs.size).toBeGreaterThanOrEqual(20);
    for (const rig of rigs.values()) {
      expect(index.files).toContain(rig.file);
      expect(fs.existsSync(path.join(RIGS, rig.file.replace('.webp', '.png'))), rig.file).toBe(true);
      const ids = new Set(rig.pieces.map((p) => p.id));
      expect(ids.size, rig.file).toBe(rig.pieces.length);
      expect(rig.pieces.filter((p) => !p.parent).length, `${rig.file} has one root`).toBe(1);
      for (const p of rig.pieces) {
        if (p.parent) expect(ids.has(p.parent), `${rig.file}: ${p.id} -> ${p.parent}`).toBe(true);
        for (const v of [...p.pivot, ...p.bbox]) expect(v, `${rig.file}: ${p.id}`).toBeGreaterThanOrEqual(-0.01), expect(v).toBeLessThanOrEqual(1.01);
        expect(p.bbox[2]).toBeGreaterThan(p.bbox[0]);
        expect(p.bbox[3]).toBeGreaterThan(p.bbox[1]);
      }
      // parents come before their children in build order
      const seen = new Set<string>();
      for (const p of rigOrder(rig)) {
        if (p.parent) expect(seen.has(p.parent), `${rig.file}: ${p.id}`).toBe(true);
        seen.add(p.id);
      }
    }
  });

  it('people have heads, arms and hands, and faces; animals have legs; objects have their moving parts', () => {
    for (const f of ['boy.webp', 'girl.webp', 'man.webp', 'woman.webp', 'farmer.webp', 'teacher.webp']) {
      const kinds = rigs.get(f)!.pieces.map((p) => p.kind);
      for (const k of ['head', 'arm', 'hand', 'leg', 'eye', 'mouth']) expect(kinds, `${f} ${k}`).toContain(k);
    }
    for (const f of ['dog.webp', 'cow.webp', 'sheep.webp']) expect(rigs.get(f)!.pieces.filter((p) => p.kind === 'leg').length, f).toBe(4);
    expect(rigs.get('car.webp')!.pieces.filter((p) => p.kind === 'wheel').length).toBe(2);
    expect(rigs.get('clock.webp')!.pieces.filter((p) => p.kind === 'clock_hand').length).toBe(2);
    expect(rigs.get('windmill.webp')!.pieces.some((p) => p.kind === 'blade')).toBe(true);
    expect(rigs.get('farmer.webp')!.pieces.find((p) => p.kind === 'hat')?.detach).toBe('hat');
  });

  it("finds a part by name, with left and right being the character's own", () => {
    const boy = rigs.get('boy.webp')!;
    expect(findPiece(boy, 'arm_r')?.id).toBe('arm_r');
    // he faces out of the picture: his left hand is on the image's right
    expect(findPiece(boy, 'left hand')?.id).toBe('hand_r');
    expect(findPiece(boy, 'right arm')?.id).toBe('arm_l');
    expect(findPiece(boy, 'head')?.id).toBe('head');
    expect(findPiece(rigs.get('farmer.webp')!, 'hat')?.id).toBe('hat');
    expect(findPiece(rigs.get('soldier.webp')!, 'helmet')?.id).toBe('hat');
    expect(findPiece(rigs.get('dog.webp')!, 'tail')?.kind).toBe('tail');
    expect(findPiece(boy, 'tail')).toBeUndefined();
  });
});

describe('gestures, expressions and parts in the engine', () => {
  const lookup = (file: string) => rigs.get(file);

  it('every gesture is a valid anim; the engine times it and clears it after', () => {
    for (const name of GESTURES) expect(ActionSchema.safeParse({ op: 'anim', id: 'x', name }).success, name).toBe(true);
    const engine = makeEngine();
    engine.world.add(character('boy_1', 'boy.webp', 'human', 1.4));
    engine.run([{ op: 'anim', id: 'boy_1', name: 'wave', times: 2 }]);
    tick(engine, 1);
    const g = engine.world.trans('boy_1').gesture!;
    expect(g.name).toBe('wave');
    expect(g.dur).toBeCloseTo(GESTURE_SECONDS.wave * 2);
    expect(g.t).toBeGreaterThan(0.8);
    tick(engine, GESTURE_SECONDS.wave * 2);
    expect(engine.world.trans('boy_1').gesture).toBeUndefined();
  });

  it('expressions are set on the face and neutral puts it back', () => {
    const engine = makeEngine();
    engine.world.add(character('boy_1', 'boy.webp', 'human', 1.4));
    engine.run([{ op: 'set', id: 'boy_1', expression: 'angry' }]);
    tick(engine, 0.2);
    expect(engine.world.get('boy_1')!.state.expression).toBe('angry');
    engine.run([{ op: 'set', id: 'boy_1', expression: 'neutral' }]);
    tick(engine, 0.2);
    expect(engine.world.get('boy_1')!.state.expression).toBeUndefined();
  });

  it('a hat comes off as its own thing, falls to the ground, and goes back on', () => {
    const engine = makeEngine();
    engine.rigs = lookup;
    engine.world.add(character('farmer_1', 'farmer.webp', 'human', 1.7));
    engine.run([{ op: 'detach', id: 'farmer_1', part: 'hat', newId: 'hat_1' }]);
    tick(engine, 0.1);
    const hat = engine.world.get('hat_1')!;
    expect(hat.word).toBe('hat');
    expect(hat.sprite).toMatchObject({ file: 'farmer.webp', piece: 'hat' });
    expect(hat.state.piece_of).toBe('farmer_1');
    expect(engine.world.get('farmer_1')!.state.off_hat).toBe(true);
    // it starts at the head and falls
    expect(hat.pos[1]).toBeGreaterThan(1);
    tick(engine, 2);
    expect(engine.world.get('hat_1')!.pos[1]).toBeLessThan(0.05);
    engine.run([{ op: 'reattach', id: 'hat_1' }]);
    tick(engine, 0.5);
    expect(engine.world.has('hat_1')).toBe(false);
    expect(engine.world.get('farmer_1')!.state.off_hat).toBeUndefined();
  });

  it('a poke reacts to the piece hit: a hat is knocked off, a hand waves, a tail wags, a loose piece goes back', () => {
    const engine = makeEngine();
    engine.rigs = lookup;
    engine.world.add(character('farmer_1', 'farmer.webp', 'human', 1.7));
    engine.world.add({ ...character('dog_1', 'dog.webp', 'animal', 0.5), pos: [3, 0, -3] });
    engine.world.add({ ...character('boy_1', 'boy.webp', 'human', 1.4), pos: [-3, 0, -3] });
    expect(engine.poke('farmer_1', 'hat')).toBe(true);
    tick(engine, 0.3);
    const loose = engine.world.list().find((e) => e.state.piece_of === 'farmer_1');
    expect(loose?.word).toBe('hat');
    expect(engine.world.get('farmer_1')!.state.off_hat).toBe(true);
    expect(engine.poke('boy_1', 'hand_r')).toBe(true);
    tick(engine, 0.3);
    expect(engine.world.trans('boy_1').gesture?.name).toBe('wave');
    expect(engine.poke('dog_1', 'tail')).toBe(true);
    tick(engine, 0.3);
    expect(engine.world.trans('dog_1').gesture?.name).toBe('wag');
    tick(engine, 2);
    expect(engine.poke(loose!.id)).toBe(true);
    tick(engine, 0.3);
    expect(engine.world.has(loose!.id)).toBe(false);
    expect(engine.world.get('farmer_1')!.state.off_hat).toBeUndefined();
  });

  it('without a rig, detach does nothing and a poke falls back to the whole-thing reaction', () => {
    const engine = makeEngine();
    engine.world.add(character('farmer_1', 'farmer.webp', 'human', 1.7));
    engine.run([{ op: 'detach', id: 'farmer_1', part: 'hat', newId: 'hat_1' }]);
    tick(engine, 0.5);
    expect(engine.world.has('hat_1')).toBe(false);
    expect(engine.poke('farmer_1', 'hat')).toBe(true);
  });
});
