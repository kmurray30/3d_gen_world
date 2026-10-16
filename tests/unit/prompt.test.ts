import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildSystemPrompt, buildUserPrompt } from '../../src/server/llm/prompt';
import { Vocab } from '../../src/server/vocab';
import type { CompactWorld } from '../../src/shared/schema';

const ctx: CompactWorld = {
  player: { pos: [0, 0, 0], yaw: 0 },
  target: 'rock_1',
  entities: [
    { id: 'rock_1', word: 'rock', kind: 'object', pos: [0, 0, -4], h: 0.7 },
    { id: 'tree_1', word: 'tree', kind: 'object', pos: [6, 0, -6], h: 5.5 },
    { id: 'bird_1', word: 'bird', kind: 'animal', pos: [0, 0, 0], h: 0.2, parent: 'tree_1' },
    { id: 'house_1', word: 'house', kind: 'object', pos: [-10, 0, 2], h: 5, state: { on_fire: true }, effects: ['fire'] },
    { id: 'cloud_1', word: 'cloud', kind: 'other', pos: [0, 9, -8], h: 3 },
  ],
};

describe('prompt', () => {
  it('describes the world relative to the player', () => {
    const u = buildUserPrompt('make it bigger', ctx);
    expect(u).toContain('- rock_1: rock | 4m ahead');
    expect(u).toContain('- tree_1: tree | 8.5m ahead-right');
    expect(u).toContain('- bird_1: bird | on tree_1');
    expect(u).toContain('- house_1: house | 10m left | on_fire | fire');
    expect(u).toContain('9m up');
    expect(u).toContain('TARGET (what the player is looking at): rock_1');
    expect(u).toContain('COMMAND: "make it bigger"');
  });

  it('turns with the player', () => {
    const turned = { ...ctx, player: { pos: [0, 0, 0] as [number, number, number], yaw: Math.PI / 2 } };
    const u = buildUserPrompt('x', turned);
    expect(u).toContain('- rock_1: rock | 4m right');
  });

  it('system prompt lists the vocabulary and examples', () => {
    const vocab = Vocab.load(path.resolve('assets/manifest.json'));
    const s = buildSystemPrompt(vocab);
    expect(s).toContain('"steps"');
    expect(s).toContain('Animals (');
    expect(s).toContain('watering can');
    expect(s.length).toBeGreaterThan(30000);
  });
});
