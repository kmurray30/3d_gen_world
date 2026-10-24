/**
 * The generator registry: a name plus loose parameters (from a preset, a vocabulary word or the model) becomes a
 * Structure. Parameters are coerced here so generators can trust their numbers.
 */
import { makeRng } from '../engine/math';
import type { DecalResolver, GenContext, MaterialName, Structure } from './types';
import { MATERIALS } from './types';
import { bunker } from './gen/bunker';
import { bridge } from './gen/bridge';
import { customStructure, type CustomPartSpec } from './gen/custom';
import { fence, yard } from './gen/fence';
import { gingerbreadHouse, house, randomHouse } from './gen/house';
import { witchHut } from './gen/hut';
import { lighthouse, tower } from './gen/tower';

export const GENERATORS = ['house', 'gingerbread', 'fence', 'yard', 'tower', 'lighthouse', 'witch_hut', 'bunker', 'bridge', 'custom'] as const;
export type GenName = (typeof GENERATORS)[number];

export type Params = Record<string, unknown>;

const COLOR_NAMES: Record<string, string> = {
  red: '#e8493b',
  blue: '#4e8fd6',
  green: '#5aa553',
  yellow: '#f6e27a',
  orange: '#f0923b',
  purple: '#8a5fc4',
  violet: '#8a5fc4',
  pink: '#f7a4c0',
  white: '#fafafa',
  black: '#2f2f2f',
  grey: '#9da3a8',
  gray: '#9da3a8',
  brown: '#8c5a2b',
  tan: '#d9b98a',
  beige: '#f2e6cf',
  cream: '#fff6d6',
  teal: '#3fa7a0',
  cyan: '#6fd3e8',
  navy: '#2f4f8f',
  gold: '#f2c14e',
  silver: '#c9ccd1',
  lime: '#9be34d',
  maroon: '#8a2b3a',
  olive: '#8a8f3a',
  peach: '#f9c9a3',
  lavender: '#e6d3f5',
  mint: '#c9e8d7',
  'sky blue': '#bfe3f7',
  'light blue': '#bfe3f7',
  'dark grey': '#5c6166',
  'dark gray': '#5c6166',
  'dark green': '#3f7a3a',
  'dark red': '#a3322a',
  'dark blue': '#2f4f8f',
};

