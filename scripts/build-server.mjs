// Bundle the Node server (and the shared engine it imports) into a single ESM file.
// Dependencies are inlined so the runtime image needs no node_modules.
import { build } from 'esbuild';

await build({
  entryPoints: ['src/server/index.ts'],
  outfile: 'dist/server/index.js',
  bundle: true,
  platform: 'node',
  target: 'node22',
  format: 'esm',
  sourcemap: true,
  packages: 'bundle',
  external: ['node:*'],
  banner: {
    // Some bundled CommonJS deps expect require(); provide it in ESM output.
    js: "import { createRequire as __createRequire } from 'node:module'; const require = __createRequire(import.meta.url);",
  },
  logLevel: 'info',
});
