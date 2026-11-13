/**
 * The Town: every word in the vocabulary, at its real size, in the place you would find it. Venues (shops, halls,
 * fenced lots, open ground, houses with rooms) are grouped into zones, the zones into bands on a street grid:
 *
 *   north   wild (wilderness, campground)  |  farmland  |  fantasy (castle, wizard's tower, forest, graveyard)
 *           industry (works, base)          |  transport (garage, station, airport)
 *           residential (houses, backyards) |  downtown + civic round the plaza  |  parkland (park, zoo, stadium)
 *   south   waterfront (beach, harbour, aquarium), then the sea
 *
 * Streets run between rows of venues, avenues between zones. Signposts at the junctions point the way, standing
 * maps say where you are, people work in every venue and walk the streets. Pure and deterministic: the server
 * builds it once and caches it.
 */
import type { Entity, Vec3, World } from '../types';
import type { DecalResolver } from '../structure/types';
import type { PathSpec, SurfaceSpec, TerrainSpec } from '../terrain/field';
import { Parts } from '../structure/build';
import { generate } from '../structure/index';
import { townBuilding } from '../structure/gen/house';
import { structureEntity } from '../structure/entity';
import { makeEntity, type SpriteResolver } from '../engine/make-entity';
import { Engine } from '../engine/index';
import { getFigure } from '../figure/items';
import { PLACES, type PlaceId, type Zone } from './places';
import { assignVenues, townItem, type Tag, type TownItem, type TownWord } from './items';
import { HOUSE_COLORS, planHouse, planVenue, type VenuePlan } from './venues';

export interface TownLot {
  x: number;
  z: number;
  w: number;
  d: number;
  yaw: number;
  title: string;
  zone: Zone;
  /** A house, backyard or a building on its own plot: drawn on the map but left out of its directory. */
  minor?: boolean;
}

/** What the standing maps draw. */
export interface TownMap {
  half: number;
  lots: TownLot[];
  streets: PathSpec[];
  plaza: { x: number; z: number; r: number };
  sea: { z: number };
}

const STREET = 12;
const AVENUE = 16;
const ROOM_PLACES: PlaceId[] = ['kitchen', 'living_room', 'bedroom', 'nursery', 'bathroom', 'laundry_garage'];
const BANDS: Zone[][] = [['wild', 'farmland', 'fantasy'], ['industry', 'transport'], ['residential', 'downtown', 'parkland'], ['waterfront']];
const PLAZA = 44;
/** Everyday people who walk the streets on top of the ones that work there. */
const WALKERS = ['man', 'woman', 'boy', 'girl', 'old man', 'old woman', 'teenager', 'tourist', 'jogger', 'businessman', 'student', 'grandmother', 'grandfather', 'mother', 'father', 'shopper'];

const mulberry = (seed: number) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

interface Region {
  zone: Zone;
  plans: VenuePlan[];
  /** Laid out: each plan's centre and yaw in the region's frame (origin top-left), and the region's size. */
  at: Array<{ plan: VenuePlan; x: number; z: number; yaw: number }>;
  streets: PathSpec[];
  w: number;
  d: number;
}

/**
 * Rows of venues along streets: one row faces south onto a street, the next faces north onto the same street,
 * then a gap, then the next pair. `spacer` keeps an empty space in the middle of the first row (for the plaza).
 */
