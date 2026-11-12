/**
 * Sculpted models: a figure's parts melted into one continuous surface, the way a modeller would sculpt it,
 * instead of solids stitched together.
 *
 * 1. Every part becomes a signed distance function (ellipsoid, capsule, rounded box, capped cone, torus, prism).
 * 2. The field is their union, with smooth fillets only where a part meets its parent, and only near the joint
 *    between them: a neck flows into the head, a shoulder into the arm, but a hanging arm does not web onto the
 *    body beside it.
 * 3. Surface nets turn the field into one mesh, and each vertex is pulled onto the surface with its normal taken
 *    from the field's gradient, so shading is smooth.
 * 4. Skin weights come from distance: a vertex follows the part it lies on, and near a joint it shares between
 *    the two parts, so the mesh bends at elbows and knees as one skin.
 *
 * Parts too thin for the grid (wing membranes, sword blades, fence rails), eyes, glowing bits and hidden ones (a
 * flame) are not melted in: the renderer draws them as their own pieces on their bones.
 *
 * No Three.js here: the result is plain typed arrays, built in milliseconds, unit tested in node.
 */
import type { FigPart, Figure, Vec3 } from './types';
import { apply, euler, mul, solve, transpose, type M3 } from './math';

export interface Sculpt {
  /** Vertex positions in figure space (rest pose). */
  positions: Float32Array;
  normals: Float32Array;
  /** Linear RGB 0..1 per vertex. */
  colors: Float32Array;
  /** Four bone indices and weights per vertex (indices into `bones`). */
  skinIndex: Uint16Array;
  skinWeight: Float32Array;
  indices: Uint32Array;
  /** Part names, one bone per part, in figure order. */
  bones: string[];
  /** Parts drawn as their own pieces instead of melted into the skin. */
  separate: string[];
  /** Grid cell size in metres. */
  cell: number;
}

interface Shape {
  part: FigPart;
  index: number;
  /** figure space -> solid local: q = Rt * (p - o) */
  Rt: M3;
  o: Vec3;
  /** Figure-space bounds of the solid, padded. */
  lo: Vec3;
  hi: Vec3;
  rgb: Vec3;
  sdf: Sdf;
  /** Thickening for preview sheets (subtracted from the distance). */
  grow: number;
}

type Sdf = (x: number, y: number, z: number) => number;

const len3 = (x: number, y: number, z: number) => Math.sqrt(x * x + y * y + z * z);
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

/** Polynomial smooth minimum (k = blend width; 0 = plain min). */
export function smin(a: number, b: number, k: number): number {
  if (k <= 1e-9) return Math.min(a, b);
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.min(a, b) - h * h * k * 0.25;
}

function hexToLinear(hex: string): Vec3 {
  const n = parseInt(hex.slice(1), 16);
  const s = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => v / 255);
  return s.map((c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4))) as Vec3;
}

