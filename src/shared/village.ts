/**
 * Procedural villages. One seed decides everything, in an order where each step can respect the ones before it:
 *   hills -> a river across one side and a lake on the other -> a plaza in the middle -> roads out of the plaza
 *   (one crosses the river, one ends at the lake) -> house lots along the roads facing them -> the special places
 *   (lighthouse on the lake shore, bunker on the highest hill, witch's hut deep in the woods, gingerbread house on
 *   a road, a fenced garden beside a house) -> bridges where roads cross water -> footpaths from every door to its
 *   road -> trees where nothing else is -> lamps, mailboxes, benches and people.
 * Terrain pads flatten the ground under every building and roads smooth their own strip, so nothing floats.
 */
import type { Entity, Kind, PlayerState, Vec3 } from './types';
import { DEG, makeRng, rotateY } from './engine/math';
import { makeEntity, type PresetItem, type SpriteResolver } from './engine/make-entity';
import { TerrainField, hillHeight, polylineDist, waterCeiling, type PathSpec, type TerrainSpec } from './terrain/field';
import { fbm } from './terrain/noise';
import { generate } from './structure/index';
import { seatOnTerrain, structureEntity } from './structure/entity';
import type { DecalResolver, Structure } from './structure/types';

const WALK_R = 54;
const ROAD_W = 3.2;
const PLAZA_R = 7.5;
const BANK = 2.6;
/** Flat ground kept round a building beyond its footprint. */
const PAD_MARGIN = 1.6;

type P2 = [number, number];

interface Lot {
  id: string;
  word: string;
  s: Structure;
  x: number;
  z: number;
  yaw: number;
  /** Footprint half-sizes (local x and z). */
  hw: number;
  hd: number;
  /** Where its door path starts (world), when it has a door. */
  door?: P2;
}

export interface Village {
  entities: Entity[];
  terrain: TerrainSpec;
  player: PlayerState;
}

const norm2 = (v: P2): P2 => {
  const l = Math.hypot(v[0], v[1]) || 1;
  return [v[0] / l, v[1] / l];
};

/** Local (lx, lz) of a lot -> world. */
function toWorld(l: Pick<Lot, 'x' | 'z' | 'yaw'>, lx: number, lz: number): P2 {
  const r = rotateY([lx, 0, lz], l.yaw * DEG);
  return [l.x + r[0], l.z + r[2]];
}

function toLocal(l: Pick<Lot, 'x' | 'z' | 'yaw'>, x: number, z: number): P2 {
  const r = rotateY([x - l.x, 0, z - l.z], -l.yaw * DEG);
  return [r[0], r[2]];
}

function corners(l: Lot, m = 0): P2[] {
  return [
    toWorld(l, -l.hw - m, -l.hd - m),
    toWorld(l, l.hw + m, -l.hd - m),
    toWorld(l, l.hw + m, l.hd + m),
    toWorld(l, -l.hw - m, l.hd + m),
  ];
}

/** Separating-axis test for two rotated rectangles, each grown by `margin`. */
function lotsOverlap(a: Lot, b: Lot, margin: number): boolean {
  const ca = corners(a, margin / 2);
  const cb = corners(b, margin / 2);
  for (const l of [a, b]) {
    const axes: P2[] = [
      [Math.cos(l.yaw * DEG), -Math.sin(l.yaw * DEG)],
      [Math.sin(l.yaw * DEG), Math.cos(l.yaw * DEG)],
    ];
    for (const ax of axes) {
      const pa = ca.map((p) => p[0] * ax[0] + p[1] * ax[1]);
      const pb = cb.map((p) => p[0] * ax[0] + p[1] * ax[1]);
      if (Math.max(...pa) < Math.min(...pb) || Math.max(...pb) < Math.min(...pa)) return false;
    }
  }
  return true;
}

function insideLot(l: Lot, x: number, z: number, margin: number): boolean {
  const [lx, lz] = toLocal(l, x, z);
  return Math.abs(lx) <= l.hw + margin && Math.abs(lz) <= l.hd + margin;
}

class Planner {
  readonly rng: () => number;
  readonly spec: TerrainSpec;
  readonly lots: Lot[] = [];
  readonly decor: PresetItem[] = [];
  readonly bridges: Array<{ x: number; z: number; yaw: number; len: number }> = [];
  private ids = new Map<string, number>();
  private structSeed: number;

  constructor(
    readonly seed: number,
    readonly decals: DecalResolver,
  ) {
    this.rng = makeRng(seed);
    this.structSeed = seed * 7919;
    const r = this.rng;
    this.spec = {
      seed,
      size: 120,
      step: 1.5,
      waterLevel: -0.6,
      hillAmp: 2.6 + r() * 1.8,
      hillScale: 22 + r() * 9,
      rim: 8 + r() * 5,
      rimFrom: 62,
      pads: [],
      roads: [],
      rivers: [],
      ponds: [],
      paths: [],
    };
  }