function layoutRegion(zone: Zone, plans: VenuePlan[], spacer = 0, boulevard = 0): Region {
  const area = plans.reduce((s, p) => s + (p.w + 6) * (p.d + STREET / 2 + 3), 0) + spacer * spacer;
  const target = Math.max(80, Math.min(420, Math.sqrt(area) * 1.15));
  const width = Math.max(target, ...plans.map((p) => p.w + 8));
  const rows: VenuePlan[][] = [];
  let cur: VenuePlan[] = [];
  let used = spacer ? spacer + 6 : boulevard ? boulevard + 6 : 0;
  // big ones first so rows come out even
  for (const p of [...plans].sort((a, b) => b.d - a.d || b.w - a.w || a.key.localeCompare(b.key))) {
    if (cur.length && used + p.w + 6 > width) {
      rows.push(cur);
      cur = [];
      used = boulevard ? boulevard + 6 : 0;
    }
    cur.push(p);
    used += p.w + 6;
  }
  if (cur.length) rows.push(cur);
  const at: Region['at'] = [];
  const streets: PathSpec[] = [];
  // rows run from the region's south edge (z = d) northward when it is the plaza row first; simpler: top to
  // bottom, pairs facing each other across a street
  let z = 0;
  rows.forEach((row, i) => {
    const facesSouth = i % 2 === 0;
    const depth = Math.max(...row.map((p) => p.d));
    let x = 3;
    const first = i === rows.length - 1 && spacer ? true : false;
    const items = [...row];
    // an empty space in the middle: the plaza in the last row, the boulevard up the middle of the others
    const gap = first ? spacer : boulevard;
    // split the row so the gap lands on the region's centre line
    let left: VenuePlan[] = [], right: VenuePlan[] = [];
    if (gap) {
      let lw = 0;
      const total = items.reduce((s, p) => s + p.w + 6, 0);
      for (const p of items) {
        if (lw + p.w / 2 < total / 2) {
          left.push(p);
          lw += p.w + 6;
        } else right.push(p);
      }
    } else left = items;
    const lw = left.reduce((s, p) => s + p.w + 6, 0);
    x = gap ? width / 2 - gap / 2 - lw : (width - (lw - 6)) / 2;
    for (const p of [...left, ...(gap ? [null] : []), ...right]) {
      if (!p) {
        x = width / 2 + gap / 2 + 6;
        continue;
      }
      const cz = facesSouth ? z + depth - p.d / 2 : z + p.d / 2;
      at.push({ plan: p, x: x + p.w / 2, z: cz, yaw: facesSouth ? 0 : 180 });
      x += p.w + 6;
    }
    z += depth;
    if (facesSouth) {
      streets.push({ pts: [[0, z + STREET / 2], [width, z + STREET / 2]], width: STREET - 3.2 });
      z += STREET;
    } else z += 5;
  });
  if (boulevard) streets.push({ pts: [[width / 2, 0], [width / 2, z]], width: boulevard - 3.2 });
  return { zone, plans, at, streets, w: width, d: Math.max(20, z) };
}

/** A building standing on a plot of its own (a bank's facade beside the bank, a skyscraper downtown). */
function plotPlan(it: TownItem): VenuePlan {
  const w = it.fx + 6, d = it.fz + 6;
  return { key: `plot:${it.word}`, place: it.venue, title: it.word.replace(/\b\w/g, (c) => c.toUpperCase()), w, d, shell: null, fittings: null, placed: [{ item: it, x: 0, y: 0, z: 0, yaw: 0 }], surfaces: [{ x: 0, z: 0, hw: w / 2, hd: d / 2, color: '#a6cf7a' }], afloat: [] };
}

/** A sign post with arrow boards pointing to places: `to` are world positions and names. */
function waysign(decals: Parts['decals'], to: Array<{ title: string; x: number; z: number; dist: number }>, here: { x: number; z: number }): ReturnType<Parts['finish']> {
  const b = new Parts(decals);
  b.box(0, 0, 0, 0.16, 3.4, 0.16, 'plank', '#5a3a22');
  b.box(0, 3.4, 0, 0.3, 0.2, 0.3, 'plank', '#3f2a1a');
  to.slice(0, 4).forEach((t, i) => {
    const dx = t.x - here.x, dz = t.z - here.z;
    // the board's long side points at the place: x of the part turned by rot
    const rot = (Math.atan2(-dz, dx) * 180) / Math.PI;
    const w = Math.min(3.2, 1.2 + t.title.length * 0.11);
    const r = (rot * Math.PI) / 180;
    const cx = (Math.cos(r) * (w / 2 + 0.1)), cz = (-Math.sin(r) * (w / 2 + 0.1));
    const y = 2.9 - i * 0.48;
    b.box(cx, y, cz, w, 0.36, 0.06, 'plank', i % 2 ? '#f2e6cf' : '#fff3d6', { rot });
    const label = `${t.title.toUpperCase().slice(0, 22)}  ${Math.round(t.dist / 10) * 10} M`;
    // text on both faces: the arrow points along the board, so it reads right on the face whose right is the tip
    const nx = Math.sin(r), nz = Math.cos(r);
    b.sign(`${label} →`, cx + nx * 0.04, y + 0.06, cz + nz * 0.04, 0.24, rot, '#fff3c4');
    b.sign(`← ${label}`, cx - nx * 0.04, y + 0.06, cz - nz * 0.04, 0.24, rot + 180, '#fff3c4');
  });
  return b.finish('waysign', { to: to.map((t) => t.title).join(', ') });
}

