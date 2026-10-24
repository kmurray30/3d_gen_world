/**
 * Terrain: a saved recipe (hills from seeded noise, a rim of hills round the edge, flattened pads and roads,
 * rivers and ponds carved below a single water level) baked into a height grid. The grid is what everyone uses:
 * the engine for placing and landing things, the player for walking, the client for the mesh. Heights between
 * grid points are interpolated over the same two triangles per cell the mesh draws, so feet touch the drawn
 * ground exactly.
 */
import { fbm, smoothstep } from './noise';

export interface PadSpec {
  x: number;
  z: number;
  /** Height the ground is flattened to. */
  h: number;
  /** Circle radius, or rectangle half-sizes with rotation (degrees, same convention as entity yaw). */
  r?: number;
  hw?: number;
  hd?: number;
  rot?: number;
  /** Width of the slope that blends back into the hills. */
  blend: number;
}

export interface RoadSpec {
  /** Centre line with its height at each point: [x, z, h]. */
  pts: Array<[number, number, number]>;
  width: number;
}

export interface RiverSpec {
  pts: Array<[number, number]>;
  width: number;
  depth: number;
}

export interface PondSpec {
  x: number;
  z: number;
  rx: number;
  rz: number;
  /** Degrees. */
  rot: number;
  depth: number;
}

export interface PathSpec {
  pts: Array<[number, number]>;
  width: number;
}

export interface TerrainSpec {
  seed: number;
  /** Half the side of the height grid in metres, and its spacing. */
  size: number;
  step: number;
  waterLevel: number;
  hillAmp: number;
  /** Metres between hill tops, roughly. */
  hillScale: number;
  /** Height of the ring of hills beyond the walkable area. */
  rim: number;
  rimFrom: number;
  pads: PadSpec[];
  roads: RoadSpec[];
  rivers: RiverSpec[];
  ponds: PondSpec[];
  /** Footpaths: painted on the ground, no height change. */
  paths: PathSpec[];
}

const BANK = 2.6;
const BANK_RISE = 0.5;
const VALLEY_SLOPE = 0.42;
const ROAD_SHOULDER = 2.6;

/** Distance from (x, z) to segment a-b and the parameter t along it. */
function segDist(x: number, z: number, ax: number, az: number, bx: number, bz: number): { d: number; t: number } {
  const dx = bx - ax;
  const dz = bz - az;
  const len2 = dx * dx + dz * dz;
  const t = len2 > 0 ? Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / len2)) : 0;
  const px = ax + dx * t;
  const pz = az + dz * t;
  return { d: Math.hypot(x - px, z - pz), t };
}

export function polylineDist(x: number, z: number, pts: ReadonlyArray<readonly number[]>): { d: number; seg: number; t: number } {
  let best = { d: Infinity, seg: 0, t: 0 };
  for (let i = 0; i + 1 < pts.length; i++) {
    const r = segDist(x, z, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1]);
    if (r.d < best.d) best = { d: r.d, seg: i, t: r.t };
  }
  return best;
}

/** Height of a water channel's cross-section at distance d from its edge-to-edge centre (half width hw). */
function channel(d: number, hw: number, depth: number, water: number): number {
  if (d < hw) {
    const k = d / hw;
    return water - depth * (1 - k * k);
  }
  const out = d - hw;
  if (out < BANK) return water + BANK_RISE * smoothstep(0, BANK, out);
  return water + BANK_RISE + (out - BANK) * VALLEY_SLOPE;
}

/** The highest the ground may be at (x, z) before a river or pond carves it down (Infinity when no water is near). */
export function waterCeiling(spec: TerrainSpec, x: number, z: number): number {
  let h = Infinity;
  for (const river of spec.rivers) h = Math.min(h, channel(polylineDist(x, z, river.pts).d, river.width / 2, river.depth, spec.waterLevel));
  for (const pond of spec.ponds) {
    const a = (pond.rot * Math.PI) / 180;
    const c = Math.cos(a);
    const s = Math.sin(a);
    const dx = x - pond.x;
    const dz = z - pond.z;
    const m = Math.min(pond.rx, pond.rz);
    h = Math.min(h, channel(Math.hypot((dx * c - dz * s) / pond.rx, (dx * s + dz * c) / pond.rz) * m, m, pond.depth, spec.waterLevel));
  }
  return h;
}

