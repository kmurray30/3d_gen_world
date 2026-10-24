import type { Entity, Kind, SpriteRef } from '../types';
import { defaultSprite, massClassFor } from './sizing';
import { solidShapeOf } from '../shape';

export interface PresetItem {
  id: string;
  word: string;
  kind: Kind;
  heightM: number;
  pos: [number, number, number];
  flip?: boolean;
}

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
    ...solidShapeOf(item.word, item.kind),
    huge: false,
    createdAt: now,
  };
}