  range(lo: number, hi: number): number {
    return lo + this.rng() * (hi - lo);
  }

  pick<T>(arr: readonly T[]): T {
    return arr[Math.floor(this.rng() * arr.length) % arr.length];
  }

  id(base: string): string {
    const n = (this.ids.get(base) ?? 0) + 1;
    this.ids.set(base, n);
    return `${base}_${n}`;
  }

  hills(x: number, z: number): number {
    return hillHeight(this.spec, x, z);
  }

  /** Distance to open water's edge (negative inside), in metres. */
  waterGap(x: number, z: number): number {
    let gap = Infinity;
    for (const rv of this.spec.rivers) gap = Math.min(gap, polylineDist(x, z, rv.pts).d - rv.width / 2);
    for (const p of this.spec.ponds) {
      const a = p.rot * DEG;
      const c = Math.cos(a);
      const s = Math.sin(a);
      const dx = x - p.x;
      const dz = z - p.z;
      const lx = dx * c - dz * s;
      const lz = dx * s + dz * c;
      const m = Math.min(p.rx, p.rz);
      gap = Math.min(gap, (Math.hypot(lx / p.rx, lz / p.rz) - 1) * m);
    }
    return gap;
  }

  roadGap(x: number, z: number): number {
    let gap = Infinity;
    for (const r of this.spec.roads) gap = Math.min(gap, polylineDist(x, z, r.pts).d - r.width / 2);
    return gap;
  }

  pathGap(x: number, z: number): number {
    let gap = Infinity;
    for (const p of this.spec.paths) gap = Math.min(gap, polylineDist(x, z, p.pts).d - p.width / 2);
    return gap;
  }

  nextStructure(gen: string, params: Record<string, unknown> = {}): Structure {
    this.structSeed = (this.structSeed * 1103515245 + 12345) & 0x7fffffff;
    return generate(gen, params, this.structSeed, this.decals)!;
  }

  /** Whether a lot can go here: on land, off the roads, clear of other lots and the plaza, inside the valley. */
  fits(l: Lot, opts: { water?: number; road?: number; lots?: number } = {}): boolean {
    const pts = [...corners(l), [l.x, l.z] as P2, toWorld(l, 0, l.hd), toWorld(l, 0, -l.hd), toWorld(l, l.hw, 0), toWorld(l, -l.hw, 0)];
    for (const [x, z] of pts) {
      if (Math.hypot(x, z) > WALK_R) return false;
      if (this.waterGap(x, z) < (opts.water ?? BANK + 1.5)) return false;
      if (this.roadGap(x, z) < (opts.road ?? 1.2)) return false;
      if (Math.hypot(x, z) < PLAZA_R + 1.5) return false;
    }
    // far enough apart that the flattened pads under neighbours never overlap (unless they share a height, like a garden)
    for (const o of this.lots) if (lotsOverlap(l, o, opts.lots ?? 2 * PAD_MARGIN + 0.4)) return false;
    // not on a cliff: the pad would leave a wall of earth
    const hs = pts.map(([x, z]) => this.hills(x, z));
    return Math.max(...hs) - Math.min(...hs) < 3.2;
  }

  /**
   * Claim a lot and flatten the ground under it: to the road's height when it sits on a road (so door paths and
   * the street meet level), else to the hills at its centre; never above what nearby water will carve away.
   */
  addLot(l: Lot, padBlend = 3.2, h?: number): number {
    this.lots.push(l);
    const padH = this.padHeight(l, h);
    const m = PAD_MARGIN;
    this.spec.pads.push({ x: round(l.x), z: round(l.z), h: padH, hw: round(l.hw + m), hd: round(l.hd + m), rot: round(l.yaw), blend: padBlend });
    return padH;
  }

  /** The height a lot's pad would get: as asked (or the road's, or the hills'), kept under nearby water's carve. */
  padHeight(l: Lot, h?: number): number {
    let padH = h ?? (this.roadGap(l.x, l.z) < l.hd + 6 ? this.roadHeight(l.x, l.z) : this.hills(l.x, l.z));
    const m = PAD_MARGIN;
    for (const [lx, lz] of [[-1, -1], [1, -1], [1, 1], [-1, 1], [0, 1], [0, -1], [1, 0], [-1, 0], [0, 0]])
      padH = Math.min(padH, waterCeiling(this.spec, ...toWorld(l, lx * (l.hw + m), lz * (l.hd + m))) - 0.02);
    return round(padH);
  }

  /** Height of the nearest road's surface to (x, z). */
  roadHeight(x: number, z: number): number {
    let best = { d: Infinity, h: this.hills(x, z) };
    for (const r of this.spec.roads) {
      const near = polylineDist(x, z, r.pts);
      if (near.d < best.d) {
        const a = r.pts[near.seg];
        const b = r.pts[near.seg + 1];
        best = { d: near.d, h: a[2] + (b[2] - a[2]) * near.t };
      }
    }
    return Math.min(best.h, waterCeiling(this.spec, x, z));
  }

