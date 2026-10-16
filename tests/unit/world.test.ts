import { describe, expect, it } from 'vitest';
import { WorldModel } from '../../src/shared/engine/world';
import { meadowWorld } from '../helpers';

describe('WorldModel', () => {
  it('attaches with top anchors, rejects cycles and self attachment', () => {
    const w = new WorldModel(meadowWorld());
    expect(w.attach('rock_1', 'house_1')).toBe(true);
    expect(w.attach('flower_1', 'rock_1')).toBe(true);
    expect(w.attach('house_1', 'flower_1')).toBe(false); // cycle
    expect(w.attach('house_1', 'house_1')).toBe(false);
    const flowerPos = w.worldPos(w.get('flower_1')!);
    expect(flowerPos[1]).toBeCloseTo(5 + 0.7, 5); // house top + rock top
  });

  it('caps attachment depth', () => {
    const w = new WorldModel(meadowWorld());
    const ids = ['house_1', 'tree_1', 'rock_1', 'fence_1', 'signpost_1', 'flower_1'];
    const results = ids.slice(1).map((id, i) => w.attach(id, ids[i]));
    expect(results.slice(0, 4)).toEqual([true, true, true, true]);
    expect(results[4]).toBe(false);
  });

  it('detach and remove keep world positions', () => {
    const w = new WorldModel(meadowWorld());
    w.attach('rock_1', 'house_1');
    const before = w.worldPos(w.get('rock_1')!);
    const orphans = w.remove('house_1');
    expect(orphans.map((e) => e.id)).toEqual(['rock_1']);
    expect(w.get('rock_1')!.pos).toEqual(before);
    expect(w.get('rock_1')!.parent).toBeUndefined();
  });

  it('round-trips through toWorld/load', () => {
    const w = new WorldModel(meadowWorld());
    w.get('tree_1')!.scale = 2;
    const snap = w.toWorld();
    w.get('tree_1')!.scale = 5;
    w.remove('rock_1');
    w.load(snap);
    expect(w.get('tree_1')!.scale).toBe(2);
    expect(w.has('rock_1')).toBe(true);
  });
});