/** The hills alone: noise plus the rim. Used by the generator before any pad or road exists. */
export function hillHeight(spec: Pick<TerrainSpec, 'seed' | 'hillAmp' | 'hillScale' | 'rim' | 'rimFrom' | 'size'>, x: number, z: number): number {
  const r = Math.hypot(x, z);
  // beyond the rim everything settles to one plateau height so a far plane can carry it to the horizon
  const settle = smoothstep(spec.size - 22, spec.size - 8, r);
  const n = fbm(x / spec.hillScale, z / spec.hillScale, spec.seed, 4);
  let h = spec.hillAmp * Math.max(0, 0.5 + 0.75 * n) * (1 - settle);
  if (r > spec.rimFrom) {
    const k = smoothstep(spec.rimFrom, spec.rimFrom + 30, r);
    const lumps = 0.65 + 0.35 * fbm(x / 14, z / 14, spec.seed + 77, 3);
    h += spec.rim * k * (lumps + (1 - lumps) * settle);
  }
  return h;
}

/** Hills, then roads and pads flattening them (pads win), then water carving. Analytic; the field samples it once per vertex. */
export function rawHeight(spec: TerrainSpec, x: number, z: number): number {
  let h = hillHeight(spec, x, z);
  for (const road of spec.roads) {
    const hw = road.width / 2;
    const near = polylineDist(x, z, road.pts);
    if (near.d >= hw + ROAD_SHOULDER) continue;
    const a = road.pts[near.seg];
    const b = road.pts[near.seg + 1];
    const roadH = a[2] + (b[2] - a[2]) * near.t;
    const w = 1 - smoothstep(hw, hw + ROAD_SHOULDER, near.d);
    h += (roadH - h) * w;
  }
  // pads: where several overlap (neighbouring houses), the one whose footprint you are in wins
  let wMax = 0;
  let wSum = 0;
  let hSum = 0;
  for (const p of spec.pads) {
    const dx = x - p.x;
    const dz = z - p.z;
    let out: number;
    if (p.r !== undefined) out = Math.max(0, Math.hypot(dx, dz) - p.r);
    else {
      const a = ((p.rot ?? 0) * Math.PI) / 180;
      // rotate into the pad's frame: rotateY(v, -a)
      const c = Math.cos(a);
      const s = Math.sin(a);
      const lx = dx * c - dz * s;
      const lz = dx * s + dz * c;
      out = Math.hypot(Math.max(0, Math.abs(lx) - (p.hw ?? 1)), Math.max(0, Math.abs(lz) - (p.hd ?? 1)));
    }
    if (out >= p.blend) continue;
    const w = 1 - smoothstep(0, p.blend, out);
    const k = w ** 6;
    wMax = Math.max(wMax, w);
    wSum += k;
    hSum += k * p.h;
  }
  if (wSum > 0) h += (hSum / wSum - h) * wMax;
  // rivers run out into the hills before the edge of the world, so the plateau beyond stays whole
  const fadeOut = smoothstep(spec.size - 44, spec.size - 24, Math.hypot(x, z)) * (spec.rim + 4);
  for (const river of spec.rivers) {
    const near = polylineDist(x, z, river.pts);
    h = Math.min(h, channel(near.d, river.width / 2, river.depth, spec.waterLevel) + fadeOut);
  }
  for (const pond of spec.ponds) {
    const a = (pond.rot * Math.PI) / 180;
    const c = Math.cos(a);
    const s = Math.sin(a);
    const dx = x - pond.x;
    const dz = z - pond.z;
    const lx = dx * c - dz * s;
    const lz = dx * s + dz * c;
    const e = Math.hypot(lx / pond.rx, lz / pond.rz);
    const m = Math.min(pond.rx, pond.rz);
    h = Math.min(h, channel(e * m, m, pond.depth, spec.waterLevel));
  }
  return h;
}