  /** A footpath that wanders a little from `a` to `b`. */
  path(a: P2, b: P2, width = 1.3, wander = 1.2): void {
    const n = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / 4));
    const dir = norm2([b[0] - a[0], b[1] - a[1]]);
    const side: P2 = [-dir[1], dir[0]];
    const phase = this.rng() * 6;
    const pts: P2[] = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const off = Math.sin(t * Math.PI) * Math.sin(phase + t * 3) * wander;
      pts.push([round(a[0] + (b[0] - a[0]) * t + side[0] * off), round(a[1] + (b[1] - a[1]) * t + side[1] * off)]);
    }
    this.spec.paths.push({ pts, width });
  }

  /** Nearest point on any road to (x, z). */
  nearestRoadPoint(x: number, z: number): P2 {
    let best: P2 = [0, 0];
    let bestD = Infinity;
    for (const r of this.spec.roads) {
      const near = polylineDist(x, z, r.pts);
      if (near.d < bestD) {
        const a = r.pts[near.seg];
        const b = r.pts[near.seg + 1];
        bestD = near.d;
        best = [a[0] + (b[0] - a[0]) * near.t, a[1] + (b[1] - a[1]) * near.t];
      }
    }
    return best;
  }

  place(word: string, kind: Kind, heightM: number, x: number, z: number, flip = false): void {
    this.decor.push({ id: this.id(word.replace(/\s+/g, '_')), word, kind, heightM, pos: [round(x), 0, round(z)], flip });
  }

  /** Decor spot test: dry, off roads, not inside a building, not on top of other decor. */
  free(x: number, z: number, r = 0.8, roadMargin = 0.3): boolean {
    if (Math.hypot(x, z) > WALK_R + 2) return false;
    if (this.waterGap(x, z) < 1) return false;
    if (this.roadGap(x, z) < roadMargin) return false;
    for (const l of this.lots) if (insideLot(l, x, z, r + 0.5)) return false;
    for (const d of this.decor) if (Math.hypot(d.pos[0] - x, d.pos[2] - z) < r + 0.6) return false;
    return true;
  }
}

function round(v: number): number {
  return Math.round(v * 1000) / 1000;
}

/* ----- the steps ----- */

function riverAndLake(pl: Planner): { n: P2; t: P2; theta: number; lake: { x: number; z: number; r: number } } {
  const theta = pl.rng() * Math.PI * 2;
  const n: P2 = [Math.cos(theta), Math.sin(theta)];
  const t: P2 = [-Math.sin(theta), Math.cos(theta)];
  const d0 = pl.range(25, 32);
  const amp = pl.range(4, 8);
  const lambda = pl.range(15, 22);
  const phi = pl.rng() * Math.PI * 2;
  const pts: P2[] = [];
  for (let s = -140; s <= 140; s += 7) {
    const off = d0 + amp * Math.sin(s / lambda + phi);
    pts.push([round(n[0] * off + t[0] * s), round(n[1] * off + t[1] * s)]);
  }
  pl.spec.rivers.push({ pts, width: round(pl.range(5.5, 7.5)), depth: 1.25 });
  const alpha = theta + Math.PI + pl.range(-0.6, 0.6);
  const dist = pl.range(31, 37);
  const rx = pl.range(8, 11);
  const rz = pl.range(6, 8.5);
  const lx = Math.cos(alpha) * dist;
  const lz = Math.sin(alpha) * dist;
  pl.spec.ponds.push({ x: round(lx), z: round(lz), rx: round(rx), rz: round(rz), rot: round(pl.rng() * 360), depth: 1.5 });
  return { n, t, theta, lake: { x: lx, z: lz, r: Math.max(rx, rz) } };
}

/** A road from the plaza heading `angle`, wobbling a little, stopping at `stop` (or the valley edge). */
function road(pl: Planner, angle: number, stop: (x: number, z: number, s: number) => boolean): void {
  const pts: P2[] = [[0, 0]];
  let heading = angle;
  let x = 0;
  let z = 0;
  const phase = pl.rng() * 10;
  for (let s = 6; s < 90; s += 6) {
    heading += 0.14 * Math.sin(phase + s / 9) * Math.min(1, s / 18);
    const nx = x + Math.cos(heading) * 6;
    const nz = z + Math.sin(heading) * 6;
    if (Math.hypot(nx, nz) > WALK_R + 2 || stop(nx, nz, s)) break;
    x = nx;
    z = nz;
    pts.push([round(x), round(z)]);
  }
  if (pts.length < 3) return;
  // heights: the hills under it, eased; pinned to the plaza where it starts
  const plazaH = pl.hills(0, 0);
  let hs = pts.map(([px, pz]) => pl.hills(px, pz));
  hs[0] = plazaH;
  if (hs.length > 1) hs[1] = (hs[1] + plazaH) / 2;
  for (let pass = 0; pass < 3; pass++) hs = hs.map((h, i) => (i === 0 ? h : (hs[i - 1] + 2 * h + (hs[i + 1] ?? h)) / 4));
  pl.spec.roads.push({ pts: pts.map(([px, pz], i) => [px, pz, round(hs[i])]), width: ROAD_W });
}

