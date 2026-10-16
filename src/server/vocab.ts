import fs from 'node:fs';
import type { Kind } from '../shared/types';
import type { WordResolution } from '../shared/schema';
import { DEFAULT_HEIGHT_M, defaultSprite } from '../shared/engine/sizing';

export interface ManifestWord {
  f: string | null;
  w: number;
  h: number;
  t: Kind;
  hm: number;
  solid: boolean;
  huge: boolean;
  tags: string[];
}
export interface Manifest {
  version: string;
  counts: { words: number; withSprite: number; aliases: number };
  words: Record<string, ManifestWord>;
  aliases: Record<string, string[]>;
  overrides: Record<string, string>;
}

const ARTICLES = /^(a|an|the|some|my|your|his|her|their|our|this|that)\s+/;
const FUZZY_MIN = 0.9;

/** The vocabulary: which words have sprites, their sizes, and how to map what people (and the model) say onto them. */
export class Vocab {
  readonly words: Record<string, ManifestWord>;
  readonly aliases: Record<string, string[]>;
  readonly overrides: Record<string, string>;
  readonly version: string;
  readonly counts: Manifest['counts'];
  private readonly list: string[];
  /** "bat" -> ["bat (animal)", "bat (baseball)"] */
  private readonly bases = new Map<string, string[]>();

  constructor(manifest: Manifest) {
    this.words = manifest.words;
    this.aliases = manifest.aliases ?? {};
    this.overrides = manifest.overrides ?? {};
    this.version = manifest.version;
    this.counts = manifest.counts;
    this.list = Object.keys(this.words);
    for (const w of this.list) {
      const m = /^(.*?)\s*\(([^)]*)\)\s*$/.exec(w);
      if (m) {
        const base = m[1].trim();
        const arr = this.bases.get(base) ?? [];
        arr.push(w);
        this.bases.set(base, arr);
      }
    }
  }

  static load(path: string): Vocab {
    return new Vocab(JSON.parse(fs.readFileSync(path, 'utf8')) as Manifest);
  }

  static normalize(word: string): string {
    return word
      .toLowerCase()
      .replace(/[“”"']/g, '')
      .replace(/[.,!?;:]+$/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(ARTICLES, '')
      .trim();
  }

  /** Map a word to a vocabulary entry, or null. */
  resolveWord(input: string, kindHint?: Kind): string | null {
    const w = Vocab.normalize(input);
    if (!w) return null;
    const direct = this.lookup(w, kindHint);
    if (direct) return direct;
    for (const f of singularForms(w)) {
      const hit = this.lookup(f, kindHint);
      if (hit) return hit;
    }
    const al = this.aliases[w] ?? singularForms(w).map((f) => this.aliases[f]).find(Boolean);
    if (al?.length) {
      if (al.length === 1) return al[0];
      const byKind = kindHint ? al.find((x) => this.words[x]?.t === kindHint) : undefined;
      return byKind ?? al[0];
    }
    // last word of a multi-word phrase: "tall oak tree" -> "tree"
    const tokens = w.split(' ');
    if (tokens.length > 1) {
      const last = tokens[tokens.length - 1];
      const tail = this.lookup(last, kindHint) ?? singularForms(last).map((f) => this.lookup(f, kindHint)).find(Boolean);
      if (tail) return tail;
    }
    if (w.length >= 4) {
      let best: string | null = null;
      let bestScore = FUZZY_MIN;
      for (const cand of this.list) {
        if (Math.abs(cand.length - w.length) > 3) continue;
        const s = jaroWinkler(w, cand);
        if (s > bestScore) {
          bestScore = s;
          best = cand;
        }
      }
      if (best) return best;
    }
    return null;
  }

  /** exact primary, then manual override, then "word (variant)" entries chosen by kind. */
  private lookup(w: string, kindHint?: Kind): string | null {
    if (this.words[w]) return w;
    const ov = this.overrides[w];
    if (ov && this.words[ov]) return ov;
    return this.exact(w, kindHint);
  }

  private exact(w: string, kindHint?: Kind): string | null {
    if (this.words[w]) return w;
    const variants = this.bases.get(w);
    if (variants?.length) {
      const byKind = kindHint ? variants.find((v) => this.words[v].t === kindHint) : undefined;
      return byKind ?? variants[0];
    }
    return null;
  }

  /** Full resolution with alternates, falling back to a placeholder card. */
  resolve(word: string, alts: string[] = [], kindHint?: Kind): WordResolution {
    const candidates = [word, ...alts];
    for (const c of candidates) {
      const hit = this.resolveWord(c, kindHint);
      if (hit) return this.entry(hit);
    }
    const label = Vocab.normalize(word) || word;
    const kind: Kind = kindHint ?? 'object';
    return { word: label, sprite: defaultSprite(kind), kind, heightM: DEFAULT_HEIGHT_M[kind], solid: true, huge: false, placeholder: true };
  }

  entry(word: string): WordResolution {
    const m = this.words[word];
    return {
      word,
      sprite: m.f ? { file: m.f, w: m.w, h: m.h } : { file: null, w: m.w, h: m.h },
      kind: m.t,
      heightM: m.hm,
      solid: m.solid,
      huge: m.huge,
      placeholder: false,
    };
  }

  byType(): Record<Kind, string[]> {
    const out: Record<Kind, string[]> = { object: [], human: [], humanoid: [], animal: [], other: [] };
    for (const w of this.list) out[this.words[w].t].push(w);
    return out;
  }
}

function singularForms(w: string): string[] {
  const out: string[] = [];
  if (w.endsWith('ies')) out.push(w.slice(0, -3) + 'y');
  if (w.endsWith('es')) out.push(w.slice(0, -2));
  if (w.endsWith('s') && !w.endsWith('ss')) out.push(w.slice(0, -1));
  return out;
}

export function jaroWinkler(a: string, b: string): number {
  if (a === b) return 1;
  const la = a.length;
  const lb = b.length;
  if (!la || !lb) return 0;
  const range = Math.max(0, Math.floor(Math.max(la, lb) / 2) - 1);
  const am = new Array<boolean>(la).fill(false);
  const bm = new Array<boolean>(lb).fill(false);
  let matches = 0;
  for (let i = 0; i < la; i++) {
    const lo = Math.max(0, i - range);
    const hi = Math.min(lb - 1, i + range);
    for (let j = lo; j <= hi; j++) {
      if (bm[j] || a[i] !== b[j]) continue;
      am[i] = true;
      bm[j] = true;
      matches++;
      break;
    }
  }
  if (!matches) return 0;
  let t = 0;
  let k = 0;
  for (let i = 0; i < la; i++) {
    if (!am[i]) continue;
    while (!bm[k]) k++;
    if (a[i] !== b[k]) t++;
    k++;
  }
  const jaro = (matches / la + matches / lb + (matches - t / 2) / matches) / 3;
  let prefix = 0;
  for (let i = 0; i < Math.min(4, la, lb) && a[i] === b[i]; i++) prefix++;
  return jaro + prefix * 0.1 * (1 - jaro);
}
