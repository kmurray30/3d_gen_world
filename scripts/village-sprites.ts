// The drawings villages use (people, animals, trees, decor), from many seeds, for rigging just those first:
//   cd scripts && npx tsx village-sprites.ts > ../words_and_images/rig/village_words.txt
import path from 'node:path';
import { Vocab } from '../src/server/vocab';
import { generateVillage } from '../src/shared/village';

const vocab = Vocab.load(path.resolve('../assets/manifest.json'));
const resolve = (word: string, kind: 'object' | 'human' | 'humanoid' | 'animal' | 'other') => {
  const hit = vocab.resolveWord(word, kind);
  return hit ? vocab.entry(hit).sprite : null;
};
const decals = (word: string) => {
  const hit = vocab.resolveWord(word);
  return hit ? vocab.entry(hit).sprite : null;
};
const seen = new Map<string, { kind: string; n: number }>();
const seeds = Number(process.argv[2] ?? 60);
for (let seed = 1; seed <= seeds; seed++) {
  for (const e of generateVillage(seed, resolve, decals, 0).entities) {
    if (e.structure || !e.sprite.file) continue;
    const stem = e.sprite.file.replace(/\.webp$/, '');
    const s = seen.get(stem) ?? { kind: e.kind, n: 0 };
    s.n++;
    seen.set(stem, s);
  }
}
const rows = [...seen.entries()].sort((a, b) => a[0].localeCompare(b[0]));
console.log(`# Drawings villages use (${rows.length}, from ${seeds} seeds): one per line, as auto_rig.py --words-file takes them`);
for (const [stem] of rows) console.log(stem);
console.error(rows.map(([s, v]) => `${s} (${v.kind}, ${v.n})`).join('\n'));
