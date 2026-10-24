import { describe, expect, it } from 'vitest';
import { shapeForWord } from '../../src/shared/shape';
import { makeEntity } from '../../src/shared/engine/make-entity';

describe('decor shapes', () => {
  it('turns round things into solids and plant-like things into crossed sheets', () => {
    expect(shapeForWord('fountain', 'object')).toBe('round');
    expect(shapeForWord('stone fountain', 'object')).toBe('round');
    expect(shapeForWord('lamppost', 'object')).toBe('round');
    expect(shapeForWord('lamp post', 'object')).toBe('round');
    expect(shapeForWord('street lamp', 'object')).toBe('round');
    expect(shapeForWord('barrel', 'object')).toBe('round');
    expect(shapeForWord('beach ball', 'object')).toBe('round');
    expect(shapeForWord('signpost', 'object')).toBe('cross');
    expect(shapeForWord('mailbox', 'object')).toBe('cross');
    expect(shapeForWord('sunflower', 'object')).toBe('cross');
    expect(shapeForWord('scarecrow', 'object')).toBe('cross');
  });

  it('leaves flat things, creatures and people as paper', () => {
    expect(shapeForWord('bench', 'object')).toBeNull();
    expect(shapeForWord('painting', 'object')).toBeNull();
    expect(shapeForWord('wellington boot', 'object')).toBeNull();
    expect(shapeForWord('dog', 'animal')).toBe('flat');
    expect(shapeForWord('boy', 'human')).toBe('flat');
    expect(shapeForWord('wizard', 'humanoid')).toBe('flat');
    expect(shapeForWord('snowman', 'humanoid')).toBe('round');
  });

  it('preset entities carry their shape', () => {
    const resolve = () => ({ file: 'x.webp', w: 100, h: 100 });
    expect(makeEntity({ id: 'f', word: 'fountain', kind: 'object', heightM: 2, pos: [0, 0, 0] }, resolve, 0).shape).toBe('round');
    expect(makeEntity({ id: 's', word: 'signpost', kind: 'object', heightM: 2, pos: [0, 0, 0] }, resolve, 0).shape).toBe('cross');
    expect(makeEntity({ id: 'b', word: 'bench', kind: 'object', heightM: 1, pos: [0, 0, 0] }, resolve, 0).shape).toBeUndefined();
  });
});
