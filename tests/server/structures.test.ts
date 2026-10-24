import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { createApp } from '../../src/server/app';
import { MockProvider } from '../../src/server/llm/provider';
import { CachedClassifier, HeuristicClassifier, JevClassifier, readProbability, type StructureClassifier } from '../../src/server/llm/classify';
import { CommandValidator } from '../../src/server/llm/validate';
import { StructureResolver } from '../../src/server/structures';
import { Vocab } from '../../src/server/vocab';
import { Db } from '../../src/server/db';
import type { ResolvedBuild, StreamEvent } from '../../src/shared/schema';
import type { World } from '../../src/shared/types';

const vocab = Vocab.load(path.resolve('assets/manifest.json'));
const context = { player: { pos: [0, 0, 0] as [number, number, number], yaw: 0 }, entities: [] };

describe('heuristic classifier', () => {
  const h = new HeuristicClassifier();
  it('knows buildings from toys', async () => {
    expect(await h.isStructure('fire station')).toBe(true);
    expect(await h.isStructure('doll house')).toBe(false);
    expect(await h.isStructure('dollhouse')).toBe(false);
    expect(await h.isStructure('birdhouse')).toBe(false);
    expect(await h.isStructure('post office')).toBe(true);
    expect(await h.isStructure('bakery')).toBe(true);
    expect(await h.isStructure('banana')).toBeNull();
  });
});

describe('jev classifier', () => {
  it('reads probabilities from the likely response shapes', () => {
    expect(readProbability({ answers: { structure: 0.91 } }, 'structure')).toBe(0.91);
    expect(readProbability({ answers: { structure: { probability: 0.2 } } }, 'structure')).toBe(0.2);
    expect(readProbability({ structure: { answer: false, confidence: 0.8 } }, 'structure')).toBeCloseTo(0.2);
    expect(readProbability({ results: { structure: { value: true, confidence: 0.7 } } }, 'structure')).toBeCloseTo(0.7);
    expect(readProbability({ nope: 1 }, 'structure')).toBeNull();
  });

  it('posts a noul question with a bearer token and falls back to the heuristic on failure', async () => {
    const calls: Array<{ url: string; body: Record<string, unknown>; auth: string }> = [];
    const fetchFn = (async (url: string | URL | Request, init?: RequestInit) => {
      const body = JSON.parse(init?.body as string) as Record<string, unknown>;
      calls.push({ url: String(url), body, auth: (init?.headers as Record<string, string>).authorization });
      if ((body.state as { word: string }).word.includes('boom')) return new Response('nope', { status: 500 });
      return new Response(JSON.stringify({ answers: { structure: (body.state as { word: string }).word === 'fire station' ? 0.93 : 0.04 } }), { status: 200 });
    }) as typeof fetch;
    const jev = new JevClassifier({ apiKey: 'k', fetchFn });
    const c = new CachedClassifier(jev, new HeuristicClassifier());
    expect(await c.isStructure('fire station')).toBe(true);
    expect(await c.isStructure('doll house')).toBe(false);
    expect(await c.isStructure('boom bakery')).toBe(true); // jev said 500 -> heuristic
    expect(await c.isStructure('fire station')).toBe(true); // cached
    expect(calls.length).toBe(3);
    expect(calls[0].url).toContain('api.typesafe.ai');
    expect(calls[0].auth).toBe('Bearer k');
    expect(calls[0].body.model).toBe('jev-latest');
    expect((calls[0].body.questions as Record<string, { type: string }>).structure.type).toBe('noul');
  });
});

describe('structure routing', () => {
  const resolver = new StructureResolver(vocab, new HeuristicClassifier());

  it('spawns of building words become builds; drawings stay cutouts; novel buildings get a sign', async () => {
    const v = new CommandValidator(vocab, context, resolver);
    const house = await v.handle({ op: 'spawn', ref: 'h', word: 'house', at: { rel: 'front' } });
    expect(house.step?.op).toBe('build');
    expect((house.step as ResolvedBuild).structure.gen).toBe('house');
    expect((house.step as ResolvedBuild).id).toBe('h_1');
    const dog = await v.handle({ op: 'spawn', ref: 'd', word: 'dog', at: { rel: 'front' } });
    expect(dog.step?.op).toBe('spawn');
    const station = await v.handle({ op: 'spawn', ref: 's', word: 'fire station', at: { rel: 'front' } });
    expect(station.step?.op).toBe('build');
    const st = (station.step as ResolvedBuild).structure;
    expect(st.gen).toBe('house');
    expect(st.parts.some((p) => p.t === 'decal' && p.text === 'FIRE STATION')).toBe(true);
    const doll = await v.handle({ op: 'spawn', ref: 'x', word: 'doll house', at: { rel: 'front' } });
    expect(doll.step?.op).toBe('spawn');
    // later steps can refer to the built thing
    const fire = await v.handle({ op: 'effect', name: 'fire', id: 'h', loop: true });
    expect(fire.step).toMatchObject({ op: 'effect', id: 'h_1' });
  });

  it('build runs generators with coerced params and lays out custom parts', async () => {
    const v = new CommandValidator(vocab, context, resolver);
    const r = await v.handle({ op: 'build', ref: 'c', word: 'cottage', at: 'front', params: { color: 'blue', stories: '2', roof: 'HIP' } });
    const s = (r.step as ResolvedBuild).structure;
    expect(s.gen).toBe('house');
    expect(s.params.wallColor).toBe('#4e8fd6');
    expect(s.params.stories).toBe(2);
    expect(s.params.roof).toBe('hip');
    const custom = await v.handle({ op: 'build', ref: 't', word: 'teapot house', at: 'front', parts: [{ shape: 'dome', r: 3, h: 3, name: 'pot' }, { shape: 'cylinder', on: 'pot', at: 'right', r: 0.4, h: 2 }] });
    expect((custom.step as ResolvedBuild).structure.gen).toBe('custom');
    expect((custom.step as ResolvedBuild).structure.parts.length).toBe(3);
    const bad = await v.handle({ op: 'build', ref: 'b', word: 'thing', at: 'front', gen: 'spaceship' });
    expect((bad.step as ResolvedBuild).structure.gen).toBe('house'); // unknown gen: a building anyway
  });

  it('the classifier only sees novel words', async () => {
    const asked: string[] = [];
    const spy: StructureClassifier = { name: 'spy', isStructure: async (w) => (asked.push(w), false) };
    const v = new CommandValidator(vocab, context, new StructureResolver(vocab, spy));
    await v.handle({ op: 'spawn', ref: 'a', word: 'dog', at: 'front' });
    await v.handle({ op: 'spawn', ref: 'b', word: 'house', at: 'front' });
    await v.handle({ op: 'spawn', ref: 'c', word: 'quantum bakery', at: 'front' });
    expect(asked).toEqual(['quantum bakery']);
  });
});

