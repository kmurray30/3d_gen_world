import { describe, expect, it } from 'vitest';
import { TerrainField, rawHeight, type TerrainSpec } from '../../src/shared/terrain/field';
import { generateVillage } from '../../src/shared/village';
import { Engine } from '../../src/shared/engine/index';
import { villageWorld } from '../../src/shared/engine/presets';
import { defaultSprite } from '../../src/shared/engine/sizing';
import { polylineDist } from '../../src/shared/terrain/field';
import { spawn, tick } from '../helpers';
import { seatOnTerrain } from '../../src/shared/structure/entity';
import { isPropGen } from '../../src/shared/structure/index';

const noDecals = () => null;
const resolve = (_w: string, kind: Parameters<typeof defaultSprite>[0]) => defaultSprite(kind);

function spec(over: Partial<TerrainSpec> = {}): TerrainSpec {
  return { seed: 4, size: 120, step: 1.5, waterLevel: -0.6, hillAmp: 3, hillScale: 24, rim: 8, rimFrom: 62, pads: [], roads: [], rivers: [], ponds: [], paths: [], ...over };
}

describe('terrain field', () => {
  it('matches the analytic heights at grid points and interpolates between them', () => {
    const s = spec();
    const f = new TerrainField(s);
    for (const [x, z] of [[0, 0], [3, -6], [-12, 9]]) expect(f.height(x, z)).toBeCloseTo(rawHeight(s, x, z), 4);
    // between grid points the value lies within the cell's corner range
    const h = f.height(0.7, 0.4);
    const corners = [f.height(0, 0), f.height(1.5, 0), f.height(0, 1.5), f.height(1.5, 1.5)];
    expect(h).toBeGreaterThanOrEqual(Math.min(...corners) - 1e-6);
    expect(h).toBeLessThanOrEqual(Math.max(...corners) + 1e-6);
  });

  it('carves rivers and ponds below the water and flattens pads and roads', () => {
    const s = spec({
      rivers: [{ pts: [[-60, 20], [60, 20]], width: 6, depth: 1.2 }],
      ponds: [{ x: -20, z: -20, rx: 6, rz: 4, rot: 30, depth: 1.4 }],
      pads: [{ x: 15, z: -10, h: 2.5, hw: 3, hd: 2, rot: 20, blend: 3 }],
      roads: [{ pts: [[0, 0, 1], [0, -30, 1]], width: 3 }],
    });
    const f = new TerrainField(s);
    expect(f.isWater(0, 20)).toBe(true);
    expect(f.height(0, 20)).toBeLessThan(s.waterLevel - 1);
    expect(f.isWater(-20, -20)).toBe(true);
    expect(f.isWater(0, 0)).toBe(false);
    expect(rawHeight(s, 15, -10)).toBeCloseTo(2.5, 5);
    expect(rawHeight(s, 0, -15)).toBeCloseTo(1, 5);
    // the rim rises beyond rimFrom and settles at the edge
    expect(f.height(0, 100)).toBeGreaterThan(s.rim * 0.6);
    expect(f.normal(0, 0)[1]).toBeGreaterThan(0.5);
  });
});

