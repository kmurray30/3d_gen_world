import type { Entity, Kind, SpriteRef, World } from '../types';
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