export function colorOf(v: unknown, fallback?: string): string | undefined {
  if (typeof v !== 'string') return fallback;
  const s = v.trim().toLowerCase();
  if (/^#[0-9a-f]{6}$/.test(s)) return s;
  if (/^#[0-9a-f]{3}$/.test(s)) return `#${s[1]}${s[1]}${s[2]}${s[2]}${s[3]}${s[3]}`;
  if (COLOR_NAMES[s]) return COLOR_NAMES[s];
  const last = s.split(/\s+/).pop() ?? '';
  return COLOR_NAMES[last] ?? fallback;
}

export function materialOf(v: unknown, fallback?: MaterialName): MaterialName | undefined {
  if (typeof v !== 'string') return fallback;
  const s = v.trim().toLowerCase();
  if ((MATERIALS as readonly string[]).includes(s)) return s as MaterialName;
  const alias: Record<string, MaterialName> = {
    wood: 'plank',
    wooden: 'plank',
    log: 'plank',
    logs: 'plank',
    planks: 'plank',
    timber: 'plank',
    bricks: 'brick',
    stucco: 'plaster',
    paint: 'plaster',
    painted: 'plaster',
    rock: 'stone',
    stones: 'stone',
    cobble: 'stone',
    cobblestone: 'stone',
    marble: 'stone',
    shingles: 'shingle',
    tile: 'shingle',
    tiles: 'shingle',
    slate: 'shingle',
    straw: 'thatch',
    hay: 'thatch',
    cement: 'concrete',
    steel: 'metal',
    iron: 'metal',
    tin: 'metal',
    candy: 'stripe',
    cookie: 'gingerbread',
    frosting: 'icing',
    snow: 'icing',
    window: 'glass',
    plain: 'flat',
  };
  return alias[s] ?? fallback;
}

const num = (v: unknown): number | undefined => {
  const n = typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : NaN;
  return Number.isFinite(n) ? n : undefined;
};
const bool = (v: unknown): boolean | undefined => (typeof v === 'boolean' ? v : typeof v === 'string' ? /^(true|yes|1)$/i.test(v) : undefined);
const str = (v: unknown, allowed: readonly string[]): string | undefined => (typeof v === 'string' && allowed.includes(v.toLowerCase()) ? v.toLowerCase() : undefined);
const clean = <T extends object>(o: T): T => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as T;

/** Coerce model-supplied parameters into what a generator accepts. Unknown keys are dropped. */
export function coerceParams(gen: GenName, raw: Params): Params {
  const p = raw ?? {};
  switch (gen) {
    case 'house':
    case 'gingerbread':
      return clean({
        w: num(p.w ?? p.width),
        d: num(p.d ?? p.depth ?? p.length),
        stories: num(p.stories ?? p.floors ?? p.storeys),
        wallMat: materialOf(p.wallMat ?? p.walls ?? p.material),
        wallColor: colorOf(p.wallColor ?? p.color ?? p.colour),
        roof: str(p.roof, ['gable', 'hip', 'flat']),
        roofMat: materialOf(p.roofMat),
        roofColor: colorOf(p.roofColor),
        pitch: num(p.pitch),
        trimColor: colorOf(p.trimColor),
        doorColor: colorOf(p.doorColor),
        chimney: bool(p.chimney),
        windows: bool(p.windows),
        doorAt: num(p.doorAt),
        sign: typeof p.sign === 'string' ? p.sign.slice(0, 24) : undefined,
        random: bool(p.random),
      });
    case 'fence':
      return clean({
        points: Array.isArray(p.points) ? p.points.filter((q) => Array.isArray(q) && q.length === 2 && q.every((n) => Number.isFinite(Number(n)))).map((q) => [Number((q as unknown[])[0]), Number((q as unknown[])[1])]) : undefined,
        length: num(p.length ?? p.len),
        closed: bool(p.closed),
        gate: num(p.gate),
        style: str(p.style, ['picket', 'rail', 'stone']),
        height: num(p.height ?? p.h),
        color: colorOf(p.color ?? p.colour),
      });
    case 'yard':
      return clean({ w: num(p.w ?? p.width), d: num(p.d ?? p.depth), style: str(p.style, ['picket', 'rail', 'stone']), height: num(p.height), color: colorOf(p.color ?? p.colour) });
    case 'tower':
      return clean({
        r: num(p.r ?? p.radius),
        h: num(p.h ?? p.height),
        sides: num(p.sides),
        mat: materialOf(p.mat ?? p.material),
        color: colorOf(p.color ?? p.colour),
        cap: str(p.cap ?? p.roof, ['cone', 'battlements', 'flat']),
        capColor: colorOf(p.capColor ?? p.roofColor),
        flag: bool(p.flag),
      });
    case 'lighthouse':
      return clean({ h: num(p.h ?? p.height), r: num(p.r ?? p.radius), bands: num(p.bands), bandColor: colorOf(p.bandColor ?? p.color ?? p.colour), cottage: bool(p.cottage) });
    case 'witch_hut':
      return clean({ r: num(p.r ?? p.radius), wallColor: colorOf(p.wallColor ?? p.color ?? p.colour), hatColor: colorOf(p.hatColor ?? p.roofColor), bandColor: colorOf(p.bandColor), tilt: num(p.tilt) });
    case 'bunker':
      return clean({ w: num(p.w ?? p.width), d: num(p.d ?? p.depth), levels: num(p.levels ?? p.stories ?? p.floors), color: colorOf(p.color ?? p.colour) });
    case 'bridge':
      return clean({ len: num(p.len ?? p.length), w: num(p.w ?? p.width), drop: num(p.drop), color: colorOf(p.color ?? p.colour) });
    case 'custom':
      return { parts: Array.isArray(p.parts) ? p.parts : [], label: typeof p.label === 'string' ? p.label : 'custom' };
  }
}

/** Build a structure. Params are expected to be coerced already. Returns null for an unknown generator. */
export function generate(gen: string, params: Params, seed: number, decals: DecalResolver): Structure | null {
  const ctx: GenContext = { rng: makeRng(seed), decal: decals };
  switch (gen as GenName) {
    case 'house': {
      const { random, ...rest } = params as Params & { random?: boolean };
      return random || Object.keys(rest).length === 0 ? randomHouse(ctx, decals, rest) : house(rest, ctx, decals);
    }
    case 'gingerbread':
      return gingerbreadHouse(ctx, decals, params);
    case 'fence': {
      const { length, ...rest } = params as Params & { length?: number };
      const points = (rest.points as Array<[number, number]> | undefined) ?? (length ? [[-length / 2, 0], [length / 2, 0]] : undefined);
      return fence({ ...rest, ...(points ? { points } : {}) }, ctx, decals);
    }
    case 'yard':
      return yard(params, ctx, decals);
    case 'tower':
      return tower(params, ctx, decals);
    case 'lighthouse':
      return lighthouse(params, ctx, decals);
    case 'witch_hut':
      return witchHut(params, ctx, decals);
    case 'bunker':
      return bunker(params, ctx, decals);
    case 'bridge':
      return bridge(params, ctx, decals);
    case 'custom':
      return customStructure((params.parts as CustomPartSpec[]) ?? [], ctx, decals, params.label as string);
    default:
      return null;
  }
}

export function isGenName(v: unknown): v is GenName {
  return typeof v === 'string' && (GENERATORS as readonly string[]).includes(v);
}

/* ----- which words are structures ----- */

export interface StructureWord {
  gen: GenName;
  params?: Params;
}

/** Words that build a structure instead of showing a cutout. Keys are normalised (lower case, no article). */
export const STRUCTURE_WORDS: Record<string, StructureWord> = {
  house: { gen: 'house', params: { random: true } },
  home: { gen: 'house', params: { random: true } },
  cottage: { gen: 'house', params: { w: 5, d: 4.5, stories: 1, roof: 'gable', roofMat: 'thatch', roofColor: '#d9b36a', wallMat: 'plaster', wallColor: '#fff0c2', pitch: 0.9 } },
  cabin: { gen: 'house', params: { w: 5.5, d: 4.5, stories: 1, wallMat: 'plank', wallColor: '#a86f38', roof: 'gable', roofMat: 'plank', roofColor: '#6a3d2a', pitch: 0.6, trimColor: '#6a3d2a' } },
  'log cabin': { gen: 'house', params: { w: 5.5, d: 4.5, stories: 1, wallMat: 'plank', wallColor: '#a86f38', roof: 'gable', roofMat: 'plank', roofColor: '#6a3d2a', pitch: 0.6, trimColor: '#6a3d2a' } },
  hut: { gen: 'house', params: { w: 4, d: 3.5, stories: 1, wallMat: 'plank', wallColor: '#b8803f', roof: 'hip', roofMat: 'thatch', roofColor: '#d9b36a', pitch: 0.9, chimney: false, windows: false } },
  shack: { gen: 'house', params: { w: 4, d: 3.5, stories: 1, wallMat: 'plank', wallColor: '#8c5a2b', roof: 'flat', roofMat: 'metal', roofColor: '#7a7f85', chimney: false } },
  shed: { gen: 'house', params: { w: 3.5, d: 3, stories: 1, wallMat: 'plank', wallColor: '#b8803f', roof: 'gable', roofMat: 'metal', roofColor: '#7a7f85', pitch: 0.5, chimney: false, windows: false } },
  barn: { gen: 'house', params: { w: 9, d: 6.5, stories: 2, wallMat: 'plank', wallColor: '#b5312a', roof: 'gable', roofMat: 'metal', roofColor: '#5c6166', pitch: 0.75, trimColor: '#ffffff', chimney: false, windows: false } },
  mansion: { gen: 'house', params: { w: 12, d: 8, stories: 2, wallMat: 'plaster', wallColor: '#f2e6cf', roof: 'hip', roofMat: 'shingle', roofColor: '#555b66', pitch: 0.55, trimColor: '#ffffff' } },
  bungalow: { gen: 'house', params: { w: 7, d: 6, stories: 1, roof: 'hip', pitch: 0.45 } },
  farmhouse: { gen: 'house', params: { w: 8, d: 6, stories: 2, wallMat: 'plank', wallColor: '#fafafa', roof: 'gable', roofMat: 'metal', roofColor: '#5c6166', pitch: 0.7, trimColor: '#2b2b2b' } },
  'fire station': { gen: 'house', params: { w: 9, d: 7, stories: 2, wallMat: 'brick', wallColor: '#c9453a', roof: 'flat', roofMat: 'concrete', roofColor: '#9da3a8', trimColor: '#fff6d6', doorAt: 0, sign: 'FIRE STATION' } },
  'police station': { gen: 'house', params: { w: 9, d: 7, stories: 2, wallMat: 'brick', wallColor: '#9da3a8', roof: 'flat', roofMat: 'concrete', roofColor: '#7a7f85', trimColor: '#2f4f8f', sign: 'POLICE' } },
  school: { gen: 'house', params: { w: 11, d: 7, stories: 2, wallMat: 'brick', wallColor: '#d98c6a', roof: 'hip', roofMat: 'shingle', roofColor: '#555b66', pitch: 0.4, sign: 'SCHOOL' } },
  shop: { gen: 'house', params: { w: 6, d: 5, stories: 1, wallMat: 'plaster', wallColor: '#bfe3f7', roof: 'flat', roofMat: 'concrete', roofColor: '#7a7f85', sign: 'SHOP' } },
  store: { gen: 'house', params: { w: 6, d: 5, stories: 1, wallMat: 'plaster', wallColor: '#bfe3f7', roof: 'flat', roofMat: 'concrete', roofColor: '#7a7f85', sign: 'STORE' } },
  inn: { gen: 'house', params: { w: 8, d: 6, stories: 2, wallMat: 'plank', wallColor: '#d9a05b', roof: 'gable', roofMat: 'shingle', roofColor: '#8d5a3b', pitch: 0.8, sign: 'INN' } },
  tavern: { gen: 'house', params: { w: 8, d: 6, stories: 2, wallMat: 'plank', wallColor: '#8c5a2b', roof: 'gable', roofMat: 'shingle', roofColor: '#3a3a3a', pitch: 0.8, sign: 'TAVERN' } },
  church: { gen: 'house', params: { w: 7, d: 11, stories: 2, wallMat: 'stone', wallColor: '#c9c4b8', roof: 'gable', roofMat: 'shingle', roofColor: '#555b66', pitch: 1.0, chimney: false, trimColor: '#2b2b2b' } },
  'gingerbread house': { gen: 'gingerbread' },
  gingerbread: { gen: 'gingerbread' },
  'candy house': { gen: 'gingerbread' },
  fence: { gen: 'fence', params: { length: 6 } },
  'picket fence': { gen: 'fence', params: { length: 6, style: 'picket' } },
  'wooden fence': { gen: 'fence', params: { length: 6, style: 'rail' } },
  'stone wall': { gen: 'fence', params: { length: 6, style: 'stone', height: 1.2 } },
  wall: { gen: 'fence', params: { length: 6, style: 'stone', height: 1.6 } },
  yard: { gen: 'yard' },
  'fenced yard': { gen: 'yard' },
  garden: { gen: 'yard' },
  'fenced garden': { gen: 'yard' },
  pen: { gen: 'yard', params: { w: 6, d: 5, style: 'rail' } },
  paddock: { gen: 'yard', params: { w: 12, d: 9, style: 'rail' } },
  tower: { gen: 'tower' },
  watchtower: { gen: 'tower', params: { cap: 'battlements', h: 9 } },
  'stone tower': { gen: 'tower' },
  turret: { gen: 'tower', params: { r: 1.6, h: 6 } },
  silo: { gen: 'tower', params: { r: 2, h: 10, sides: 16, mat: 'metal', color: '#c9ccd1', cap: 'cone', capColor: '#9da3a8', flag: false } },
  lighthouse: { gen: 'lighthouse' },
  bunker: { gen: 'bunker' },
  fort: { gen: 'bunker', params: { levels: 2 } },
  fortress: { gen: 'bunker', params: { levels: 3, w: 18, d: 12 } },
  'witch hut': { gen: 'witch_hut' },
  "witch's hut": { gen: 'witch_hut' },
  'witches hut': { gen: 'witch_hut' },
  'witch house': { gen: 'witch_hut' },
  "witch's house": { gen: 'witch_hut' },
  building: { gen: 'house', params: { random: true } },
  bridge: { gen: 'bridge' },
  footbridge: { gen: 'bridge', params: { w: 2.2 } },
};

export function structureWord(normalized: string): StructureWord | null {
  return STRUCTURE_WORDS[normalized] ?? null;
}

export { customStructure, type CustomPartSpec, CUSTOM_SHAPES, CUSTOM_AT, MAX_CUSTOM_PARTS } from './gen/custom';
export { house, randomHouse, gingerbreadHouse, type HouseParams } from './gen/house';
export { fence, yard } from './gen/fence';
export { tower, lighthouse } from './gen/tower';
export { witchHut } from './gen/hut';
export { bunker } from './gen/bunker';
export { bridge } from './gen/bridge';
