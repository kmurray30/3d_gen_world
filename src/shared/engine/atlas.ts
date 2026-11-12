/**
 * The Atlas: every thing in the vocabulary in one world you can walk around, organised like a place rather than
 * a list. Districts (Food Hall, Garage, Wild Park...) are lots in rows along footpaths, starting from a plaza.
 * Inside a district, each group (fruit, power tools, dog breeds) has its own signboard and its things in rows:
 * small things on display tables, bigger ones standing on the ground, fish swimming over a pond, planets and
 * stars floating overhead. Tiny things are shown bigger and huge ones smaller, so everything reads at walking
 * distance.
 *
 * Pure and deterministic: the server builds it once from the vocabulary and the catalog and caches it.
 */
import type { Entity, Kind, Vec3, World } from '../types';
import type { DecalResolver } from '../structure/types';
import type { TerrainSpec } from '../terrain/field';
import { generate } from '../structure/index';
import { structureEntity } from '../structure/entity';
import { makeEntity, type SpriteResolver } from './make-entity';
import { getFigure } from '../figure/items';
import { catalog } from '../figure/catalog/index';
import { DISTRICTS, type District } from '../figure/catalog/types';

export interface AtlasWord {
  word: string;
  kind: Kind;
  /** Vocabulary height in metres. */
  hm: number;
}

/** Districts in walking order: people and places first, then everyday things, nature, and the fantastic. */
export const ATLAS_ORDER: District[] = ['town', 'places', 'food', 'kitchen', 'home', 'wardrobe', 'toys', 'music', 'sports', 'study', 'tech', 'clinic', 'workshop', 'armory', 'garage', 'farm', 'pets', 'wild', 'aviary', 'bugs', 'sea', 'garden', 'nature', 'sky', 'fantasy', 'ideas'];

/** Where the hand-made sample figures live (the catalog files everything else). */
const SAMPLE_PLACE: Record<string, [District, string]> = {
  man: ['town', 'everyday people'], woman: ['town', 'everyday people'], boy: ['town', 'everyday people'], girl: ['town', 'everyday people'], knight: ['town', 'history'],
  dog: ['pets', 'dogs'], cat: ['pets', 'cats'], horse: ['farm', 'farm animals'], cow: ['farm', 'farm animals'], pig: ['farm', 'farm animals'], sheep: ['farm', 'farm animals'], rooster: ['farm', 'farm animals'],
  tree: ['garden', 'trees'], 'pine tree': ['garden', 'trees'], bush: ['garden', 'shrubs'], flower: ['garden', 'flowers'], rock: ['nature', 'rocks'],
  house: ['places', 'homes'], well: ['farm', 'farm things'], fence: ['farm', 'farm things'], barrel: ['farm', 'farm things'], wheelbarrow: ['farm', 'farm things'], lamppost: ['places', 'street things'],
  bench: ['home', 'seating'], table: ['home', 'tables'], apple: ['food', 'fruit'], sword: ['armory', 'blades'], dragon: ['fantasy', 'dragons'],
};
const FALLBACK: Record<Kind, [District, string]> = { human: ['town', 'more people'], humanoid: ['fantasy', 'more beings'], animal: ['wild', 'more animals'], object: ['home', 'odds and ends'], other: ['ideas', 'more ideas'] };

/** Districts whose small things sit on tables. */
const ON_TABLES = new Set<District>(['food', 'kitchen', 'home', 'wardrobe', 'toys', 'music', 'sports', 'study', 'tech', 'clinic', 'workshop', 'armory', 'bugs', 'ideas', 'garden']);
/** The tallest a thing is shown in each district (metres); everything else gets 4.5. */
const MAX_SHOWN: Partial<Record<District, number>> = { places: 3.2, sky: 3.5, nature: 4, garage: 4.5, ideas: 2.5, sea: 3 };

const TABLE_TOP = 0.76;
const TABLE_W = 1.4;
const STREET = 9;

interface Item {
  word: string;
  kind: Kind;
  district: District;
  group: string;
  /** Natural size: height, width along x as shown, depth along z. */
  h: number;
  w: number;
  d: number;
  scale: number;
  onTable: boolean;
  swims: boolean;
  floats: boolean;
}

