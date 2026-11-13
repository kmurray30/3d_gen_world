/**
 * One venue's plan: its footprint, its building (or fence, or open ground), its fittings (shelves, tables, glass
 * cases, plinths, tanks, pens, parking bays, a counter), and where every one of its things goes. Plans are in the
 * venue's own frame: the origin at its centre, the front (entrance, facing the street) toward +z, metres.
 *
 * Things are real size, so fittings are sized to them: a shelf holds what fits on it, a car gets a parking bay,
 * a giraffe a pen it can stand in, a jet a stand big enough for its wings.
 */
import { Parts } from '../structure/build';
import type { MaterialName, Structure } from '../structure/types';
import { PLACES, type PlaceId } from './places';
import type { TownItem } from './items';

export interface Placed {
  item: TownItem;
  x: number;
  y: number;
  z: number;
  /** Degrees; 0 faces the venue's front (+z). */
  yaw: number;
}

export interface LocalSurface {
  x: number;
  z: number;
  hw: number;
  hd: number;
  color: string;
  edge?: string;
  marks?: 'bays' | 'pitch' | 'runway' | 'tiles' | 'furrows';
}

export interface VenuePlan {
  key: string;
  place: PlaceId;
  title: string;
  w: number;
  d: number;
  /** A building around it: house-generator parameters (null for outdoor venues). */
  shell: Record<string, unknown> | null;
  fittings: Structure | null;
  placed: Placed[];
  surfaces: LocalSurface[];
  /** Water things (boats, whales) to put in the sea in front of this venue. */
  afloat: TownItem[];
}

type Decals = Parts['decals'];

const GAP = 0.45;
const SHELF_W = 2.4;
const SHELF_D = 0.55;
const SHELF_LEVELS = [0.12, 0.56, 1.0, 1.44];
const LEVEL_H = 0.4;
const TABLE_H = 0.78;
const CASE_H = 0.92;

interface Mod {
  w: number;
  d: number;
  /** Builds its fitting at (cx, cz) and places its things. */
  draw: (b: Parts, cx: number, cz: number, out: Placed[], surf: LocalSurface[]) => void;
}

const wood = (b: Parts, x: number, y: number, z: number, w: number, h: number, d: number, color = '#b5814e', mat: MaterialName = 'plank') => b.box(x, y, z, w, h, d, mat, color);

/* ----- fittings ----- */

/** Shelf units for small things: as many as needed, each four boards high, things side by side on each board. */
function shelfMods(items: TownItem[], color: string): Mod[] {
  const mods: Mod[] = [];
  let unit: TownItem[][] = SHELF_LEVELS.map(() => []);
  let used = SHELF_LEVELS.map(() => 0);
  const flush = () => {
    if (!unit.some((l) => l.length)) return;
    const levels = unit;
    mods.push({
      w: SHELF_W,
      d: SHELF_D,
      draw: (b, cx, cz, out) => {
        for (const s of [-1, 1]) wood(b, cx + (s * (SHELF_W - 0.05)) / 2, 0, cz, 0.05, 1.85, SHELF_D, color);
        wood(b, cx, 0, cz - SHELF_D / 2 + 0.02, SHELF_W, 1.85, 0.03, color);
        levels.forEach((list, li) => {
          const y = SHELF_LEVELS[li];
          wood(b, cx, y - 0.03, cz, SHELF_W - 0.06, 0.03, SHELF_D, color);
          const total = list.reduce((s, it) => s + it.fx + 0.06, 0);
          let x = cx - total / 2;
          for (const it of list) {
            out.push({ item: it, x: x + it.fx / 2 + 0.03, y, z: cz + 0.04, yaw: 0 });
            x += it.fx + 0.06;
          }
        });
      },
    });
    unit = SHELF_LEVELS.map(() => []);
    used = SHELF_LEVELS.map(() => 0);
  };
  for (const it of [...items].sort((a, b) => a.h - b.h)) {
    if (it.h > LEVEL_H || it.fz > SHELF_D) {
      // too tall or deep for a shelf: the lowest board takes tall things, or a table does
      continue;
    }
    let li = used.findIndex((u) => u + it.fx + 0.06 <= SHELF_W - 0.1);
    if (li < 0) {
      flush();
      li = 0;
    }
    unit[li].push(it);
    used[li] += it.fx + 0.06;
  }
  flush();
  return mods;
}

