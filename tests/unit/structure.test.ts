import { describe, expect, it } from 'vitest';
import { buildStructureMesh, _test as geo } from '../../src/shared/structure/geometry';
import { partContact, partSpan, resolveBodyVsStructure, roofHeightAt, structureTopAt } from '../../src/shared/structure/collide';
import { GENERATORS, coerceParams, colorOf, generate, materialOf, structureWord } from '../../src/shared/structure/index';
import { customStructure } from '../../src/shared/structure/gen/custom';
import { Parts } from '../../src/shared/structure/build';
import type { Part, Structure } from '../../src/shared/structure/types';
import { makeRng } from '../../src/shared/engine/math';
import { villageWorld } from '../../src/shared/engine/presets';
import { defaultSprite } from '../../src/shared/engine/sizing';

const ctxOf = (seed = 1) => ({ rng: makeRng(seed), decal: () => null });
const noDecals = () => null;

describe('geometry', () => {
  it('triangulates concave polygons without dropping area', () => {
    // an L shape in the xy plane
    const L: Array<[number, number, number]> = [
      [0, 0, 0],
      [2, 0, 0],
      [2, 1, 0],
      [1, 1, 0],
      [1, 2, 0],
      [0, 2, 0],
    ];
    const n = geo.polygonNormal(L);
    const tris = geo.triangulate(L, n);
    expect(tris.length).toBe((L.length - 2) * 3);
    let area = 0;
    for (let i = 0; i < tris.length; i += 3) {
      const [a, b, c] = [L[tris[i]], L[tris[i + 1]], L[tris[i + 2]]];
      area += Math.abs((b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])) / 2;
    }
    expect(area).toBeCloseTo(3, 6);
  });

  it('stairs faces point outward and the profile closes', () => {
    const faces = geo.stairsFaces({ t: 'stairs', pos: [0, 0, 0], w: 2, h: 1, d: 2, steps: 4, mat: 'stone', color: '#fff' });
    const side = faces[0];
    expect(side.length).toBe(3 + 4 * 2 - 1);
    expect(geo.polygonNormal(side)[0]).toBeGreaterThan(0.99);
    expect(geo.polygonNormal(faces[1])[0]).toBeLessThan(-0.99);
    const riser = faces[2];
    expect(geo.polygonNormal(riser)[2]).toBeLessThan(-0.99);
    const tread = faces[3];
    expect(geo.polygonNormal(tread)[1]).toBeGreaterThan(0.99);
  });

  it('builds a box into 6 faces, 12 crease edges and metre-based uvs', () => {
    const s: Structure = { gen: 'custom', params: {}, parts: [{ t: 'box', pos: [0, 0, 0], w: 2, h: 3, d: 4, mat: 'plaster', color: '#ffffff' }], bounds: { w: 2, h: 3, d: 4 } };
    const m = buildStructureMesh(s);
    expect(m.groups.length).toBe(1);
    const mesh = m.groups[0].mesh;
    expect(mesh.pos.length / 3).toBe(24);
    expect(mesh.idx.length).toBe(36);
    expect(m.edges.length / 6).toBe(12);
    // uv extents on the front face (first 4 vertices) span the face size in metres
    const us = [0, 1, 2, 3].map((i) => mesh.uv[i * 2]);
    const vs = [0, 1, 2, 3].map((i) => mesh.uv[i * 2 + 1]);
    expect(Math.max(...us) - Math.min(...us)).toBeCloseTo(2, 5);
    expect(Math.max(...vs) - Math.min(...vs)).toBeCloseTo(3, 5);
    // top faces are brightest
    const topShade = mesh.shade.slice(16, 20);
    expect(Math.min(...topShade)).toBe(1);
  });

  it('a wall with a doorway is one slab: outline around the notch, no seams on the face', () => {
    const s: Structure = {
      gen: 'custom',
      params: {},
      parts: [{ t: 'wall', pos: [0, 0, 0], w: 6, h: 3, d: 0.24, mat: 'plaster', color: '#fff', openings: [{ at: 1, w: 1, h: 2.1 }] }],
      bounds: { w: 6, h: 3, d: 0.24 },
    };
    const m = buildStructureMesh(s);
    const front = m.groups[0].mesh;
    // the front polygon has 4 extra vertices for the notch
    expect(front.pos.length / 3).toBeGreaterThanOrEqual(8 + 8 + 4 + 4 + 4);
    // outline edges include the lintel line at y=2.1 between x=0.5 and 1.5 on the front face
    const edges: Array<number[]> = [];
    for (let i = 0; i < m.edges.length; i += 6) edges.push(m.edges.slice(i, i + 6));
    const lintel = edges.find((e) => Math.abs(e[1] - 2.1) < 1e-6 && Math.abs(e[4] - 2.1) < 1e-6 && Math.abs(e[2] - 0.12) < 1e-6);
    expect(lintel).toBeTruthy();
    // no vertical edge runs the full height through the middle of the face (that would be a panel seam)
    const seam = edges.find((e) => Math.abs(e[0] - e[3]) < 1e-6 && Math.abs(e[0]) < 2.9 && Math.min(e[1], e[4]) < 1e-6 && Math.max(e[1], e[4]) > 2.9);
    expect(seam).toBeUndefined();
    const spanInDoor = partSpan(s.parts[0], 1, 0)!;
    expect(spanInDoor.bottom).toBeCloseTo(2.1);
    expect(partSpan(s.parts[0], -1, 0)!.bottom).toBe(0);
  });

  it('every generator produces a closed, bounded mesh', () => {
    for (const gen of GENERATORS) {
      const s = generate(gen, gen === 'custom' ? { parts: [{ shape: 'cylinder', h: 3, r: 1, name: 'a' }, { shape: 'cone', on: 'a', h: 2 }] } : {}, 3, noDecals)!;
      expect(s, gen).toBeTruthy();
      expect(s.parts.length, gen).toBeGreaterThan(0);
      expect(s.bounds.w, gen).toBeGreaterThan(0.5);
      expect(s.bounds.h, gen).toBeGreaterThan(0.5);
      const m = buildStructureMesh(s);
      expect(m.groups.length, gen).toBeGreaterThan(0);
      for (const g of m.groups) {
        expect(g.mesh.idx.length % 3, gen).toBe(0);
        for (const i of g.mesh.idx) expect(i, gen).toBeLessThan(g.mesh.pos.length / 3);
        for (const v of g.mesh.pos) expect(Number.isFinite(v), gen).toBe(true);
      }
      expect(m.edges.length % 6, gen).toBe(0);
      // the footprint is centred on the origin
      let minX = Infinity;
      let maxX = -Infinity;
      for (const g of m.groups)
        for (let i = 0; i < g.mesh.pos.length; i += 3) {
          minX = Math.min(minX, g.mesh.pos[i]);
          maxX = Math.max(maxX, g.mesh.pos[i]);
        }
      expect(Math.abs(minX + maxX), gen).toBeLessThan(0.6);
    }
  });
});

