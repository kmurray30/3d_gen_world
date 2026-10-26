import type { Hono } from 'hono';
import { serveStatic } from '@hono/node-server/serve-static';

const IMMUTABLE = 'public, max-age=31536000, immutable';
const SHORT = 'public, max-age=60, must-revalidate';

/**
 * Static files:
 *  - /sprites/<manifestVersion>/<size>/<file>.webp  -> assets/sprites/<size>/<file>.webp (immutable; the
 *    version segment changes whenever the manifest changes, so word-named files can still be cached forever)
 *  - /manifest.json                                  -> assets/manifest.json (short cache)
 *  - /rigs/<file>.json|png, /rigs/index.json          -> assets/rigs (how drawings come apart; short cache)
 *  - everything else                                 -> dist/client (Vite output; hashed bundles are immutable)
 *  - /w/<slug>                                       -> dist/client/index.html (SPA)
 * Roots are relative to the process working directory (repo root locally, /app in the container).
 */
export function mountStatic(app: Hono): void {
  app.use(
    '/sprites/*',
    serveStatic({
      root: './assets',
      rewriteRequestPath: (p) => p.replace(/^\/sprites\/[^/]+\//, '/sprites/'),
      onFound: (_path, c) => {
        c.header('Cache-Control', IMMUTABLE);
      },
    }),
  );
  app.use(
    '/rigs/*',
    serveStatic({
      root: './assets',
      onFound: (_path, c) => {
        c.header('Cache-Control', SHORT);
      },
    }),
  );
  app.get(
    '/manifest.json',
    serveStatic({
      path: './assets/manifest.json',
      onFound: (_path, c) => {
        c.header('Cache-Control', SHORT);
      },
    }),
  );
  app.use(
    '/*',
    serveStatic({
      root: './dist/client',
      onFound: (path, c) => {
        // Vite emits content-hashed files under /static; index.html must stay fresh.
        c.header('Cache-Control', path.includes('/static/') ? IMMUTABLE : 'no-cache');
      },
    }),
  );
  app.get('/w/*', serveStatic({ path: './dist/client/index.html' }));
}