/** The distance function of a part's solid in its own frame. */
function partSdf(p: FigPart): Sdf {
  const [w, h, d] = p.size;
  switch (p.shape) {
    case 'ball': {
      const rx = w / 2, ry = h / 2, rz = d / 2;
      return (x, y, z) => {
        const k0 = len3(x / rx, y / ry, z / rz);
        const k1 = len3(x / (rx * rx), y / (ry * ry), z / (rz * rz));
        return k1 < 1e-9 ? -Math.min(rx, ry, rz) : (k0 * (k0 - 1)) / k1;
      };
    }
    case 'capsule': {
      if (h <= w) return partSdf({ ...p, shape: 'ball' });
      const r = w / 2, half = h / 2 - r, sz = w / d;
      const fix = Math.min(1, d / w);
      return (x, y, z) => (len3(x, y - clamp(y, -half, half), z * sz) - r) * fix;
    }
    case 'box': {
      const rr = Math.min(w, h, d) * 0.5 * Math.min(0.98, p.round ?? 0);
      const bx = w / 2 - rr, by = h / 2 - rr, bz = d / 2 - rr;
      return (px, py, pz) => {
        const x = Math.abs(px) - bx, y = Math.abs(py) - by, z = Math.abs(pz) - bz;
        return len3(Math.max(x, 0), Math.max(y, 0), Math.max(z, 0)) + Math.min(Math.max(x, y, z), 0) - rr;
      };
    }
    case 'cyl': {
      // capped cone with an elliptical section: bottom radius r1, top r2, half height hh
      const r1 = w / 2, r2 = (w / 2) * (p.taper ?? 1), hh = h / 2, sz = w / d;
      const fix = Math.min(1, d / w);
      const k2x = r2 - r1, k2y = 2 * hh;
      const k2d = k2x * k2x + k2y * k2y;
      return (x, y, z) => {
        const qx = Math.hypot(x, z * sz), qy = y;
        const cax = qx - Math.min(qx, qy < 0 ? r1 : r2), cay = Math.abs(qy) - hh;
        const t = clamp(((r2 - qx) * k2x + (hh - qy) * k2y) / k2d, 0, 1);
        const cbx = qx - r2 + k2x * t, cby = qy - hh + k2y * t;
        const s = cbx < 0 && cay < 0 ? -1 : 1;
        return s * Math.sqrt(Math.min(cax * cax + cay * cay, cbx * cbx + cby * cby)) * fix;
      };
    }
    case 'torus': {
      const r = (p.tube ?? 0.25) * (w / 2), R = w / 2 - r, sy = w / h, sz = (2 * r) / d;
      return (x, y, z) => Math.hypot(Math.hypot(x, y * sy) - R, z * sz) - r;
    }
    case 'wedge': {
      // a triangle in x-y (base at y = -h/2, apex at y = +h/2 over `apex`), extruded along z
      const ax = (p.apex ?? 0) * w;
      const P: Array<[number, number]> = [[-w / 2, -h / 2], [w / 2, -h / 2], [ax, h / 2]];
      return (x, y, z) => {
        const wx = triangleSdf(x, y, P), wy = Math.abs(z) - d / 2;
        return Math.min(Math.max(wx, wy), 0) + Math.hypot(Math.max(wx, 0), Math.max(wy, 0));
      };
    }
  }
}

export function triangleSdf(px: number, py: number, P: Array<[number, number]>): number {
  let best = Infinity;
  let sign = 1;
  const [p0, p1, p2] = P;
  const s = Math.sign((p1[0] - p0[0]) * (p0[1] - p2[1]) - (p1[1] - p0[1]) * (p0[0] - p2[0])) || 1;
  let inside = 1;
  for (let i = 0; i < 3; i++) {
    const a = P[i], b = P[(i + 1) % 3];
    const ex = b[0] - a[0], ey = b[1] - a[1];
    const vx = px - a[0], vy = py - a[1];
    const t = clamp((vx * ex + vy * ey) / (ex * ex + ey * ey), 0, 1);
    const dx = vx - ex * t, dy = vy - ey * t;
    best = Math.min(best, dx * dx + dy * dy);
    if (s * (vx * ey - vy * ex) < 0) inside = 0;
  }
  sign = inside ? -1 : 1;
  return sign * Math.sqrt(best);
}

/**
 * The pose a figure is sculpted and skinned in, as joint deltas from its rest pose. Like a modeller's A-pose:
 * arms (and a bird's wings) held away from the body so the sculpt does not fuse them to it; the bones then bring
 * them back down, and every animation bends the skin from there.
 */
export function bindPose(fig: Figure): Record<string, Vec3> {
  if (fig.rig === 'biped') return { armL: [0, 0, 38], armR: [0, 0, -38], legL: [0, 0, 4], legR: [0, 0, -4] };
  if (fig.rig === 'bird') return { wingL: [0, 0, 40], wingR: [0, 0, -40] };
  return {};
}

