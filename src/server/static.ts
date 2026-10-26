import type { Hono } from 'hono';
import { serveStatic } from '@hono/node-server/serve-static';

const IMMUTABLE = 'public, max-age=31536000, immutable';
const SHORT = 'public, max-age=60, must-revalidate';

/**
 * Static files:
 *  - /sprites/<manifestVersion>/<size>/<file>.webp  -> assets/sprites/<size>/<file>.webp (immutable; the
 *    version segment changes whenever the manifest changes, so word-named files can still be cached forever)
 *  - /manifest.json                                  -> assets/manifest.json (short cache)
 *  - /rigs/<file>.json, /rigs/index.json               -> assets/rigs (how drawings come apart; short cache)
 *  - /audio/manifest.json, /audio/<cue>/<n>.mp3        -> assets/audio (sounds and music; see words_and_images/audio)
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
  app.use(
    '/audio/*',
    serveStatic({
      root: './assets',
      onFound: (path, c) => {
        // the cue list changes when sounds are fetched again; the sounds themselves can be kept a day
        c.header('Cache-Control', /\.(mp3|ogg|wav|m4a)$/.test(path) ? 'public, max-age=86400' : SHORT);
      },
    }),
  );
  // no sounds fetched yet: a plain 404, not the app's page
  app.get('/audio/*', (c) => c.notFound());
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