describe('village generator', () => {
  it('is deterministic per seed and differs between seeds', () => {
    const a = generateVillage(11, resolve, noDecals, 0);
    const b = generateVillage(11, resolve, noDecals, 0);
    const c = generateVillage(12, resolve, noDecals, 0);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    expect(JSON.stringify(a.terrain)).not.toBe(JSON.stringify(c.terrain));
  });

  it('every village gets each special structure, including the fenced garden on tight seeds', () => {
    // these seeds once found no room for a full-size garden beside any house
    for (const seed of [7, 13, 43, 273]) {
      const v = generateVillage(seed, resolve, noDecals, 0);
      const gens = new Set(v.entities.filter((e) => e.structure).map((e) => e.structure!.gen));
      for (const g of ['bunker', 'gingerbread', 'house', 'lighthouse', 'witch_hut', 'yard', 'bridge']) expect(gens, `seed ${seed}: ${g}`).toContain(g);
    }
  });

  for (const seed of [1, 2, 3, 42, 43, 44, 64, 78, 273, 777, 9001]) {
    it(`seed ${seed}: buildings on dry flat ground, facing a road or path, bridges where roads cross the river`, () => {
      const v = generateVillage(seed, resolve, noDecals, 0);
      const f = new TerrainField(v.terrain);
      const buildings = v.entities.filter((e) => e.structure && e.structure.gen !== 'bridge' && !isPropGen(e.structure.gen));
      expect(buildings.length).toBeGreaterThanOrEqual(8);
      for (const e of buildings) {
        const s = e.structure!;
        const a = ((e.yaw ?? 0) * Math.PI) / 180;
        for (const [lx, lz] of [[-s.bounds.w / 2, -s.bounds.d / 2], [s.bounds.w / 2, -s.bounds.d / 2], [s.bounds.w / 2, s.bounds.d / 2], [-s.bounds.w / 2, s.bounds.d / 2], [0, 0]]) {
          const x = e.pos[0] + lx * Math.cos(a) + lz * Math.sin(a);
          const z = e.pos[2] - lx * Math.sin(a) + lz * Math.cos(a);
          expect(f.isWater(x, z), `${e.id} corner in water`).toBe(false);
          // ground under the footprint is within a few cm of the floor (pads flatten it)
          expect(Math.abs(f.height(x, z) - e.pos[1]), `${e.id} not seated`).toBeLessThan(0.35);
        }
        // the front door leads somewhere: a road or a footpath starts within reach
        const fx = e.pos[0] + Math.sin(a) * (s.bounds.d / 2 + 0.6);
        const fz = e.pos[2] + Math.cos(a) * (s.bounds.d / 2 + 0.6);
        const nearRoad = Math.min(...v.terrain.roads.map((r) => polylineDist(fx, fz, r.pts).d));
        const nearPath = Math.min(Infinity, ...v.terrain.paths.map((p) => polylineDist(fx, fz, p.pts).d));
        if (s.gen !== 'yard') expect(Math.min(nearRoad, nearPath), `${e.id} door leads nowhere`).toBeLessThan(2.5);
      }
      // every river crossing has a bridge whose deck is above the water and meets the banks
      const bridges = v.entities.filter((e) => e.structure?.gen === 'bridge');
      expect(bridges.length).toBeGreaterThanOrEqual(1);
      for (const b of bridges) {
        expect(b.pos[1]).toBeGreaterThan(v.terrain.waterLevel + 0.4);
        const a = ((b.yaw ?? 0) * Math.PI) / 180;
        const half = b.structure!.bounds.d / 2;
        for (const s of [-1, 1]) {
          const end = f.height(b.pos[0] + Math.sin(a) * half * s, b.pos[2] + Math.cos(a) * half * s);
          expect(b.pos[1] + 0.05 - end, `${b.id} end step`).toBeLessThan(0.55);
        }
      }
      // built props (fountain, lamp posts, mailboxes...) stand on dry ground, never floating above it
      const props = v.entities.filter((e) => e.structure && isPropGen(e.structure.gen));
      expect(props.some((e) => e.structure!.gen === 'fountain')).toBe(true);
      expect(props.filter((e) => e.structure!.gen === 'lamppost').length).toBeGreaterThanOrEqual(4);
      expect(props.some((e) => e.structure!.gen === 'birdbath')).toBe(true);
      for (const e of props) {
        expect(f.isWater(e.pos[0], e.pos[2]), `${e.id} in water`).toBe(false);
        // the lowest part (a plinth on a slope) reaches the ground; nothing is buried deep
        const lowest = e.pos[1] + Math.min(...e.structure!.parts.map((p) => p.pos[1]));
        expect(lowest - f.height(e.pos[0], e.pos[2]), `${e.id} floats`).toBeLessThan(0.02);
        expect(f.height(e.pos[0], e.pos[2]) - e.pos[1], `${e.id} sunk`).toBeLessThan(0.3);
      }
      // nothing but the boat and ducks stands in the water
      const floaters = new Set(['boat', 'duck']);
      for (const e of v.entities.filter((x) => !x.structure && !floaters.has(x.word))) expect(f.isWater(e.pos[0], e.pos[2], 0), `${e.id} in water`).toBe(false);
      // decor sits on the ground
      for (const e of v.entities.filter((x) => !x.structure && !floaters.has(x.word))) expect(Math.abs(e.pos[1] - f.height(e.pos[0], e.pos[2])), e.id).toBeLessThan(0.01);
      expect(v.entities.length).toBeLessThan(170);
    });
  }
});

