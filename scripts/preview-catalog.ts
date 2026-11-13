/**
 * Contact sheet of sculpted catalog models, numbered, for checking by eye (no browser):
 *   npx tsx scripts/preview-catalog.ts objects-01 0 48 /tmp/sheet.png        (add --no-people to drop the person)
 *   npx tsx scripts/preview-catalog.ts --words="bus,car,airplane" /tmp/sheet.png   (any words, any chunks)
 * Prints "index word" for each tile. Thin parts are thickened to show at preview size. Anything between 0.35 m and
 * 80 m tall has a grey 1.7 m person standing beside it, so you can see whether it is the right size for people.
 */
import { sculpt } from '../src/shared/figure/sculpt';
import { who } from '../src/shared/figure/accessories';
import { Canvas } from './lib/raster';
import { loadChunks, withPerson } from './lib/act-lab';

const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const people = !process.argv.includes('--no-people');
// --words=bus,school bus,airplane : those words from any chunk, in that order (then args are just the out file)
const wordsArg = process.argv.find((a) => a.startsWith('--words='))?.slice(8);
let name: string, startS: string, countS: string, out: string;
let list: Awaited<ReturnType<typeof loadChunks>>;
if (wordsArg) {
  const { catalog } = await import('../src/shared/figure/catalog/index');
  const all = catalog();
  const keys = wordsArg.split(',').map((w) => w.trim()).filter(Boolean);
  list = keys.flatMap((k) => (all.get(k) ? [all.get(k)!] : (console.log(`  no entry: ${k}`), [])));
  [out = 'preview.png'] = args;
  [name, startS, countS] = ['words', '0', String(list.length)];
} else {
  [name, startS = '0', countS = '48', out = 'preview.png'] = args;
  list = await loadChunks(name);
}
if (!list.length) {
  console.error(`unknown or empty chunk ${name}`);
  process.exit(2);
}
const person = sculpt(who('scale person', { h: 1.7, skin: '#c8c8c8', hair: '#8a8a8a', top: '#b0b0b0', bottom: '#9a9a9a', shoes: '#777777', style: 'short' }), { preview: true, detail: 0.6 });
const start = Number(startS), count = Math.min(Number(countS), list.length - start);
const cols = 8, tile = 170;
const rows = Math.ceil(count / cols);
const cv = new Canvas(cols * tile, rows * tile);
for (let i = 0; i < count; i++) {
  const en = list[start + i];
  const x = (i % cols) * tile, y = Math.floor(i / cols) * tile;
  cv.rect(x, y, tile, 1, [200, 200, 200]);
  cv.rect(x, y, 1, tile, [200, 200, 200]);
  try {
    const f = en.f();
    let s = sculpt(f, { preview: true, detail: 0.55 });
    if (people && f.rig !== 'biped' && f.heightM >= 0.35 && f.heightM <= 80) s = withPerson(s, f, person);
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
