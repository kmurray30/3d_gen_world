import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { createApp } from '../../src/server/app';
import { Db } from '../../src/server/db';
import { MockProvider } from '../../src/server/llm/provider';
import { Vocab } from '../../src/server/vocab';
import type { World } from '../../src/shared/types';

const vocab = Vocab.load(path.resolve('assets/manifest.json'));
const json = (body: unknown, method = 'POST', headers: Record<string, string> = {}) => ({ method, body: JSON.stringify(body), headers: { 'content-type': 'application/json', ...headers } });

describe('worlds + auth + limits', () => {
  it('creates, fetches, saves with revision checks, and resets worlds', async () => {
    const app = createApp({ vocab, provider: new MockProvider(0), db: new Db(':memory:'), version: 't', auth: { passcode: '', secret: 's', secure: false }, dailyCap: 100 });
    const created = await app.request('/api/worlds', { method: 'POST' });
    expect(created.status).toBe(201);
    const { slug, world } = (await created.json()) as { slug: string; world: World };
    expect(slug).toMatch(/^[a-z]+-[a-z]+-\d{4}$/);
    expect(world.entities.length).toBeGreaterThan(3);
    const got = await app.request(`/api/worlds/${slug}`);
    expect(got.status).toBe(200);
    const saved = { ...world, rev: 2, entities: world.entities.slice(1) };
    expect((await app.request(`/api/worlds/${slug}`, json({ world: saved }, 'PUT'))).status).toBe(200);
    const stale = await app.request(`/api/worlds/${slug}`, json({ world: { ...world, rev: 2 } }, 'PUT'));
    expect(stale.status).toBe(409);
    expect(((await stale.json()) as { world: World }).world.entities.length).toBe(world.entities.length - 1);
    const reset = await app.request(`/api/worlds/${slug}/reset`, { method: 'POST' });
    const r = ((await reset.json()) as { world: World }).world;
    expect(r.rev).toBe(3);
    expect(r.entities.length).toBe(world.entities.length);
    expect((await app.request('/api/worlds/nope-nope-0000')).status).toBe(404);
  });

  it('gates the api behind the passcode cookie', async () => {
    const app = createApp({ vocab, provider: new MockProvider(0), db: new Db(':memory:'), version: 't', auth: { passcode: 'open-sesame', secret: 'secret', secure: false }, dailyCap: 100 });
    expect((await app.request('/api/worlds', { method: 'POST' })).status).toBe(401);
    const cfg = (await (await app.request('/api/config')).json()) as { needsPasscode: boolean; authed: boolean };
    expect(cfg).toMatchObject({ needsPasscode: true, authed: false });
    expect((await app.request('/api/auth', json({ passcode: 'wrong' }))).status).toBe(401);
    const ok = await app.request('/api/auth', json({ passcode: 'open-sesame' }));
    expect(ok.status).toBe(200);
    const cookie = ok.headers.get('set-cookie')!.split(';')[0];
    expect(cookie).toMatch(/^pw_auth=/);
    expect((await app.request('/api/worlds', { method: 'POST', headers: { cookie } })).status).toBe(201);
    const forged = cookie.replace(/\.[^.]+$/, '.AAAA');
    expect((await app.request('/api/worlds', { method: 'POST', headers: { cookie: forged } })).status).toBe(401);
  });

  it('enforces per-ip limits and the daily cap on commands', async () => {
    const db = new Db(':memory:');
    const app = createApp({ vocab, provider: new MockProvider(0), db, version: 't', auth: { passcode: '', secret: 's', secure: false }, dailyCap: 3, limits: { perIpPerMin: 2, perSlugPerMin: 100 } });
    const body = { command: 'a dog', context: { player: { pos: [0, 0, 0], yaw: 0 }, entities: [] } };
    const a = await app.request('/api/worlds/x-y-1111/command', json(body, 'POST', { 'x-forwarded-for': '1.1.1.1, 10.0.0.1' }));
    expect(a.status).toBe(200);
    await a.text();
    const b = await app.request('/api/worlds/x-y-1111/command', json(body, 'POST', { 'x-forwarded-for': '1.1.1.1' }));
    expect(b.status).toBe(200);
    await b.text();
    const c = await app.request('/api/worlds/x-y-1111/command', json(body, 'POST', { 'x-forwarded-for': '1.1.1.1' }));
    expect(c.status).toBe(429);
    const d = await app.request('/api/worlds/x-y-1111/command', json(body, 'POST', { 'x-forwarded-for': '2.2.2.2' }));
    expect(d.status).toBe(200);
    await d.text();
    expect(db.usage()).toBe(3);
    const e = await app.request('/api/worlds/x-y-1111/command', json(body, 'POST', { 'x-forwarded-for': '3.3.3.3' }));
    expect(e.status).toBe(429);
    expect(((await e.json()) as { error: string }).error).toMatch(/daily/);
    const health = (await (await app.request('/api/health')).json()) as { commandsToday: number };
    expect(health.commandsToday).toBe(3);
  });
});
