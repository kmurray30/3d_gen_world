/** Structure entities: how a Structure becomes an Entity the rest of the engine understands. */
import type { Entity, Vec3 } from '../types';
import { HUGE_FROM_M } from '../engine/sizing';
import type { Structure } from './types';

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

/** Yaw (degrees) that turns a structure's front (+z) toward a point. */
export function yawToward(from: Vec3, to: Vec3): number {
  return (Math.atan2(to[0] - from[0], to[2] - from[2]) * 180) / Math.PI;
}