function measureItem(aw: AtlasWord): Item {
  const en = catalog().get(aw.word);
  const [district, group] = en ? [en.d, en.g] : SAMPLE_PLACE[aw.word] ?? FALLBACK[aw.kind];
  const fig = getFigure(aw.word);
  let h = Math.max(0.02, aw.hm || 1), w = h * 0.8, d = h * 0.5;
  let swims = false;
  if (fig) {
    h = fig.heightM;
    const side = fig.view === 'side';
    w = Math.max(0.05, 2 * (side ? fig.halfD : fig.halfW));
    d = Math.max(0.05, 2 * (side ? fig.halfW : fig.halfD));
    swims = fig.rig === 'fish';
  }
  const floats = district === 'sky';
  const big = Math.max(h, w, d);
  // tiny things are shown bigger, huge ones smaller
  let scale = 1;
  const small = ON_TABLES.has(district) && big < 1.1;
  const lo = small ? 0.22 : 0.5;
  if (big < lo) scale = lo / big;
  const hi = MAX_SHOWN[district] ?? 4.5;
  if (h * scale > hi) scale = hi / h;
  if (Math.max(w, d) * scale > hi * 1.8) scale = Math.min(scale, (hi * 1.8) / Math.max(w, d));
  const onTable = small && h * scale <= 0.8 && w * scale <= TABLE_W - 0.1;
  return { word: aw.word, kind: aw.kind, district, group, h, w, d, scale, onTable, swims, floats };
}

interface Placed {
  item: Item;
  x: number;
  z: number;
  y: number;
}

interface Block {
  title: string;
  w: number;
  d: number;
  items: Placed[];
  tables: Array<[number, number]>;
}

/** One group's things in rows no wider than `maxW`: tables first, then standing things. */
function layoutGroup(title: string, items: Item[], maxW: number): Block {
  const placed: Placed[] = [];
  const tables: Array<[number, number]> = [];
  let x = 0, z = 0, rowD = 0, wMax = 0;
  const newRow = () => {
    z -= rowD + 1.6;
    x = 0;
    rowD = 0;
  };
  // small things: fill tables left to right
  const small = items.filter((i) => i.onTable);
  let ti = 0;
  while (ti < small.length) {
    if (x + TABLE_W > maxW && x > 0) newRow();
    const tx = x + TABLE_W / 2;
    tables.push([tx, z - 0.45]);
    let used = 0.05;
    const on: Item[] = [];
    while (ti < small.length) {
      const it = small[ti];
      const iw = it.w * it.scale + 0.08;
      if (on.length && used + iw > TABLE_W - 0.05) break;
      on.push(it);
      used += iw;
      ti++;
    }
    let cx = tx - used / 2 + 0.05;
    for (const it of on) {
      const iw = it.w * it.scale + 0.08;
      placed.push({ item: it, x: cx + iw / 2, z: z - 0.45, y: TABLE_TOP });
      cx += iw;
    }
    x += TABLE_W + 0.7;
    rowD = Math.max(rowD, 0.9);
    wMax = Math.max(wMax, x);
  }
  if (small.length) newRow();
  // standing things, tallest at the back of each row
  const big = items.filter((i) => !i.onTable).sort((a, b) => a.h * a.scale - b.h * b.scale);
  for (const it of big) {
    const iw = it.w * it.scale, id = it.d * it.scale;
    if (x + iw > maxW && x > 0) newRow();
    placed.push({ item: it, x: x + iw / 2, z: z - id / 2, y: 0 });
    x += iw + Math.max(0.6, iw * 0.25);
    rowD = Math.max(rowD, id);
    wMax = Math.max(wMax, x);
  }
  const depth = -(z - rowD) + 0.5;
  return { title, w: Math.max(wMax, 4), d: depth, items: placed, tables };
}

interface Lot {
  district: District;
  w: number;
  d: number;
  blocks: Array<{ block: Block; x: number; z: number }>;
}

/** Groups this small are folded into a bigger one, so a district is a handful of signed areas, not a sign per thing. */
const MIN_GROUP = 3;
const GROUP_ALIAS: Record<string, string> = { ammo: 'ammunition', seabirds: 'sea birds', roadworks: 'road works', dancewear: 'dance wear', 'rope & chain': 'rope and chain' };
const GENERIC = new Set(['thing', 'things', 'gear', 'and', 'part', 'parts', 'stuff', 'other', 'the', 'of', 'supplies', 'equipment', 'accessories', 'more']);
const stem = (w: string) => (w.endsWith('ies') ? w.slice(0, -3) + 'y' : /(ses|xes|ches|shes)$/.test(w) ? w.slice(0, -2) : w.endsWith('s') && !w.endsWith('ss') ? w.slice(0, -1) : w);
const words = (g: string) => g.split(/[\s-]+/).map(stem).filter((w) => w && !GENERIC.has(w));

/**
 * Authors named groups freely, so a district can hold "costume" and "costumes", or a dozen groups of one.
 * Groups with the same name, give or take plurals and words like "things" and "gear", merge; small ones join the biggest group sharing a word with them ("gun parts" -> "guns"),
 * and whatever is left gathers under "all sorts".
 */
