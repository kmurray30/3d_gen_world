/**
 * Check a catalog chunk: every assigned word has an entry, every entry builds, has sane parts and size, and
 * sculpts into a model.   npx tsx scripts/check-catalog.ts objects-01
 */
import fs from 'node:fs';
import path from 'node:path';
import { DISTRICTS } from '../src/shared/figure/catalog/types';
import type { CatalogEntry } from '../src/shared/figure/catalog/types';
import { sculpt } from '../src/shared/figure/sculpt';

const name = process.argv[2];
const file = path.resolve(`src/shared/figure/catalog/${name}.ts`);
if (!name || !fs.existsSync(file)) {
  console.error('usage: npx tsx scripts/check-catalog.ts <chunk>   (a file in src/shared/figure/catalog/)');
  process.exit(2);
}
// only this chunk is loaded, so another author's half-written file cannot break the check
const ENTRIES = ((await import(file)) as { ENTRIES: CatalogEntry[] }).ENTRIES;
const manifest = JSON.parse(fs.readFileSync(path.resolve('assets/manifest.json'), 'utf8')).words as Record<string, { t: string; hm: number }>;
const assigned = fs
  .readFileSync(path.resolve(`src/shared/figure/catalog/assign/${name}.tsv`), 'utf8')
  .split('\n')
  .slice(1)
  .filter(Boolean)
  .map((l) => l.split('\t')[0]);
const entries = ENTRIES;
const seen = new Set<string>();
const errors: string[] = [];
const warns: string[] = [];
let ok = 0;
for (const en of entries) {
  const where = `${en.key}`;
  if (seen.has(en.key)) errors.push(`${where}: duplicate entry`);
  seen.add(en.key);
  if (!manifest[en.key]) warns.push(`${where}: not a vocabulary word (keys must match the .tsv exactly)`);
  if (!(en.d in DISTRICTS)) errors.push(`${where}: unknown district "${en.d}"`);
  if (!en.g || en.g.length > 32) errors.push(`${where}: group must be a short phrase`);
  try {
    const f = en.f();
    const names = new Set<string>();
    for (const p of f.parts) {
      if (names.has(p.name)) errors.push(`${where}: duplicate part name "${p.name}"`);
      names.add(p.name);
      if (!p.size.every((v) => Number.isFinite(v) && v > 0)) errors.push(`${where}: part ${p.name} has a bad size ${JSON.stringify(p.size)}`);
      if (![...p.at, ...(p.off ?? [0, 0, 0])].every(Number.isFinite)) errors.push(`${where}: part ${p.name} has a bad position`);
    }
    for (const p of f.parts) if (p.parent && !names.has(p.parent)) errors.push(`${where}: ${p.name} hangs off missing ${p.parent}`);
    if (!(f.heightM > 0.005 && f.heightM < 400)) errors.push(`${where}: height ${f.heightM}`);
    const hm = manifest[en.key]?.hm;
    if (hm && (f.heightM > hm * 4 || f.heightM < hm / 4)) warns.push(`${where}: height ${f.heightM.toFixed(2)} m vs vocabulary ${hm} m`);
    const s = sculpt(f, { detail: 0.5 });
    if (s.positions.length / 3 < 30) errors.push(`${where}: sculpted to almost nothing (${s.positions.length / 3} vertices)`);
    ok++;
  } catch (err) {
    errors.push(`${where}: ${(err as Error).message}`);
  }
}
const missing = assigned.filter((w) => !seen.has(w));
console.log(`${name}: ${ok}/${entries.length} entries build and sculpt; ${assigned.length - missing.length}/${assigned.length} assigned words covered`);
if (missing.length) console.log(`missing (${missing.length}): ${missing.slice(0, 40).join(', ')}${missing.length > 40 ? ' ...' : ''}`);
for (const w of warns.slice(0, 40)) console.log('warn  ', w);
for (const er of errors) console.log('ERROR ', er);
process.exit(errors.length ? 1 : 0);
