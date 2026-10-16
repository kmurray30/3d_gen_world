import { describe, expect, it } from 'vitest';
import { findFreeSpot, footprints, isFree, resolvePlace, stopAtEdge, supportAt } from '../../src/shared/engine/place';
import { WorldModel } from '../../src/shared/engine/world';
import { makeRng } from '../../src/shared/engine/math';
import { footprintRadius } from '../../src/shared/engine/sizing';
import { makeEngine, meadowWorld, spawn, tick, emptyWorld } from '../helpers';

describe('placement', () => {
  it('footprints skip attached and hidden entities and include the player', () => {
    const w = new WorldModel(meadowWorld());
    const total = w.size;
    w.get('rock_1')!.hidden = true;
    w.attach('flower_1', 'house_1', 'top');
    const fps = footprints(w);
    expect(fps.map((f) => f.id)).toContain('player');
    expect(fps.length).toBe(total - 2 + 1);
  });

  it('findFreeSpot returns the point itself when free and a nearby free point otherwise', () => {
    const fps = [{ id: 'a', x: 0, z: 0, r: 1 }];
    expect(findFreeSpot(fps, 5, 5, 0.5, makeRng(1))).toEqual([5, 0, 5]);
    const spot = findFreeSpot(fps, 0, 0, 0.5, makeRng(1));
    expect(isFree(fps, spot[0], spot[2], 0.5)).toBe(true);
    expect(Math.hypot(spot[0], spot[2])).toBeLessThan(2.1);
  });

  it('front/behind/left/right follow the player yaw', () => {
    const w = new WorldModel(emptyWorld());
    const rng = makeRng(3);
    const self = { radius: 0.3, heightM: 1 };
    const front = resolvePlace({ rel: 'front', of: 'player', height: 'ground' }, w, self, rng).pos;
    expect(front[2]).toBeLessThan(-1); // yaw 0 looks toward -z
    w.player.yaw = Math.PI / 2; // looking toward -x
    const front2 = resolvePlace({ rel: 'front', of: 'player', height: 'ground' }, w, self, rng).pos;
    expect(front2[0]).toBeLessThan(-1);
    expect(Math.abs(front2[2])).toBeLessThan(0.5);
    const left = resolvePlace({ rel: 'left', of: 'player', height: 'ground' }, w, self, rng).pos;
    expect(left[2]).toBeGreaterThan(1); // left of someone facing -x is +z
  });

  it('places tall things farther from the player so they are seen whole', () => {
    const w = new WorldModel(emptyWorld());
    const rng = makeRng(3);
    const near = resolvePlace({ rel: 'front', of: 'player', height: 'ground' }, w, { radius: 0.3, heightM: 0.5 }, rng).pos;
    const tall = resolvePlace({ rel: 'front', of: 'player', height: 'ground' }, w, { radius: 1.5, heightM: 8 }, rng).pos;
    expect(Math.hypot(...[tall[0], tall[2]])).toBeGreaterThan(Math.hypot(near[0], near[2]) + 4);
  });

  it('"on" attaches and "above" floats over the target top', () => {
    const w = new WorldModel(meadowWorld());
    const rng = makeRng(1);
    const on = resolvePlace({ rel: 'on', of: 'house_1', height: 'ground' }, w, { radius: 0.3, heightM: 1 }, rng);
    expect(on.parent).toBe('house_1');
    const above = resolvePlace({ rel: 'above', of: 'house_1', height: 'ground' }, w, { radius: 0.3, heightM: 1 }, rng);
    expect(above.pos[1]).toBeGreaterThan(5);
    expect(above.parent).toBeUndefined();
  });

  it('many random spawns never overlap and never sit on the player', () => {
    const engine = makeEngine(emptyWorld());
    const rels = ['near', 'front', 'left', 'right', 'behind', 'random', 'far', 'offscreen'] as const;
    for (let i = 0; i < 40; i++) {
      engine.run([spawn(`e${i}`, 'rock', { rel: rels[i % rels.length] }, {}, 'object', 0.5 + (i % 5) * 0.4)]);
      tick(engine, 0.6);
    }
    const list = engine.world.list();
    expect(list.length).toBe(40);
    for (const a of list) {
      expect(Math.hypot(a.pos[0], a.pos[2])).toBeGreaterThan(0.35 + footprintRadius(a) - 1e-6);
      for (const b of list) {
        if (a === b) continue;
        const d = Math.hypot(a.pos[0] - b.pos[0], a.pos[2] - b.pos[2]);
        expect(d + 1e-6).toBeGreaterThanOrEqual(footprintRadius(a) + footprintRadius(b));
      }
    }
  });

  it('stopAtEdge stops short by both radii plus padding', () => {
    const p = stopAtEdge([0, 0, 0], [10, 0, 0], 1, 0.5, 0.1);
    expect(p[0]).toBeCloseTo(8.4, 5);
    expect(p[2]).toBeCloseTo(0, 5);
  });

  it('supportAt reports the top of the tallest solid thing under a point', () => {
    const w = new WorldModel(meadowWorld());
    const house = w.get('house_1')!;
    const s = supportAt(w, house.pos[0], house.pos[2], new Set());
    expect(s.id).toBe('house_1');
    expect(s.y).toBeCloseTo(5, 5);
    expect(supportAt(w, 30, 30, new Set()).y).toBe(0);
  });
});