describe('engine on terrain', () => {
  it('spawns and walks things on the ground, keeps them out of the water and lands drops on the slope', () => {
    const world = villageWorld('t', resolve, noDecals, 42, 0);
    const engine = new Engine(world, 3);
    const w = engine.world;
    w.player.pos = [0, w.ground(0, 0), 0];
    engine.run([spawn('dog_9', 'dog', { rel: 'far' }, {}, 'animal', 0.6)]);
    tick(engine, 1);
    const dog = w.get('dog_9')!;
    expect(Math.abs(dog.pos[1] - w.ground(dog.pos[0], dog.pos[2]))).toBeLessThan(1e-6);
    expect(w.wet(dog.pos[0], dog.pos[2], 0)).toBe(false);
    // walk it somewhere far: it follows the ground (or a bridge deck) the whole way
    engine.run([{ op: 'move', id: 'dog_9', to: { rel: 'random', of: 'player', height: 'ground' }, speed: 'run' }]);
    let maxGap = 0;
    for (let i = 0; i < 300; i++) {
      engine.update(1 / 60);
      const surface = w.ground(dog.pos[0], dog.pos[2]);
      if (dog.pos[1] < surface - 1e-6) maxGap = Math.max(maxGap, surface - dog.pos[1]);
    }
    expect(maxGap).toBeLessThan(0.01);
    // something dropped from the sky lands on the ground under it
    engine.run([spawn('ball_9', 'ball', { rel: 'front', height: 'sky' }, {}, 'object', 0.3), { op: 'drop', id: 'ball_9' }]);
    tick(engine, 4);
    const ball = w.get('ball_9')!;
    const p = w.worldPos(ball);
    expect(p[1]).toBeGreaterThanOrEqual(w.ground(p[0], p[2]) - 1e-6);
  });

  it('builds sit on uneven ground on a foundation with steps to the door', () => {
    // a 1-in-5 slope rising toward -z: the front (+z) of an unrotated house is the low side
    const ground = (_x: number, z: number) => -z * 0.2;
    const s = { gen: 'house', params: { doorAt: 0 }, parts: [{ t: 'box' as const, pos: [0, 0, 0] as [number, number, number], w: 6, h: 3, d: 5, mat: 'plaster' as const, color: '#fff' }], bounds: { w: 6, h: 3, d: 5 } };
    const seated = seatOnTerrain(s, [0, 0, 0], 0, ground);
    expect(seated.base).toBeCloseTo(0.5, 5); // the highest ground under the footprint (z = -2.5)
    const foundation = seated.structure.parts.find((p) => p.mat === 'stone' && p.t === 'box')!;
    expect(foundation.pos[1]).toBeLessThan(-1); // reaches below the lowest corner (1 m down)
    const steps = seated.structure.parts.find((p) => p.t === 'stairs')!;
    expect(steps.pos[2]).toBeGreaterThan(2.5); // in front of the door
    // flat ground: nothing added
    expect(seatOnTerrain(s, [0, 0, 0], 0, () => 1).structure.parts.length).toBe(1);
    // fences follow the ground post by post
    const fence = { gen: 'fence', params: {}, parts: [{ t: 'box' as const, pos: [0, 0, 2] as [number, number, number], w: 0.2, h: 1, d: 0.2, mat: 'plank' as const, color: '#fff' }], bounds: { w: 1, h: 1, d: 4 } };
    expect(seatOnTerrain(fence, [0, 0, 0], 0, ground).structure.parts[0].pos[1]).toBeCloseTo(-0.4, 5);
  });
});
