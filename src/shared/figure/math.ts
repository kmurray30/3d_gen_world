/**
 * Small 3x3 rotation math and forward kinematics for figures, with no Three.js so the engine, the server and tests
 * can use it. Matrices are row-major number[9]. Euler order XYZ (R = Rx * Ry * Rz), matching Three.js.
 */
import type { FigPart, Figure, Vec3 } from './types';

export type M3 = number[];
const DEG = Math.PI / 180;

export const I3: M3 = [1, 0, 0, 0, 1, 0, 0, 0, 1];

export function mul(a: M3, b: M3): M3 {
  const r = new Array<number>(9);
  for (let i = 0; i < 3; i++)
    for (let j = 0; j < 3; j++) r[i * 3 + j] = a[i * 3] * b[j] + a[i * 3 + 1] * b[3 + j] + a[i * 3 + 2] * b[6 + j];
  return r;
}

export function apply(m: M3, v: Vec3): Vec3 {
  return [m[0] * v[0] + m[1] * v[1] + m[2] * v[2], m[3] * v[0] + m[4] * v[1] + m[5] * v[2], m[6] * v[0] + m[7] * v[1] + m[8] * v[2]];
}

export function transpose(m: M3): M3 {
  return [m[0], m[3], m[6], m[1], m[4], m[7], m[2], m[5], m[8]];
}

/** Euler XYZ in degrees -> rotation matrix (Rx * Ry * Rz). */
export function euler(d: Vec3 | undefined): M3 {
  if (!d || (d[0] === 0 && d[1] === 0 && d[2] === 0)) return I3;
  const [x, y, z] = [d[0] * DEG, d[1] * DEG, d[2] * DEG];
  const cx = Math.cos(x), sx = Math.sin(x), cy = Math.cos(y), sy = Math.sin(y), cz = Math.cos(z), sz = Math.sin(z);
  const rx: M3 = [1, 0, 0, 0, cx, -sx, 0, sx, cx];
  const ry: M3 = [cy, 0, sy, 0, 1, 0, -sy, 0, cy];
  const rz: M3 = [cz, -sz, 0, sz, cz, 0, 0, 0, 1];
  return mul(mul(rx, ry), rz);
}

