import fs from 'node:fs';
import path from 'node:path';
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { env } from './env';
import { mountStatic } from './static';
import type { HealthResponse } from '../shared/types';

const app = new Hono();
if (!env.isProd) app.use(logger());

function countSprites(): number {
  const dir = path.join(env.assetsDir, 'sprites', '512');
  if (!fs.existsSync(dir)) return 0;
  return fs.readdirSync(dir).filter((f) => f.endsWith('.webp')).length;
}

app.get('/api/health', (c) => {
  const body: HealthResponse = { ok: true, sprites: countSprites(), version: process.env.npm_package_version ?? '0.1.0' };
  return c.json(body);
});

// Unknown API routes answer JSON instead of falling through to the SPA.
app.all('/api/*', (c) => c.json({ error: 'not found' }, 404));

mountStatic(app);

serve({ fetch: app.fetch, port: env.port, hostname: '0.0.0.0' }, (info) => {
  console.log(`[server] listening on http://0.0.0.0:${info.port} (${env.nodeEnv})`);
});