/** Display tables (or counters): things in a row on top, two rows when they are small. */
function tableMods(items: TownItem[], opts: { h?: number; color?: string; glass?: boolean; cloth?: string } = {}): Mod[] {
  const H = opts.h ?? (opts.glass ? CASE_H : TABLE_H);
  const mods: Mod[] = [];
  let row: TownItem[] = [];
  let used = 0;
  const flush = () => {
    if (!row.length) return;
    const list = row;
    const depth = Math.max(0.7, ...list.map((it) => it.fz + 0.25));
    const width = Math.max(1.2, list.reduce((s, it) => s + it.fx + 0.12, 0) + 0.3);
    const tallest = Math.max(...list.map((it) => it.h));
    mods.push({
      w: width,
      d: depth,
      draw: (b, cx, cz, out) => {
        if (opts.glass) {
          // a glass case: a wooden base, the things on it, a glass box over them
          wood(b, cx, 0, cz, width, H, depth, opts.color ?? '#7a5230');
          b.box(cx, H, cz, width, Math.max(0.25, tallest + 0.08), depth, 'glass', '#cfeefa', { ghost: false });
        } else {
          for (const sx of [-1, 1]) for (const sz of [-1, 1]) wood(b, cx + sx * (width / 2 - 0.06), 0, cz + sz * (depth / 2 - 0.06), 0.06, H - 0.04, 0.06, opts.color ?? '#8c5a2b');
          wood(b, cx, H - 0.04, cz, width, 0.04, depth, opts.color ?? '#b5814e');
          if (opts.cloth) b.box(cx, H, cz, width - 0.04, 0.01, depth - 0.04, 'flat', opts.cloth, { noInk: true });
        }
        let x = cx - width / 2 + 0.15;
        for (const it of list) {
          out.push({ item: it, x: x + it.fx / 2 + 0.06, y: H + (opts.cloth ? 0.01 : 0), z: cz, yaw: 0 });
          x += it.fx + 0.12;
        }
      },
    });
    row = [];
    used = 0;
  };
  const maxW = 2.6;
  for (const it of items) {
    if (used + it.fx + 0.12 > maxW && row.length) flush();
    row.push(it);
    used += it.fx + 0.12;
  }
  flush();
  return mods;
}

/** A plinth for an exhibit: about waist high for small things, low for big ones. */
function plinthMod(it: TownItem, color = '#e8e4dc'): Mod {
  const ph = it.h < 0.6 ? 1.0 : it.h < 2 ? 0.45 : 0.25;
  const w = it.fx + 0.4, d = it.fz + 0.4;
  return {
    w: w + 0.6,
    d: d + 0.6,
    draw: (b, cx, cz, out) => {
      b.box(cx, 0, cz, w, ph, d, 'stone', color);
      out.push({ item: it, x: cx, y: ph, z: cz, yaw: 0 });
    },
  };
}

/** Standing on the floor with a little room round it. */
function floorMod(it: TownItem, pad = 0.5): Mod {
  return { w: it.fx + pad * 2, d: it.fz + pad * 2, draw: (_b, cx, cz, out) => out.push({ item: it, x: cx, y: 0, z: cz, yaw: 0 }) };
}

/** A fish tank on a stand for small swimmers; a big tank of its own for a big one. */
function tankMods(items: TownItem[]): Mod[] {
  const mods: Mod[] = [];
  const small = items.filter((it) => Math.max(it.fx, it.fz) <= 0.7);
  const big = items.filter((it) => Math.max(it.fx, it.fz) > 0.7);
  for (let i = 0; i < small.length; i += 5) {
    const list = small.slice(i, i + 5);
    mods.push({
      w: 2.6,
      d: 1.1,
      draw: (b, cx, cz, out) => {
        wood(b, cx, 0, cz, 2.4, 0.7, 0.9, '#3a3633', 'metal');
        b.box(cx, 0.7, cz, 2.4, 0.95, 0.9, 'water', '#6fb7e0', { ghost: true, noInk: true });
        b.box(cx, 0.7, cz, 2.44, 1.0, 0.94, 'glass', '#d6f0fa');
        list.forEach((it, k) => out.push({ item: it, x: cx - 0.9 + k * 0.45, y: 0.95 + (k % 2) * 0.2, z: cz + (k % 2 ? -0.15 : 0.15), yaw: 0 }));
      },
    });
  }
  for (const it of big) {
    const w = it.fx + 1.2, d = it.fz + 1.2, h = it.h + 1.0;
    mods.push({
      w: w + 0.6,
      d: d + 0.6,
      draw: (b, cx, cz, out) => {
        wood(b, cx, 0, cz, w, 0.4, d, '#3a3633', 'metal');
        b.box(cx, 0.4, cz, w, h, d, 'water', '#6fb7e0', { ghost: true, noInk: true });
        b.box(cx, 0.4, cz, w + 0.05, h + 0.05, d + 0.05, 'glass', '#d6f0fa');
        out.push({ item: it, x: cx, y: 0.6, z: cz, yaw: 0 });
      },
    });
  }
  return mods;
}

