import type { World } from '../types';
import type { DecalResolver } from '../structure/types';
import { generateVillage } from '../village';
import { makeEntity, type PresetItem, type SpriteResolver } from './make-entity';

export { makeEntity, type PresetItem, type SpriteResolver } from './make-entity';

/** The starter meadow. Positions are hand placed so nothing overlaps; the player spawns at the origin facing -z. */
export const STARTER_MEADOW: PresetItem[] = [
  { id: 'tree_1', word: 'tree', kind: 'object', heightM: 5.5, pos: [-7, 0, -12] },
  { id: 'house_1', word: 'house', kind: 'object', heightM: 5, pos: [8, 0, -14] },
  { id: 'rock_1', word: 'rock', kind: 'object', heightM: 0.7, pos: [3, 0, -6] },
  { id: 'fence_1', word: 'fence', kind: 'object', heightM: 1.1, pos: [-4, 0, -5], flip: true },
  { id: 'puddle_1', word: 'puddle', kind: 'other', heightM: 0.25, pos: [1.5, 0, -9] },
  { id: 'signpost_1', word: 'signpost', kind: 'object', heightM: 1.8, pos: [-1.5, 0, -4] },
  { id: 'flower_1', word: 'flower', kind: 'object', heightM: 0.5, pos: [5, 0, -9] },
];

export function starterWorld(slug: string, resolve: SpriteResolver, now = Date.now()): World {
  return {
    slug,
    rev: 1,
    player: { pos: [0, 0, 0], yaw: 0, pitch: 0 },
    entities: STARTER_MEADOW.map((item) => makeEntity(item, resolve, now)),
    createdAt: now,
  };
}

/* ----- the village: generated from a seed (see shared/village.ts) ----- */

export function villageWorld(slug: string, resolve: SpriteResolver, decals: DecalResolver, seed = 1, now = Date.now()): World {
  const v = generateVillage(seed, resolve, decals, now);
  return { slug, rev: 1, player: v.player, entities: v.entities, createdAt: now, preset: 'village', seed, terrain: v.terrain };
}

export const PRESET_NAMES = ['meadow', 'village'] as const;
export type PresetName = (typeof PRESET_NAMES)[number];

export function presetWorld(preset: string | undefined, slug: string, resolve: SpriteResolver, decals: DecalResolver, seed?: number, now = Date.now()): World {
  return preset === 'village' ? villageWorld(slug, resolve, decals, seed ?? (Math.floor(Math.random() * 1e9) + 1), now) : starterWorld(slug, resolve, now);
}
