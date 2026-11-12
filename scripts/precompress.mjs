// Writes .br and .gz next to each text file Vite emitted, so the server can send them compressed without
// compressing on every request (serveStatic's `precompressed` option picks them by Accept-Encoding).
//   node scripts/precompress.mjs [dir=dist/client]
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const root = process.argv[2] ?? 'dist/client';
const TEXT = /\.(js|css|html|json|svg|txt)$/;
let raw = 0, br = 0;
const walk = (dir) => {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p);
    else if (TEXT.test(ent.name) && fs.statSync(p).size > 1024) {
      const buf = fs.readFileSync(p);
      const b = zlib.brotliCompressSync(buf, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 11, [zlib.constants.BROTLI_PARAM_SIZE_HINT]: buf.length } });
      fs.writeFileSync(`${p}.br`, b);
      fs.writeFileSync(`${p}.gz`, zlib.gzipSync(buf, { level: 9 }));
      raw += buf.length;
      br += b.length;
    }
  }
};
walk(root);
console.log(`precompressed ${(raw / 1e6).toFixed(2)} MB -> ${(br / 1e6).toFixed(2)} MB (brotli)`);
