import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { CHUNKS, catalog } from '../../src/shared/figure/catalog/index';
import { DISTRICTS } from '../../src/shared/figure/catalog/types';
import { figureKeys, figureFor } from '../../src/shared/figure/items';

const manifest = JSON.parse(fs.readFileSync(path.resolve('assets/manifest.json'), 'utf8')).words as Record<string, unknown>;

describe('the catalog', () => {
  it('covers (nearly) every vocabulary word', () => {
    const have = new Set(figureKeys());
    const words = Object.keys(manifest);
    const covered = words.filter((w) => have.has(w)).length;
    expect(covered / words.length).toBeGreaterThan(0.95);
  });

  it('every entry is a vocabulary word in a real district, and builds into a well-formed figure', () => {
    const bad: string[] = [];
    for (const [chunk, list] of Object.entries(CHUNKS))
      for (const en of list) {
        if (!manifest[en.key]) bad.push(`${chunk}/${en.key}: not a vocabulary word`);
        if (!(en.d in DISTRICTS)) bad.push(`${chunk}/${en.key}: district ${en.d}`);
        try {
          const f = en.f();
          const names = new Set(f.parts.map((p) => p.name));
          if (names.size !== f.parts.length) bad.push(`${chunk}/${en.key}: duplicate part names`);
          for (const p of f.parts) if (p.parent && !names.has(p.parent)) bad.push(`${chunk}/${en.key}: missing parent ${p.parent}`);
          if (!(f.heightM > 0.005 && Number.isFinite(f.heightM))) bad.push(`${chunk}/${en.key}: height ${f.heightM}`);
        } catch (err) {
          bad.push(`${chunk}/${en.key}: ${(err as Error).message}`);
        }
      }
    expect(bad).toEqual([]);
  });

  it('the figure lookup finds catalog words', () => {
    const some = [...catalog().keys()].slice(0, 50);
    for (const w of some) expect(figureFor(w)?.key).toBe(w);
  });
});
