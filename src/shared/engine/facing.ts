/**
 * Sprites have a yaw in the world like everything else: the paper faces +z turned by `yaw` degrees. They no longer
 * turn to follow the camera, so you can walk around a cutout and see its edge. Living things that turn or walk
 * pick orientations biased toward the viewer so they stay readable, but not so strongly that it looks tracked.
 */
import type { Vec3 } from '../types';

const DEG = Math.PI / 180;

/** Yaw whose front (+z) points from `from` toward `to`. */
export function yawFacing(from: Vec3, to: Vec3): number {
  return Math.atan2(to[0] - from[0], to[2] - from[2]) / DEG;
}

/** Yaw whose paper plane contains the ground direction `d` (a walking character's side is what you see). */
export function yawAlong(dx: number, dz: number): number {
  return Math.atan2(-dz, dx) / DEG;
}

/** The plane's right-hand direction in the ground plane. */
export function rightOf(yawDeg: number): [number, number] {
  return [Math.cos(yawDeg * DEG), -Math.sin(yawDeg * DEG)];
}

/** The plane's facing direction (normal) in the ground plane. */
export function normalOf(yawDeg: number): [number, number] {
  return [Math.sin(yawDeg * DEG), Math.cos(yawDeg * DEG)];
}

export function wrapDeg(a: number): number {
  return ((((a + 180) % 360) + 360) % 360) - 180;
}

export function lerpAngle(from: number, to: number, t: number): number {
  return from + wrapDeg(to - from) * Math.max(0, Math.min(1, t));
}

/** How face-on a plane with this yaw is from `cam`: 1 = facing, 0 = edge-on. */
export function visibility(yawDeg: number, pos: Vec3, cam: Vec3): number {
  const dx = cam[0] - pos[0];
  const dz = cam[2] - pos[2];
  const l = Math.hypot(dx, dz);
  if (l < 1e-6) return 1;
  const n = normalOf(yawDeg);
  return Math.abs((n[0] * dx + n[1] * dz) / l);
}

/**
 * Nudge a yaw so the plane is at least `minVis` face-on from the camera: the smallest rotation that gets there,
 * toward whichever of the two camera-facing orientations is closer. Yaws that are already visible enough pass through.
 */
export function visibleYaw(yawDeg: number, pos: Vec3, cam: Vec3, minVis = 0.6): number {
  if (visibility(yawDeg, pos, cam) >= minVis) return yawDeg;
  const toCam = yawFacing(pos, cam);
  const limit = Math.acos(Math.min(1, minVis)) / DEG; // max angle between normal and the camera direction
  const d1 = wrapDeg(toCam - yawDeg);
  const d2 = wrapDeg(toCam + 180 - yawDeg);
  const d = Math.abs(d1) <= Math.abs(d2) ? d1 : d2;
  // rotate just enough: move toward the facing orientation until the angle to it is `limit`
  const excess = Math.abs(d) - limit;
  return excess <= 0 ? yawDeg : wrapDeg(yawDeg + Math.sign(d) * excess);
}

/** Whether a sprite moving along `d` should be mirrored on a plane with this yaw (art faces left by default). */
export function flipFor(yawDeg: number, dx: number, dz: number): boolean {
  const r = rightOf(yawDeg);
  return dx * r[0] + dz * r[1] > 0;
}