function roads(pl: Planner, geo: ReturnType<typeof riverAndLake>): void {
  const lakeAngle = Math.atan2(geo.lake.z, geo.lake.x);
  const lakeStop = (x: number, z: number) => Math.hypot(x - geo.lake.x, z - geo.lake.z) < geo.lake.r + 7;
  const wet = (x: number, z: number) => pl.waterGap(x, z) < BANK + 2;
  // A crosses the river and carries on; B ends at the lake shore; C (and maybe D) run along the valley
  road(pl, geo.theta + pl.range(-0.15, 0.15), (x, z) => lakeStop(x, z));
  road(pl, lakeAngle, (x, z) => lakeStop(x, z));
  const perp = [geo.theta + Math.PI / 2, geo.theta - Math.PI / 2];
  const gap = (a: number) => Math.abs(Math.atan2(Math.sin(a - lakeAngle), Math.cos(a - lakeAngle)));
  perp.sort((a, b) => gap(b) - gap(a));
  road(pl, perp[0] + pl.range(-0.2, 0.2), (x, z) => lakeStop(x, z) || wet(x, z));
  if (gap(perp[1]) > 0.9 && pl.rng() < 0.7) road(pl, perp[1] + pl.range(-0.2, 0.2), (x, z) => lakeStop(x, z) || wet(x, z));
  pl.spec.pads.push({ x: 0, z: 0, h: round(pl.hills(0, 0)), r: PLAZA_R, blend: 6 });
}

/** Where a road crosses the river: one bridge per crossing, spanning the channel and its banks. */
function bridges(pl: Planner): void {
  for (const rd of pl.spec.roads) {
    for (const rv of pl.spec.rivers) {
      for (let i = 0; i + 1 < rd.pts.length; i++) {
        const a = rd.pts[i];
        const b = rd.pts[i + 1];
        for (let j = 0; j + 1 < rv.pts.length; j++) {
          const hit = segIntersect(a[0], a[1], b[0], b[1], rv.pts[j][0], rv.pts[j][1], rv.pts[j + 1][0], rv.pts[j + 1][1]);
          if (!hit) continue;
          const dir = norm2([b[0] - a[0], b[1] - a[1]]);
          const rvDir = norm2([rv.pts[j + 1][0] - rv.pts[j][0], rv.pts[j + 1][1] - rv.pts[j][1]]);
          // crossing at an angle makes the channel longer along the road
          const sin = Math.max(0.5, Math.abs(dir[0] * rvDir[1] - dir[1] * rvDir[0]));
          const len = (rv.width + 2 * BANK + 2.5) / sin;
          pl.bridges.push({ x: hit[0], z: hit[1], yaw: (Math.atan2(dir[0], dir[1]) * 180) / Math.PI, len });
        }
      }
    }
  }
}

function segIntersect(ax: number, az: number, bx: number, bz: number, cx: number, cz: number, dx: number, dz: number): P2 | null {
  const r: P2 = [bx - ax, bz - az];
  const s: P2 = [dx - cx, dz - cz];
  const den = r[0] * s[1] - r[1] * s[0];
  if (Math.abs(den) < 1e-9) return null;
  const t = ((cx - ax) * s[1] - (cz - az) * s[0]) / den;
  const u = ((cx - ax) * r[1] - (cz - az) * r[0]) / den;
  if (t < 0 || t > 1 || u < 0 || u > 1) return null;
  return [ax + r[0] * t, az + r[1] * t];
}

