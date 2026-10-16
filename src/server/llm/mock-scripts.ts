import type { CompactWorld, Step } from '../../shared/schema';

/** Canned scripts for MOCK_LLM=1: pick by command keywords, filling in ids from the world context. */
export function mockScript(command: string, ctx: CompactWorld): Step[] {
  const c = command.toLowerCase();
  const find = (re: RegExp) => ctx.entities.find((e) => re.test(e.word))?.id;
  const house = find(/house|hut|cabin|castle/);
  const flower = find(/flower|sprout|sapling|plant/);
  const any = ctx.target ?? ctx.entities[0]?.id;
  if (/disappear|clear|delete everything|remove everything/.test(c)) return [{ op: 'remove', id: 'all', how: 'fade' }];
  if (/water/.test(c) && flower)
    return [
      { op: 'spawn', ref: 'can', word: 'watering can', at: { rel: 'above', of: flower, height: 'low' } },
      { op: 'set', id: 'can', tilt: -45, dur: 0.5 },
      { op: 'par', do: [{ op: 'effect', name: 'water_spray', id: 'can', dur: 2.5 }, { op: 'set', id: flower, scale: 2.2, dur: 2.5, delay: 0.5 }] },
      { op: 'set', id: flower, word: 'sunflower' },
      { op: 'par', do: [{ op: 'set', id: 'can', tilt: 0, dur: 0.4 }, { op: 'effect', name: 'sparkle', id: flower, dur: 1.5 }] },
      { op: 'remove', id: 'can', how: 'fade' },
    ];
  if (/fire|burn/.test(c) && house)
    return [
      { op: 'set', id: house, state: { on_fire: true } },
      { op: 'effect', name: 'fire', id: house, loop: true },
      { op: 'effect', name: 'smoke', id: house, loop: true },
      { op: 'anim', id: house, name: 'shake' },
      { op: 'say', text: 'The house is on fire!' },
    ];
  if (/cat/.test(c) && house)
    return [
      { op: 'spawn', ref: 'cat', word: 'cat', at: { rel: 'near', of: house, height: 'ground' } },
      { op: 'move', id: 'cat', to: { rel: 'on', of: house, height: 'ground' }, style: 'hop' },
      { op: 'say', id: 'cat', text: 'meow' },
      { op: 'wait', dur: 1 },
      { op: 'drop', id: 'cat' },
      { op: 'anim', id: 'cat', name: 'wobble' },
    ];
  if (/dog|walks up|comes to me/.test(c))
    return [
      { op: 'spawn', ref: 'dog', word: 'dog', at: { rel: 'offscreen', of: 'player', height: 'ground' } },
      { op: 'move', id: 'dog', to: { rel: 'near', of: 'player', dist: 'close', height: 'ground' }, style: 'walk' },
      { op: 'anim', id: 'dog', name: 'hop', times: 2 },
      { op: 'say', id: 'dog', text: 'woof!' },
    ];
  if (/knight|bow/.test(c))
    return [
      { op: 'spawn', ref: 'knight', word: 'knight', at: { rel: 'front', of: 'player', height: 'ground' }, face: 'player' },
      { op: 'set', id: 'knight', tilt: 25, dur: 0.6 },
      { op: 'wait', dur: 0.5 },
      { op: 'set', id: 'knight', tilt: 0, dur: 0.6 },
      { op: 'say', id: 'knight', text: 'My liege.' },
    ];
  if (/grow|bigger|huge/.test(c) && any) return [{ op: 'set', id: any, scale: 2.5, dur: 1.5 }, { op: 'effect', name: 'sparkle', id: any, dur: 1 }];
  if (/shrink|smaller|tiny/.test(c) && any) return [{ op: 'set', id: any, scale: 0.4, dur: 1 }];
  // default: spawn the last noun-ish token in front of the player
  const words = c.replace(/[^a-z\s]/g, '').split(/\s+/).filter((w) => w.length > 2 && !['the', 'and', 'spawn', 'make', 'create', 'appear', 'appears', 'please', 'with', 'into', 'here', 'there'].includes(w));
  const word = words[words.length - 1] ?? 'rock';
  return [
    { op: 'spawn', ref: word, word, at: { rel: 'front', of: 'player', height: 'ground' } },
    { op: 'anim', id: word, name: 'bounce' },
  ];
}