describe('collision', () => {
  const box: Part = { t: 'box', pos: [0, 0, 0], w: 4, h: 3, d: 0.3, mat: 'plaster', color: '#fff' };

  it('spans and pushes out of a rotated box', () => {
    expect(partSpan(box, 0, 0)).toEqual({ bottom: 0, top: 3 });
    expect(partSpan(box, 0, 1)).toBeNull();
    const wall: Part = { ...box, rot: 90 }; // now runs along z
    expect(partSpan(wall, 0, 1.5)).toEqual({ bottom: 0, top: 3 });
    expect(partSpan(wall, 1, 0)).toBeNull();
    const c = partContact(wall, 0.3, 0, 0.35)!;
    expect(c).not.toBeNull();
    expect(0.3 + c.push[0]).toBeCloseTo(0.15 + 0.35, 6); // pushed out along +x to touch the face at x = 0.15
    expect(Math.abs(c.push[1])).toBeLessThan(1e-6);
    expect(c.span).toEqual({ bottom: 0, top: 3 });
    expect(partContact(wall, 2, 0, 0.35)).toBeNull();
  });

  it('roof heights follow the slope', () => {
    const gable = { t: 'roof' as const, style: 'gable' as const, pos: [0, 0, 0] as [number, number, number], w: 6, d: 4, h: 2, mat: 'shingle' as const, color: '' };
    expect(roofHeightAt(gable, 0, 0)).toBeCloseTo(2);
    expect(roofHeightAt(gable, 2, 2)).toBeCloseTo(0);
    expect(roofHeightAt(gable, -1, 1)).toBeCloseTo(1);
    const hip = { ...gable, style: 'hip' as const };
    expect(roofHeightAt(hip, 0, 0)).toBeCloseTo(2);
    expect(roofHeightAt(hip, 3, 0)).toBeCloseTo(0);
    expect(roofHeightAt(hip, 1, 0)).toBeCloseTo(2); // on the ridge
  });

  it('stairs are a ramp a body can climb; walls block and patios support', () => {
    const b = new Parts();
    b.wall(0, 0, 2, 6, 3, 0, 'concrete', '#ccc', [{ at: 0, w: 1.4, h: 2.3 }]);
    b.box(0, 3, 0, 6, 0.3, 4, 'concrete', '#ccc');
    b.stairs(4, 0, 0, 1.5, 3.3, 4, 12, 'concrete', '#ccc');
    const s = b.finish('custom', {});
    // finish() recentres the footprint, so read positions back from the parts
    const wall = s.parts[0] as { pos: [number, number, number] };
    const slab = s.parts[1] as { pos: [number, number, number] };
    const stairs = s.parts[2] as { pos: [number, number, number] };
    const e = { pos: [0, 0, 0] as [number, number, number], yaw: 0, scale: 1 };
    const origin: [number, number, number] = [0, 0, 0];
    // walk toward the wall off-centre: blocked
    const pos: [number, number, number] = [wall.pos[0] + 2, 0, wall.pos[2] + 0.3];
    const c1 = resolveBodyVsStructure(s, e, origin, pos, 0.35, 1.5, 0);
    expect(c1.blocked).toBe(true);
    expect(pos[2]).toBeCloseTo(wall.pos[2] + 0.12 + 0.35, 6);
    // through the doorway: free
    const pos2: [number, number, number] = [wall.pos[0], 0, wall.pos[2]];
    const c2 = resolveBodyVsStructure(s, e, origin, pos2, 0.35, 1.5, 0);
    expect(c2.blocked).toBe(false);
    expect(c2.support).toBe(0); // the slab is overhead, not support
    // up the stairs: support rises with z, then the patio takes over
    let feet = 0;
    for (let z = -2; z <= 2; z += 0.25) {
      const p: [number, number, number] = [stairs.pos[0], feet, stairs.pos[2] + z];
      const c = resolveBodyVsStructure(s, e, origin, p, 0.35, 1.5, 0);
      expect(c.blocked, `z=${z}`).toBe(false);
      expect(c.support).toBeGreaterThanOrEqual(feet - 1e-9);
      feet = c.support;
    }
    expect(feet).toBeCloseTo(3.3, 5);
    const onPatio: [number, number, number] = [slab.pos[0] + 2.5, feet, slab.pos[2]];
    const c3 = resolveBodyVsStructure(s, e, origin, onPatio, 0.35, 1.5, 0);
    expect(c3.support).toBeCloseTo(3.3, 5);
    expect(c3.blocked).toBe(false);
    expect(structureTopAt(s, e, origin, slab.pos[0], slab.pos[2])).toBeCloseTo(3.3, 5);
  });

  it('respects the entity yaw and scale', () => {
    const s: Structure = { gen: 'custom', params: {}, parts: [{ t: 'box', pos: [0, 0, 2], w: 1, h: 2, d: 1, mat: 'plaster', color: '#fff' }], bounds: { w: 1, h: 2, d: 5 } };
    // yaw 90: local +z -> world +x
    const e = { pos: [10, 0, 10] as [number, number, number], yaw: 90, scale: 2 };
    expect(structureTopAt(s, e, [10, 0, 10], 14, 10)).toBeCloseTo(4, 5);
    expect(structureTopAt(s, e, [10, 0, 10], 10, 14)).toBeNull();
  });
});

