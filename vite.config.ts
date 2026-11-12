import { defineConfig } from 'vite';

// Client lives in src/client; built output goes to dist/client and is served by the Node server.
export default defineConfig({
  root: 'src/client',
  publicDir: false,
  build: {
    outDir: '../../dist/client',
    emptyOutDir: true,
    assetsDir: 'static',
    sourcemap: true,
    target: 'es2022',
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': { target: 'http://localhost:8787', changeOrigin: false },
      '/sprites': { target: 'http://localhost:8787', changeOrigin: false },
      '/rigs': { target: 'http://localhost:8787', changeOrigin: false },
      '/audio': { target: 'http://localhost:8787', changeOrigin: false },
    },
  },
});
