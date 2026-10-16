import type { Kind, World } from '../src/shared/types';
import type { ResolvedSpawn, ResolvedSet, WordResolution, Place } from '../src/shared/schema';
import { Engine } from '../src/shared/engine/index';
import { starterWorld } from '../src/shared/engine/presets';
import { defaultSprite } from '../src/shared/engine/sizing';

export function res(word: string, kind: Kind = 'object', heightM = 1, solid = true): WordResolution {
  return { word, sprite: defaultSprite(kind), kind, heightM, solid, huge: false, placeholder: false };
}

export function spawn(id: string, word: string, at: Partial<Place> = {}, extra: Partial<ResolvedSpawn> = {}, kind: Kind = 'object', heightM = 1): ResolvedSpawn {
  return { op: 'spawn', ref: id, id, word, at: { rel: 'near', of: 'player', height: 'ground', ...at }, res: res(word, kind, heightM), ...extra };
}

export function set(id: string, patch: Partial<ResolvedSet>): ResolvedSet {
  return { op: 'set', id, ...patch };
}

export function emptyWorld(): World {
  return { slug: 't', rev: 1, player: { pos: [0, 0, 0], yaw: 0, pitch: 0 }, entities: [], createdAt: 0 };
}

export function meadowWorld(): World {
  return starterWorld('t', (_w, kind) => defaultSprite(kind), 0);
}

export function makeEngine(world: World = emptyWorld()): Engine {
  return new Engine(world, 7);
}

/** Advance the engine in fixed steps. */
export function tick(engine: Engine, seconds: number, step = 1 / 60): void {
  const n = Math.ceil(seconds / step);
  for (let i = 0; i < n; i++) engine.update(step);
}
