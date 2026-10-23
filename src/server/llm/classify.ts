/**
 * "Is this word a building?" for words the vocabulary and the structure list do not know. Jev (TypeSafe's
 * classifier) answers with a probability in a few hundred milliseconds when TYPESAFE_API_KEY is set; otherwise, or
 * when it fails, a keyword heuristic decides. Answers are cached per word.
 */

export interface StructureClassifier {
  readonly name: string;
  /** true = build it, false = draw a card; null = no opinion. */
  isStructure(word: string, command?: string): Promise<boolean | null>;
}

const BUILDINGS = new Set([
  'station', 'house', 'home', 'hall', 'tower', 'castle', 'palace', 'temple', 'church', 'chapel', 'cathedral', 'mosque', 'shrine', 'barn', 'shed',
  'garage', 'warehouse', 'factory', 'mill', 'inn', 'tavern', 'pub', 'shop', 'store', 'market', 'bakery', 'library', 'school', 'hospital', 'clinic',
  'bank', 'hotel', 'motel', 'office', 'apartment', 'apartments', 'mansion', 'cottage', 'cabin', 'hut', 'lodge', 'fort', 'fortress', 'bunker', 'prison',
  'jail', 'lighthouse', 'windmill', 'silo', 'stable', 'stables', 'stadium', 'arena', 'theater', 'theatre', 'museum', 'gym', 'cafe', 'restaurant',
  'diner', 'saloon', 'dojo', 'academy', 'university', 'college', 'embassy', 'monastery', 'abbey', 'chateau', 'villa', 'bungalow', 'igloo', 'teepee',
  'tipi', 'yurt', 'pagoda', 'ziggurat', 'skyscraper', 'building', 'hangar', 'depot', 'outpost', 'kiosk', 'gazebo', 'pavilion', 'shelter', 'booth',
  'townhouse', 'farmhouse', 'courthouse', 'schoolhouse', 'warehouse', 'lighthouse', 'clubhouse', 'guardhouse', 'greenhouse', 'outhouse', 'penthouse',
  'firehouse', 'brewery', 'winery', 'distillery', 'pharmacy', 'salon', 'barbershop', 'laundromat', 'post office', 'town hall', 'city hall', 'barracks',
  'armory', 'armoury', 'keep', 'citadel', 'manor', 'estate', 'chalet', 'dormitory', 'dorm', 'cinema', 'mall', 'supermarket', 'convenience store',
]);
const NOT_BUILDINGS = /\b(dolls?|toys?|model|miniature|mini|lego|kennel|hutch|coop|cardboard|snow globe|gingerbread man|lantern|cage|cards?|box|boxes|tent|bridge|boat|ship|car|truck|van|bus|train|plane|rocket)\b|dollhouse|playhouse|birdhouse|doghouse|dollshouse/;

export class HeuristicClassifier implements StructureClassifier {
  readonly name = 'heuristic';
  async isStructure(word: string): Promise<boolean | null> {
    const w = word.toLowerCase().trim();
    if (NOT_BUILDINGS.test(w)) return false;
    if (BUILDINGS.has(w)) return true;
    const tokens = w.split(/\s+/);
    const last = tokens[tokens.length - 1];
    if (BUILDINGS.has(last)) return true;
    if (tokens.length >= 2 && BUILDINGS.has(tokens.slice(-2).join(' '))) return true;
    if (/(house|tower|hall|shop|store|station)$/.test(last) && last.length > 5) return true;
    return null;
  }
}

export interface JevOptions {
  apiKey: string;
  model?: string;
  url?: string;
  timeoutMs?: number;
  fetchFn?: typeof fetch;
}

const QUESTION =
  'Is this word a building or other large built structure with walls that a person could walk into or onto (like a fire station, barn, temple or watchtower), rather than a small object, toy, miniature, vehicle, creature or piece of scenery (like a doll house, birdhouse, lantern or rock)?';

/**
 * TypeSafe's System One model: typed questions in, probabilities out, no text. One "noul" (yes/no) question per
 * word. The response shape is read defensively because the published examples differ between guides.
 */