/** Animal pens: a fenced patch of grass (or sand, or ice) per big animal, small ones sharing. */
function penMods(items: TownItem[], floor = '#7bbf5a'): Mod[] {
  const mods: Mod[] = [];
  const small = items.filter((it) => Math.max(it.fx, it.fz) < 0.7);
  const big = items.filter((it) => Math.max(it.fx, it.fz) >= 0.7);
  const pen = (list: TownItem[], w: number, d: number): Mod => ({
    w: w + 1,
    d: d + 1,
    draw: (b, cx, cz, out, surf) => {
      surf.push({ x: cx, z: cz, hw: w / 2, hd: d / 2, color: floor, edge: '#5c4630' });
      const railH = Math.max(0.6, Math.min(1.4, Math.max(...list.map((it) => it.h)) * 0.5));
      for (const s of [-1, 1]) {
        wood(b, cx + (s * w) / 2, 0, cz, 0.08, railH, d, '#8a6440');
        wood(b, cx, 0, cz - (d / 2) * s, w, railH * (s < 0 ? 0.5 : 1), 0.08, '#8a6440');
      }
      list.forEach((it, k) => {
        const cols = Math.max(1, Math.ceil(Math.sqrt(list.length)));
        const gx = (k % cols) - (cols - 1) / 2, gz = Math.floor(k / cols) - (Math.ceil(list.length / cols) - 1) / 2;
        out.push({ item: it, x: cx + gx * (w / (cols + 0.5)), y: 0, z: cz + gz * (d / (Math.ceil(list.length / cols) + 0.5)), yaw: 0 });
      });
    },
  });
  for (let i = 0; i < small.length; i += 6) {
    const list = small.slice(i, i + 6);
    mods.push(pen(list, 3.6, 3));
  }
  for (const it of big) mods.push(pen([it], Math.max(3, it.fx * 2.2), Math.max(3, it.fz * 2.6 + 1)));
  return mods;
}

/** A parking bay (or a stand at the airport): painted lines round the vehicle. */
function parkedMod(it: TownItem): Mod {
  const w = it.fx + 1.4, d = it.fz + 1.6;
  return {
    w,
    d,
    draw: (_b, cx, cz, out, surf) => {
      surf.push({ x: cx, z: cz, hw: w / 2, hd: d / 2, color: '#6b6e73', marks: 'bays' });
      out.push({ item: it, x: cx, y: 0, z: cz, yaw: 0 });
    },
  };
}

/** Its own plot: a building (a barn, a lighthouse, a skyscraper). */
function buildingMod(it: TownItem): Mod {
  return { w: it.fx + 5, d: it.fz + 5, draw: (_b, cx, cz, out) => out.push({ item: it, x: cx, y: 0, z: cz, yaw: 0 }) };
}

/** Pack modules into rows from the back toward the front, `aisle` between rows. */
function pack(mods: Mod[], width: number, aisle: number): { rows: Array<{ mods: Mod[]; d: number; w: number }>; d: number; w: number } {
  const rows: Array<{ mods: Mod[]; d: number; w: number }> = [];
  let cur: Mod[] = [];
  let used = 0;
  for (const m of mods) {
    if (cur.length && used + m.w > width) {
      rows.push({ mods: cur, d: Math.max(...cur.map((x) => x.d)), w: used - GAP });
      cur = [];
      used = 0;
    }
    cur.push(m);
    used += m.w + GAP;
  }
  if (cur.length) rows.push({ mods: cur, d: Math.max(...cur.map((x) => x.d)), w: used - GAP });
  const d = rows.reduce((s, r) => s + r.d, 0) + Math.max(0, rows.length - 1) * aisle;
  return { rows, d, w: Math.max(0, ...rows.map((r) => r.w)) };
}

/** Lay packed rows out with their back at zBack, centred on x, and draw them. */
function layRows(packed: ReturnType<typeof pack>, zBack: number, aisle: number, b: Parts, out: Placed[], surf: LocalSurface[]): void {
  let z = zBack;
  for (const row of packed.rows) {
    let x = -row.w / 2;
    for (const m of row.mods) {
      m.draw(b, x + m.w / 2, z + row.d - m.d / 2, out, surf);
      x += m.w + GAP;
    }
    z += row.d + aisle;
  }
}

