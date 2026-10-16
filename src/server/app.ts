import { Hono } from 'hono';
import { logger } from 'hono/logger';
import type { LlmProvider } from './llm/provider';
import { commandRoutes } from './routes/command';
import { mountStatic } from './static';
import type { Vocab } from './vocab';

export interface AppDeps {
  vocab: Vocab;
  provider: LlmProvider;
  version: string;
  passcode: string;
  log?: boolean;
  onCommand?: Parameters<typeof commandRoutes>[0]['onCommand'];
}

export function createApp(deps: AppDeps): Hono {
  const app = new Hono();
  if (deps.log) app.use(logger());

  app.get('/api/health', (c) =>
    c.json({ ok: true, sprites: deps.vocab.counts.withSprite, words: deps.vocab.counts.words, version: deps.version, llm: deps.provider.name }),
  );
  app.get('/api/config', (c) => c.json({ spriteVersion: deps.vocab.version, llm: deps.provider.name, needsPasscode: !!deps.passcode }));

  app.route('/api/worlds', commandRoutes({ vocab: deps.vocab, provider: deps.provider, onCommand: deps.onCommand }));

  app.all('/api/*', (c) => c.json({ error: 'not found' }, 404));
  mountStatic(app);
  return app;
}
