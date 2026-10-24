import { describe, expect, it } from 'vitest';
import { flipFor, normalOf, rightOf, visibility, visibleYaw, wrapDeg, yawAlong, yawFacing } from '../../src/shared/engine/facing';

describe('facing math', () => {
  it('yawFacing points the paper front at the target', () => {
    expect(yawFacing([0, 0, 0], [0, 0, 5])).toBeCloseTo(0);
    expect(yawFacing([0, 0, 0], [5, 0, 0])).toBeCloseTo(90);
    expect(Math.abs(yawFacing([0, 0, 0], [0, 0, -5]))).toBeCloseTo(180);
    const n = normalOf(yawFacing([1, 0, 1], [4, 0, 5]));
    expect(n[0] / n[1]).toBeCloseTo(3 / 4);
  });

  it('yawAlong keeps a walking direction inside the paper plane', () => {
    for (const [dx, dz] of [[1, 0], [0, 1], [-1, 0.5], [0.3, -0.9]]) {
      const r = rightOf(yawAlong(dx, dz));
      const n = normalOf(yawAlong(dx, dz));
      expect(Math.abs(dx * n[0] + dz * n[1])).toBeLessThan(1e-9); // direction is perpendicular to the normal
      expect(dx * r[0] + dz * r[1]).toBeGreaterThan(0); // and runs along the plane's right
    }
  });

  it('flipFor mirrors the art (which faces left) when the target is to the right of the plane', () => {
    expect(flipFor(0, 1, 0)).toBe(true);
    expect(flipFor(0, -1, 0)).toBe(false);
    expect(flipFor(180, 1, 0)).toBe(false);
  });

  it('visibleYaw leaves readable yaws alone and nudges edge-on ones just enough', () => {
    const cam: [number, number, number] = [0, 1.6, 5];
    const pos: [number, number, number] = [0, 0, 0];
    expect(visibleYaw(0, pos, cam, 0.6)).toBeCloseTo(0);
    expect(visibleYaw(20, pos, cam, 0.6)).toBeCloseTo(20);
    const edge = visibleYaw(90, pos, cam, 0.6);
    expect(visibility(edge, pos, cam)).toBeCloseTo(0.6, 5);
    expect(Math.abs(wrapDeg(edge - 90))).toBeLessThan(40); // the smallest turn, not a snap to face-on
    const back = visibleYaw(180, pos, cam, 0.75);
    expect(visibility(back, pos, cam)).toBeGreaterThanOrEqual(0.75 - 1e-9); // facing away is as visible as facing toward
    expect(Math.abs(wrapDeg(back - 180))).toBeLessThan(1e-6);
  });
});