/** Two invisible corner markers so a structure's frame stays centred on the venue (finish() recentres on bounds). */
function frame(b: Parts, w: number, d: number): void {
  for (const s of [-1, 1]) b.box((s * w) / 2, 0, (s * d) / 2, 0.01, 0.01, 0.01, 'flat', '#000000', { ghost: true, hidden: true, noInk: true });
}

/* ----- palettes ----- */

const WALLS: Partial<Record<PlaceId, [string, string]>> = {
  grocery: ['#9fd17a', '#2f7a3a'], bakery: ['#f6d9a8', '#b8742f'], butcher: ['#f3d7d2', '#a3322a'], restaurant: ['#f2e6cf', '#8a2b3a'], diner: ['#f6e27a', '#e0473b'],
  cafe: ['#d9b98a', '#5a3a22'], candy_shop: ['#f4a1c0', '#8a5fc4'], pub: ['#a7744a', '#3f2a1a'], pharmacy: ['#e8f6ef', '#3fa77a'], hospital: ['#f7f5ef', '#e0473b'],
  clothing_store: ['#e9ddf2', '#6b4a8f'], jewelry_store: ['#2f3d52', '#e2b23a'], salon: ['#f9c9d6', '#c84a7a'], craft_store: ['#fff3d6', '#d6874f'], toy_store: ['#a8d8f5', '#f0923b'],
  party_store: ['#f6d24a', '#d64fa0'], music_store: ['#2a2726', '#e2b23a'], electronics_store: ['#d4d7da', '#2f6fd6'], hardware_store: ['#f0923b', '#3a3633'], home_store: ['#f2e6cf', '#5a7d4a'],
  bookstore: ['#7a5230', '#f2e6cf'], sports_store: ['#4e8fd6', '#ffffff'], pet_store: ['#9be34d', '#3f7a3a'], garden_center: ['#cfe8b8', '#3f7a3a'], antique_shop: ['#8a6440', '#e2b23a'],
  bank: ['#e6e1d3', '#5c6166'], post_office: ['#e0473b', '#ffffff'], police_station: ['#2f4f8f', '#ffffff'], fire_station: ['#c0392b', '#f6d24a'], city_hall: ['#efe9dc', '#5c6166'],
  school: ['#d9a173', '#f7f5ef'], library: ['#b5814e', '#2f4f8f'], science_lab: ['#f7f5ef', '#3fa7a0'], museum: ['#e6e1d3', '#7a5230'], gallery: ['#ffffff', '#2a2726'],
  place_of_worship: ['#efe9dc', '#8a5fc4'], observatory: ['#d4d7da', '#2f3d52'], theater: ['#8a2b3a', '#e2b23a'], arcade: ['#2a2726', '#d64fa0'], gym: ['#5c6166', '#f0923b'],
  office: ['#a9c6d6', '#2f3d52'], aquarium: ['#6fb7e0', '#2f4f8f'], factory: ['#b9c2ca', '#3a3633'], wizard_tower: ['#4a2f6b', '#e2b23a'],
};

const GROUND: Partial<Record<PlaceId, LocalSurface['marks'] | string>> = {};
const LOT_FLOOR: Partial<Record<PlaceId, [string, LocalSurface['marks']?]>> = {
  garage: ['#7a7d82'], airport: ['#7a7d82'], train_station: ['#9a9590'], construction_site: ['#a8865a'], power_plant: ['#9a9590'], dump: ['#8a7a64'],
  military_base: ['#8a8a6a'], farm: ['#b08a52', 'furrows'], zoo: ['#a6cf7a'], stadium: ['#5aa553', 'pitch'], fairground: ['#d8c49a'], miniature_park: ['#8fcf6a'],
  castle: ['#a7a7a0', 'tiles'], graveyard: ['#7a9a5a'], harbor: ['#a89f90'], backyard: ['#8fcf6a'],
};
void GROUND;

/* ----- plans by kind of venue ----- */

/** A shop or hall: a building with a counter and staff by the door, shelves and tables behind, exhibits, tanks and
 *  pens in rows, pictures along the back wall. */
