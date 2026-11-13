import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import '../../src/shared/figure/catalog/index';
import { townWorld, type TownLot } from '../../src/shared/city/town';
import { MAX_SIZE_M, extraWords, type Tag, type TownWord } from '../../src/shared/city/items';
import { PLACES } from '../../src/shared/city/places';
import type { Entity } from '../../src/shared/types';

const manifest = JSON.parse(fs.readFileSync(path.resolve('assets/manifest.json'), 'utf8')).words as Record<string, { t: TownWord['kind']; hm: number }>;
const vocab: TownWord[] = Object.entries(manifest).map(([word, e]) => ({ word, kind: e.t, hm: e.hm }));
// every word, and the catalog's act-only props (the slice of bread) as things of their own
const words: TownWord[] = [...vocab, ...extraWords(new Set(vocab.map((w) => w.word)))];
const tags = JSON.parse(fs.readFileSync(path.resolve('src/shared/city/tags.json'), 'utf8')) as Record<string, Tag>;

/** The lot a point stands in (lots are turned by their yaw). */
function lotAt(lots: TownLot[], x: number, z: number): TownLot | undefined {
  return lots.find((l) => {
    const r = (l.yaw * Math.PI) / 180;
    const dx = x - l.x, dz = z - l.z;
    const lx = dx * Math.cos(r) - dz * Math.sin(r);
    const lz = dx * Math.sin(r) + dz * Math.cos(r);
    return Math.abs(lx) <= l.w / 2 + 0.5 && Math.abs(lz) <= l.d / 2 + 0.5;
  });
}

describe('Everytown', () => {
  const world = townWorld(words, tags, () => null, () => null, 0);
  const things = world.entities.filter((e) => /^(a|st|sky)_/.test(e.id) && !e.state.setup);
  const byWord = new Map<string, Entity>(things.map((e) => [e.word, e]));
  const lots = world.town.lots;

  it('every word is tagged with real places', () => {
    const missing = words.filter((w) => !tags[w.word]);
    expect(missing.length).toBeLessThan(words.length * 0.01);
    for (const [, t] of Object.entries(tags)) for (const p of t.p) expect(PLACES[p], p).toBeTruthy();
  });

  it('holds every word in the vocabulary (and every act-only prop) exactly once, with unique ids', () => {
    expect(words.some((w) => w.word === 'slice of bread')).toBe(true);
    expect(things.length).toBe(words.length);
    expect(new Set(things.map((e) => e.word)).size).toBe(words.length);
    expect(new Set(world.entities.map((e) => e.id)).size).toBe(world.entities.length);
  });

  it('puts things where you would find them in the real world', () => {
    const at = (word: string) => {
      const e = byWord.get(word)!;
      return lotAt(lots, e.pos[0], e.pos[2])?.title ?? '(street)';
    };
    expect(at('tank')).toMatch(/Military Base/);
    expect(at('banana')).toMatch(/Grocery/);
    expect(at('lion')).toMatch(/Zoo/);
    expect(at('stethoscope')).toMatch(/Hospital/);
    expect(at('hammer')).toMatch(/Hardware|Construction/);
    expect(at('refrigerator')).toBe('House');
    expect(at('telescope')).toMatch(/Observatory|Planetarium/);
  });

  it('has the places the things need, signposts at junctions and standing maps', () => {
    const titles = new Set(lots.map((l) => l.title));
    for (const t of ['Grocery Store', 'Pharmacy', 'Military Base', 'Zoo', 'Airport', 'Hospital', 'School', 'House']) expect(titles, t).toContain(t);
    const structures = world.entities.filter((e) => e.structure);
    expect(structures.filter((e) => e.word === 'signpost').length).toBeGreaterThan(8);
    expect(structures.filter((e) => e.word === 'map').length).toBeGreaterThan(4);
    // every map draws the town with you are here where it stands
    const maps = structures.filter((e) => e.word === 'map');
    for (const m of maps) {
      const texts = m.structure!.parts.map((d) => ('text' in d ? String(d.text ?? '') : ''));
      expect(texts.some((t) => t.startsWith(`@map:${Math.round(m.pos[0])},${Math.round(m.pos[2])}`))).toBe(true);
    }
  });

  it('is full of people, some of them walking about', () => {
    const walkers = world.entities.filter((e) => e.state.wander);
    expect(walkers.length).toBeGreaterThanOrEqual(40);
    const people = world.entities.filter((e) => e.kind === 'human');
    expect(people.length).toBeGreaterThan(300);
  });

  it('shows things at their real size, except giants and specks', () => {
    for (const e of things) {
      const shown = e.heightM * e.scale;
      expect(shown, e.word).toBeLessThanOrEqual(MAX_SIZE_M + 0.01);
      expect(Math.abs(e.pos[0]), e.word).toBeLessThan(world.terrain!.size);
      expect(Math.abs(e.pos[2]), e.word).toBeLessThan(world.terrain!.size);
    }
    // a person is a person's height and a bus is a bus's height, side by side in the same world
    expect(byWord.get('school bus')!.scale).toBe(1);
    expect(byWord.get('school bus')!.heightM).toBeGreaterThan(2.5);
    expect(byWord.get('banana')!.heightM).toBeLessThan(0.3);
  });

  it('runs the things’ setups: what goes in something starts in it', () => {
    const inside = world.entities.filter((e) => e.state.setup && e.parent);
    expect(inside.length).toBeGreaterThan(10);
    for (const e of inside) expect(world.entities.some((p) => p.id === e.parent)).toBe(true);
  });

  it('is deterministic and compact enough to send', () => {
    const again = townWorld(words, tags, () => null, () => null, 0);
    expect(JSON.stringify(again)).toBe(JSON.stringify(world));
    expect(JSON.stringify(world).length).toBeLessThan(5_000_000);
  });
});