describe('server routes', () => {
  const app = createApp({ vocab, provider: new MockProvider(0), db: new Db(':memory:'), version: 'test', auth: { passcode: '', secret: 's', secure: false }, dailyCap: 100 });

  it('creates village worlds and resets them to the village', async () => {
    const r = await app.request('/api/worlds?preset=village', { method: 'POST' });
    expect(r.status).toBe(201);
    const { slug, world } = (await r.json()) as { slug: string; world: World };
    expect(world.preset).toBe('village');
    const gens = world.entities.filter((e) => e.structure).map((e) => e.structure!.gen);
    expect(gens).toContain('lighthouse');
    expect(gens).toContain('bunker');
    // decals resolved against the vocabulary: doors and windows are real sprites
    const house = world.entities.find((e) => e.structure?.gen === 'house')!;
    expect(house.structure!.parts.some((p) => p.t === 'decal' && p.sprite.file === 'door.webp')).toBe(true);
    const reset = await app.request(`/api/worlds/${slug}/reset`, { method: 'POST' });
    expect(((await reset.json()) as { world: World }).world.preset).toBe('village');
    const bad = await app.request('/api/worlds?preset=moon', { method: 'POST' });
    expect(bad.status).toBe(400);
    const plain = await app.request('/api/worlds', { method: 'POST' });
    expect(((await plain.json()) as { world: World }).world.preset).toBeUndefined();
  });

  it('config carries the avatar and the mock command path builds structures', async () => {
    const cfg = (await (await app.request('/api/config')).json()) as { avatar?: { word: string; sprite: { file: string | null } } };
    expect(cfg.avatar?.word).toBe('boy');
    expect(cfg.avatar?.sprite.file).toBe('boy.webp');
    const res = await app.request('/api/worlds/w1/command', { method: 'POST', body: JSON.stringify({ command: 'build a wizard tower with a crooked hat', context }), headers: { 'content-type': 'application/json' } });
    const evs = (await res.text()).split('\n').filter(Boolean).map((l) => JSON.parse(l) as StreamEvent);
    const build = evs.find((e) => e.t === 'step' && (e.step as { op: string }).op === 'build') as { step: ResolvedBuild } | undefined;
    expect(build?.step.structure.gen).toBe('custom');
    expect(build?.step.structure.parts.length).toBe(4);
  });
});

describe('changing buildings', () => {
  it('set with params regenerates a building from its recorded parameters (add a story)', async () => {
    const resolver = new StructureResolver(vocab, new HeuristicClassifier());
    const ctx = {
      player: { pos: [0, 0, 0] as [number, number, number], yaw: 0 },
      entities: [
        { id: 'house_1', word: 'house', kind: 'object' as const, pos: [0, 0, 6] as [number, number, number], h: 4, structure: { gen: 'house', params: { stories: 1, w: 5, d: 4, wallMat: 'brick', wallColor: '#c96a4b', roof: 'gable' } } },
        { id: 'dog_1', word: 'dog', kind: 'animal' as const, pos: [1, 0, 2] as [number, number, number], h: 0.6 },
      ],
    };
    const v = new CommandValidator(vocab, ctx, resolver);
    const r = await v.handle({ op: 'set', id: 'house_1', params: { stories: 2 } });
    const step = r.step as { op: string; id: string; structure?: { gen: string; params: Record<string, unknown>; heightM: number } };
    expect(step.op).toBe('set');
    expect(step.structure?.gen).toBe('house');
    expect(step.structure?.params.stories).toBe(2);
    expect(step.structure?.params.wallMat).toBe('brick'); // the rest of the house is kept
    expect(step.structure?.params.wallColor).toBe('#c96a4b');
    expect(r.errors).toEqual([]);
    const again = await v.handle({ op: 'set', id: 'house_1', params: { stories: 3 } });
    expect((again.step as typeof step).structure?.params.stories).toBe(3);
    const dog = await v.handle({ op: 'set', id: 'dog_1', params: { stories: 2 } });
    expect((dog.step as typeof step).structure).toBeUndefined();
    expect(dog.errors.length).toBe(1);
  });
});
