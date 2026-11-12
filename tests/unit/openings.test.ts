import { describe, expect, it } from 'vitest';
import { buildStructureMesh, _test as geo } from '../../src/shared/structure/geometry';
import { resolveBodyVsStructure } from '../../src/shared/structure/collide';
import { generate } from '../../src/shared/structure/index';
import { cutOpenings, isWindow } from '../../src/shared/structure/openings';
import type { DecalPart, PrismPart, Structure, WallPart } from '../../src/shared/structure/types';
import type { Vec3 } from '../../src/shared/types';

const sprites = (word: string) => (word === 'door' ? { file: 'door.webp', w: 261, h: 399 } : word === 'window' ? { file: 'window.webp', w: 312, h: 373 } : null);

/** Whether any face of the mesh covers a structure-local point (within 1 cm of a face's plane, inside it). */
function covered(s: Structure, p: [number, number, number]): boolean {
  const mesh = buildStructureMesh(s);
  for (const g of mesh.groups) {
    if (g.decal) continue;
    const { pos, idx } = g.mesh;
    for (let t = 0; t < idx.length; t += 3) {
      const [a, b, c] = [idx[t], idx[t + 1], idx[t + 2]].map((i) => [pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]]);
      const n = geo.polygonNormal([a, b, c] as [number, number, number][]);
      const d = (p[0] - a[0]) * n[0] + (p[1] - a[1]) * n[1] + (p[2] - a[2]) * n[2];
      if (Math.abs(d) > 0.01) continue;
      // barycentric test in the plane
      const v0 = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
      const v1 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
      const v2 = [p[0] - a[0], p[1] - a[1], p[2] - a[2]];
      const dot = (x: number[], y: number[]) => x[0] * y[0] + x[1] * y[1] + x[2] * y[2];
      const d00 = dot(v0, v0), d01 = dot(v0, v1), d02 = dot(v0, v2), d11 = dot(v1, v1), d12 = dot(v1, v2);
      const inv = 1 / (d00 * d11 - d01 * d01);
      const u = (d11 * d02 - d01 * d12) * inv;
      const v = (d00 * d12 - d01 * d02) * inv;
      if (u >= -1e-6 && v >= -1e-6 && u + v <= 1 + 1e-6) return true;
    }
  }
  return false;
}

/** The middle of a decal's hole, on its host's outer face (structure-local). */
function holeMiddle(d: DecalPart, back = 0.02): [number, number, number] {
  const r = ((d.rot ?? 0) * Math.PI) / 180;
  const up = d.role === 'door' ? d.h * 0.5 : d.h * (1 - (0.119 + 0.82) / 2);
  return [d.pos[0] - Math.sin(r) * back, d.pos[1] + up, d.pos[2] - Math.cos(r) * back];
}

describe('holes behind doors and windows', () => {
  it("every house window has a hole through its wall behind the sashes, and the wall stays whole around it", () => {
    const s = generate('house', { w: 7, d: 5, stories: 2, windows: true }, 3, sprites)!;
    const windows = s.parts.filter(isWindow);
    expect(windows.length).toBeGreaterThan(4);
    expect(windows.every((w) => w.hole)).toBe(true);
    const walls = s.parts.filter((p): p is WallPart => p.t === 'wall');
    const holes = walls.flatMap((w) => (w.openings ?? []).filter((o) => (o.y ?? 0) > 0.3));
    expect(holes.length).toBe(windows.length);
    for (const w of windows) {
      // through the hole, nothing; just beside the window, wall
      expect(covered(s, holeMiddle(w, 0.0)), 'hole').toBe(false);
      const r = ((w.rot ?? 0) * Math.PI) / 180;
      const beside: [number, number, number] = [w.pos[0] + Math.cos(r) * (w.w / 2 + 0.25), w.pos[1] + w.h / 2, w.pos[2] - Math.sin(r) * (w.w / 2 + 0.25)];
      expect(covered(s, beside), 'wall beside it').toBe(true);
    }
  });

  it('older houses without holes get them when drawn, and cutting twice changes nothing', () => {
    const s = generate('house', { w: 6, d: 5 }, 3, sprites)!;
    // an old save: no holes, no flags
    const old: Structure = structuredClone(s);
    for (const p of old.parts) {
      if (p.t === 'decal') delete p.hole;
      if (p.t === 'wall') p.openings = (p.openings ?? []).filter((o) => !o.y);
    }
    const cut = cutOpenings(old);
    expect(cut).not.toBe(old);
    expect(cut.parts.filter(isWindow).every((w) => w.hole)).toBe(true);
    expect(cutOpenings(cut)).toBe(cut);
    expect(cutOpenings(s)).toBe(s);
  });

  it('a tower becomes hollow with a doorway you can walk through; its windows let you see in but not climb in', () => {
    const s = generate('tower', { r: 2.5, h: 12, sides: 8 }, 3, sprites)!;
    const body = s.parts.find((p): p is PrismPart => p.t === 'prism' && p.r === 2.5)!;
    expect(body.hole).toBeGreaterThan(1.5);
    const doorway = body.openings!.find((o) => !o.y || o.y < 0.5)!;
    expect(doorway).toBeTruthy();
    expect(body.openings!.length).toBeGreaterThan(1);
    const door = s.parts.find((p): p is DecalPart => p.t === 'decal' && p.role === 'door')!;
    expect(door.hole).toBe(true);
    expect(covered(s, holeMiddle(door, 0.05))).toBe(false);
    // walk from in front of the door to inside: not blocked by the wall
    const e = { yaw: 0, scale: 1 };
    const origin: Vec3 = [0, 0, 0];
    const front = door.pos[2];
    let support = 0.35;
    for (let z = front + 1.2; z > 0.5; z -= 0.1) {
      const pos: Vec3 = [door.pos[0], 0.35, z];
      const hit = resolveBodyVsStructure(s, e, origin, pos, 0.3, 1.6, support);
      support = hit.support;
      expect(Math.abs(pos[2] - z), `pushed at z=${z.toFixed(1)}`).toBeLessThan(0.05);
    }
    // the wall beside the door still blocks
    const r = 2.5 * Math.cos(Math.PI / 8);
    const side: Vec3 = [Math.cos(Math.PI / 8 + (Math.PI * 2) / 8 * 2.5) * r, 0.35, Math.sin(Math.PI / 8 + (Math.PI * 2) / 8 * 2.5) * r];
    expect(resolveBodyVsStructure(s, e, origin, side, 0.3, 1.6, 0.35).blocked).toBe(true);
  });

  it("a lighthouse's door is cut through the tower and the band over it", () => {
    const s = generate('lighthouse', {}, 3, sprites)!;
    const door = s.parts.find((p): p is DecalPart => p.t === 'decal' && p.role === 'door' && p.pos[2] > 1)!;
    expect(door.hole).toBe(true);
    expect(covered(s, holeMiddle(door, 0.05))).toBe(false);
    const window = s.parts.find((p): p is DecalPart => isWindow(p) && !!p.rot === false && p.pos[1] > 3);
    if (window) expect(covered(s, holeMiddle(window, 0.05))).toBe(false);
  });

  it("the witch hut's windows sit on the boards' outer faces, with holes through them", () => {
    const s = generate('witch_hut', {}, 3, sprites)!;
    const windows = s.parts.filter(isWindow);
    expect(windows.length).toBe(2);
    for (const w of windows) {
      expect(w.hole).toBe(true);
      expect(covered(s, holeMiddle(w, 0.0))).toBe(false);
    }
  });
});