/** Lots along both sides of every road, houses facing it. */
function houses(pl: Planner, want: number): void {
  const candidates: Array<{ x: number; z: number; nx: number; nz: number; s: number }> = [];
  for (const rd of pl.spec.roads) {
    let s = 0;
    for (let i = 0; i + 1 < rd.pts.length; i++) {
      const a = rd.pts[i];
      const b = rd.pts[i + 1];
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const dir = norm2([b[0] - a[0], b[1] - a[1]]);
      for (let k = 0; k < len; k += 3) {
        const along = s + k;
        if (along < PLAZA_R + 6) continue;
        const x = a[0] + dir[0] * k;
        const z = a[1] + dir[1] * k;
        candidates.push({ x, z, nx: -dir[1], nz: dir[0], s: along });
        candidates.push({ x, z, nx: dir[1], nz: -dir[0], s: along });
      }
      s += len;
    }
  }
  // closer to the plaza first, with some shuffle so streets are not packed from one end
  candidates.sort((p, q) => p.s + pl.rng() * 14 - (q.s + pl.rng() * 14));
  const specials: Array<{ gen: string; word: string; id: string }> = [{ gen: 'gingerbread', word: 'gingerbread house', id: 'gingerbread_house' }];
  let placed = 0;
  for (const c of candidates) {
    if (placed >= want + specials.length) break;
    const special = placed === 2 ? specials.shift() : undefined;
    const s = special ? pl.nextStructure(special.gen) : pl.nextStructure('house', { random: true });
    const hw = s.bounds.w / 2;
    const hd = s.bounds.d / 2;
    const off = ROAD_W / 2 + 2.4 + hd;
    const x = c.x + c.nx * off;
    const z = c.z + c.nz * off;
    // the front (+z) faces the road
    const yaw = (Math.atan2(-c.nx, -c.nz) * 180) / Math.PI;
    const lot: Lot = { id: '', word: special?.word ?? 'house', s, x, z, yaw, hw, hd };
    const level = pl.roadHeight(x, z);
    const cliff = corners(lot).some(([cx, cz]) => Math.abs(pl.hills(cx, cz) - level) > 2.4);
    if (cliff || !pl.fits(lot)) {
      if (special) specials.unshift(special);
      continue;
    }
    lot.id = pl.id(special?.id ?? 'house');
    const doorAt = typeof s.params.doorAt === 'number' ? s.params.doorAt : 0;
    lot.door = toWorld(lot, doorAt, hd + 0.5);
    pl.addLot(lot);
    placed++;
  }
}

/** A fenced garden beside one of the houses, gate toward the same road. */
function garden(pl: Planner): Lot | null {
  const houses = pl.lots.filter((l) => l.word === 'house');
  for (const h of houses) {
    const w = pl.range(7, 9);
    const d = pl.range(5.5, 7);
    const s = pl.nextStructure('yard', { w, d });
    for (const side of [1, -1]) {
      const [x, z] = toWorld(h, side * (h.hw + 1.4 + s.bounds.w / 2), h.hd - s.bounds.d / 2);
      const lot: Lot = { id: '', word: 'yard', s, x, z, yaw: h.yaw, hw: s.bounds.w / 2, hd: s.bounds.d / 2 };
      if (!pl.fits(lot, { lots: 0.8 })) continue;
      // the garden shares its house's ground; skip spots where water would have to cut it lower
      const houseH = pl.spec.pads.find((p) => Math.abs(p.x - round(h.x)) < 1e-6 && Math.abs(p.z - round(h.z)) < 1e-6)?.h;
      if (houseH === undefined || Math.abs(pl.padHeight(lot, houseH) - houseH) > 0.01) continue;
      lot.id = pl.id('yard');
      pl.addLot(lot, 3, houseH);
      return lot;
    }
  }
  return null;
}

/** The lighthouse on the lake shore nearest the lake road, door toward the road's end. */
function lighthouse(pl: Planner, geo: ReturnType<typeof riverAndLake>): void {
  const s = pl.nextStructure('lighthouse');
  const lakeRoad = pl.spec.roads[1] ?? pl.spec.roads[0];
  const end = lakeRoad.pts[lakeRoad.pts.length - 1];
  const base = Math.atan2(end[1] - geo.lake.z, end[0] - geo.lake.x);
  const lake = pl.spec.ponds[0];
  const minR = lake ? Math.min(lake.rx, lake.rz) : geo.lake.r;
  for (const turn of [0.5, -0.5, 0.9, -0.9, 1.3, -1.3, 1.8, -1.8]) {
    const a = base + turn;
    for (let r = minR; r < geo.lake.r + 18; r += 0.5) {
      const x = geo.lake.x + Math.cos(a) * r;
      const z = geo.lake.z + Math.sin(a) * r;
      // the door faces away from the water, toward land
      const yaw = (Math.atan2(x - geo.lake.x, z - geo.lake.z) * 180) / Math.PI;
      const lot: Lot = { id: '', word: 'lighthouse', s, x, z, yaw, hw: s.bounds.w / 2, hd: s.bounds.d / 2 };
      if (!pl.fits(lot, { water: BANK + 0.4, road: 1.5 })) continue;
      lot.id = pl.id('lighthouse');
      lot.door = toWorld(lot, 0, lot.hd + 0.4);
      pl.addLot(lot, 2.5);
      pl.path(lot.door, pl.nearestRoadPoint(lot.door[0], lot.door[1]), 1.4, 0.8);
      return;
    }
  }
}

/** The bunker on the highest open ground, facing the way back to the plaza. */
function bunker(pl: Planner): void {
  const s = pl.nextStructure('bunker', { levels: 3 });
  let best: Lot | null = null;
  let bestScore = -Infinity;
  for (let i = 0; i < 260; i++) {
    const a = pl.rng() * Math.PI * 2;
    const r = pl.range(24, 48);
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    const road = pl.nearestRoadPoint(x, z);
    const yaw = (Math.atan2(road[0] - x, road[1] - z) * 180) / Math.PI;
    const lot: Lot = { id: '', word: 'bunker', s, x, z, yaw, hw: s.bounds.w / 2, hd: s.bounds.d / 2 };
    if (!pl.fits(lot, { road: 3, lots: 6 })) continue;
    const score = pl.hills(x, z) - 0.02 * pl.roadGap(x, z);
    if (score > bestScore) {
      bestScore = score;
      best = lot;
    }
  }
  if (!best) return;
  best.id = pl.id('bunker');
  best.door = toWorld(best, 0, best.hd + 0.5);
  pl.addLot(best, 5);
  pl.path(best.door, pl.nearestRoadPoint(best.door[0], best.door[1]), 1.6, 1.5);
}

