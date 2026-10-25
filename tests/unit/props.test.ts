import { describe, expect, it } from 'vitest';
import { buildStructureMesh, _test as geo } from '../../src/shared/structure/geometry';
import { partContact, partSpan, resolveBodyVsStructure } from '../../src/shared/structure/collide';
import { PROP_GENS, coerceParams, generate, isPropGen, structureWord } from '../../src/shared/structure/index';
import { seatOnTerrain } from '../../src/shared/structure/entity';
import type { PrismPart, RibbonPart } from '../../src/shared/structure/types';
import type { Vec3 } from '../../src/shared/types';

const noDecals = () => null;
const dot = (a: number[], b: number[]) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const centre = (f: number[][]) => [0, 1, 2].map((k) => f.reduce((s, p) => s + p[k], 0) / f.length);

describe('kit: hollow, lying and strip parts', () => {
  const tube: PrismPart = { t: 'prism', pos: [0, 0, 0], sides: 8, r: 2, h: 0.6, hole: 1.6, mat: 'stone', color: '#ccc' };

  it('a hollow prism faces out on the outside, toward the axis on the inside, up on top', () => {
    const faces = geo.prismFaces(tube);
    expect(faces.length).toBe(8 * 4);
    let inner = 0;
    let top = 0;
    for (const f of faces) {
      const n = geo.polygonNormal(f as [number, number, number][]);
      const c = centre(f);
      const radial = Math.hypot(c[0], c[2]);
      if (Math.abs(n[1]) > 0.9) {
        if (n[1] > 0) top++;
        expect(c[1] > 0.3 ? n[1] > 0 : n[1] < 0).toBe(true);
        continue;
      }
      const out = dot(n, [c[0] / radial, 0, c[2] / radial]);
      if (radial < 1.8) {
        inner++;
        expect(out).toBeLessThan(-0.9);
      } else expect(out).toBeGreaterThan(0.9);
    }
    expect(inner).toBe(8);
    expect(top).toBe(8);
  });

  it('a hollow prism collides as a ring: the opening is empty, the wall pushes either way', () => {
    expect(partSpan(tube, 0, 0)).toBeNull();
    expect(partSpan(tube, 1.8, 0)).toMatchObject({ bottom: 0, top: 0.6 });
    expect(partContact(tube, 0.5, 0, 0.3)).toBeNull();
    const inside = partContact(tube, 1.5, 0, 0.3)!;
    expect(inside.push[0]).toBeLessThan(0);
    const outside = partContact(tube, 2.1, 0, 0.3)!;
    expect(outside.push[0]).toBeGreaterThan(0);
  });

  it('a prism on its side lies along z, rests on its base and has a round top', () => {
    const log: PrismPart = { t: 'prism', pos: [0, 0, 0], sides: 12, r: 0.3, h: 2, lie: true, mat: 'plank', color: '#a86' };
    const ys = geo.prismFaces(log).flat().map((p) => p[1]);
    const zs = geo.prismFaces(log).flat().map((p) => p[2]);
    expect(Math.min(...ys)).toBeGreaterThanOrEqual(-1e-9);
    expect(Math.max(...ys)).toBeCloseTo(0.6, 1);
    expect(Math.max(...zs)).toBeCloseTo(1);
    expect(partSpan(log, 0, 0.9)!.top).toBeCloseTo(0.6);
    expect(partSpan(log, 0.29, 0)!.top).toBeLessThan(0.45);
    expect(partSpan(log, 0, 1.2)).toBeNull();
    const half: PrismPart = { ...log, half: true };
    expect(Math.max(...geo.prismFaces(half).flat().map((p) => p[1]))).toBeCloseTo(0.3, 1);
    expect(Math.min(...geo.prismFaces(half).flat().map((p) => p[1]))).toBeCloseTo(0);
  });

  it('a paper strip has two sides along its path and never collides', () => {
    const strip: RibbonPart = { t: 'ribbon', pos: [0, 0, 0], path: [[0, 1], [0.5, 1.4], [1, 1.2], [1.4, 0.5]], w: 0.2, wEnd: 0.3, mat: 'water', color: '#7cf', ghost: true };
    const [front, back] = geo.ribbonFaces(strip);
    expect(geo.polygonNormal(front as [number, number, number][])[2]).toBeGreaterThan(0.99);
    expect(geo.polygonNormal(back as [number, number, number][])[2]).toBeLessThan(-0.99);
    expect(front.length).toBe(8);
    expect(partSpan(strip, 0.5, 0)).toBeNull();
    const mesh = buildStructureMesh({ gen: 'custom', params: {}, parts: [strip], bounds: { w: 3, h: 2, d: 0.3 } });
    // the outline goes round the strip once: 8 perimeter edges, none across it
    expect(mesh.edges.length / 6).toBe(8);
  });
});

