import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { ATLAS_ORDER, atlasWorld, consolidateGroups, type AtlasWord } from '../../src/shared/engine/atlas';
import { DISTRICTS } from '../../src/shared/figure/catalog/types';

const manifest = JSON.parse(fs.readFileSync(path.resolve('assets/manifest.json'), 'utf8')).words as Record<string, { t: AtlasWord['kind']; hm: number }>;
const words: AtlasWord[] = Object.entries(manifest).map(([word, e]) => ({ word, kind: e.t, hm: e.hm }));

describe('the Atlas', () => {
  const world = atlasWorld(words, () => null, () => null, 0);
  const things = world.entities.filter((e) => e.id.startsWith('a_'));

  it('holds every word in the vocabulary exactly once', () => {
    expect(things.length).toBe(words.length);
    expect(new Set(things.map((e) => e.word)).size).toBe(words.length);
    expect(new Set(world.entities.map((e) => e.id)).size).toBe(world.entities.length);
  });

  it('every district is in the walking order, and districts and groups have signs', () => {
    expect(new Set(ATLAS_ORDER)).toEqual(new Set(Object.keys(DISTRICTS)));
    const signs = world.entities.filter((e) => e.structure?.gen === 'signboard').map((e) => e.label);
    expect(signs).toContain('the atlas');
    expect(signs.length).toBeGreaterThan(5);
  });

  it('things stand inside the terrain, on the ground, on a table, over water or in the sky, and are shown at a readable size', () => {
    const size = world.terrain!.size;
    for (const e of things) {
      expect(Math.abs(e.pos[0])).toBeLessThan(size);
      expect(Math.abs(e.pos[2])).toBeLessThan(size);
      expect(e.pos[1]).toBeGreaterThanOrEqual(-0.5);
      expect(e.pos[1]).toBeLessThan(6);
      const shown = e.heightM * e.scale;
      expect(shown).toBeGreaterThan(0.01); // flat things (rugs, coins) are thin; scaling goes by the largest side
      expect(shown).toBeLessThan(6.5);
    }
    // the player starts on the plaza, south of everything, looking north
    expect(world.player.pos[2]).toBeGreaterThan(Math.max(...things.map((e) => e.pos[2])));
  });

  it('folds same-named and tiny groups together, so a district is a handful of signed areas', () => {
    const g = (name: string, n: number) => Array.from({ length: n }, () => ({ group: name }));
    const m = consolidateGroups([...g('guns', 5), ...g('gun parts', 1), ...g('costume', 2), ...g('costumes', 2), ...g('hospital', 2), ...g('hospital things', 2), ...g('banks', 1)]);
    expect(m.get('gun parts')).toBe('guns');
    expect(m.get('costume')).toBe(m.get('costumes'));
    expect(m.get('hospital')).toBe(m.get('hospital things'));
    expect(m.get('banks')).toBe('all sorts');
    // the real catalog: no district ends up with a sign per thing
    const signs = world.entities.filter((e) => e.structure?.gen === 'signboard').length;
    expect(signs).toBeLessThan(things.length / 8);
  });

  it('is deterministic and compact enough to send', () => {
    const again = atlasWorld(words, () => null, () => null, 0);
    expect(JSON.stringify(again)).toBe(JSON.stringify(world));
    expect(JSON.stringify(world).length).toBeLessThan(4_000_000);
  });
});
