/** Structure entities: how a Structure becomes an Entity the rest of the engine understands. */
import type { Entity, Vec3 } from '../types';
import { HUGE_FROM_M } from '../engine/sizing';
import { DEG, rotateY } from '../engine/math';
import { round } from './build';
import type { Part, Structure } from './types';

export function structureEntity(id: string, word: string, s: Structure, pos: Vec3, yaw: number, now: number, label = word): Entity {
  return {
    id,
    word,
    label,
    sprite: { file: null, w: Math.max(1, Math.round(Math.max(s.bounds.w, s.bounds.d) * 100)), h: Math.max(1, Math.round(s.bounds.h * 100)) },
    pos: [...pos] as Vec3,
    flip: false,
    scale: 1,
    heightM: s.bounds.h,
    tilt: 0,
    state: {},
    effects: [],
    kind: 'object',
    solid: true,
    massClass: 'heavy',
    huge: s.bounds.h >= HUGE_FROM_M,
    createdAt: now,
    yaw,
    structure: s,
  };
}

/**
 * Sit a structure on uneven ground. Buildings stand at the highest ground under their footprint on a stone
 * foundation that reaches down to the lowest, with steps up to the front door when the front is low; fences
 * follow the ground post by post; bridges keep their own height. Returns the base height and a structure copy.
 */
export function seatOnTerrain(s: Structure, pos: Vec3, yaw: number, ground: (x: number, z: number) => number): { base: number; structure: Structure } {
  const toWorld = (lx: number, lz: number): [number, number] => {
    const r = rotateY([lx, 0, lz], yaw * DEG);
    return [pos[0] + r[0], pos[2] + r[2]];
  };
  const centre = ground(pos[0], pos[2]);
  if (s.gen === 'bridge') return { base: pos[1] || centre, structure: s };
  if (s.gen === 'fence' || s.gen === 'yard') {
    const parts = s.parts.map((p) => {
      const [wx, wz] = toWorld(p.pos[0], p.pos[2]);
      return { ...p, pos: [p.pos[0], round(p.pos[1] + ground(wx, wz) - centre), p.pos[2]] as [number, number, number] };
    });
    return { base: centre, structure: { ...s, parts } };
  }
  const hw = s.bounds.w / 2;
  const hd = s.bounds.d / 2;
  let lo = Infinity;
  let hi = -Infinity;
  for (let i = 0; i <= 4; i++)
    for (let j = 0; j <= 4; j++) {
      const [wx, wz] = toWorld(-hw + (i / 4) * 2 * hw, -hd + (j / 4) * 2 * hd);
      const h = ground(wx, wz);
      lo = Math.min(lo, h);
      hi = Math.max(hi, h);
    }
  const drop = hi - lo;
  if (drop < 0.12) return { base: centre, structure: s };
  const parts: Part[] = [...s.parts];
  const depth = drop + 0.3;
  parts.push({ t: 'box', pos: [0, -depth, 0], w: round(s.bounds.w + 0.1), h: round(depth + 0.02), d: round(s.bounds.d + 0.1), mat: 'stone', color: '#b9b2a3' });
  // steps down to the ground in front of the door
  const doorAt = typeof s.params.doorAt === 'number' ? s.params.doorAt : 0;
  const [fx, fz] = toWorld(doorAt, hd + 0.9);
  const frontDrop = hi - ground(fx, fz);
  if (frontDrop > 0.3) {
    const run = Math.min(4, Math.max(0.9, frontDrop * 1.3));
    parts.push({ t: 'stairs', pos: [doorAt, -frontDrop, hd + run / 2], w: 1.8, h: round(frontDrop + 0.02), d: round(run), steps: Math.max(2, Math.round(frontDrop / 0.22)), mat: 'stone', color: '#b9b2a3', rot: 180 });
  }
  return { base: hi, structure: { ...s, parts } };
}

/** Yaw (degrees) that turns a structure's front (+z) toward a point. */
export function yawToward(from: Vec3, to: Vec3): number {
  return (Math.atan2(to[0] - from[0], to[2] - from[2]) * 180) / Math.PI;
}