describe('props', () => {
  it('every prop word builds its prop; detailed things are not props', () => {
    for (const [word, gen] of [
      ['fountain', 'fountain'],
      ['lamp post', 'lamppost'],
      ['street light', 'lamppost'],
      ['mailbox', 'mailbox'],
      ['signpost', 'signpost'],
      ['wishing well', 'well'],
      ['park bench', 'bench'],
      ['bird bath', 'birdbath'],
      ['trash can', 'trash_can'],
      ['column', 'pillar'],
    ])
      expect(structureWord(word)?.gen, word).toBe(gen);
    for (const word of ['scarecrow', 'statue', 'flower', 'lantern', 'barrel']) expect(structureWord(word), word).toBeNull();
  });

  it('each generator is deterministic per seed and stands on the ground', () => {
    for (const gen of PROP_GENS) {
      const a = generate(gen, {}, 7, noDecals)!;
      expect(JSON.stringify(a), gen).toBe(JSON.stringify(generate(gen, {}, 7, noDecals)));
      expect(isPropGen(a.gen), gen).toBe(true);
      expect(Math.min(...a.parts.map((p) => p.pos[1])), gen).toBeCloseTo(0);
      expect(a.bounds.h, gen).toBeLessThan(5);
    }
  });

  it('the fountain: an octagonal basin you can wade into, ghost water, water arcs, a column', () => {
    for (const tiers of [1, 2]) {
      const s = generate('fountain', coerceParams('fountain', { tiers, r: 2.4, color: 'pink' }), 1, noDecals)!;
      expect(s.params).toMatchObject({ tiers, r: 2.4, color: '#f7a4c0' });
      const water = s.parts.filter((p) => p.mat === 'water');
      expect(water.every((p) => p.ghost)).toBe(true);
      expect(water.filter((p) => p.t === 'ribbon').length).toBe(tiers === 1 ? 4 : 12);
      const basin = s.parts.find((p): p is PrismPart => p.t === 'prism' && !!p.hole && p.r === 2.4)!;
      expect(basin.sides).toBe(8);
      // walking in: the wall blocks a body outside it; inside, the body stands on the step under the water
      const e = { yaw: 0, scale: 1 };
      const origin: Vec3 = [0, 0, 0];
      const outside: Vec3 = [2.6, 0.16, 0];
      const hit = resolveBodyVsStructure(s, e, origin, outside, 0.3, 1.6, 0.16);
      expect(hit.blocked).toBe(true);
      const wading: Vec3 = [1.4, 0.16, 0];
      const inside = resolveBodyVsStructure(s, e, origin, wading, 0.3, 1.6, 0);
      expect(inside.support).toBeCloseTo(0.16);
      expect(inside.blocked).toBe(false);
    }
  });

  it('the lamp post glows with a halo at night; the mailbox door faces the front', () => {
    const lamp = generate('lamppost', {}, 2, noDecals)!;
    expect(lamp.parts.some((p) => p.glow && p.halo)).toBe(true);
    expect(buildStructureMesh(lamp).groups.some((g) => g.glow)).toBe(true);
    const mail = generate('mailbox', coerceParams('mailbox', { color: 'blue' }), 2, noDecals)!;
    expect(mail.params.color).toBe('#4e8fd6');
    const handle = mail.parts.find((p) => p.t === 'box' && p.w === 0.05)!;
    expect(handle.pos[2]).toBeGreaterThan(0.2);
  });

  it('props stand on the lowest ground under their feet, not on a foundation', () => {
    const slope = (x: number) => x * 0.3;
    const post = generate('signpost', { arms: 3 }, 4, noDecals)!;
    const seated = seatOnTerrain(post, [10, 0, 0], 0, (x) => slope(x));
    expect(seated.structure.parts.length).toBe(post.parts.length);
    // the post's foot, not the reach of its arms, decides the height
    expect(seated.base).toBeGreaterThan(slope(10) - 0.05);
    expect(seated.base).toBeLessThanOrEqual(slope(10));
    // a gentle slope: the well sinks a little on its uphill side; a steep one: it stands level on a plinth
    const well = generate('well', {}, 4, noDecals)!;
    const gentle = (x: number) => x * 0.1;
    const w = seatOnTerrain(well, [10, 0, 0], 0, gentle);
    expect(w.structure.parts.length).toBe(well.parts.length);
    expect(w.base).toBeLessThan(gentle(10));
    const steep = seatOnTerrain(well, [10, 0, 0], 0, slope);
    const plinth = steep.structure.parts[steep.structure.parts.length - 1];
    expect(plinth).toMatchObject({ t: 'prism', mat: 'stone' });
    expect(steep.base).toBeGreaterThan(slope(10));
    expect(steep.base + plinth.pos[1]).toBeLessThan(slope(10 - 1));
  });
});