function indoorPlan(key: string, place: PlaceId, items: TownItem[], decals: Decals): VenuePlan {
  const def = PLACES[place];
  const [wallColor, trim] = WALLS[place] ?? ['#efe9dc', '#5c6166'];
  const by = (s: TownItem['spot']) => items.filter((it) => it.spot === s);
  const staff = by('person');
  const wallItems = by('wall');
  const tallOnShelf = by('shelf').filter((it) => it.h > LEVEL_H || it.fz > SHELF_D);
  const mods: Mod[] = [
    ...shelfMods(by('shelf'), '#c8a272'),
    ...tableMods([...by('table'), ...tallOnShelf], { cloth: place === 'restaurant' || place === 'cafe' || place === 'diner' ? '#f7f5ef' : undefined }),
    ...tableMods(by('rack'), { h: 0.4, color: '#5c6166' }),
    ...tableMods(by('case'), { glass: true }),
    ...tankMods(by('tank')),
    ...penMods(by('pen'), '#c9b48a'),
    ...by('pedestal').map((it) => plinthMod(it)),
    ...[...by('floor'), ...by('parked'), ...by('ground'), ...by('building'), ...by('water'), ...by('sky')].map((it) => floorMod(it, 0.45)),
  ];
  const area = mods.reduce((s, m) => s + (m.w + GAP) * (m.d + 1.6), 0);
  const inner = Math.max(9, Math.min(64, Math.ceil(Math.sqrt(area * 1.4))));
  const aisle = 1.7;
  const packed = pack(mods, inner - 1.2, aisle);
  const W = Math.max(inner, packed.w + 1.6);
  // the counter keeps to its half of the room (a wider one would poke through the wall); staff stand in rows
  // behind it, and each extra row of staff makes the room deeper
  const cwMax = Math.max(3, W / 2 - 1);
  const perRow = Math.max(2, Math.floor((cwMax - 0.6) / 1.0));
  const staffRows = Math.max(1, Math.ceil(staff.length / perRow));
  const front = 3.4 + (staffRows - 1) * 1.1; // entrance, counter and staff
  const wallRow = wallItems.length ? 0.6 : 0;
  const D = Math.max(8, packed.d + front + 1.4 + wallRow);
  const tallest = Math.max(2.4, ...items.map((it) => it.h + (it.spot === 'pedestal' ? 1 : it.spot === 'table' || it.spot === 'case' ? 1 : 0)));
  const b = new Parts(decals);
  frame(b, W, D);
  const placed: Placed[] = [];
  const surfaces: LocalSurface[] = [];
  layRows(packed, -D / 2 + 0.7 + wallRow, aisle, b, placed, surfaces);
  // pictures, clocks and mirrors along the back wall, at eye height
  let wx = -W / 2 + 0.8;
  for (const it of wallItems) {
    if (wx + it.fx > W / 2 - 0.5) break;
    placed.push({ item: it, x: wx + it.fx / 2, y: Math.max(0.8, 1.55 - it.h / 2), z: -D / 2 + 0.3 + it.fz / 2, yaw: 0 });
    wx += it.fx + 0.4;
  }
  // overflow from the back wall stands on a low table
  const leftWall = wallItems.filter((it) => !placed.some((p) => p.item === it));
  if (leftWall.length) {
    const extra = pack(tableMods(leftWall), W - 1.2, aisle);
    layRows(extra, D / 2 - front - extra.d - 0.3, aisle, b, placed, surfaces);
  }
  // the counter by the door with the staff behind it, facing the door
  const cw = Math.min(cwMax, Math.max(3, Math.min(staff.length, perRow) * 1.0 + 1));
  b.box(-W / 4, 0, D / 2 - 2.4, cw, 1.0, 0.7, 'plank', trim);
  staff.forEach((it, k) => {
    const row = Math.floor(k / perRow), col = k % perRow;
    placed.push({ item: it, x: -W / 4 - cw / 2 + 0.6 + col * 1.0, y: 0, z: D / 2 - 3.2 - row * 1.1, yaw: 0 });
  });
  const floorH = Math.max(3.2, tallest + 0.9);
  return {
    key,
    place,
    title: def.title,
    w: W,
    d: D,
    shell: { w: W + 0.5, d: D + 0.5, stories: 1, floorH, roof: 'flat', wallMat: place === 'bank' || place === 'city_hall' || place === 'museum' || place === 'library' ? 'stone' : 'plaster', wallColor, trimColor: trim, doorColor: trim, chimney: false, windows: true, sign: def.title.toUpperCase().slice(0, 28), doorAt: W / 4 > 3 ? W / 4 : 0 },
    fittings: b.finish('fittings', { venue: key }),
    placed,
    surfaces,
    afloat: [],
  };
}