export function consolidateGroups(items: Array<{ group: string }>): Map<string, string> {
  // "hospital", "hospital things" and "hospitals" are one group
  const norm = (g: string) => {
    const a = GROUP_ALIAS[g.toLowerCase()] ?? g.toLowerCase();
    return words(a).join(' ') || a.split(/\s+/).map(stem).join(' ');
  };
  const count = new Map<string, number>();
  const shown = new Map<string, string>(); // normalised name -> the most used spelling
  const spelled = new Map<string, Map<string, number>>();
  for (const it of items) {
    const k = norm(it.group);
    count.set(k, (count.get(k) ?? 0) + 1);
    const s = spelled.get(k) ?? new Map<string, number>();
    s.set(it.group, (s.get(it.group) ?? 0) + 1);
    spelled.set(k, s);
  }
  for (const [k, s] of spelled) shown.set(k, [...s].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0][0]);
  const big = [...count].filter(([, n]) => n >= MIN_GROUP).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const into = new Map<string, string>();
  for (const [k, n] of count) {
    if (n >= MIN_GROUP) {
      into.set(k, shown.get(k)!);
      continue;
    }
    const mine = new Set(words(k));
    let best: string | null = null;
    let bestShared = 0;
    for (const [bk] of big) {
      const shared = words(bk).filter((w) => mine.has(w)).length;
      if (shared > bestShared) (best = bk), (bestShared = shared);
    }
    into.set(k, best ? shown.get(best)! : 'all sorts');
  }
  const out = new Map<string, string>();
  for (const it of items) out.set(it.group, into.get(norm(it.group))!);
  return out;
}

/** A district: its groups packed into a lot (shelf packing, group blocks left to right). */
function layoutDistrict(district: District, items: Item[]): Lot {
  const groups = new Map<string, Item[]>();
  const groupOf = consolidateGroups(items);
  for (const it of items) {
    const g = groupOf.get(it.group)!;
    groups.set(g, [...(groups.get(g) ?? []), it]);
  }
  const area = items.reduce((s, it) => s + (it.onTable ? 0.5 : Math.max(1, (it.w * it.scale + 0.8) * (it.d * it.scale + 1.6))), 0);
  const lotW = Math.max(26, Math.min(80, Math.sqrt(area) * 1.5));
  const blocks = [...groups.entries()].sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0])).map(([g, list]) => layoutGroup(g, list, Math.min(lotW, Math.max(8, Math.sqrt(list.length) * 3.2))));
  const out: Lot['blocks'] = [];
  let x = 0, z = -4, rowD = 0, wMax = 0;
  for (const b of blocks) {
    if (x + b.w > lotW && x > 0) {
      z -= rowD + 3;
      x = 0;
      rowD = 0;
    }
    out.push({ block: b, x, z });
    x += b.w + 3;
    rowD = Math.max(rowD, b.d + 1.5);
    wMax = Math.max(wMax, x);
  }
  return { district, w: Math.max(wMax, 12), d: -z + rowD + 2, blocks: out };
}

