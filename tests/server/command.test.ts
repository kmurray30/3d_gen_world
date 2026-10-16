import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { createApp } from '../../src/server/app';
import { MockProvider } from '../../src/server/llm/provider';
import { Vocab } from '../../src/server/vocab';
import { Db } from '../../src/server/db';
import type { StreamEvent } from '../../src/shared/schema';

const vocab = Vocab.load(path.resolve('assets/manifest.json'));
const app = createApp({ vocab, provider: new MockProvider(0), db: new Db(':memory:'), version: 'test', auth: { passcode: '', secret: 's', secure: false }, dailyCap: 100 });
const context = {
  player: { pos: [0, 0, 0] as [number, number, number], yaw: 0 },
  entities: [
    { id: 'house_1', word: 'house', kind: 'object' as const, pos: [8, 0, -14] as [number, number, number], h: 5 },
    { id: 'flower_1', word: 'flower', kind: 'object' as const, pos: [5, 0, -9] as [number, number, number], h: 0.5 },
  ],
};

async function events(res: Response): Promise<StreamEvent[]> {
  const text = await res.text();
  return text.split('\n').filter(Boolean).map((l) => JSON.parse(l) as StreamEvent);
}

describe('command route', () => {
  it('streams meta, resolved steps and done for a command', async () => {
    const res = await app.request('/api/worlds/w1/command', { method: 'POST', body: JSON.stringify({ command: 'a dog walks up to me', context }), headers: { 'content-type': 'application/json' } });
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('application/x-ndjson');
    const evs = await events(res);
    expect(evs[0]).toMatchObject({ t: 'meta', model: 'mock' });
    const steps = evs.filter((e) => e.t === 'step');
    expect(steps.length).toBe(4);
    const spawn = (steps[0] as { step: { op: string; id: string; res: { word: string; kind: string } } }).step;
    expect(spawn.op).toBe('spawn');
    expect(spawn.id).toBe('dog_1');
    expect(spawn.res.word).toBe('dog');
    expect(spawn.res.kind).toBe('animal');
    const move = (steps[1] as { step: { op: string; id: string } }).step;
    expect(move.id).toBe('dog_1');
    expect(evs[evs.length - 1]).toMatchObject({ t: 'done', steps: 4 });
  });

  it('rewrites refs to allocated ids, resolves morph words and reports bad steps', async () => {
    const steps = [
      { op: 'spawn', ref: 'can', word: 'watering can', at: { rel: 'above', of: 'flower_1', height: 'low' } },
      { op: 'set', id: 'flower_1', word: 'sunflower' },
      { op: 'move', id: 'ghost', to: { rel: 'near', of: 'house_1' } },
      { op: 'teleport', id: 'can' },
      { op: 'par', do: [{ op: 'remove', id: 'can', how: 'fade' }, { op: 'say', text: 'bye', id: 'nobody' }] },
    ];
    const res = await app.request('/api/worlds/w1/script', { method: 'POST', body: JSON.stringify({ steps, context }), headers: { 'content-type': 'application/json' } });
    const evs = await events(res);
    const stepEvs = evs.filter((e) => e.t === 'step').map((e) => (e as { step: Record<string, unknown> }).step);
    expect(stepEvs[0]).toMatchObject({ op: 'spawn', id: 'can_1', res: { word: 'watering can' } });
    expect(stepEvs[1]).toMatchObject({ op: 'set', id: 'flower_1', res: { word: 'sunflower' } });
    const par = stepEvs[2] as { op: string; do: Array<Record<string, unknown>> };
    expect(par.op).toBe('par');
    expect(par.do[0]).toMatchObject({ op: 'remove', id: 'can_1' });
    expect(par.do[1]).toMatchObject({ op: 'say', text: 'bye' });
    expect((par.do[1] as { id?: string }).id).toBeUndefined();
    const errs = evs.filter((e) => e.t === 'error');
    expect(errs.length).toBe(2);
    expect(evs[evs.length - 1]).toMatchObject({ t: 'done', steps: 3 });
  });

  it('rejects malformed bodies and unknown api routes with json', async () => {
    const bad = await app.request('/api/worlds/w1/command', { method: 'POST', body: '{"command":""}', headers: { 'content-type': 'application/json' } });
    expect(bad.status).toBe(400);
    const nf = await app.request('/api/nope');
    expect(nf.status).toBe(404);
    expect(await nf.json()).toEqual({ error: 'not found' });
  });
});