/** The witch's hut as far from any road as it can get, reached by a winding path. */
function witchHut(pl: Planner): Lot | null {
  const s = pl.nextStructure('witch_hut');
  let best: Lot | null = null;
  let bestScore = -Infinity;
  for (let i = 0; i < 260; i++) {
    const a = pl.rng() * Math.PI * 2;
    const r = pl.range(28, 50);
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    const road = pl.nearestRoadPoint(x, z);
    const yaw = (Math.atan2(road[0] - x, road[1] - z) * 180) / Math.PI;
    const lot: Lot = { id: '', word: 'witch hut', s, x, z, yaw, hw: s.bounds.w / 2, hd: s.bounds.d / 2 };
    if (!pl.fits(lot, { road: 8, lots: 9 })) continue;
    const score = Math.min(pl.roadGap(x, z), 22) + fbm(x / 25, z / 25, pl.seed + 5) * 6;
    if (score > bestScore) {
      bestScore = score;
      best = lot;
    }
  }
  if (!best) return null;
  best.id = pl.id('witch_hut');
  best.door = toWorld(best, 0, best.hd + 0.4);
  pl.addLot(best, 3);
  pl.path(best.door, pl.nearestRoadPoint(best.door[0], best.door[1]), 1.1, 3);
  return best;
}

/** A small pond in an open spot, sometimes. */
function smallPond(pl: Planner): void {
  if (pl.rng() < 0.35) return;
  for (let i = 0; i < 120; i++) {
    const a = pl.rng() * Math.PI * 2;
    const r = pl.range(16, 46);
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    const rad = pl.range(3, 4.5);
    if (pl.waterGap(x, z) < rad + 10 || pl.roadGap(x, z) < rad + 5 || pl.pathGap(x, z) < rad + 3) continue;
    if (pl.lots.some((l) => insideLot(l, x, z, rad + 5))) continue;
    if (Math.hypot(x, z) + rad > WALK_R - 2) continue;
    pl.spec.ponds.push({ x: round(x), z: round(z), rx: round(rad), rz: round(rad * pl.range(0.7, 1)), rot: round(pl.rng() * 360), depth: 1 });
    pl.place('duck', 'animal', 0.5, x + rad * 0.3, z);
    return;
  }
}

function doorPaths(pl: Planner): void {
  for (const l of pl.lots) {
    if (!l.door || pl.spec.paths.some((p) => Math.hypot(p.pts[0][0] - l.door![0], p.pts[0][1] - l.door![1]) < 0.5)) continue;
    const road = pl.nearestRoadPoint(l.door[0], l.door[1]);
    pl.path(l.door, road, 1.3, 0.5);
    // a mailbox where the path meets the road, on the house's side
    const dir = norm2([l.door[0] - road[0], l.door[1] - road[1]]);
    const side: P2 = [-dir[1], dir[0]];
    const mx = road[0] + dir[0] * (ROAD_W / 2 + 0.9) + side[0] * 1.2;
    const mz = road[1] + dir[1] * (ROAD_W / 2 + 0.9) + side[1] * 1.2;
    if ((l.word === 'house' || l.word === 'gingerbread house') && pl.rng() < 0.7 && pl.free(mx, mz, 0.4)) pl.place('mailbox', 'object', 1.1, mx, mz);
  }
}

function trees(pl: Planner, hut: Lot | null): void {
  forest(pl, hut, 0, WALK_R + 2, 38, 0.05);
  // a fringe of woods on the hills round the valley, out of reach but framing it
  forest(pl, null, WALK_R + 3, 78, 28, -0.25);
}

function forest(pl: Planner, hut: Lot | null, r0: number, r1: number, cap: number, threshold: number): void {
  let count = 0;
  for (let i = 0; i < 1500 && count < cap; i++) {
    const a = pl.rng() * Math.PI * 2;
    const r = Math.sqrt(r0 * r0 + pl.rng() * (r1 * r1 - r0 * r0));
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    const nearHut = hut ? Math.hypot(x - hut.x, z - hut.z) : Infinity;
    const wooded = fbm(x / 22, z / 22, pl.seed + 5) > threshold || (nearHut < 15 && nearHut > 5.5);
    if (!wooded && pl.rng() > 0.08) continue;
    if (Math.hypot(x, z) < PLAZA_R + 4) continue;
    if (pl.roadGap(x, z) < 2.2 || pl.pathGap(x, z) < 1.4 || pl.waterGap(x, z) < 1.8) continue;
    if (pl.lots.some((l) => insideLot(l, x, z, 2.2))) continue;
    if (pl.decor.some((d) => Math.hypot(d.pos[0] - x, d.pos[2] - z) < (r > WALK_R ? 4.5 : 3.4))) continue;
    const roll = pl.rng();
    if (roll < 0.2) pl.place('bush', 'object', round(pl.range(0.9, 1.3)), x, z, pl.rng() < 0.5);
    else if (roll < 0.33 && !nearHut) pl.place('apple tree', 'object', round(pl.range(4, 5)), x, z, pl.rng() < 0.5);
    else pl.place('tree', 'object', round(pl.range(5, 7.5)), x, z, pl.rng() < 0.5);
    count++;
  }
}