/** A standing map of the town on two legs, with "you are here" marked where it stands (drawn by the client). */
function mapBoard(decals: Parts['decals'], x: number, z: number, yaw: number): ReturnType<Parts['finish']> {
  const b = new Parts(decals);
  for (const s of [-1, 1]) b.box(s * 1.7, 0, 0, 0.14, 3.0, 0.14, 'metal', '#2f3d52');
  b.box(0, 0.6, 0, 3.6, 2.4, 0.12, 'metal', '#2f3d52');
  b.decal(0, 0.68, 0.07, { file: null, w: 800, h: 520 }, 3.4, 2.24, 0, { text: `@map:${Math.round(x)},${Math.round(z)},${Math.round(yaw)}`, color: '#ffffff' });
  b.decal(0, 0.68, -0.07, { file: null, w: 800, h: 520 }, 3.4, 2.24, 180, { text: `@map:${Math.round(x)},${Math.round(z)},${Math.round(yaw + 180)}`, color: '#ffffff' });
  b.sign('YOU ARE HERE', 0, 3.08, 0.07, 0.22, 0, '#fff3c4');
  return b.finish('citymap', {});
}

export function townWorld(words: TownWord[], tags: Record<string, Tag>, resolve: SpriteResolver, decals: DecalResolver, now = 0): World & { town: TownMap } {
  const rng = mulberry(20261113);
  // 1. every word as an item with its venue and spot
  const items = words.map((w) => townItem(w, tags[w.word]));
  const streetItems = items.filter((it) => it.venue === 'street' && it.spot !== 'building');
  const skyItems = items.filter((it) => it.venue === 'sky');
  const roomItems = items.filter((it) => ROOM_PLACES.includes(it.venue) && it.spot !== 'building');
  // a shed or a tree house stays in its backyard
  const yardItems = items.filter((it) => it.venue === 'backyard');
  // whole buildings (a barn, a bank, a lighthouse) never go inside a shop, hall or house: they stand on plots of
  // their own in the zone of the place they belong to; in outdoor venues (a farm's barn) they stay put
  const indoor = (p: PlaceId) => ['shop', 'hall', 'house'].includes(PLACES[p].kind) || p === 'street';
  const plots = items.filter((it) => it.spot === 'building' && indoor(it.venue));
  const venueItems = items.filter((it) => !plots.includes(it) && it.venue !== 'street' && it.venue !== 'sky' && it.venue !== 'backyard' && !ROOM_PLACES.includes(it.venue));
  const venues = assignVenues(venueItems);

  // 2. a plan per venue
  const byZone = new Map<Zone, VenuePlan[]>();
  const addPlan = (zone: Zone, p: VenuePlan) => byZone.set(zone, [...(byZone.get(zone) ?? []), p]);
  for (const [key, v] of [...venues].sort((a, b) => a[0].localeCompare(b[0]))) {
    const plan = planVenue(key, v.place, v.items, decals, rng);
    if (key.includes('#')) plan.title = `${plan.title} ${key.split('#')[1]}`;
    addPlan(PLACES[v.place].zone, plan);
  }
  for (const it of plots) {
    const zone = it.venue === 'street' ? 'downtown' : PLACES[it.venue].zone;
    addPlan(zone === 'sky' ? 'downtown' : zone, plotPlan(it));
  }
  // houses: rooms shared out so each house has two or three rooms and about 30 things; each house a backyard
  const byRoom = new Map<PlaceId, TownItem[]>();
  for (const it of roomItems) byRoom.set(it.venue, [...(byRoom.get(it.venue) ?? []), it]);
  const roomChunks: Array<{ place: PlaceId; items: TownItem[] }> = [];
  for (const [place, list] of [...byRoom].sort((a, b) => a[0].localeCompare(b[0]))) {
    const n = Math.max(1, Math.ceil(list.length / 14));
    for (let i = 0; i < n; i++) roomChunks.push({ place, items: list.filter((_, k) => k % n === i) });
  }
  const houseCount = Math.max(1, Math.ceil(roomChunks.length / 3));
  const houses: Array<Array<{ place: PlaceId; items: TownItem[] }>> = Array.from({ length: houseCount }, () => []);
  // deal rooms round so each house gets a mix (a kitchen, a bedroom, a bathroom...)
  roomChunks.forEach((r, i) => houses[i % houseCount].push(r));
  houses.forEach((rooms, i) => {
    if (!rooms.length) return;
    addPlan('residential', planHouse(`house#${i + 1}`, rooms, decals, HOUSE_COLORS[i % HOUSE_COLORS.length]));
  });
  const yards = Math.max(1, Math.ceil(yardItems.length / 8));
  for (let i = 0; i < yards; i++) {
    const list = yardItems.filter((_, k) => k % yards === i);
    if (!list.length) continue;
    const p = planVenue(`backyard#${i + 1}`, 'backyard', list, decals, rng);
    p.title = 'Backyard';
    addPlan('residential', p);
  }

  // 3. regions, bands and the plaza between downtown and the waterfront
  const regions = new Map<Zone, Region>();
  for (const band of BANDS)
    for (const zone of band) {
      const plans = zone === 'downtown' ? [...(byZone.get('downtown') ?? []), ...(byZone.get('civic') ?? [])] : (byZone.get(zone) ?? []);
      if (!plans.length && zone !== 'downtown' && zone !== 'waterfront') continue;
      regions.set(zone, layoutRegion(zone, plans, zone === 'downtown' ? PLAZA : 0, zone === 'downtown' ? 14 : 0));
    }
  // place bands north to south; within a band, regions west to east, the band centred on the downtown column
  const placed: Array<{ region: Region; ox: number; oz: number }> = [];
  const bandSpan: Array<[number, number]> = [];
  const bandsLaid: Array<{ zones: Region[]; d: number }> = BANDS.map((b) => {
    const zones = b.map((z) => regions.get(z)).filter((r): r is Region => !!r);
    return { zones, d: Math.max(0, ...zones.map((r) => r.d)) };
  }).filter((b) => b.zones.length);
  const totalD = bandsLaid.reduce((s, b) => s + b.d, 0) + AVENUE * (bandsLaid.length - 1);
  let oz = -totalD / 2;
  const avenues: PathSpec[] = [];
  let plazaZ = 0;
  let minX = 0, maxX = 0;
  for (const band of bandsLaid) {
    const widths = band.zones.map((r) => r.w);
    const total = widths.reduce((s, w) => s + w, 0) + AVENUE * (band.zones.length - 1);
    // centre the band on downtown when it has downtown, else on its own middle
    const di = band.zones.findIndex((r) => r.zone === 'downtown');
    let ox = di >= 0 ? -(widths.slice(0, di).reduce((s, w) => s + w, 0) + AVENUE * di) - widths[di] / 2 : -total / 2;
    // the west edge of the band has a road too
    avenues.push({ pts: [[ox - AVENUE / 2, oz - AVENUE / 2], [ox - AVENUE / 2, oz + band.d + AVENUE / 2]], width: AVENUE - 3.2 });
    for (const r of band.zones) {
      // a region shorter than its band sits against the band's south edge (its streets meet the avenue)
      placed.push({ region: r, ox, oz: oz + band.d - r.d });
      minX = Math.min(minX, ox);
      maxX = Math.max(maxX, ox + r.w);
      ox += r.w + AVENUE;
      avenues.push({ pts: [[ox - AVENUE / 2, oz - AVENUE / 2], [ox - AVENUE / 2, oz + band.d + AVENUE / 2]], width: AVENUE - 3.2 });
    }
    bandSpan.push([placed[placed.length - band.zones.length].ox, ox - AVENUE]);
    if (band.zones.some((r) => r.zone === 'downtown')) plazaZ = oz + band.d + AVENUE / 2;
    oz += band.d + AVENUE;
  }
  // an avenue along the south of each band, as long as that band and the next one need
  let bz = -totalD / 2;
  bandsLaid.forEach((band, i) => {
    bz += band.d + AVENUE;
    const [a0, a1] = bandSpan[i];
    const [b0, b1] = bandSpan[i + 1] ?? bandSpan[i];
    avenues.push({ pts: [[Math.min(a0, b0) - AVENUE, bz - AVENUE / 2], [Math.max(a1, b1) + AVENUE, bz - AVENUE / 2]], width: AVENUE - 3.2 });
  });
  // and one along the north edge
  avenues.push({ pts: [[bandSpan[0][0] - AVENUE, -totalD / 2 - AVENUE / 2], [bandSpan[0][1] + AVENUE, -totalD / 2 - AVENUE / 2]], width: AVENUE - 3.2 });
  const southEdge = oz - AVENUE;
  // the plaza sits on the avenue south of downtown, centred on x = 0
  const plaza = { x: 0, z: plazaZ - PLAZA / 2 + 2, r: PLAZA / 2 - 2 };
  const half = Math.ceil(Math.max(Math.abs(minX), Math.abs(maxX), totalD / 2) + 30);
  for (const a of avenues) for (const p of a.pts) p[0] = Math.max(-half + 10, Math.min(half - 10, p[0]));

  // 4. entities
  const entities: Entity[] = [];
  const surfaces: SurfaceSpec[] = [];
  const streets: PathSpec[] = [...avenues];
  const lots: TownLot[] = [];
  let n = 0;
  const id = (p: string) => `${p}_${n++}`;
  const toWorld = (X: number, Z: number, yaw: number, x: number, z: number): [number, number] => {
    const r = (yaw * Math.PI) / 180;
    return [X + x * Math.cos(r) + z * Math.sin(r), Z - x * Math.sin(r) + z * Math.cos(r)];
  };
  const thing = (it: TownItem, x: number, y: number, z: number, yaw: number, pre = 'a'): Entity => {
    const e = makeEntity({ id: id(pre), word: it.word, kind: it.kind, heightM: it.fig ? it.fig.heightM : it.h, pos: [Math.round(x * 100) / 100, Math.round(y * 100) / 100, Math.round(z * 100) / 100] }, resolve, now);
    e.heightM = Math.round((it.fig ? it.fig.heightM : it.h / it.scale) * 1000) / 1000;
    e.scale = Math.round(it.scale * 1000) / 1000;
    e.yaw = Math.round(yaw);
    e.state = { stay: true };
    entities.push(e);
    return e;
  };
  const afloat: Array<{ items: TownItem[]; x: number }> = [];
  for (const { region, ox, oz: rz } of placed) {
    for (const s of region.streets) streets.push({ pts: s.pts.map(([x, z]) => [x + ox, z + rz] as [number, number]), width: s.width });
    for (const { plan, x, z, yaw } of region.at) {
      const X = x + ox, Z = z + rz;
      lots.push({ x: Math.round(X), z: Math.round(Z), w: Math.round(plan.w), d: Math.round(plan.d), yaw, title: plan.title, zone: region.zone, ...(plan.key.startsWith('plot:') || plan.title === 'House' || plan.title === 'Backyard' ? { minor: true } : {}) });
      if (plan.shell) entities.push(structureEntity(id('bldg'), plan.title.toLowerCase(), townBuilding(plan.shell, decals), [X, 0, Z], yaw, now, plan.title.toLowerCase()));
      if (plan.fittings) entities.push(structureEntity(id('fit'), 'fittings', plan.fittings, [X, 0, Z], yaw, now, 'fittings'));
      for (const sf of plan.surfaces) {
        const [sx, sz] = toWorld(X, Z, yaw, sf.x, sf.z);
        surfaces.push({ x: sx, z: sz, hw: sf.hw, hd: sf.hd, rot: yaw, color: sf.color, ...(sf.edge ? { edge: sf.edge } : {}), ...(sf.marks ? { marks: sf.marks } : {}) });
      }
      for (const p of plan.placed) {
        const [wx, wz] = toWorld(X, Z, yaw, p.x, p.z);
        thing(p.item, wx, p.y, wz, yaw + p.yaw);
      }
      if (plan.afloat.length) afloat.push({ items: plan.afloat, x: X });
    }
  }

  // 5. the sea south of the waterfront, with boats along piers and big swimmers offshore
  const seaZ = southEdge + 4;
  let seaFar = seaZ + 120;
  // boats moor at piers in rows out from the shore in front of their venue; whales and big fish swim beyond them
  for (const group of afloat) {
    const ROW = 180;
    let x = 0, rowZ = seaZ + 8, rowDepth = 0;
    const startX = group.x - ROW / 2;
    const boats = group.items.filter((it) => !(it.fig?.rig === 'fish' || it.kind === 'animal')).sort((a, b) => b.fz - a.fz);
    const swimmers = group.items.filter((it) => it.fig?.rig === 'fish' || it.kind === 'animal');
    for (const it of boats) {
      const along = it.fx + 6;
      if (x + along > ROW && x > 0) {
        rowZ += rowDepth + 12;
        x = 0;
        rowDepth = 0;
      }
      const bx = startX + x + along / 2;
      // a pier from the shore (or the previous row) out past the boat, and the boat moored beside it
      const pier = new Parts(decals);
      const pl = rowZ - seaZ + it.fz + 4;
      pier.box(0, -0.2, 0, 2.2, 0.35, pl, 'plank', '#a0784e');
      for (let k = 0; k * 6 < pl; k++) for (const sd of [-1, 1]) pier.box(sd * 1.0, -2.2, -pl / 2 + k * 6 + 1, 0.25, 2.2, 0.25, 'plank', '#6b4a2b');
      entities.push(structureEntity(id('pier'), 'pier', pier.finish('pier', {}), [bx - it.fx / 2 - 1.8, 0, seaZ + pl / 2], 0, now, 'pier'));
      const e = thing(it, bx, -0.75, rowZ + it.fz / 2 + 2, 0);
      e.state.afloat = true;
      seaFar = Math.max(seaFar, rowZ + it.fz + 2);
      x += along;
      rowDepth = Math.max(rowDepth, it.fz);
    }
    let sx = 0;
    const swimZ = rowZ + rowDepth + 18;
    for (const it of swimmers) {
      const e = thing(it, startX + sx + it.fx / 2, -0.6 - it.h * 0.45, swimZ + it.fz / 2, 90);
      e.state.afloat = true;
      seaFar = Math.max(seaFar, swimZ + it.fz);
      sx += it.fx + 10;
    }
  }

  // the sea reaches past the farthest boat, and the land goes on past the sea's far shore
  const ponds: TerrainSpec['ponds'] = [{ x: 0, z: (seaZ + seaFar + 24) / 2, rx: half + 40, rz: (seaFar + 24 - seaZ) / 2, rot: 0, depth: 3 }];

  // 6. street things along the avenues: furniture on the pavement, vehicles at the kerb, people walking
  const kerb: Array<{ x: number; z: number; yaw: number }> = [];
  for (const s of avenues) {
    const [[x0, z0], [x1, z1]] = s.pts as Array<[number, number]>;
    const len = Math.hypot(x1 - x0, z1 - z0);
    const ux = (x1 - x0) / len, uz = (z1 - z0) / len;
    for (let t = 14; t < len - 14; t += 7) for (const side of [-1, 1]) kerb.push({ x: x0 + ux * t - uz * side * (s.width / 2 + 1.4), z: z0 + uz * t + ux * side * (s.width / 2 + 1.4), yaw: (Math.atan2(ux, uz) * 180) / Math.PI + (side > 0 ? 90 : -90) });
  }
  // keep clear of the plaza
  const free = kerb.filter((k) => Math.hypot(k.x - plaza.x, k.z - plaza.z) > plaza.r + 4);
  const stride = Math.max(1, Math.floor(free.length / Math.max(1, streetItems.length + 1)));
  streetItems.forEach((it, i) => {
    const k = free[(i * stride + Math.floor(stride / 2)) % free.length];
    if (!k) return;
    const vehicle = it.spot === 'parked' || Math.max(it.fx, it.fz) > 2.5;
    // vehicles park in the street along the kerb, nose along the road; the rest stand on the pavement
    const back = vehicle ? 2.6 + it.fz / 2 : 0;
    const r = (k.yaw * Math.PI) / 180;
    const e = thing(it, k.x - Math.sin(r) * back, 0, k.z - Math.cos(r) * back, vehicle ? k.yaw + 90 : k.yaw, 'st');
    if (it.spot === 'person') e.state.wander = true;
  });
  // extra people out and about
  const walkers = WALKERS.filter((w) => getFigure(w));
  for (let i = 0; i < 48 && walkers.length; i++) {
    const k = free[(i * 37 + 11) % free.length];
    if (!k) break;
    const word = walkers[i % walkers.length];
    const f = getFigure(word)!;
    const e = makeEntity({ id: id('ped'), word, kind: 'human', heightM: f.heightM, pos: [k.x + (rng() - 0.5) * 2, 0, k.z + (rng() - 0.5) * 2] }, resolve, now);
    e.yaw = Math.round(k.yaw + 90 * (rng() < 0.5 ? 1 : -1));
    e.state = { stay: true, wander: true };
    entities.push(e);
  }

  // 7. the sky: clouds, balloons, the moon and friends float over the middle of town
  skyItems.forEach((it, i) => {
    const a = i * 2.39996;
    const r = 30 + Math.sqrt(i) * 22;
    thing(it, Math.cos(a) * r, 22 + (i % 5) * 5, plaza.z - 60 + Math.sin(a) * r * 0.8, Math.round(rng() * 360), 'sky');
  });

  // 8. the plaza: fountain, benches, lamps, the town's name, a map and a signpost
  surfaces.push({ x: plaza.x, z: plaza.z, hw: plaza.r, hd: plaza.r, color: '#d9caa6', edge: '#8e8a82', marks: 'tiles' });
  const fountain = generate('fountain', { r: 4, tiers: 2 }, 3, decals);
  if (fountain) entities.push(structureEntity('plaza_fountain', 'fountain', fountain, [plaza.x, 0, plaza.z], 0, now, 'fountain'));
  for (const [dx, dz, yaw] of [[-9, 6, 90], [9, 6, -90], [-9, -6, 90], [9, -6, -90]] as Array<[number, number, number]>) {
    const bench = generate('bench', {}, 5, decals);
    if (bench) entities.push(structureEntity(id('bench'), 'bench', bench, [plaza.x + dx, 0, plaza.z + dz], yaw, now, 'bench'));
  }
  for (const [dx, dz] of [[-plaza.r + 2, -plaza.r + 2], [plaza.r - 2, -plaza.r + 2], [-plaza.r + 2, plaza.r - 2], [plaza.r - 2, plaza.r - 2]]) {
    const lamp = generate('lamppost', {}, 5, decals);
    if (lamp) entities.push(structureEntity(id('lamp'), 'lamppost', lamp, [plaza.x + dx, 0, plaza.z + dz], 0, now, 'lamppost'));
  }
  const name = generate('signboard', { text: 'WELCOME TO EVERYTOWN' }, 1, decals);
  if (name) entities.push(structureEntity('plaza_sign', 'sign', name, [plaza.x, 0, plaza.z + plaza.r - 4], 0, now, 'welcome to everytown'));

  // 9. signposts at junctions, maps at the plaza and at each zone's way in
  const venuesSeen = lots.filter((l) => l.title !== 'House' && l.title !== 'Backyard');
  const junctions: Array<{ x: number; z: number }> = [];
  for (const a of avenues) for (const b2 of avenues) {
    const [[ax0, az0], [ax1, az1]] = a.pts as Array<[number, number]>;
    const [[bx0, bz0], [bx1, bz1]] = b2.pts as Array<[number, number]>;
    if (ax0 === ax1 && bz0 === bz1) {
      const x = ax0, z = bz0;
      if (z >= Math.min(az0, az1) && z <= Math.max(az0, az1) && x >= Math.min(bx0, bx1) && x <= Math.max(bx0, bx1)) junctions.push({ x: x + AVENUE / 2 + 1.5, z: z + AVENUE / 2 + 1.5 });
    }
  }
  junctions.push({ x: plaza.x + 6, z: plaza.z - plaza.r + 3 });
  const pointTo = (here: { x: number; z: number }) => {
    const dist = (l: TownLot) => Math.hypot(l.x - here.x, l.z - here.z);
    const near = venuesSeen.filter((l) => dist(l) > 20).sort((a, b) => dist(a) - dist(b));
    // two nearby places, and two farther ones in other directions
    const picks: TownLot[] = near.slice(0, 2);
    for (const l of near.slice(2).reverse()) {
      if (picks.length >= 4) break;
      const ang = Math.atan2(l.z - here.z, l.x - here.x);
      if (picks.every((p) => Math.abs(Math.atan2(p.z - here.z, p.x - here.x) - ang) > 0.9) && !picks.some((p) => p.title === l.title)) picks.push(l);
    }
    return picks.map((l) => ({ title: l.title, x: l.x, z: l.z, dist: dist(l) }));
  };
  for (const j of junctions) {
    const s = waysign(decals, pointTo(j), j);
    entities.push(structureEntity(id('signpost'), 'signpost', s, [j.x, 0, j.z], 0, now, 'signpost'));
  }
  const mapsAt: Array<{ x: number; z: number; yaw: number }> = [{ x: plaza.x - 8, z: plaza.z + plaza.r - 5, yaw: 0 }];
  for (const { region, ox, oz: rz } of placed) mapsAt.push({ x: ox + region.w / 2 + 4, z: rz + region.d + 2.5, yaw: 0 });
  for (const mp of mapsAt) entities.push(structureEntity(id('map'), 'map', mapBoard(decals, mp.x, mp.z, mp.yaw), [mp.x, 0, mp.z], mp.yaw, now, 'map'));

  // 10. the ground: flat town, the sea to the south, hills round the edge
  const size = Math.ceil(Math.max(half + 60, seaFar + 70));
  const terrain: TerrainSpec = {
    seed: 11,
    size,
    // the town is flat but for the sea and the rim, so a coarse grid does (a fine one would be half a million vertices)
    step: 3,
    waterLevel: -0.6,
    hillAmp: 0,
    hillScale: 30,
    rim: 8,
    rimFrom: half + 10,
    pads: [{ x: plaza.x, z: plaza.z, h: 0, r: 0.01, blend: 1 }],
    roads: [],
    rivers: [],
    ponds,
    paths: [],
    streets,
    surfaces,
    paintHalf: size,
  };
  const world: World & { town: TownMap } = {
    slug: 'town',
    rev: 1,
    player: { pos: [plaza.x, 0, plaza.z + plaza.r - 1], yaw: 0, pitch: 0 },
    entities,
    createdAt: now,
    preset: 'town',
    terrain,
    town: { half: size, lots, streets, plaza, sea: { z: seaZ } },
  };
  // 11. acts that set things up (bread in the toaster, milk in the fridge) run once in a headless engine
  const engine = new Engine(world, 5);
  engine.idle.enabled = false;
  let setups = 0;
  for (const e of world.entities) if (!e.structure && engine.setupAct(e.id)) setups++;
  if (setups) for (let t = 0; t < 6; t += 0.1) engine.update(0.1);
  const out = engine.world.toWorld() as World & { town: TownMap };
  out.town = world.town;
  const before = new Set(world.entities.map((e) => e.id));
  for (const e of out.entities) {
    if (e.structure) continue;
    e.state.stay = true;
    // what a setup made (the bread in a toaster) is marked, so the town's own things can be told apart
    if (!before.has(e.id)) e.state.setup = true;
  }
  return out;
}

export const _test = { layoutRegion, waysign };
void ([] as Vec3[]);
