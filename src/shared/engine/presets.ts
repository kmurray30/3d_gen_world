import type { Entity, Kind, Vec3, World } from '../types';
import type { DecalResolver } from '../structure/types';
import { generate } from '../structure/index';
import { structureEntity } from '../structure/entity';
import { generateVillage } from '../village';
import { makeEntity, type PresetItem, type SpriteResolver } from './make-entity';
import type { Figure } from '../figure/types';
import { FIGURE_KEYS, getFigure } from '../figure/items';

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

/* ----- the visuals gallery: every code-drawn figure as a trio (original sprite, paper, 3D) ----- */

const GALLERY_ROWS: Array<{ group: Figure['group']; title: string; z: number; lift?: number }> = [
  { group: 'people', title: 'PEOPLE', z: -7 },
  { group: 'animals', title: 'ANIMALS', z: -15 },
  // dragons hover in the air, flapping
  { group: 'fantasy', title: 'DRAGONS', z: -25, lift: 1.8 },
  { group: 'things', title: 'THINGS', z: -35 },
  { group: 'nature', title: 'NATURE', z: -45 },
  { group: 'village', title: 'VILLAGE', z: -58 },
];

/** Each figure stands as its old sprite, a paper cutout, folded origami and 3D. */
export const GALLERY_LOOKS: Array<NonNullable<Entity['look']>> = ['sprite', 'paper', 'origami', 'toon', 'cel'];

const KIND_OF_RIG: Record<Figure['rig'], Kind> = { biped: 'human', quad: 'animal', bird: 'animal', dragon: 'other', prop: 'object' };

export function galleryWorld(slug: string, resolve: SpriteResolver, decals: DecalResolver, now = Date.now()): World {
  const entities: Entity[] = [];
  const sign = (id: string, text: string, pos: Vec3) => {
    const s = generate('signboard', { text }, 1, decals);
    if (s) entities.push(structureEntity(id, 'sign', s, pos, 0, now, text.toLowerCase()));
  };
  sign('sign_styles', 'SPRITE PAPER ORIGAMI 3D CEL', [-2.5, 0, -2.5]);
  for (const row of GALLERY_ROWS) {
    const figs = FIGURE_KEYS.map((k) => getFigure(k)!).filter((f) => f.group === row.group);
    const widthOf = (f: Figure) => Math.max(0.5, 2 * (f.view === 'side' ? f.halfD : f.halfW));
    const gap = 0.5;
    const trio = (f: Figure) => widthOf(f) * GALLERY_LOOKS.length + gap * (GALLERY_LOOKS.length - 1);
    const total = figs.reduce((sum, f) => sum + trio(f), 0) + (figs.length - 1) * 2.2;
    let x = -total / 2;
    sign(`sign_${row.group}`, row.title, [x - 3.2, 0, row.z + 0.5]);
    for (const f of figs) {
      const w = widthOf(f);
      GALLERY_LOOKS.forEach((look, i) => {
        const cx = x + w / 2 + i * (w + gap);
        const item: PresetItem = { id: `${f.key.replace(/\s+/g, '_')}_${look}`, word: f.key, kind: KIND_OF_RIG[f.rig], heightM: Math.round(f.heightM * 100) / 100, pos: [cx, row.lift ?? 0, row.z] };
        const e = makeEntity(item, resolve, now);
        e.look = look;
        e.yaw = 0;
        e.state = { stay: true };
        entities.push(e);
      });
      x += trio(f) + 2.2;
    }
    if (row.group === 'fantasy') {
      // and more dragons circling high overhead, one in each code-drawn style
      const f = getFigure('dragon')!;
      const flyers = ['paper', 'origami', 'toon', 'cel'] as const;
      flyers.forEach((look, i) => {
        const e = makeEntity({ id: `dragon_flying_${look}`, word: 'dragon', kind: KIND_OF_RIG[f.rig], heightM: Math.round(f.heightM * 100) / 100, pos: [0, 7.5 + i * 0.8, row.z] }, resolve, now);
        e.look = look;
        e.yaw = 0;
        e.state = { stay: true, orbit: 11, orbitSpeed: 5.5, orbitPhase: (i * 2 * Math.PI) / flyers.length };
        entities.push(e);
      });
    }
  }
  return { slug, rev: 1, player: { pos: [0, 0, 0], yaw: 0, pitch: 0 }, entities, createdAt: now, preset: 'gallery' };
}

export const PRESET_NAMES = ['meadow', 'village', 'gallery'] as const;
export type PresetName = (typeof PRESET_NAMES)[number];

export function presetWorld(preset: string | undefined, slug: string, resolve: SpriteResolver, decals: DecalResolver, seed?: number, now = Date.now()): World {
  if (preset === 'gallery') return galleryWorld(slug, resolve, decals, now);
  return preset === 'village' ? villageWorld(slug, resolve, decals, seed ?? (Math.floor(Math.random() * 1e9) + 1), now) : starterWorld(slug, resolve, now);
}
