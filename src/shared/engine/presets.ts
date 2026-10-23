import type { Entity, Kind, SpriteRef, Vec3, World } from '../types';
import { generate } from '../structure/index';
import { structureEntity, yawToward } from '../structure/entity';
import type { DecalResolver, Structure } from '../structure/types';
import { defaultSprite, massClassFor } from './sizing';

export interface PresetItem {
  id: string;
  word: string;
  kind: Kind;
  heightM: number;
  pos: [number, number, number];
  flip?: boolean;
}

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

export type SpriteResolver = (word: string, kind: Kind) => SpriteRef | null;

export function makeEntity(item: PresetItem, resolve: SpriteResolver, now: number): Entity {
  const sprite = resolve(item.word, item.kind) ?? defaultSprite(item.kind);
  return {
    id: item.id,
    word: item.word,
    label: item.word,
    sprite,
    pos: [...item.pos],
    flip: item.flip ?? false,
    scale: 1,
    heightM: item.heightM,
    tilt: 0,
    state: {},
    effects: [],
    kind: item.kind,
    solid: item.kind !== 'other',
    massClass: massClassFor(item.kind, item.heightM),
    huge: false,
    createdAt: now,
  };
}

export function starterWorld(slug: string, resolve: SpriteResolver, now = Date.now()): World {
  return {
    slug,
    rev: 1,
    player: { pos: [0, 0, 0], yaw: 0, pitch: 0 },
    entities: STARTER_MEADOW.map((item) => makeEntity(item, resolve, now)),
    createdAt: now,
  };
}

/* ----- the village: one of everything the structure kit makes ----- */

interface StructureItem {
  id: string;
  word: string;
  gen: string;
  params?: Record<string, unknown>;
  seed: number;
  pos: Vec3;
  /** Degrees; undefined = face the origin. */
  yaw?: number;
}

export const VILLAGE_STRUCTURES: StructureItem[] = [
  { id: 'house_1', word: 'house', gen: 'house', seed: 11, pos: [-11, 0, -11] },
  { id: 'house_2', word: 'house', gen: 'house', seed: 23, pos: [11, 0, -13] },
  { id: 'house_3', word: 'house', gen: 'house', seed: 37, pos: [-13, 0, 9], params: { stories: 2 } },
  { id: 'yard_1', word: 'yard', gen: 'yard', seed: 5, pos: [13, 0, 7], params: { w: 9, d: 7 }, yaw: 0 },
  { id: 'gingerbread_house_1', word: 'gingerbread house', gen: 'gingerbread', seed: 7, pos: [0, 0, -30] },
  { id: 'witch_hut_1', word: 'witch hut', gen: 'witch_hut', seed: 3, pos: [-26, 0, -26] },
  { id: 'lighthouse_1', word: 'lighthouse', gen: 'lighthouse', seed: 9, pos: [27, 0, -32] },
  { id: 'bunker_1', word: 'bunker', gen: 'bunker', seed: 13, pos: [30, 0, 18], yaw: 90 },
];