export class JevClassifier implements StructureClassifier {
  readonly name = 'jev';
  private readonly model: string;
  private readonly url: string;
  private readonly timeoutMs: number;
  private readonly fetchFn: typeof fetch;
  constructor(private readonly opts: JevOptions) {
    this.model = opts.model ?? 'jev-latest';
    this.url = opts.url ?? 'https://api.typesafe.ai/v1/systemone';
    this.timeoutMs = opts.timeoutMs ?? 2500;
    this.fetchFn = opts.fetchFn ?? fetch;
  }
  async isStructure(word: string, command?: string): Promise<boolean | null> {
    const body = {
      model: this.model,
      state: { word, context: command ?? '', game: 'a paper-cutout world where buildings are built from boxes and roofs and everything else is a flat drawn cutout' },
      questions: { structure: { type: 'noul', question: QUESTION } },
    };
    const res = await this.fetchFn(this.url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${this.opts.apiKey}` },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(this.timeoutMs),
    });
    if (!res.ok) throw new Error(`jev ${res.status}`);
    const json = (await res.json()) as unknown;
    const p = readProbability(json, 'structure');
    if (p === null) throw new Error('jev: no probability in response');
    return p >= 0.5;
  }
}

/** Finds the probability for a question key in whatever envelope the API used. */
export function readProbability(json: unknown, key: string): number | null {
  const asNum = (v: unknown): number | null => {
    if (typeof v === 'number' && Number.isFinite(v)) return v;
    if (typeof v === 'boolean') return v ? 1 : 0;
    if (v && typeof v === 'object') {
      const o = v as Record<string, unknown>;
      for (const k of ['probability', 'p', 'value', 'answer', 'confidence', 'score', 'yes', 'true']) {
        const n = asNum(o[k]);
        if (n !== null) {
          // an answer object may carry a boolean plus confidence: {answer: false, confidence: 0.9}
          if ((k === 'answer' || k === 'value') && typeof o[k] === 'boolean' && typeof o.confidence === 'number') return o[k] ? o.confidence : 1 - o.confidence;
          return n;
        }
      }
    }
    return null;
  };
  if (!json || typeof json !== 'object') return null;
  const o = json as Record<string, unknown>;
  for (const container of [o, o.answers, o.results, o.result, o.data, o.output, o.questions]) {
    if (!container || typeof container !== 'object') continue;
    const hit = (container as Record<string, unknown>)[key];
    const n = asNum(hit);
    if (n !== null) return Math.max(0, Math.min(1, n));
  }
  return null;
}

/** Jev when configured, with the heuristic as fallback and a per-word cache. */
export class CachedClassifier implements StructureClassifier {
  readonly name: string;
  private readonly cache = new Map<string, boolean | null>();
  constructor(
    private readonly primary: StructureClassifier,
    private readonly fallback: StructureClassifier = new HeuristicClassifier(),
    private readonly log: (msg: string) => void = () => undefined,
  ) {
    this.name = primary === fallback ? primary.name : `${primary.name}+${fallback.name}`;
  }
  async isStructure(word: string, command?: string): Promise<boolean | null> {
    const key = word.toLowerCase().trim();
    if (this.cache.has(key)) return this.cache.get(key)!;
    let verdict: boolean | null = null;
    try {
      verdict = await this.primary.isStructure(key, command);
    } catch (e) {
      this.log(`[classify] ${this.primary.name} failed for "${key}": ${(e as Error).message}; using ${this.fallback.name}`);
      verdict = null;
    }
    if (verdict === null && this.primary !== this.fallback) verdict = await this.fallback.isStructure(key, command);
    this.cache.set(key, verdict);
    if (this.cache.size > 2000) this.cache.delete(this.cache.keys().next().value!);
    return verdict;
  }
}

export function makeClassifier(opts: { typesafeApiKey?: string; model?: string; url?: string; log?: (m: string) => void }): StructureClassifier {
  const heuristic = new HeuristicClassifier();
  if (opts.typesafeApiKey) return new CachedClassifier(new JevClassifier({ apiKey: opts.typesafeApiKey, model: opts.model, url: opts.url }), heuristic, opts.log);
  return new CachedClassifier(heuristic, heuristic, opts.log);
}
