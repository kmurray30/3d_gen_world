/** Every catalog chunk, keyed by word. */
import type { CatalogEntry } from './types';
import { addEntries, catalog } from './registry';
import { ENTRIES as c0 } from './people-a';
import { ENTRIES as c1 } from './people-b';
import { ENTRIES as c2 } from './people-c';
import { ENTRIES as c3 } from './animals-a';
import { ENTRIES as c4 } from './animals-b';
import { ENTRIES as c5 } from './other';
import { ENTRIES as c6 } from './objects-01';
import { ENTRIES as c7 } from './objects-02';
import { ENTRIES as c8 } from './objects-03';
import { ENTRIES as c9 } from './objects-04';
import { ENTRIES as c10 } from './objects-05';
import { ENTRIES as c11 } from './objects-06';
import { ENTRIES as c12 } from './objects-07';
import { ENTRIES as c13 } from './objects-08';
import { ENTRIES as c14 } from './objects-09';
import { ENTRIES as c15 } from './objects-10';

export const CHUNKS: Record<string, CatalogEntry[]> = {
  'people-a': c0,
  'people-b': c1,
  'people-c': c2,
  'animals-a': c3,
  'animals-b': c4,
  'other': c5,
  'objects-01': c6,
  'objects-02': c7,
  'objects-03': c8,
  'objects-04': c9,
  'objects-05': c10,
  'objects-06': c11,
  'objects-07': c12,
  'objects-08': c13,
  'objects-09': c14,
  'objects-10': c15,
};

for (const list of Object.values(CHUNKS)) addEntries(list);

/** All entries by word (the first entry wins if a word appears twice). */
export { catalog };