export class TerrainField {
  readonly n: number;
  readonly size: number;
  readonly step: number;
  readonly waterLevel: number;
  readonly heights: Float32Array;
  /** Height outside the grid: the average of its edge, so a far plane can continue it. */
  readonly edge: number;

  constructor(readonly spec: TerrainSpec) {
    this.size = spec.size;
    this.step = spec.step;
    this.waterLevel = spec.waterLevel;
    this.n = Math.round((2 * spec.size) / spec.step) + 1;
    this.heights = new Float32Array(this.n * this.n);
    let edgeSum = 0;
    let edgeCount = 0;
    for (let j = 0; j < this.n; j++) {
      const z = -spec.size + j * spec.step;
      for (let i = 0; i < this.n; i++) {
        const x = -spec.size + i * spec.step;
        const h = rawHeight(spec, x, z);
        this.heights[j * this.n + i] = h;
        if (i === 0 || j === 0 || i === this.n - 1 || j === this.n - 1) {
          edgeSum += h;
          edgeCount++;
        }
      }
    }
    this.edge = edgeSum / Math.max(1, edgeCount);
  }

  private at(i: number, j: number): number {
    return this.heights[j * this.n + i];
  }

  /** Ground height at (x, z), interpolated over the mesh's triangles: (i,j)-(i+1,j)-(i,j+1) and (i+1,j)-(i+1,j+1)-(i,j+1). */
  height(x: number, z: number): number {
    const gx = (x + this.size) / this.step;
    const gz = (z + this.size) / this.step;
    if (gx < 0 || gz < 0 || gx > this.n - 1 || gz > this.n - 1) return this.edge;
    const i = Math.min(this.n - 2, Math.floor(gx));
    const j = Math.min(this.n - 2, Math.floor(gz));
    const fx = gx - i;
    const fz = gz - j;
    const h00 = this.at(i, j);
    const h10 = this.at(i + 1, j);
    const h01 = this.at(i, j + 1);
    const h11 = this.at(i + 1, j + 1);
    if (fx + fz <= 1) return h00 + (h10 - h00) * fx + (h01 - h00) * fz;
    return h11 + (h01 - h11) * (1 - fx) + (h10 - h11) * (1 - fz);
  }

  /** Unit surface normal at (x, z). */
  normal(x: number, z: number): [number, number, number] {
    const e = this.step * 0.5;
    const dx = this.height(x + e, z) - this.height(x - e, z);
    const dz = this.height(x, z + e) - this.height(x, z - e);
    const nx = -dx;
    const ny = 2 * e;
    const nz = -dz;
    const l = Math.hypot(nx, ny, nz);
    return [nx / l, ny / l, nz / l];
  }

  /** Whether (x, z) is under water (with a small margin so things do not stand on the waterline). */
  isWater(x: number, z: number, margin = 0.08): boolean {
    return this.height(x, z) < this.waterLevel + margin;
  }

  /** Any of the centre and 8 points round a circle of radius r is wet. */
  wetWithin(x: number, z: number, r: number): boolean {
    if (this.isWater(x, z)) return true;
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2;
      if (this.isWater(x + Math.cos(a) * r, z + Math.sin(a) * r)) return true;
    }
    return false;
  }
}

/** Fields are a few tens of milliseconds to build; worlds that share a recipe share the field. */
const cache = new Map<string, TerrainField>();

export function terrainField(spec: TerrainSpec | undefined | null): TerrainField | null {
  if (!spec) return null;
  const key = JSON.stringify(spec);
  let f = cache.get(key);
  if (!f) {
    f = new TerrainField(spec);
    cache.set(key, f);
    if (cache.size > 4) cache.delete(cache.keys().next().value!);
  }
  return f;
}