export const VILLAGE_DECOR: PresetItem[] = [
  { id: 'signpost_1', word: 'signpost', kind: 'object', heightM: 1.8, pos: [-2, 0, -5] },
  { id: 'lamppost_1', word: 'lamppost', kind: 'object', heightM: 3.2, pos: [3, 0, -8] },
  { id: 'lamppost_2', word: 'lamppost', kind: 'object', heightM: 3.2, pos: [-3, 0, -20] },
  { id: 'tree_1', word: 'tree', kind: 'object', heightM: 6, pos: [-4, 0, -14] },
  { id: 'tree_2', word: 'tree', kind: 'object', heightM: 5.5, pos: [20, 0, -22] },
  { id: 'tree_3', word: 'apple tree', kind: 'object', heightM: 4.5, pos: [15, 0, 9] },
  { id: 'tree_4', word: 'tree', kind: 'object', heightM: 6.5, pos: [-24, 0, 0] },
  { id: 'bush_1', word: 'bush', kind: 'object', heightM: 1.1, pos: [-6, 0, -8] },
  { id: 'bush_2', word: 'bush', kind: 'object', heightM: 1.0, pos: [7, 0, -3] },
  { id: 'flower_1', word: 'flower', kind: 'object', heightM: 0.5, pos: [11.5, 0, 6] },
  { id: 'sunflower_1', word: 'sunflower', kind: 'object', heightM: 1.6, pos: [10.5, 0, 8.5] },
  { id: 'rose_1', word: 'rose', kind: 'object', heightM: 0.6, pos: [13, 0, 5] },
  { id: 'dog_1', word: 'dog', kind: 'animal', heightM: 0.6, pos: [12.5, 0, 7.5] },
  { id: 'girl_1', word: 'girl', kind: 'human', heightM: 1.4, pos: [4, 0, -11] },
  { id: 'man_1', word: 'man', kind: 'human', heightM: 1.75, pos: [7, 0, -17], flip: true },
  { id: 'mailbox_1', word: 'mailbox', kind: 'object', heightM: 1.1, pos: [-7, 0, -6] },
  { id: 'bench_1', word: 'bench', kind: 'object', heightM: 0.9, pos: [2, 0, -24] },
  { id: 'witch_1', word: 'witch', kind: 'humanoid', heightM: 1.65, pos: [-21, 0, -22] },
  { id: 'cauldron_1', word: 'cauldron', kind: 'object', heightM: 0.8, pos: [-22.5, 0, -20] },
  { id: 'pumpkin_1', word: 'pumpkin', kind: 'object', heightM: 0.45, pos: [-24, 0, -19.5] },
  { id: 'owl_1', word: 'owl', kind: 'animal', heightM: 0.5, pos: [-29, 0, -21] },
  { id: 'candy_cane_1', word: 'candy cane', kind: 'object', heightM: 0.9, pos: [3.5, 0, -26] },
  { id: 'lollipop_1', word: 'lollipop', kind: 'object', heightM: 0.9, pos: [-3.5, 0, -26.5] },
  { id: 'sailor_1', word: 'sailor', kind: 'human', heightM: 1.7, pos: [22, 0, -28] },
  { id: 'seagull_1', word: 'seagull', kind: 'animal', heightM: 0.4, pos: [31, 0, -27] },
  { id: 'boat_1', word: 'boat', kind: 'object', heightM: 2.2, pos: [34, 0, -37] },
  { id: 'soldier_1', word: 'soldier', kind: 'human', heightM: 1.75, pos: [20, 0, 16] },
  { id: 'sandbag_1', word: 'sandbag', kind: 'object', heightM: 0.5, pos: [21, 0, 19] },
  { id: 'crate_1', word: 'crate', kind: 'object', heightM: 0.9, pos: [19, 0, 21] },
  { id: 'scarecrow_1', word: 'scarecrow', kind: 'object', heightM: 1.9, pos: [-20, 0, 16] },
  { id: 'hay_bale_1', word: 'hay bale', kind: 'object', heightM: 1.0, pos: [-18, 0, 19] },
  { id: 'cow_1', word: 'cow', kind: 'animal', heightM: 1.4, pos: [-23, 0, 22] },
  { id: 'well_1', word: 'well', kind: 'object', heightM: 1.8, pos: [0, 0, 9] },
];

export function buildVillageStructure(item: StructureItem, decals: DecalResolver, now: number): Entity | null {
  const s: Structure | null = generate(item.gen, item.params ?? {}, item.seed, decals);
  if (!s) return null;
  const yaw = item.yaw ?? yawToward(item.pos, [0, 0, 0]);
  return structureEntity(item.id, item.word, s, item.pos, Math.round(yaw), now);
}

export function villageWorld(slug: string, resolve: SpriteResolver, decals: DecalResolver, now = Date.now()): World {
  const entities: Entity[] = [];
  for (const item of VILLAGE_STRUCTURES) {
    const e = buildVillageStructure(item, decals, now);
    if (e) entities.push(e);
  }
  for (const item of VILLAGE_DECOR) entities.push(makeEntity(item, resolve, now));
  return {
    slug,
    rev: 1,
    player: { pos: [0, 0, 0], yaw: 0, pitch: 0 },
    entities,
    createdAt: now,
    preset: 'village',
  };
}

export const PRESET_NAMES = ['meadow', 'village'] as const;
export type PresetName = (typeof PRESET_NAMES)[number];

export function presetWorld(preset: string | undefined, slug: string, resolve: SpriteResolver, decals: DecalResolver, now = Date.now()): World {
  return preset === 'village' ? villageWorld(slug, resolve, decals, now) : starterWorld(slug, resolve, now);
}