/** Lamps along the roads, the plaza furniture, and the people who live here. */
function dressing(pl: Planner, geo: ReturnType<typeof riverAndLake>, garden: Lot | null): void {
  // plaza: a well, benches, lamps, the signpost where the river road leaves
  pl.place('fountain', 'object', 2.2, 0, -3.2);
  for (const a of [0.6, 2.2, 3.8, 5.4]) {
    const x = Math.cos(a) * (PLAZA_R - 0.8);
    const z = Math.sin(a) * (PLAZA_R - 0.8);
    if (pl.roadGap(x, z) > 0.4 && pl.free(x, z, 0.4, 0.4)) pl.place('lamppost', 'object', 3.2, x, z);
  }
  for (const a of [1.4, 4.6]) {
    const x = Math.cos(a) * (PLAZA_R - 2.2);
    const z = Math.sin(a) * (PLAZA_R - 2.2);
    if (pl.roadGap(x, z) > 0.4 && pl.free(x, z, 0.6, 0.4)) pl.place('bench', 'object', 0.9, x, z);
  }
  const a0 = pl.spec.roads[0]?.pts[2];
  if (a0) {
    const x = a0[0] * 0.75 + 1.8;
    const z = a0[1] * 0.75 + 1.8;
    if (pl.free(x, z, 0.5)) pl.place('signpost', 'object', 1.8, x, z);
  }
  // lamps every ~15 m down each road, alternating sides
  for (const rd of pl.spec.roads) {
    let s = 0;
    let next = PLAZA_R + 8;
    let side = 1;
    for (let i = 0; i + 1 < rd.pts.length; i++) {
      const a = rd.pts[i];
      const b = rd.pts[i + 1];
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const dir = norm2([b[0] - a[0], b[1] - a[1]]);
      while (next <= s + len) {
        const k = next - s;
        const x = a[0] + dir[0] * k - dir[1] * side * (ROAD_W / 2 + 0.8);
        const z = a[1] + dir[1] * k + dir[0] * side * (ROAD_W / 2 + 0.8);
        if (pl.free(x, z, 0.5, 0.2) && pl.waterGap(x, z) > BANK + 0.5) pl.place('lamppost', 'object', 3.2, x, z);
        side = -side;
        next += 15;
      }
      s += len;
    }
  }
  // people and animals near the places they belong
  const near = (l: Lot | undefined, word: string, kind: Kind, h: number, dx: number, dz: number) => {
    if (!l) return;
    const [x, z] = toWorld(l, dx, dz);
    if (pl.free(x, z, 0.4, 0.5)) pl.place(word, kind, h, x, z);
  };
  const lot = (word: string) => pl.lots.find((l) => l.word === word);
  near(lot('lighthouse'), 'sailor', 'human', 1.7, 1.6, lot('lighthouse')!?.hd + 1.6);
  near(lot('witch hut'), 'witch', 'humanoid', 1.65, 1.4, (lot('witch hut')?.hd ?? 0) + 1.8);
  near(lot('witch hut'), 'cauldron', 'object', 0.8, -1.6, (lot('witch hut')?.hd ?? 0) + 2.2);
  near(lot('witch hut'), 'pumpkin', 'object', 0.45, -2.6, (lot('witch hut')?.hd ?? 0) + 1.2);
  near(lot('witch hut'), 'owl', 'animal', 0.5, 3.5, -1);
  near(lot('bunker'), 'soldier', 'human', 1.75, 2.5, (lot('bunker')?.hd ?? 0) + 1.8);
  near(lot('bunker'), 'sandbag', 'object', 0.5, -2.5, (lot('bunker')?.hd ?? 0) + 1.3);
  near(lot('bunker'), 'crate', 'object', 0.9, -3.6, (lot('bunker')?.hd ?? 0) + 1.4);
  near(lot('gingerbread house'), 'candy cane', 'object', 0.9, 2.2, (lot('gingerbread house')?.hd ?? 0) + 1.2);
  near(lot('gingerbread house'), 'lollipop', 'object', 0.9, -2.2, (lot('gingerbread house')?.hd ?? 0) + 1.2);
  if (garden) {
    for (let i = 0; i < 6; i++) {
      const [x, z] = toWorld(garden, pl.range(-garden.hw + 1, garden.hw - 1), pl.range(-garden.hd + 1, garden.hd - 1.8));
      pl.decor.push({ id: pl.id('flower'), word: pl.pick(['flower', 'rose', 'sunflower', 'daisy'] as const), kind: 'object', heightM: 0.6, pos: [round(x), 0, round(z)] });
    }
    const [dx, dz] = toWorld(garden, 0.5, 0);
    pl.decor.push({ id: pl.id('dog'), word: 'dog', kind: 'animal', heightM: 0.6, pos: [round(dx), 0, round(dz)] });
  }
  // a boat moored on the lake, a gull on its shore
  const lake = pl.spec.ponds[0];
  if (lake) {
    pl.decor.push({ id: pl.id('boat'), word: 'boat', kind: 'object', heightM: 1.6, pos: [round(lake.x + pl.range(-2, 2)), 0, round(lake.z + pl.range(-2, 2))] });
    const a = pl.rng() * Math.PI * 2;
    const x = lake.x + Math.cos(a) * (Math.max(lake.rx, lake.rz) + 2.5);
    const z = lake.z + Math.sin(a) * (Math.max(lake.rx, lake.rz) + 2.5);
    if (pl.free(x, z, 0.4)) pl.place('seagull', 'animal', 0.4, x, z);
  }
  // villagers on the plaza and along the roads
  for (const [word, kind, h] of [
    ['girl', 'human', 1.4],
    ['man', 'human', 1.75],
    ['farmer', 'human', 1.7],
    ['cat', 'animal', 0.3],
  ] as const) {
    for (let k = 0; k < 30; k++) {
      const a = pl.rng() * Math.PI * 2;
      const r = pl.range(3, 16);
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      if (pl.free(x, z, 0.6, -0.2)) {
        pl.place(word, kind, h, x, z, pl.rng() < 0.5);
        break;
      }
    }
  }
  // grazing animals in open country
  for (const [word, h] of [
    ['cow', 1.4],
    ['sheep', 0.8],
    ['scarecrow', 1.9],
  ] as const) {
    for (let k = 0; k < 60; k++) {
      const a = pl.rng() * Math.PI * 2;
      const r = pl.range(18, 50);
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      if (pl.roadGap(x, z) > 4 && pl.free(x, z, 1.2)) {
        pl.place(word, word === 'scarecrow' ? 'object' : 'animal', h, x, z, pl.rng() < 0.5);
        break;
      }
    }
  }
  void geo;
}