export const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const scale = (a: Vec3, k: number): Vec3 => [a[0] * k, a[1] * k, a[2] * k];
export const dot = (a: Vec3, b: Vec3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

/** Joint frames of every part for a pose (extra rotations per part name, root offset and rotation). */
export interface Frame {
  R: M3;
  T: Vec3;
}

export function solve(fig: Figure, pose?: { j?: Record<string, Vec3>; t?: Record<string, Vec3>; root?: Vec3; rootRot?: Vec3 }): Map<string, Frame> {
  const out = new Map<string, Frame>();
  const root: Frame = { R: euler(pose?.rootRot), T: pose?.root ?? [0, 0, 0] };
  const byName = new Map(fig.parts.map((p) => [p.name, p]));
  const visit = (p: FigPart): Frame => {
    const hit = out.get(p.name);
    if (hit) return hit;
    const parent = p.parent ? byName.get(p.parent) : undefined;
    const pf = parent ? visit(parent) : root;
    const extra = pose?.j?.[p.name];
    const rot: Vec3 = extra ? [(p.rot?.[0] ?? 0) + extra[0], (p.rot?.[1] ?? 0) + extra[1], (p.rot?.[2] ?? 0) + extra[2]] : (p.rot ?? [0, 0, 0]);
    const nudge = pose?.t?.[p.name];
    const f: Frame = { R: mul(pf.R, euler(rot)), T: add(pf.T, apply(pf.R, nudge ? add(p.at, nudge) : p.at)) };
    out.set(p.name, f);
    return f;
  };
  for (const p of fig.parts) visit(p);
  return out;
}

/** Points on the surface of a part's solid, in the part's joint frame (for outlines and bounds). */
export function shapePoints(p: FigPart): Vec3[] {
  const pts: Vec3[] = [];
  const [w, h, d] = p.size;
  switch (p.shape) {
    case 'ball':
      for (let i = 0; i <= 10; i++) {
        const th = (i / 10) * Math.PI;
        const n = i === 0 || i === 10 ? 1 : 20;
        for (let k = 0; k < n; k++) {
          const ph = (k / n) * Math.PI * 2;
          pts.push([(Math.sin(th) * Math.cos(ph) * w) / 2, (Math.cos(th) * h) / 2, (Math.sin(th) * Math.sin(ph) * d) / 2]);
        }
      }
      break;
    case 'capsule': {
      const r = w / 2;
      const half = Math.max(0, h / 2 - r);
      for (const cy of [half, -half])
        for (let i = 0; i <= 8; i++) {
          const th = (i / 8) * Math.PI;
          for (let k = 0; k < 16; k++) {
            const ph = (k / 16) * Math.PI * 2;
            pts.push([Math.sin(th) * Math.cos(ph) * r, cy + Math.cos(th) * r * (h < w ? h / w : 1), (Math.sin(th) * Math.sin(ph) * d) / 2]);
          }
        }
      break;
    }
    case 'box': {
      const rr = Math.min(w, h, d) * 0.5 * Math.min(1, p.round ?? 0);
      const corner = (sx: number, sy: number, sz: number) => [sx * (w / 2 - rr), sy * (h / 2 - rr), sz * (d / 2 - rr)] as Vec3;
      for (const sx of [-1, 1])
        for (const sy of [-1, 1])
          for (const sz of [-1, 1]) {
            const c = corner(sx, sy, sz);
            if (rr <= 0) pts.push(c);
            else
              for (let k = 0; k < 6; k++) {
                const a = (k / 6) * (Math.PI / 2);
                pts.push([c[0] + sx * rr * Math.cos(a), c[1] + sy * rr * Math.sin(a), c[2]]);
                pts.push([c[0], c[1] + sy * rr * Math.sin(a), c[2] + sz * rr * Math.cos(a)]);
                pts.push([c[0] + sx * rr * Math.cos(a), c[1], c[2] + sz * rr * Math.sin(a)]);
              }
          }
      break;
    }
    case 'cyl': {
      const n = p.segs ?? 24;
      const t = p.taper ?? 1;
      for (let k = 0; k < n; k++) {
        const a = (k / n) * Math.PI * 2 + (p.segs ? Math.PI / n : 0);
        const cx = Math.cos(a), sz = Math.sin(a);
        pts.push([(cx * w) / 2, -h / 2, (sz * d) / 2]);
        if (t > 0.001) pts.push([(cx * w * t) / 2, h / 2, (sz * d * t) / 2]);
      }
      if (t <= 0.001) pts.push([0, h / 2, 0]);
      break;
    }
    case 'torus': {
      const tube = p.tube ?? 0.25;
      for (let k = 0; k < 32; k++) {
        const a = (k / 32) * Math.PI * 2;
        for (const s of [-1, 1]) pts.push([(Math.cos(a) * w) / 2, (Math.sin(a) * h) / 2, (s * d) / 2]);
      }
      void tube;
      break;
    }
    case 'wedge':
      for (const z of [-d / 2, d / 2]) pts.push([-w / 2, -h / 2, z], [w / 2, -h / 2, z], [0, h / 2, z]);
      break;
  }
  const off = p.off ?? [0, 0, 0];
  const R = euler(p.srot);
  return pts.map((q) => add(off, apply(R, q)));
}

/** Convex hull of 2D points, counter-clockwise (Andrew's monotone chain). */
export function hull(points: Array<[number, number]>): Array<[number, number]> {
  const pts = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (pts.length < 3) return pts;
  const cross = (o: [number, number], a: [number, number], b: [number, number]) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower: Array<[number, number]> = [];
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 1e-12) lower.pop();
    lower.push(p);
  }
  const upper: Array<[number, number]> = [];
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 1e-12) upper.pop();
    upper.push(p);
  }
  upper.pop();
  lower.pop();
  return lower.concat(upper);
}

/** Paper view mapping: figure space -> (paper x, paper y, toward the viewer). Front view keeps x; profile views
 *  show the figure's left side with its head toward paper -x (cutouts face left by default). */
export function viewMatrix(view: 'front' | 'side'): M3 {
  return view === 'front' ? I3 : [0, 0, -1, 0, 1, 0, 1, 0, 0];
}

/** Fill in heightM and the footprint from the rest pose. */
export function measure(fig: Omit<Figure, 'heightM' | 'halfW' | 'halfD'> & Partial<Figure>): Figure {
  const frames = solve(fig as Figure);
  let top = 0;
  let mx = 0;
  let mz = 0;
  for (const p of fig.parts) {
    const f = frames.get(p.name)!;
    for (const q of shapePoints(p)) {
      const w = add(f.T, apply(f.R, q));
      top = Math.max(top, w[1]);
      mx = Math.max(mx, Math.abs(w[0]));
      mz = Math.max(mz, Math.abs(w[2]));
    }
  }
  return { ...(fig as Figure), heightM: top, halfW: mx, halfD: mz };
}