/** A fenced outdoor venue: a gate with its name over it, pens, bays, stands and plots in rows. */
function lotPlan(key: string, place: PlaceId, items: TownItem[], decals: Decals): VenuePlan {
  const def = PLACES[place];
  const water = items.filter((it) => it.spot === 'water' || (place === 'harbor' && it.spot === 'parked'));
  const rest = items.filter((it) => !water.includes(it));
  const by = (s: TownItem['spot']) => rest.filter((it) => it.spot === s);
  const floorColor = LOT_FLOOR[place]?.[0] ?? '#a6cf7a';
  const mods: Mod[] = [
    ...by('building').map(buildingMod),
    ...by('parked').map(parkedMod),
    ...penMods(by('pen'), place === 'farm' ? '#c8a96a' : '#8fcf6a'),
    ...tankMods(by('tank')),
    ...by('pedestal').map((it) => plinthMod(it, '#d6d0c2')),
    ...[...by('floor'), ...by('ground'), ...by('wall'), ...by('sky')].map((it) => floorMod(it, Math.min(2, 0.5 + it.h * 0.2))),
    ...tableMods([...by('shelf'), ...by('table'), ...by('rack')]),
    ...tableMods(by('case'), { glass: true }),
  ];
  const area = mods.reduce((s, m) => s + (m.w + GAP) * (m.d + 3), 0);
  const inner = Math.max(16, Math.min(150, Math.ceil(Math.sqrt(area * 1.3))));
  const aisle = place === 'airport' ? 8 : 3;
  const packed = pack(mods, inner - 2, aisle);
  const W = Math.max(inner, packed.w + 3);
  const staff = by('person');
  // staff stand inside the fence, left of the gate, as many to a row as fit
  const lotRow = Math.max(1, Math.floor((W / 2 - 5 / 2 - 2.6) / 1.1));
  const front = 5 + (staff.length ? 1.5 + (Math.ceil(staff.length / lotRow) - 1) * 1.2 : 0);
  const D = Math.max(12, packed.d + front + 3);
  const b = new Parts(decals);
  frame(b, W, D);
  const placed: Placed[] = [];
  const surfaces: LocalSurface[] = [{ x: 0, z: 0, hw: W / 2, hd: D / 2, color: floorColor, marks: LOT_FLOOR[place]?.[1] }];
  if (place === 'airport') surfaces.push({ x: 0, z: -D / 2 - 14, hw: W / 2 + 20, hd: 9, color: '#55585d', marks: 'runway' });
  layRows(packed, -D / 2 + 1.5, aisle, b, placed, surfaces);
  // a fence round it with a gate at the front, and the name over the gate
  const fenceColor = place === 'military_base' ? '#6a6a4a' : place === 'castle' ? '#8f8c86' : '#8a6440';
  const fenceMat: MaterialName = place === 'castle' ? 'stone' : place === 'military_base' || place === 'power_plant' || place === 'dump' || place === 'construction_site' ? 'metal' : 'plank';
  const fh = place === 'castle' ? 4 : place === 'military_base' ? 2.6 : 1.1;
  const gate = 5;
  b.box(0, 0, -D / 2, W, fh, 0.15, fenceMat, fenceColor);
  for (const s of [-1, 1]) {
    b.box((s * W) / 2, 0, 0, 0.15, fh, D, fenceMat, fenceColor);
    b.box(s * (W / 4 + gate / 4), 0, D / 2, W / 2 - gate / 2, fh, 0.15, fenceMat, fenceColor);
    b.box((s * gate) / 2, 0, D / 2, 0.3, 4.2, 0.3, 'plank', '#5a3a22');
  }
  b.box(0, 3.6, D / 2, gate + 0.6, 0.7, 0.18, 'plank', '#f2e6cf');
  b.sign(def.title.toUpperCase().slice(0, 28), 0, 3.71, D / 2 + 0.1, 0.48, 0, '#fff3c4');
  b.sign(def.title.toUpperCase().slice(0, 28), 0, 3.71, D / 2 - 0.1, 0.48, 180, '#fff3c4');
  staff.forEach((it, k) => placed.push({ item: it, x: -gate / 2 - 2 - (k % lotRow) * 1.1, y: 0, z: D / 2 - 2.5 - Math.floor(k / lotRow) * 1.2, yaw: 0 }));
  return { key, place, title: def.title, w: W, d: D, shell: null, fittings: b.finish('fittings', { venue: key }), placed, surfaces, afloat: water };
}

/** Open ground (a park, the wilderness, a beach, an enchanted forest): things spread out naturally, a sign at the
 *  way in, footpaths. */
