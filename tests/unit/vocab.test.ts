import { describe, expect, it } from 'vitest';
import { Vocab, jaroWinkler } from '../../src/server/vocab';

const word = (t: 'object' | 'human' | 'animal' | 'other', hm: number, f: string | null = 'x.webp') => ({ f, w: 512, h: 512, t, hm, solid: t !== 'other', huge: false, tags: [] });
const vocab = new Vocab({
  version: 'test',
  counts: { words: 0, withSprite: 0, aliases: 0 },
  words: {
    dog: word('animal', 0.6),
    tree: word('object', 10),
    'bat (animal)': word('animal', 0.1),
    'bat (baseball)': word('object', 0.8),
    elephant: word('animal', 3),
    hose: word('object', 0.3),
    socks: word('object', 0.1),
    factory: word('object', 12),
    'potted plant': word('object', 0.5),
    beef: word('object', 0.2),
    cow: word('animal', 1.4),
    man: word('human', 1.75),
    bicycle: word('object', 1),
    motorcycle: word('object', 1.1),
    'kid (animal)': word('animal', 0.6),
    boy: word('human', 1.3),
  },
  aliases: { plant: ['factory'], hound: ['dog'], bike: ['bicycle', 'motorcycle'] },
  overrides: { plant: 'potted plant', person: 'man', kid: 'boy' },
});

describe('Vocab.resolveWord', () => {
  it('matches exact words, strips articles, handles plurals and phrases', () => {
    expect(vocab.resolveWord('dog')).toBe('dog');
    expect(vocab.resolveWord('a Dog!')).toBe('dog');
    expect(vocab.resolveWord('dogs')).toBe('dog');
    expect(vocab.resolveWord('tall oak tree')).toBe('tree');
  });
  it('disambiguates parenthetical variants by kind hint', () => {
    expect(vocab.resolveWord('bat')).toBe('bat (animal)');
    expect(vocab.resolveWord('bat', 'object')).toBe('bat (baseball)');
  });
  it('prefers overrides to synonym traps, then aliases', () => {
    expect(vocab.resolveWord('plant')).toBe('potted plant');
    expect(vocab.resolveWord('person')).toBe('man');
    expect(vocab.resolveWord('kid')).toBe('boy'); // override beats the goat variant
    expect(vocab.resolveWord('kids')).toBe('boy');
    expect(vocab.resolveWord('hound')).toBe('dog');
    expect(vocab.resolveWord('bike')).toBe('bicycle');
    expect(vocab.resolveWord('hose')).toBe('hose');
  });
  it('fuzzy matches close misspellings only', () => {
    expect(vocab.resolveWord('elefant')).toBe('elephant');
    expect(vocab.resolveWord('xyzzyq')).toBeNull();
    expect(jaroWinkler('martha', 'marhta')).toBeGreaterThan(0.95);
  });
  it('resolve() uses alternates and falls back to a placeholder', () => {
    expect(vocab.resolve('hoverboard', ['bicycle']).word).toBe('bicycle');
    const ph = vocab.resolve('hoverboard');
    expect(ph.placeholder).toBe(true);
    expect(ph.sprite.file).toBeNull();
    expect(ph.word).toBe('hoverboard');
  });
});
