import { describe, expect, it } from 'vitest';
import type { ResolvedBuild } from '../../src/shared/schema';
import { generate } from '../../src/shared/structure/index';
import { villageWorld } from '../../src/shared/engine/presets';
import { defaultSprite } from '../../src/shared/engine/sizing';
import { Engine } from '../../src/shared/engine/index';
import { emptyWorld, makeEngine, spawn, tick } from '../helpers';

const noDecals = () => null;

function build(id: string, gen: string, params: Record<string, unknown> = {}, at: ResolvedBuild['at'] = { rel: 'front', of: 'player', height: 'ground' }): ResolvedBuild {
  const structure = generate(gen, params, 4, noDecals)!;
  return { op: 'build', ref: id, id, word: gen, label: gen, at, structure };
}

/** Walk the player straight along a direction for a while, resolving collisions each frame. */
function walk(engine: Engine, dir: [number, number], seconds: number, speed = 3): void {
  const p = engine.world.player;
  const steps = Math.ceil(seconds * 60);
  for (let i = 0; i < steps; i++) {
    p.pos[0] += dir[0] * speed / 60;
    p.pos[2] += dir[1] * speed / 60;
    engine.collidePlayer();
    const g = engine.playerGround;
    if (p.pos[1] < g) p.pos[1] = Math.min(g, p.pos[1] + 9 / 60);
    else if (p.pos[1] > g) p.pos[1] = Math.max(g, p.pos[1] - 20 / 60);
  }
}

describe('structures in the engine', () => {
  it('build places a house on the ground in front of the player, facing them, and it rises in', () => {
    const engine = makeEngine(emptyWorld());
    engine.run([build('house_1', 'house', { w: 6, d: 5 })]);
    tick(engine, 0.1);
    const h = engine.world.get('house_1')!;
    expect(h.structure?.gen).toBe('house');
    expect(h.scale).toBeLessThan(1);
    tick(engine, 1.5);
    expect(h.scale).toBeCloseTo(1, 5);
    expect(h.pos[1]).toBe(0);
    expect(h.pos[2]).toBeLessThan(-3); // ahead of the player (facing -z)
    // front (+z local) turned toward the player at the origin
    const yaw = h.yaw!;
    const fx = Math.sin((yaw * Math.PI) / 180);
    const fz = Math.cos((yaw * Math.PI) / 180);
    const toPlayer = [-h.pos[0], -h.pos[2]];
    const len = Math.hypot(toPlayer[0], toPlayer[1]);
    expect((fx * toPlayer[0] + fz * toPlayer[1]) / len).toBeGreaterThan(0.95);
    expect(engine.busy).toBe(false);
  });

  it('walls stop the player, the doorway lets them in, and "on the house" lands things on the roof', () => {
    const engine = makeEngine(emptyWorld());
    engine.run([build('house_1', 'house', { w: 6, d: 5, doorAt: 0, roof: 'gable' }, { rel: 'at', of: 'player', height: 'ground' })]);
    tick(engine, 2);
    const h = engine.world.get('house_1')!;
    // put the house at a known spot facing +z (front toward +z world) and the player in front of it
    h.pos = [0, 0, -10];
    h.yaw = 0;
    const p = engine.world.player;
    p.pos = [2, 0, 0];
    walk(engine, [0, -1], 4);
    // blocked by the front wall right of the door: the body rests against the wall's outer face
    const front = h.structure!.parts.find((q) => q.t === 'wall')! as { pos: [number, number, number]; d: number };
    const face = h.pos[2] + front.pos[2] + front.d / 2;
    expect(p.pos[2]).toBeCloseTo(face + 0.35, 2);
    // through the door
    p.pos = [0, 0, 0];
    walk(engine, [0, -1], 3.4);
    expect(p.pos[2]).toBeLessThan(-8);
    expect(p.pos[2]).toBeGreaterThan(-12.5);
    expect(p.pos[1]).toBeCloseTo(0.06, 5); // standing on the floor slab
    // a cat dropped from above the house lands on the roof surface, not at the chimney top
    engine.run([spawn('cat_1', 'cat', { rel: 'above', of: 'house_1', height: 'high' }, {}, 'animal', 0.3), { op: 'drop', id: 'cat_1' }]);
    tick(engine, 5);
    const cat = engine.world.get('cat_1')!;
    expect(cat.parent).toBe('house_1');
    const y = engine.world.worldPos(cat)[1];
    expect(y).toBeGreaterThan(2.4);
    expect(y).toBeLessThan(h.structure!.bounds.h);
  });

  it('the bunker stairs can be climbed to the patio and a fall comes back down', () => {
    const engine = makeEngine(emptyWorld());
    engine.run([build('bunker_1', 'bunker', {}, { rel: 'at', of: 'player', height: 'ground' })]);
    tick(engine, 2);
    const b = engine.world.get('bunker_1')!;
    b.pos = [0, 0, 0];
    b.yaw = 0;
    const stairs = b.structure!.parts.find((q) => q.t === 'stairs')!;
    // start at the foot of the first flight (it rises toward -z) and walk up
    const p = engine.world.player;
    const d = (stairs as { d: number }).d;
    p.pos = [stairs.pos[0], 0, stairs.pos[2] + d / 2 + 0.6];
    walk(engine, [0, -1], (d + 1.5) / 3);
    expect(p.pos[1]).toBeGreaterThan(3);
    // the landing wall stops a walk straight off the top
    expect(p.pos[2]).toBeGreaterThan(stairs.pos[2] - d / 2 - 0.5);
    // step left onto the patio and keep the height
    walk(engine, [-1, 0], 1);
    expect(p.pos[1]).toBeGreaterThan(3);
    expect(engine.playerGround).toBeGreaterThan(3);
    // the parapet keeps a walk toward the front edge on the patio
    const before = [...p.pos];
    walk(engine, [0, 1], 6);
    expect(p.pos[1]).toBeCloseTo(before[1], 5);
    // back to the stairs and down to the meadow
    p.pos = [stairs.pos[0], 3.35, stairs.pos[2] - d / 2 + 0.3];
    walk(engine, [0, 1], (d + 2) / 3);
    expect(p.pos[1]).toBe(0);
  });

  it('the village loads into the engine with the player standing on the plaza', () => {
    const world = villageWorld('v', (_w, kind) => defaultSprite(kind), noDecals, 3, 0);
    const engine = new Engine(world, 1);
    engine.collidePlayer();
    const p = engine.world.player.pos;
    expect(engine.playerGround).toBeCloseTo(engine.world.ground(p[0], p[2]), 2);
    expect(Math.abs(p[1] - engine.playerGround)).toBeLessThan(0.01);
    const snap = engine.snapshot();
    expect(snap.entities.find((e) => e.id === 'bunker_1')?.structure?.parts.length).toBeGreaterThan(20);
    expect(JSON.stringify(snap).length).toBeLessThan(200000);
  });
});