export function atlasWorld(words: AtlasWord[], resolve: SpriteResolver, decals: DecalResolver, now = Date.now()): World {
  const items = words.map(measureItem);
  const byDistrict = new Map<District, Item[]>();
  for (const it of items) byDistrict.set(it.district, [...(byDistrict.get(it.district) ?? []), it]);
  for (const list of byDistrict.values()) list.sort((a, b) => a.word.localeCompare(b.word));
  const lots = ATLAS_ORDER.filter((d) => byDistrict.has(d)).map((d) => layoutDistrict(d, byDistrict.get(d)!));

  // lots in rows along streets, the first row just north of the plaza; rows about as wide as the whole is deep
  const ROW_W = Math.max(160, Math.sqrt(lots.reduce((s, l) => s + (l.w + STREET) * (l.d + STREET), 0)) * 1.1);
  const rows: Lot[][] = [];
  let cur: Lot[] = [], curW = 0;
  for (const lot of lots) {
    if (curW + lot.w > ROW_W && cur.length) {
      rows.push(cur);
      cur = [];
      curW = 0;
    }
    cur.push(lot);
    curW += lot.w + STREET;
  }
  if (cur.length) rows.push(cur);

  const entities: Entity[] = [];
  let n = 0;
  const id = (p: string) => `${p}_${n++}`;
  const sign = (text: string, pos: Vec3, yaw = 0) => {
    const s = generate('signboard', { text }, 1, decals);
    if (s) entities.push(structureEntity(id('sign'), 'sign', s, pos, yaw, now, text.toLowerCase()));
  };
  const paths: TerrainSpec['paths'] = [];
  const ponds: TerrainSpec['ponds'] = [];
  let zRow = -10;
  let minX = 0, maxX = 0, minZ = 0;
  for (const row of rows) {
    const rowW = row.reduce((s, l) => s + l.w, 0) + STREET * (row.length - 1);
    const rowD = Math.max(...row.map((l) => l.d));
    let x = -rowW / 2;
    // a street in front of the row and between lots, lit by lampposts
    paths.push({ pts: [[-rowW / 2 - STREET, zRow + STREET / 2], [rowW / 2 + STREET, zRow + STREET / 2]], width: 4 });
    for (let lx = -rowW / 2; lx <= rowW / 2; lx += 22) {
      const lamp = generate('lamppost', {}, 5, decals);
      if (lamp) entities.push(structureEntity(id('lamp'), 'lamppost', lamp, [Math.round(lx * 10) / 10, 0, zRow + STREET / 2 + 2.6], 0, now, 'lamppost'));
    }
    for (const lot of row) {
      const x0 = x, z0 = zRow;
      paths.push({ pts: [[x0 + lot.w + STREET / 2, z0 + STREET / 2], [x0 + lot.w + STREET / 2, z0 - rowD - STREET / 2]], width: 3 });
      const info = DISTRICTS[lot.district];
      sign(info.title.toUpperCase(), [x0 + 2.5, 0, z0 + 1.2]);
      if (lot.district === 'sea') ponds.push({ x: x0 + lot.w / 2, z: z0 - lot.d / 2 - 1, rx: lot.w / 2 - 1, rz: lot.d / 2 - 2.5, rot: 0, depth: 1.2 });
      for (const { block, x: bx, z: bz } of lot.blocks) {
        const ox = x0 + bx, oz = z0 + bz;
        sign(block.title.toUpperCase().slice(0, 24), [ox + 1.5, 0, oz + 1]);
        for (const [tx, tz] of block.tables) {
          const t = makeEntity({ id: id('table'), word: 'table', kind: 'object', heightM: 0.76, pos: [ox + tx, 0, oz + tz] }, resolve, now);
          t.yaw = 0;
          t.state = { stay: true, display: true };
          entities.push(t);
        }
        for (const p of block.items) {
          const it = p.item;
          let y = p.y;
          if (it.floats) y = 2.5 + ((n * 0.37) % 1) * 2.5;
          if (lot.district === 'sea' && it.swims) y = -0.45 + ((n * 0.61) % 1) * 0.4; // just above the pond's water
          const e = makeEntity({ id: id('a'), word: it.word, kind: it.kind, heightM: Math.round(it.h * 1000) / 1000, pos: [ox + p.x, y, oz + p.z] }, resolve, now);
          e.scale = Math.round(it.scale * 1000) / 1000;
          e.yaw = 0;
          e.state = { stay: true };
          entities.push(e);
        }
      }
      minX = Math.min(minX, x0);
      maxX = Math.max(maxX, x0 + lot.w);
      x += lot.w + STREET;
    }
    zRow -= rowD + STREET;
    minZ = Math.min(minZ, zRow);
  }
  // the plaza: a fountain, a welcome sign and a directory of districts
  const fountain = generate('fountain', {}, 3, decals);
  if (fountain) entities.push(structureEntity('plaza_fountain', 'fountain', fountain, [0, 0, 6], 0, now, 'fountain'));
  sign('THE ATLAS', [-5, 0, 3]);
  sign('EVERYTHING THERE IS', [5, 0, 3]);
  // a footpath from where you arrive, round the fountain, up to the first street
  paths.push({ pts: [[0, 17], [0, 10], [-4.5, 6], [0, 1.5], [0, -10 + STREET / 2]], width: 3 });
  paths.push({ pts: [[0, 10], [4.5, 6], [0, 1.5]], width: 3 });
  // centre everything on the terrain grid (it spans -size..size around the origin)
  const top = 22;
  const dz = -(top + minZ) / 2;
  for (const e of entities) e.pos[2] += dz;
  for (const p of paths) for (const q of p.pts) q[1] += dz;
  for (const p of ponds) p.z += dz;
  const half = Math.max((maxX - minX) / 2, (top - minZ) / 2) + 30;
  const terrain: TerrainSpec = {
    seed: 7,
    size: Math.ceil(Math.max(120, half * 1.35)),
    step: 2,
    waterLevel: -0.6,
    hillAmp: 0,
    hillScale: 30,
    rim: 6,
    rimFrom: Math.ceil(Math.max(100, half * 1.15)),
    pads: [],
    roads: [],
    rivers: [],
    ponds,
    paths,
  };
  return { slug: 'atlas', rev: 1, player: { pos: [0, 0, 14 + dz], yaw: 0, pitch: 0 }, entities, createdAt: now, preset: 'atlas', terrain };
}