export function generateVillage(seed: number, resolve: SpriteResolver, decals: DecalResolver, now = Date.now()): Village {
  const pl = new Planner(seed, decals);
  const geo = riverAndLake(pl);
  roads(pl, geo);
  bridges(pl);
  houses(pl, 5 + Math.floor(pl.rng() * 3));
  const yard = garden(pl);
  lighthouse(pl, geo);
  bunker(pl);
  const hut = witchHut(pl);
  doorPaths(pl);
  smallPond(pl);
  dressing(pl, geo, yard);
  trees(pl, hut);

  const field = new TerrainField(pl.spec);
  const entities: Entity[] = [];
  for (const l of pl.lots) {
    const pos: Vec3 = [round(l.x), 0, round(l.z)];
    const seated = seatOnTerrain(l.s, pos, Math.round(l.yaw), (x, z) => field.height(x, z));
    pos[1] = round(seated.base);
    entities.push(structureEntity(l.id, l.word, seated.structure, pos, Math.round(l.yaw), now));
  }
  for (const b of pl.bridges) {
    const s = pl.nextStructure('bridge', { len: Math.min(26, b.len), w: ROAD_W + 0.4 });
    const dir: P2 = [Math.sin(b.yaw * DEG), Math.cos(b.yaw * DEG)];
    const half = s.bounds.d / 2;
    const deck = Math.max(field.height(b.x + dir[0] * half, b.z + dir[1] * half), field.height(b.x - dir[0] * half, b.z - dir[1] * half));
    const id = pl.id('bridge');
    entities.push(structureEntity(id, 'bridge', s, [round(b.x), round(deck), round(b.z)], Math.round(b.yaw), now));
  }
  for (const d of pl.decor) {
    // boats and ducks float; everything else stands on the ground
    const floats = (d.word === 'boat' || d.word === 'duck') && field.isWater(d.pos[0], d.pos[2], 0);
    const y = floats ? pl.spec.waterLevel - (d.word === 'boat' ? 0.25 : 0.08) : field.height(d.pos[0], d.pos[2]);
    entities.push(makeEntity({ ...d, pos: [d.pos[0], round(y), d.pos[2]] }, resolve, now));
  }
  const start: Vec3 = [0, round(field.height(0, 3.5)), 3.5];
  return { entities, terrain: pl.spec, player: { pos: start, yaw: 0, pitch: 0 } };
}

export type { PathSpec };