function openPlan(key: string, place: PlaceId, items: TownItem[], decals: Decals, rng: () => number): VenuePlan {
  const def = PLACES[place];
  const water = items.filter((it) => it.spot === 'water' || it.spot === 'tank' && Math.max(it.fx, it.fz) > 1.5);
  const rest = items.filter((it) => !water.includes(it));
  const cellOf = (it: TownItem) => Math.max(2.2, Math.max(it.fx, it.fz) + 1.6);
  const area = rest.reduce((s, it) => s + cellOf(it) ** 2, 0) * 1.25;
  const W = Math.max(24, Math.min(170, Math.ceil(Math.sqrt(area * 1.4))));
  // rows of cells, each thing jittered within its cell
  const placed: Placed[] = [];
  const b = new Parts(decals);
  let x = -W / 2 + 1, z = -2, rowD = 0;
  const sorted = [...rest].sort((a, b2) => cellOf(b2) - cellOf(a) || a.word.localeCompare(b2.word));
  const rows: Array<Array<{ it: TownItem; x: number }>> = [];
  let row: Array<{ it: TownItem; x: number }> = [];
  for (const it of sorted) {
    const c = cellOf(it);
    if (x + c > W / 2 - 1 && row.length) {
      rows.push(row);
      row = [];
      x = -W / 2 + 1;
    }
    row.push({ it, x: x + c / 2 });
    x += c;
  }
  if (row.length) rows.push(row);
  const rowDepth = rows.map((r) => Math.max(...r.map((c) => cellOf(c.it))));
  const D = Math.max(20, rowDepth.reduce((s, d) => s + d, 0) + 8);
  z = -D / 2 + 1;
  rows.forEach((r, i) => {
    rowD = rowDepth[i];
    for (const c of r) {
      const cell = cellOf(c.it);
      const j = (cell - Math.max(c.it.fx, c.it.fz)) * 0.35;
      const spot = c.it.spot;
      const y = spot === 'sky' ? 6 + rng() * 6 : 0;
      placed.push({ item: c.it, x: c.x + (rng() - 0.5) * j, y, z: z + rowD / 2 + (rng() - 0.5) * j, yaw: Math.round((rng() - 0.5) * 50) });
    }
    z += rowD;
  });
  const color = place === 'beach' ? '#ecd9a2' : place === 'enchanted_forest' ? '#6fa86a' : place === 'wilderness' ? '#93c46a' : '#9bd27a';
  // the name on a sign at the way in, both sides
  for (const s of [-1, 1]) b.box((s * 2.4) / 2, 0, D / 2 - 0.5, 0.14, 2.2, 0.14, 'plank', '#6b4a2b');
  b.box(0, 1.5, D / 2 - 0.5, 3.2, 0.65, 0.1, 'plank', '#c8955a');
  b.sign(def.title.toUpperCase().slice(0, 28), 0, 1.63, D / 2 - 0.44, 0.38, 0, '#fff3c4');
  b.sign(def.title.toUpperCase().slice(0, 28), 0, 1.63, D / 2 - 0.56, 0.38, 180, '#fff3c4');
  frame(b, W, D);
  return { key, place, title: def.title, w: W, d: D, shell: null, fittings: b.finish('fittings', { venue: key }), placed, surfaces: [{ x: 0, z: 0, hw: W / 2, hd: D / 2, color }], afloat: water };
}

