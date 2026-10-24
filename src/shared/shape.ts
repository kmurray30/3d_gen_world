/**
 * How a drawn thing stands in the world. Most cutouts are flat paper; round things (fountains, barrels, lamp
 * posts) are turned into a ten-sided solid from their own outline; plant-like and post-like things (flowers,
 * signs, statues) are two crossed sheets, like the origami trees. Words decide; the client only overrides
 * "round" when the drawing turns out lopsided (then it is crossed instead).
 */
import type { Kind } from './types';

export const DECOR_SHAPES = ['flat', 'cross', 'round'] as const;
export type DecorShape = (typeof DECOR_SHAPES)[number];

const ROUND = new RegExp(
  '(^|\\s)(' +
    [
      'fountain', 'well', 'wishing well', 'birdbath', 'bird bath', 'barrel', 'keg', 'cask', 'vase', 'urn', 'pot', 'flowerpot', 'planter',
      'bucket', 'pail', 'cauldron', 'column', 'pillar', 'pedestal', 'lamppost', 'lamp post', 'street ?lamp', 'street ?light', 'lamp',
      'lantern', 'lighthouse', 'candle', 'candlestick', 'cake', 'cupcake', 'drum', 'jar', 'bottle', 'cup', 'mug', 'bowl', 'trash can',
      'garbage can', 'bin', 'fire hydrant', 'hydrant', 'traffic cone', 'cone', 'beehive', 'hay ?bale', 'pumpkin', 'rock', 'boulder',
      'stone', 'globe', '\\w*ball', 'snowman', 'chimney', 'silo', 'water tower', 'flagpole', 'stump', 'tree stump', 'mushroom',
      'toadstool', 'obelisk', 'sundial', 'tub', 'gumdrop', 'lollipop', 'hourglass', 'bell', 'buoy', 'can', 'tin can', 'spool',
      'cylinder', 'tower', 'totem', 'thermos', 'cookie jar', 'teacup', 'goblet', 'chalice', 'trophy', 'egg', 'acorn', 'onion', 'apple',
    ].join('|') +
    ')$',
);

const CROSS = new RegExp(
  '(^|\\s)(' +
    [
      'signpost', 'sign', 'road sign', 'statue', 'scarecrow', 'mailbox', 'cactus', 'flower', 'flowers', 'rose', 'sunflower', 'daisy',
      'tulip', 'lily', 'lavender', 'dandelion', 'poppy', 'orchid', 'grass', 'tall grass', 'reed', 'reeds', 'cattail', 'corn', 'wheat',
      'crop', 'crops', 'weathervane', 'flag', 'torch', 'campfire', 'bonfire', 'candy cane', 'windmill', 'fern', 'palm', 'bamboo', 'ivy',
      'vine', 'coral', 'seaweed', 'kelp', 'sapling', 'sprout', 'plant', 'potted plant', 'weed', 'clover', 'thistle', 'herb', 'flame',
      'fire', 'easel', 'coat rack', 'hat stand', 'scarecrow', 'totem pole', 'antenna', 'satellite dish', 'telescope', 'microphone',
      'fishing rod', 'broom', 'mop', 'pitchfork', 'shovel', 'rake', 'hoe', 'spear', 'banner', 'kite', 'pinwheel', 'balloon', 'balloons',
    ].join('|') +
    ')$',
);

/** Living things stay flat paper (they turn and walk); round things a snowman can be. */
export function shapeForWord(word: string, kind: Kind): DecorShape | null {
  const w = word.toLowerCase().trim();
  if (kind === 'animal' || kind === 'human') return 'flat';
  if (kind === 'humanoid') return /(^|\s)snowman$/.test(w) ? 'round' : 'flat';
  if (ROUND.test(w)) return 'round';
  if (CROSS.test(w)) return 'cross';
  return null;
}

export function isDecorShape(v: unknown): v is DecorShape {
  return typeof v === 'string' && (DECOR_SHAPES as readonly string[]).includes(v);
}

/** The shape field an entity or word resolution carries: only solids are stored, flat paper says nothing. */
export function solidShapeOf(word: string, kind: Kind): { shape?: 'cross' | 'round' } {
  const shape = shapeForWord(word, kind);
  return shape === 'cross' || shape === 'round' ? { shape } : {};
}
