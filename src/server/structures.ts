/**
 * Decides whether a word the model wants to spawn is a structure (built from parts) or a cutout, and runs the
 * generators for explicit build actions. Order: the structure word list, then an exact vocabulary match (a
 * drawing exists), then the classifier for anything novel ("fire station" builds, "doll house" stays a card).
 */
import type { CustomPart } from '../shared/schema';
import { coerceParams, generate, isGenName, structureWord, type GenName } from '../shared/structure/index';
import type { DecalResolver, Structure } from '../shared/structure/types';
import type { StructureClassifier } from './llm/classify';
import { Vocab } from './vocab';

export interface Built {
  structure: Structure;
  label: string;
}

export class StructureResolver {
  private seed = (Date.now() & 0xffff) + 1;
  readonly decals: DecalResolver;

  constructor(
    private readonly vocab: Vocab,
    private readonly classifier: StructureClassifier,
  ) {
    this.decals = (word) => {
      const hit = vocab.resolveWord(word);
      return hit ? vocab.entry(hit).sprite : null;
    };
  }

  private nextSeed(): number {
    this.seed = (this.seed * 1103515245 + 12345) & 0x7fffffff;
    return this.seed;
  }

  /** The structure a spawn word should become, or null when it should stay a cutout. */
  async forSpawn(word: string, alts: string[] = [], command?: string): Promise<Built | null> {
    const candidates = [word, ...alts].map((w) => Vocab.normalize(w)).filter(Boolean);
    for (const c of candidates) {
      const sw = structureWord(c) ?? structureWord(c.replace(/s$/, ''));
      if (sw) return this.make(sw.gen, sw.params ?? {}, c);
    }
    const norm = candidates[0] ?? Vocab.normalize(word);
    // a real drawing wins over a guess; only tail/fuzzy matches count as "novel"
    const how = this.vocab.matchKind(norm);
    if (how === 'exact' || how === 'alias') return null;
    for (const alt of candidates.slice(1)) {
      const h = this.vocab.matchKind(alt);
      if (h === 'exact' || h === 'alias') return null;
    }
    const verdict = await this.classifier.isStructure(norm, command);
    if (!verdict) return null;
    return this.make('house', { random: true, sign: norm.toUpperCase().slice(0, 24) }, norm);
  }

  /** How an object nobody listed should stand in 3D, when the classifier has an opinion (Jev); null = flat. */
  async shapeOf(word: string): Promise<'cross' | 'round' | null> {
    const shape = await this.classifier.shapeOf?.(word).catch(() => null);
    return shape === 'cross' || shape === 'round' ? shape : null;
  }

  /** An explicit build action. */
  forBuild(word: string, gen: string | undefined, params: Record<string, unknown> | undefined, parts: CustomPart[] | undefined): Built | null {
    const label = Vocab.normalize(word) || word;
    if (parts?.length && (!gen || gen === 'custom')) return this.make('custom', { parts, label }, label);
    if (gen && isGenName(gen)) return this.make(gen, params ?? {}, label);
    const sw = structureWord(label) ?? structureWord(label.split(' ').pop() ?? '');
    // the model's own parameters win over the word's preset (a "blue cottage" is blue)
    if (sw) return this.make(sw.gen, { ...coerceParams(sw.gen, sw.params ?? {}), ...coerceParams(sw.gen, params ?? {}) }, label);
    return this.make('house', { random: true, ...(params ?? {}) }, label);
  }

  private make(gen: GenName, params: Record<string, unknown>, label: string): Built | null {
    const s = generate(gen, coerceParams(gen, params), this.nextSeed(), this.decals);
    return s ? { structure: s, label } : null;
  }
}