/** A family house: up to three rooms side by side behind a front door, each furnished from one room's things. */
function housePlan(key: string, rooms: Array<{ place: PlaceId; items: TownItem[] }>, decals: Decals, colors: [string, string, string]): VenuePlan {
  const b = new Parts(decals);
  const placed: Placed[] = [];
  const surfaces: LocalSurface[] = [];
  const plans = rooms.map((r) => {
    const by = (s: TownItem['spot']) => r.items.filter((it) => it.spot === s);
    const mods: Mod[] = [
      ...[...by('floor'), ...by('ground'), ...by('parked'), ...by('pen'), ...by('building'), ...by('pedestal'), ...by('water'), ...by('sky')].map((it) => floorMod(it, 0.3)),
      ...tableMods([...by('table'), ...by('rack'), ...by('case')], { color: '#8c5a2b' }),
      ...shelfMods(by('shelf'), '#e8e4dc'),
      ...tankMods(by('tank')),
    ];
    const packed = pack(mods, 7, 1.2);
    return { r, mods, packed, people: by('person'), wall: by('wall') };
  });
  const roomW = plans.map((p) => Math.max(5, p.packed.w + 1));
  const W = roomW.reduce((s, w) => s + w, 0) + 0.2 * (plans.length - 1);
  const D = Math.max(7, ...plans.map((p) => p.packed.d + 3.2));
  frame(b, W, D);
  let x0 = -W / 2;
  plans.forEach((p, i) => {
    const rw = roomW[i];
    const cx = x0 + rw / 2;
    // the room's own frame: shift everything this room lays out by its centre
    const sub = new Parts(decals);
    const mine: Placed[] = [];
    layRows(p.packed, -D / 2 + 0.5, 1.2, sub, mine, surfaces);
    for (const part of sub.parts) {
      part.pos = [part.pos[0] + cx, part.pos[1], part.pos[2]];
      b.add(part);
    }
    for (const m of mine) placed.push({ ...m, x: m.x + cx });
    let wx = x0 + 0.5;
    for (const it of p.wall) {
      if (wx + it.fx > x0 + rw - 0.3) break;
      placed.push({ item: it, x: wx + it.fx / 2, y: Math.max(0.8, 1.55 - it.h / 2), z: -D / 2 + 0.25 + it.fz / 2, yaw: 0 });
      wx += it.fx + 0.3;
    }
    p.people.forEach((it, k) => placed.push({ item: it, x: cx - 1 + k * 1.0, y: 0, z: D / 2 - 1.8, yaw: 0 }));
    // a floor of its own colour, and a wall with a doorway to the next room
    surfaces.push({ x: cx, z: 0, hw: rw / 2, hd: D / 2, color: ROOM_FLOOR[p.r.place] ?? '#c8a272', marks: p.r.place === 'bathroom' || p.r.place === 'kitchen' ? 'tiles' : undefined });
    if (i < plans.length - 1) {
      const wxp = x0 + rw + 0.1;
      b.box(wxp, 0, -D / 4 - 0.6, 0.12, 2.5, D / 2 - 1.2, 'plaster', colors[0]);
      b.box(wxp, 0, D / 4 + 0.6, 0.12, 2.5, D / 2 - 1.2, 'plaster', colors[0]);
    }
    x0 += rw + 0.2;
  });
  const tallest = Math.max(2.6, ...rooms.flatMap((r) => r.items.map((it) => it.h + 0.5)));
  const unplaced = rooms.flatMap((r) => r.items).filter((it) => !placed.some((p) => p.item === it));
  // anything that did not fit stands along the front of the house inside
  let fx = -W / 2 + 0.6;
  for (const it of unplaced) {
    placed.push({ item: it, x: fx + it.fx / 2, y: 0, z: D / 2 - 0.8, yaw: 180 });
    fx += it.fx + 0.4;
  }
  return {
    key,
    place: rooms[0].place,
    title: 'House',
    w: W,
    d: D,
    shell: { w: W + 0.5, d: D + 0.5, stories: 1, floorH: Math.max(2.8, tallest), roof: 'gable', wallMat: 'plaster', wallColor: colors[0], roofColor: colors[1], trimColor: '#ffffff', doorColor: colors[2], chimney: true, windows: true, doorAt: 0 },
    fittings: b.finish('fittings', { venue: key }),
    placed,
    surfaces,
    afloat: [],
  };
}

const ROOM_FLOOR: Partial<Record<PlaceId, string>> = { kitchen: '#e8e4dc', bathroom: '#d6f0fa', bedroom: '#c8a272', living_room: '#b5814e', nursery: '#f4d9e6', laundry_garage: '#b9b9b0' };

export const HOUSE_COLORS: Array<[string, string, string]> = [
  ['#f6e27a', '#e8493b', '#b86a3c'], ['#a8d8f5', '#2f4f8f', '#ffffff'], ['#f4a1c0', '#8a2b3a', '#5a3a22'], ['#cfe8b8', '#5a7d4a', '#8a5a35'],
  ['#f2e6cf', '#7a5230', '#2f4f8f'], ['#e9ddf2', '#4a2f6b', '#e2b23a'], ['#fff3d6', '#c0392b', '#2f6fd6'], ['#d9b98a', '#3f2a1a', '#e0473b'],
];

export function planVenue(key: string, place: PlaceId, items: TownItem[], decals: Decals, rng: () => number): VenuePlan {
  const k = PLACES[place].kind;
  if (k === 'shop' || k === 'hall') return indoorPlan(key, place, items, decals);
  if (k === 'lot') return lotPlan(key, place, items, decals);
  return openPlan(key, place, items, decals, rng);
}

export function planHouse(key: string, rooms: Array<{ place: PlaceId; items: TownItem[] }>, decals: Decals, colors: [string, string, string]): VenuePlan {
  return housePlan(key, rooms, decals, colors);
}
