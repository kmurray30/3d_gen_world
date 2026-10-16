import { Hono } from 'hono';
import { z } from 'zod';
import type { World } from '../../shared/types';
import { starterWorld } from '../../shared/engine/presets';
import type { Db } from '../db';
import type { Vocab } from '../vocab';

const ADJ = ['sunny', 'misty', 'quiet', 'windy', 'golden', 'sleepy', 'cozy', 'wild', 'tiny', 'brave', 'lucky', 'merry', 'dusty', 'bright', 'secret', 'rusty'];
const NOUN = ['meadow', 'valley', 'hollow', 'garden', 'orchard', 'pasture', 'glade', 'field', 'grove', 'marsh', 'ridge', 'hill', 'pond', 'yard', 'lane', 'patch'];

export function randomSlug(rng = Math.random): string {
  const pick = (arr: string[]) => arr[Math.floor(rng() * arr.length)];
  return `${pick(ADJ)}-${pick(NOUN)}-${Math.floor(1000 + rng() * 9000)}`;
}

const SLUG = /^[a-z0-9][a-z0-9-]{2,63}$/;

const WorldBody = z.object({
  world: z.object({
    slug: z.string(),
    rev: z.number().int().nonnegative(),
    player: z.object({ pos: z.tuple([z.number(), z.number(), z.number()]), yaw: z.number(), pitch: z.number() }),
    entities: z.array(z.record(z.string(), z.unknown())).max(400),
    createdAt: z.number(),
  }),
});

export function worldsRoutes(db: Db, vocab: Vocab): Hono {
  const app = new Hono();
  const resolver = (word: string, kind: 'object' | 'human' | 'humanoid' | 'animal' | 'other') => {
    const hit = vocab.resolveWord(word, kind);
    return hit ? vocab.entry(hit).sprite : null;
  };
  const fresh = (slug: string): World => starterWorld(slug, resolver);

  app.post('/', (c) => {
    let slug = randomSlug();
    while (db.hasWorld(slug)) slug = randomSlug();
    const world = fresh(slug);
    db.createWorld(world);
    return c.json({ slug, world }, 201);
  });

  app.get('/:slug', (c) => {
    const slug = c.req.param('slug');
    if (!SLUG.test(slug)) return c.json({ error: 'bad slug' }, 400);
    const world = db.getWorld(slug);
    if (!world) return c.json({ error: 'no such world' }, 404);
    return c.json({ world });
  });

  app.put('/:slug', async (c) => {
    const slug = c.req.param('slug');
    if (!SLUG.test(slug)) return c.json({ error: 'bad slug' }, 400);
    const body = WorldBody.safeParse(await c.req.json().catch(() => null));
    if (!body.success) return c.json({ error: 'bad world', detail: body.error.issues[0]?.message }, 400);
    const world = { ...(body.data.world as unknown as World), slug };
    const conflict = db.saveWorld(world);
    if (conflict) return c.json({ error: 'stale revision', world: conflict }, 409);
    return c.json({ ok: true, rev: world.rev });
  });

  app.post('/:slug/reset', (c) => {
    const slug = c.req.param('slug');
    if (!SLUG.test(slug)) return c.json({ error: 'bad slug' }, 400);
    const prev = db.getWorld(slug);
    const world = fresh(slug);
    world.rev = (prev?.rev ?? 0) + 1;
    if (prev) world.createdAt = prev.createdAt;
    db.replaceWorld(world);
    return c.json({ world });
  });

  return app;
}