describe('generators', () => {
  it('are deterministic per seed and vary across seeds', () => {
    const a = generate('house', { random: true }, 5, noDecals)!;
    const b = generate('house', { random: true }, 5, noDecals)!;
    const c = generate('house', { random: true }, 6, noDecals)!;
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    expect(JSON.stringify(a)).not.toBe(JSON.stringify(c));
  });

  it('houses get a doorway you can walk through and a roof you cannot', () => {
    const s = generate('house', { w: 6, d: 5, doorAt: 0, roof: 'gable' }, 1, noDecals)!;
    const e = { pos: [0, 0, 0] as [number, number, number], yaw: 0, scale: 1 };
    const inside: [number, number, number] = [0, 0, 0];
    expect(resolveBodyVsStructure(s, e, [0, 0, 0], inside, 0.35, 1.5, 0).blocked).toBe(false);
    const door: [number, number, number] = [0, 0, 2.5];
    expect(resolveBodyVsStructure(s, e, [0, 0, 0], door, 0.35, 1.5, 0).blocked).toBe(false);
    const wallHit: [number, number, number] = [2, 0, 2.5];
    expect(resolveBodyVsStructure(s, e, [0, 0, 0], wallHit, 0.35, 1.5, 0).blocked).toBe(true);
    expect(structureTopAt(s, e, [0, 0, 0], 0, 0)).toBeGreaterThan(2.6);
  });

  it('coerces model parameters', () => {
    const p = coerceParams('house', { width: '7', stories: 2, color: 'blue', walls: 'bricks', roof: 'HIP', nonsense: 1 });
    expect(p).toEqual({ w: 7, stories: 2, wallMat: 'brick', wallColor: '#4e8fd6', roof: 'hip' });
    expect(colorOf('dark green')).toBe('#3f7a3a');
    expect(colorOf('#abc')).toBe('#aabbcc');
    expect(colorOf('fuchsia-ish', '#000')).toBe('#000');
    expect(materialOf('wooden')).toBe('plank');
    expect(structureWord('fire station')?.gen).toBe('house');
    expect(structureWord('dollhouse')).toBeNull();
  });

  it('lays out custom parts by relation', () => {
    const s = customStructure(
      [
        { name: 'base', shape: 'cylinder', r: 2, h: 4 },
        { name: 'hat', shape: 'cone', on: 'base', h: 3, r: 2.5 },
        { shape: 'stairs', on: 'base', at: 'front', w: 1, h: 1, d: 2 },
        { shape: 'box', on: 'nothing', at: 'left', w: 1, h: 1, d: 1 },
      ],
      ctxOf(),
      noDecals,
    );
    expect(s.parts.length).toBe(4);
    const [base, hat, stairs, box] = s.parts;
    expect(hat.pos[1]).toBeCloseTo(base.pos[1] + 4 - 0.02, 5);
    expect(hat.pos[0]).toBeCloseTo(base.pos[0], 5);
    expect(stairs.pos[2]).toBeGreaterThan(base.pos[2] + 2);
    expect(stairs.pos[1]).toBeCloseTo(base.pos[1], 5);
    // unknown anchor falls back to the last part
    expect(box.pos[0]).toBeLessThan(stairs.pos[0]);
    expect(s.bounds.h).toBeCloseTo(7 - 0.02, 2);
  });

  it('the village has every structure and nothing overlaps badly', () => {
    const w = villageWorld('v', (_w, kind) => defaultSprite(kind), noDecals, 0);
    const structures = w.entities.filter((e) => e.structure);
    expect(structures.map((e) => e.structure!.gen).sort()).toEqual(['bunker', 'gingerbread', 'house', 'house', 'house', 'lighthouse', 'witch_hut', 'yard']);
    for (const a of structures)
      for (const b of structures) {
        if (a === b) continue;
        const ra = Math.hypot(a.structure!.bounds.w, a.structure!.bounds.d) / 2;
        const rb = Math.hypot(b.structure!.bounds.w, b.structure!.bounds.d) / 2;
        const d = Math.hypot(a.pos[0] - b.pos[0], a.pos[2] - b.pos[2]);
        expect(d, `${a.id} vs ${b.id}`).toBeGreaterThan((ra + rb) * 0.7);
      }
    expect(w.preset).toBe('village');
    expect(w.entities.length).toBeGreaterThan(30);
  });
});
