/**
 * The catalog's entries by word, filled by whoever loads chunks: `./index` loads them all (the game, the server,
 * the tests); the authoring tools load one chunk at a time, so another author's half-written file cannot break
 * theirs. Nothing here imports a chunk.
 */
import type { CatalogEntry } from './types';

const byKey = new Map<string, CatalogEntry>();

/** Add entries (the first entry for a word wins). */
export function addEntries(list: CatalogEntry[]): void {
  for (const en of list) if (!byKey.has(en.key)) byKey.set(en.key, en);
}

/** All loaded entries by word. */
export function catalog(): Map<string, CatalogEntry> {
  return byKey;
}
