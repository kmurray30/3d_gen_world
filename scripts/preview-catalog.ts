/**
 * Contact sheet of sculpted catalog models, numbered, for checking by eye (no browser):
 *   npx tsx scripts/preview-catalog.ts objects-01 0 48 /tmp/sheet.png
 * Prints "index word" for each tile. Thin parts are thickened to show at preview size.
 */
import path from 'node:path';
import type { CatalogEntry } from '../src/shared/figure/catalog/types';
import { sculpt } from '../src/shared/figure/sculpt';
import { Canvas } from './lib/raster';

const [name, startS = '0', countS = '48', out = 'preview.png'] = process.argv.slice(2);
const mod = (await import(path.resolve(`src/shared/figure/catalog/${name}.ts`))) as { ENTRIES?: CatalogEntry[]; EXAMPLES?: CatalogEntry[] };
const list = mod.ENTRIES ?? mod.EXAMPLES;
if (!list) {
  console.error(`unknown chunk ${name}`);
  process.exit(2);
}
const start = Number(startS), count = Math.min(Number(countS), list.length - start);
const cols = 8, tile = 150;
const rows = Math.ceil(count / cols);
const cv = new Canvas(cols * tile, rows * tile);
for (let i = 0; i < count; i++) {
  const en = list[start + i];
  const x = (i % cols) * tile, y = Math.floor(i / cols) * tile;
  cv.rect(x, y, tile, 1, [200, 200, 200]);
  cv.rect(x, y, 1, tile, [200, 200, 200]);
  try {
    const f = en.f();
    const s = sculpt(f, { preview: true, detail: 0.55 });
    cv.sculpt(s, x, y, tile, f.view === 'side' ? 55 : 30);
  } catch (err) {
    cv.rect(x + 20, y + 20, tile - 40, tile - 40, [230, 80, 80]);
    console.log(`  ${start + i} ${en.key}: ERROR ${(err as Error).message}`);
  }
  cv.number(start + i, x + 4, y + 4);
  console.log(`${start + i} ${en.key}`);
}
cv.png(out);
console.log(`wrote ${out}`);
