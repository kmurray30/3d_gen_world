import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { checkPasscode, isAuthed, issueCookie, requireAuth, type AuthConfig } from './auth';
import { today, type Db } from './db';
import type { LlmProvider } from './llm/provider';
import { RateLimiter, clientIp } from './ratelimit';
import { commandRoutes } from './routes/command';
import { worldsRoutes } from './routes/worlds';
import { mountStatic } from './static';
import type { Vocab } from './vocab';

export interface AppDeps {
  vocab: Vocab;
  provider: LlmProvider;
  db: Db;
  version: string;
  auth: AuthConfig;
  dailyCap: number;
  limits?: { perIpPerMin: number; perSlugPerMin: number };
  log?: boolean;
}

export function createApp(deps: AppDeps): Hono {
  const app = new Hono();
  if (deps.log) app.use(logger());
  const perIp = new RateLimiter(deps.limits?.perIpPerMin ?? 10);
  const perSlug = new RateLimiter(deps.limits?.perSlugPerMin ?? 30);

  app.get('/api/health', (c) =>
    c.json({
      ok: true,
      sprites: deps.vocab.counts.withSprite,
      words: deps.vocab.counts.words,
      version: deps.version,
      llm: deps.provider.name,
      commandsToday: deps.db.usage(),
    }),
  );
  app.get('/api/config', (c) =>
    c.json({ spriteVersion: deps.vocab.version, llm: deps.provider.name, needsPasscode: !!deps.auth.passcode, authed: isAuthed(c, deps.auth) }),
  );
  app.post('/api/auth', async (c) => {
    const body = (await c.req.json().catch(() => ({}))) as { passcode?: string };
    if (!perIp.take(`auth:${clientIp(c)}`)) return c.json({ error: 'too many attempts, wait a minute' }, 429);
    if (!checkPasscode(body.passcode ?? '', deps.auth)) return c.json({ error: 'wrong passcode' }, 401);
    issueCookie(c, deps.auth);
    return c.json({ ok: true });
  });

  app.use('/api/worlds/*', requireAuth(deps.auth));
  app.use('/api/worlds', requireAuth(deps.auth));

  // Command budget: per-IP and per-world rate limits, then the global daily cap.
  app.use('/api/worlds/:slug/command', async (c, next) => {
    if (!perIp.take(clientIp(c))) return c.json({ error: 'Slow down a little: ten commands a minute per player.' }, 429);
    if (!perSlug.take(c.req.param('slug'))) return c.json({ error: 'This world is busy: thirty commands a minute at most.' }, 429);
    if (deps.db.usage(today()) >= deps.dailyCap) return c.json({ error: 'The daily command budget is used up. Try again tomorrow.' }, 429);
    deps.db.bumpUsage(today());
    await next();
  });

  app.route('/api/worlds', worldsRoutes(deps.db, deps.vocab));
  app.route(
    '/api/worlds',
    commandRoutes({
      vocab: deps.vocab,
      provider: deps.provider,
      onCommand: (info) => {
        deps.db.logCommand({ slug: info.slug, text: info.command, steps: info.steps, ms: info.ms, model: info.model, errors: info.errors });
        if (deps.log) {
          console.log(`[cmd] ${info.slug} "${info.command}" -> ${info.steps} steps in ${info.ms}ms${info.errors.length ? ` (${info.errors.length} skipped: ${info.errors.join('; ').slice(0, 200)})` : ''}`);
          if (process.env.LLM_DEBUG === '1') console.log(`[raw] ${info.raw.slice(0, 3000)}`);
        }
      },
    }),
  );

  app.all('/api/*', (c) => c.json({ error: 'not found' }, 404));
  mountStatic(app);
  return app;
}