export interface SculptOptions {
  /** Cells along the figure's longest side (default by kind of figure). */
  resolution?: number;
  /** Multiplier on the default resolution (phones use less). */
  detail?: number;
  /** Melt every visible part into the skin, thickening thin ones to show at grid size (for preview sheets). */
  preview?: boolean;
}

/** Which parts melt into the skin. */
function melts(p: FigPart, cell: number): boolean {
  if (p.scale === 0 || p.role === 'eye' || p.role === 'glow' || p.role === 'face' || p.role === 'label' || p.only === 'paper') return false;
  return Math.min(...p.size) >= cell * 2.2;
}

export function sculpt(fig: Figure, opts: SculptOptions = {}): Sculpt {
  const rest = solve(fig, { j: bindPose(fig) });
  // grid over the figure's bounds
  const all: Shape[] = [];
  let lo: Vec3 = [Infinity, Infinity, Infinity];
  let hi: Vec3 = [-Infinity, -Infinity, -Infinity];
  fig.parts.forEach((p, index) => {
    if (p.only === 'paper' || p.role === 'face' || p.scale === 0) return;
    const f = rest.get(p.name)!;
    const R = mul(f.R, euler(p.srot));
    const o: Vec3 = (() => {
      const off = apply(f.R, p.off ?? [0, 0, 0]);
      return [f.T[0] + off[0], f.T[1] + off[1], f.T[2] + off[2]];
    })();
    // bounds from the solid's box corners
    const e = p.size.map((v) => v / 2) as Vec3;
    const bl: Vec3 = [Infinity, Infinity, Infinity];
    const bh: Vec3 = [-Infinity, -Infinity, -Infinity];
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) {
      const c = apply(R, [sx * e[0], sy * e[1], sz * e[2]]);
      for (let i = 0; i < 3; i++) {
        bl[i] = Math.min(bl[i], o[i] + c[i]);
        bh[i] = Math.max(bh[i], o[i] + c[i]);
      }
    }
    for (let i = 0; i < 3; i++) {
      lo[i] = Math.min(lo[i], bl[i]);
      hi[i] = Math.max(hi[i], bh[i]);
    }
    all.push({ part: p, index, Rt: transpose(R), o, lo: bl, hi: bh, rgb: hexToLinear(p.color), sdf: partSdf(p), grow: 0 });
  });
  const span = Math.max(hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2]);
  const cell = span / (opts.resolution ?? (fig.rig === 'prop' ? 64 : fig.rig === 'dragon' ? 120 : 84) * (opts.detail ?? 1));
  const melted = opts.preview ? all : all.filter((s) => melts(s.part, cell));
  if (opts.preview) for (const s of melted) s.grow = Math.max(0, (cell * 1.6 - Math.min(...s.part.size)) / 2);
  const separate = fig.parts.filter((p) => !melted.some((s) => s.part === p)).map((p) => p.name);
  const pad = 3;
  const org: Vec3 = [lo[0] - pad * cell, lo[1] - pad * cell, lo[2] - pad * cell];
  const nx = Math.ceil((hi[0] - lo[0]) / cell) + pad * 2 + 1;
  const ny = Math.ceil((hi[1] - lo[1]) / cell) + pad * 2 + 1;
  const nz = Math.ceil((hi[2] - lo[2]) / cell) + pad * 2 + 1;
  const field = new Float32Array(nx * ny * nz).fill(1e3);
  const at = (i: number, j: number, k: number) => i + nx * (j + ny * k);

  const local = (s: Shape, x: number, y: number, z: number): number => {
    const dx = x - s.o[0], dy = y - s.o[1], dz = z - s.o[2];
    const R = s.Rt;
    return s.sdf(R[0] * dx + R[1] * dy + R[2] * dz, R[3] * dx + R[4] * dy + R[5] * dz, R[6] * dx + R[7] * dy + R[8] * dz) - s.grow;
  };
  const box = (l: Vec3, h: Vec3, margin: number) => {
    const i0 = Math.max(0, Math.floor((l[0] - margin - org[0]) / cell)), i1 = Math.min(nx - 1, Math.ceil((h[0] + margin - org[0]) / cell));
    const j0 = Math.max(0, Math.floor((l[1] - margin - org[1]) / cell)), j1 = Math.min(ny - 1, Math.ceil((h[1] + margin - org[1]) / cell));
    const k0 = Math.max(0, Math.floor((l[2] - margin - org[2]) / cell)), k1 = Math.min(nz - 1, Math.ceil((h[2] + margin - org[2]) / cell));
    return { i0, i1, j0, j1, k0, k1 };
  };

  // 1. plain union of every melted solid, each evaluated only around itself
  for (const s of melted) {
    const b = box(s.lo, s.hi, cell * 3);
    for (let k = b.k0; k <= b.k1; k++)
      for (let j = b.j0; j <= b.j1; j++)
        for (let i = b.i0; i <= b.i1; i++) {
          const d = local(s, org[0] + i * cell, org[1] + j * cell, org[2] + k * cell);
          const n = at(i, j, k);
          if (d < field[n]) field[n] = d;
        }
  }
  // 2. fillets where a part meets its parent, fading out away from the joint between them
  const byName = new Map(melted.map((s) => [s.part.name, s]));
  const blends: Array<{ a: Shape; b: Shape; J: Vec3; k: number; R: number; Rw: number }> = [];
  const H = fig.heightM;
  const organic = fig.rig !== 'prop';
  for (const c of melted) {
    const pa = c.part.parent ? byName.get(c.part.parent) : undefined;
    if (!pa) continue;
    const thin = Math.min(Math.min(...c.part.size), Math.min(...pa.part.size));
    const k = clamp(thin * (organic ? 0.45 : 0.2), cell * 1.2, H * (organic ? 0.07 : 0.03));
    const J = rest.get(c.part.name)!.T;
    // the fillet reaches a little past the joint; skin is shared over a smaller ball (about half the limb's
    // thickness from the joint), or a raised arm would drag the side of the body up with it
    blends.push({ a: pa, b: c, J, k, R: Math.max(k * 2.2, thin * 0.8), Rw: Math.max(cell * 1.5, Math.min(c.part.size[0], c.part.size[2]) * 1.05) });
  }
  for (const bl of blends) {
    const b = box([bl.J[0] - bl.R, bl.J[1] - bl.R, bl.J[2] - bl.R], [bl.J[0] + bl.R, bl.J[1] + bl.R, bl.J[2] + bl.R], cell);
    for (let k = b.k0; k <= b.k1; k++)
      for (let j = b.j0; j <= b.j1; j++)
        for (let i = b.i0; i <= b.i1; i++) {
          const x = org[0] + i * cell, y = org[1] + j * cell, z = org[2] + k * cell;
          const r = len3(x - bl.J[0], y - bl.J[1], z - bl.J[2]);
          if (r >= bl.R) continue;
          const fade = 1 - r / bl.R;
          const d = smin(local(bl.a, x, y, z), local(bl.b, x, y, z), bl.k * fade * fade * (3 - 2 * fade));
          const n = at(i, j, k);
          if (d < field[n]) field[n] = d;
        }
  }

  // the field between grid points, by trilinear interpolation (cheap, and smooth enough to shade by)
  const sample = (x: number, y: number, z: number): number => {
    const fx = clamp((x - org[0]) / cell, 0, nx - 1.001), fy = clamp((y - org[1]) / cell, 0, ny - 1.001), fz = clamp((z - org[2]) / cell, 0, nz - 1.001);
    const i = Math.floor(fx), j = Math.floor(fy), k = Math.floor(fz);
    const tx = fx - i, ty = fy - j, tz = fz - k;
    const b = i + nx * (j + ny * k), sy = nx, sz = nx * ny;
    const c000 = field[b], c100 = field[b + 1], c010 = field[b + sy], c110 = field[b + sy + 1];
    const c001 = field[b + sz], c101 = field[b + sz + 1], c011 = field[b + sz + sy], c111 = field[b + sz + sy + 1];
    const x00 = c000 + (c100 - c000) * tx, x10 = c010 + (c110 - c010) * tx;
    const x01 = c001 + (c101 - c001) * tx, x11 = c011 + (c111 - c011) * tx;
    const y0 = x00 + (x10 - x00) * ty, y1 = x01 + (x11 - x01) * ty;
    return y0 + (y1 - y0) * tz;
  };

  // 3. surface nets: a vertex in every cell the surface crosses, a quad across every crossed grid edge
  const cellVert = new Int32Array((nx - 1) * (ny - 1) * (nz - 1)).fill(-1);
  const cv = (i: number, j: number, k: number) => i + (nx - 1) * (j + (ny - 1) * k);
  const pos: number[] = [];
  const CORNERS: Vec3[] = [[0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 0], [0, 0, 1], [1, 0, 1], [0, 1, 1], [1, 1, 1]];
  const EDGES: Array<[number, number]> = [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]];
  const vals = new Float32Array(8);
  for (let k = 0; k < nz - 1; k++)
    for (let j = 0; j < ny - 1; j++)
      for (let i = 0; i < nx - 1; i++) {
        let mask = 0;
        for (let c = 0; c < 8; c++) {
          const v = field[at(i + CORNERS[c][0], j + CORNERS[c][1], k + CORNERS[c][2])];
          vals[c] = v;
          if (v < 0) mask |= 1 << c;
        }
        if (mask === 0 || mask === 255) continue;
        let sx = 0, sy = 0, sz = 0, cnt = 0;
        for (const [a, b] of EDGES) {
          if ((vals[a] < 0) === (vals[b] < 0)) continue;
          const t = vals[a] / (vals[a] - vals[b]);
          sx += CORNERS[a][0] + (CORNERS[b][0] - CORNERS[a][0]) * t;
          sy += CORNERS[a][1] + (CORNERS[b][1] - CORNERS[a][1]) * t;
          sz += CORNERS[a][2] + (CORNERS[b][2] - CORNERS[a][2]) * t;
          cnt++;
        }
        cellVert[cv(i, j, k)] = pos.length / 3;
        pos.push(org[0] + (i + sx / cnt) * cell, org[1] + (j + sy / cnt) * cell, org[2] + (k + sz / cnt) * cell);
      }
  const tris: number[] = [];
  const quad = (a: number, b: number, c: number, d: number, flip: boolean) => {
    if (a < 0 || b < 0 || c < 0 || d < 0) return;
    if (flip) tris.push(a, c, b, a, d, c);
    else tris.push(a, b, c, a, c, d);
  };
  for (let k = 1; k < nz - 1; k++)
    for (let j = 1; j < ny - 1; j++)
      for (let i = 1; i < nx - 1; i++) {
        const v0 = field[at(i, j, k)];
        const inside = v0 < 0;
        // edge along +x from (i,j,k): cells around it differ in j and k
        if (i < nx - 1 && inside !== field[at(i + 1, j, k)] < 0)
          quad(cellVert[cv(i, j - 1, k - 1)], cellVert[cv(i, j, k - 1)], cellVert[cv(i, j, k)], cellVert[cv(i, j - 1, k)], !inside);
        if (j < ny - 1 && inside !== field[at(i, j + 1, k)] < 0)
          quad(cellVert[cv(i - 1, j, k - 1)], cellVert[cv(i - 1, j, k)], cellVert[cv(i, j, k)], cellVert[cv(i, j, k - 1)], !inside);
        if (k < nz - 1 && inside !== field[at(i, j, k + 1)] < 0)
          quad(cellVert[cv(i - 1, j - 1, k)], cellVert[cv(i, j - 1, k)], cellVert[cv(i, j, k)], cellVert[cv(i - 1, j, k)], !inside);
      }

  // 4. pull each vertex onto the surface, take its normal from the field, and colour and weight it by part
  const nv = pos.length / 3;
  const positions = new Float32Array(pos);
  const normals = new Float32Array(nv * 3);
  const colors = new Float32Array(nv * 3);
  const skinIndex = new Uint16Array(nv * 4);
  const skinWeight = new Float32Array(nv * 4);
  const bones = fig.parts.map((p) => p.name);
  const boneOf = new Map(bones.map((n, i) => [n, i]));
  const e = cell * 0.75;
  const grad = (x: number, y: number, z: number): Vec3 => {
    const gx = sample(x + e, y, z) - sample(x - e, y, z);
    const gy = sample(x, y + e, z) - sample(x, y - e, z);
    const gz = sample(x, y, z + e) - sample(x, y, z - e);
    const l = len3(gx, gy, gz) || 1;
    return [gx / l, gy / l, gz / l];
  };
  for (let v = 0; v < nv; v++) {
    let x = positions[v * 3], y = positions[v * 3 + 1], z = positions[v * 3 + 2];
    const g0 = grad(x, y, z);
    const step = clamp(sample(x, y, z), -cell * 0.5, cell * 0.5);
    x -= g0[0] * step, y -= g0[1] * step, z -= g0[2] * step;
    positions[v * 3] = x, positions[v * 3 + 1] = y, positions[v * 3 + 2] = z;
    normals.set(grad(x, y, z), v * 3);
    // the part the vertex lies on gives its colour; a parent or child sharing the joint nearby shares the weight
    let own = melted[0];
    let ownD = Infinity;
    const m = cell * 4;
    const ds: Array<[Shape, number]> = [];
    for (const s2 of melted) {
      if (x < s2.lo[0] - m || x > s2.hi[0] + m || y < s2.lo[1] - m || y > s2.hi[1] + m || z < s2.lo[2] - m || z > s2.hi[2] + m) continue;
      const d = local(s2, x, y, z);
      ds.push([s2, d]);
      if (d < ownD) {
        ownD = d;
        own = s2;
      }
    }
    // colour: the nearest part's, softened across about half a cell where two parts meet, so seams do not zig-zag
    let cr = 0, cg = 0, cb = 0, cw = 0;
    for (const [s2, d] of ds) {
      const w = Math.exp(-(d - ownD) / (cell * 0.3));
      if (w < 0.02) continue;
      cr += s2.rgb[0] * w, cg += s2.rgb[1] * w, cb += s2.rgb[2] * w, cw += w;
    }
    colors.set(cw > 0 ? [cr / cw, cg / cw, cb / cw] : own.rgb, v * 3);
    const ws: Array<[number, number]> = [[boneOf.get(own.part.name)!, 1]];
    for (const bl of blends) {
      if (bl.a !== own && bl.b !== own) continue;
      const other = bl.a === own ? bl.b : bl.a;
      const r = len3(x - bl.J[0], y - bl.J[1], z - bl.J[2]);
      if (r >= bl.Rw) continue;
      const dOther = local(other, x, y, z) - ownD;
      const fall = 1 - r / bl.Rw;
      const w = fall * fall * Math.exp(-Math.max(0, dOther) / Math.max(bl.k * 0.5, cell));
      ws.push([boneOf.get(other.part.name)!, w]);
    }
    ws.sort((a, b) => b[1] - a[1]);
    const top = ws.slice(0, 4);
    const sum = top.reduce((s, [, w]) => s + w, 0);
    top.forEach(([bi, w], slot) => {
      skinIndex[v * 4 + slot] = bi;
      skinWeight[v * 4 + slot] = w / sum;
    });
  }
  return { positions, normals, colors, skinIndex, skinWeight, indices: new Uint32Array(tris), bones, separate, cell };
}
