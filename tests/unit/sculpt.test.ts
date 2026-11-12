import { describe, expect, it } from 'vitest';
import { getFigure } from '../../src/shared/figure/items';
import { sculpt, smin, triangleSdf } from '../../src/shared/figure/sculpt';

describe('sculpted models', () => {
  it('distance helpers: a triangle is negative inside and positive outside; smin blends below the plain min', () => {
    const tri: Array<[number, number]> = [[-1, -1], [1, -1], [0, 1]];
    expect(triangleSdf(0, -0.3, tri)).toBeLessThan(0);
    expect(triangleSdf(0, 2, tri)).toBeGreaterThan(0);
    expect(triangleSdf(0, -1, tri)).toBeCloseTo(0, 6);
    expect(smin(1, 1, 0.5)).toBeLessThan(1);
    expect(smin(1, 3, 0.5)).toBe(1);
  });

  for (const key of ['man', 'dog', 'dragon', 'house', 'tree']) {
    it(`${key}: one closed skin, weights that sum to one, the figure's size`, () => {
      const f = getFigure(key)!;
      const s = sculpt(f);
      const nv = s.positions.length / 3;
      expect(nv).toBeGreaterThan(300);
      expect(s.indices.length % 3).toBe(0);
      // closed surface: every edge is shared by exactly two triangles
      const edges = new Map<string, number>();
      for (let t = 0; t < s.indices.length; t += 3)
        for (let e = 0; e < 3; e++) {
          const a = s.indices[t + e], b = s.indices[t + ((e + 1) % 3)];
          const k = a < b ? `${a}_${b}` : `${b}_${a}`;
          edges.set(k, (edges.get(k) ?? 0) + 1);
        }
      const bad = [...edges.values()].filter((n) => n !== 2).length;
      expect(bad / edges.size).toBeLessThan(0.002);
      // skin weights
      for (let v = 0; v < nv; v++) {
        const w = s.skinWeight[v * 4] + s.skinWeight[v * 4 + 1] + s.skinWeight[v * 4 + 2] + s.skinWeight[v * 4 + 3];
        expect(Math.abs(w - 1)).toBeLessThan(1e-4);
      }
      // the model is as tall as the figure (within a couple of grid cells), ignoring the separate details
      let top = -Infinity;
      for (let v = 0; v < nv; v++) top = Math.max(top, s.positions[v * 3 + 1]);
      expect(top).toBeLessThanOrEqual(f.heightM + s.cell * 2);
      expect(top).toBeGreaterThan(f.heightM * (key === 'dragon' ? 0.5 : 0.85));
    });
  }

  it('the house keeps its roof, and thin or glowing details stay separate pieces', () => {
    const house = sculpt(getFigure('house')!);
    let top = -Infinity;
    for (let v = 0; v < house.positions.length / 3; v++) top = Math.max(top, house.positions[v * 3 + 1]);
    expect(top).toBeGreaterThan(3.5); // walls are 2.4 m; the roof ridge is near 3.9 m
    const dragon = sculpt(getFigure('dragon')!);
    for (const p of ['membraneL', 'membraneTipR', 'flame', 'eyeL']) expect(dragon.separate).toContain(p);
    expect(dragon.separate).not.toContain('body');
  });

  it('a joint is shared between the two parts that meet there, so the skin bends there', () => {
    const f = getFigure('man')!;
    const s = sculpt(f);
    const fore = s.bones.indexOf('foreL'), arm = s.bones.indexOf('armL');
    let shared = 0;
    for (let v = 0; v < s.positions.length / 3; v++) {
      const ids = [s.skinIndex[v * 4], s.skinIndex[v * 4 + 1]];
      const ws = [s.skinWeight[v * 4], s.skinWeight[v * 4 + 1]];
      if (ids.includes(fore) && ids.includes(arm) && Math.min(...ws) > 0.15) shared++;
    }
    expect(shared).toBeGreaterThan(10);
  });
});
