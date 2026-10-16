import type { Entity, Kind, MassClass, SpriteRef } from '../types';

export const HEIGHT_MIN_M = 0.1;
export const HEIGHT_MAX_M = 12;
export const HUGE_FROM_M = 12;

export const DEFAULT_HEIGHT_M: Record<Kind, number> = { object: 0.5, human: 1.7, humanoid: 1.7, animal: 0.6, other: 1.0 };
export const DEFAULT_ASPECT: Record<Kind, number> = { object: 1.0, human: 0.5, humanoid: 0.55, animal: 1.2, other: 1.0 };

export function clampHeight(kind: Kind, heightM: number | null | undefined): number {
  if (!heightM || heightM <= 0 || !Number.isFinite(heightM)) return DEFAULT_HEIGHT_M[kind] ?? 1;
  return Math.min(HEIGHT_MAX_M, Math.max(HEIGHT_MIN_M, heightM));
}

export function defaultSprite(kind: Kind): SpriteRef {
  const aspect = DEFAULT_ASPECT[kind] ?? 1;
  return aspect <= 1 ? { file: null, w: Math.round(512 * aspect), h: 512 } : { file: null, w: 512, h: Math.round(512 / aspect) };
}

/** Rendered height in metres. */
export function renderHeight(e: Pick<Entity, 'heightM' | 'scale'>): number {
  return e.heightM * e.scale;
}

/** Rendered width in metres, from the sprite aspect ratio. */
export function renderWidth(e: Pick<Entity, 'heightM' | 'scale' | 'sprite'>): number {
  const aspect = e.sprite.h > 0 ? e.sprite.w / e.sprite.h : 1;
  return renderHeight(e) * aspect;
}

/** Footprint circle radius on the ground. Sprites are wider than their physical footprint. */
export function footprintRadius(e: Pick<Entity, 'heightM' | 'scale' | 'sprite'>): number {
  return Math.min(4, Math.max(0.1, renderWidth(e) * 0.35));
}

export function massClassFor(kind: Kind, heightM: number): MassClass {
  if (kind === 'animal') return 'animal';
  if (kind === 'human' || kind === 'humanoid') return 'person';
  if (heightM < 0.5) return 'light';
  if (heightM < 0.9) return 'medium';
  return 'heavy';
}

/** Objects the player cannot walk through. */
export function blocksPlayer(e: Entity): boolean {
  return e.solid && !e.parent && !e.hidden && e.massClass === 'heavy' && renderHeight(e) >= 0.9;
}
