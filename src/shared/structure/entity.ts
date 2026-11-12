/** Structure entities: how a Structure becomes an Entity the rest of the engine understands. */
import type { Entity, Vec3 } from '../types';
import { HUGE_FROM_M } from '../engine/sizing';
import { DEG, rotateY } from '../engine/math';
import { round } from './build';
import type { Part, Structure } from './types';
import { isPropGen } from './index';

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
 * follow the ground post by post; small props stand on the lowest ground; bridges keep their own height. Returns
 * the base height and a structure copy.
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
  const prop = isPropGen(s.gen) || Math.max(s.bounds.w, s.bounds.d) <= 1.8;
  // a prop touches the ground only where its feet are (a signpost's post, not its arms)
  const { hw, hd } = prop ? feet(s) : { hw: s.bounds.w / 2, hd: s.bounds.d / 2 };
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
  if (prop) {
    // props and other small things (a lamp post, a well, a bench) stand on the lowest ground under them, a little
    // sunk on the uphill side; on a real slope they stand level on a round stone plinth instead
    if (drop < 0.3) return { base: lo, structure: s };
    const plinth: Part = { t: 'prism', pos: [0, -(drop + 0.1), 0], sides: 10, r: round(Math.max(hw, hd) + 0.15), h: round(drop + 0.1), mat: 'stone', color: '#b9b2a3' };
    return { base: hi, structure: { ...s, parts: [...s.parts, plinth] } };
  }
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

/** Half-extents of the parts that stand on the ground (y = 0), round the structure's origin. */
function feet(s: Structure): { hw: number; hd: number } {
  let hw = 0.05;
  let hd = 0.05;
  for (const p of s.parts) {
    if (p.pos[1] > 0.05 || p.ghost || p.hidden || p.t === 'decal' || p.t === 'ribbon') continue;
    const rx = p.t === 'prism' ? (p.lie ? p.r : Math.max(p.r, p.rTop ?? 0)) : p.w / 2;
    const rz = p.t === 'prism' ? (p.lie ? p.h / 2 : p.rz ?? p.r) : 'd' in p ? p.d / 2 : 0.05;
    const reach = Math.hypot(rx, rz) * (p.rot ? 1 : 0);
    hw = Math.max(hw, Math.abs(p.pos[0]) + (reach || rx));
    hd = Math.max(hd, Math.abs(p.pos[2]) + (reach || rz));
  }
  return { hw: Math.min(hw, s.bounds.w / 2), hd: Math.min(hd, s.bounds.d / 2) };
}

/** Yaw (degrees) that turns a structure's front (+z) toward a point. */
export function yawToward(from: Vec3, to: Vec3): number {
  return (Math.atan2(to[0] - from[0], to[2] - from[2]) * 180) / Math.PI;
}
