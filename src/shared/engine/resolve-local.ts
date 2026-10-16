import type { Kind } from '../types';
import type { ResolvedAction, ResolvedStep, Step, WordResolution } from '../schema';
import { DEFAULT_HEIGHT_M, defaultSprite } from './sizing';

const ANIMALS = new Set(['dog', 'cat', 'bird', 'horse', 'cow', 'pig', 'frog', 'rabbit', 'fox', 'bear', 'dragon', 'fish', 'duck', 'chicken', 'sheep', 'wolf', 'lion', 'snake', 'butterfly', 'bee']);
const HUMANS = new Set(['man', 'woman', 'boy', 'girl', 'knight', 'wizard', 'king', 'queen', 'farmer', 'robot', 'zombie', 'ghost', 'pirate', 'ninja', 'chef', 'doctor', 'police officer']);
const HEIGHTS: Record<string, number> = { tree: 5, house: 5, castle: 8, mountain: 12, car: 1.5, truck: 2.5, dragon: 4, horse: 1.7, cow: 1.4, bird: 0.2, cat: 0.3, dog: 0.6, ball: 0.3, rock: 0.5, flower: 0.4, sunflower: 1.6, 'watering can': 0.35, cloud: 3, sun: 6 };

/** Dev-only resolver: no manifest, every word is a placeholder card with a guessed kind and height. */
export function localResolve(word: string): WordResolution {
  const w = word.toLowerCase().trim();
  const kind: Kind = ANIMALS.has(w) ? 'animal' : HUMANS.has(w) ? 'human' : 'object';
  const heightM = HEIGHTS[w] ?? DEFAULT_HEIGHT_M[kind];
  return { word: w, sprite: defaultSprite(kind), kind, heightM, solid: true, huge: heightM >= 12, placeholder: true };
}

export function resolveStepsLocally(steps: Step[]): ResolvedStep[] {
  const one = (a: Step): ResolvedAction => {
    if (a.op === 'spawn') return { ...a, id: a.ref, res: localResolve(a.word) };
    if (a.op === 'set' && a.word) return { ...a, res: localResolve(a.word) };
    return a as ResolvedAction;
  };
  return steps.map((s) => (s.op === 'par' ? { op: 'par', do: s.do.map(one) } : one(s)));
}
