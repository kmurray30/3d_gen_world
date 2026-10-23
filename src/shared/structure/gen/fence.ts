/**
 * Fences are runs: a line of points on the ground with a post at every point and rails between them. A closed run
 * with one open segment is a fenced yard with a gate.
 */
import type { GenContext, MaterialName, Structure } from '../types';
import { Parts, pick, tidy } from '../build';
import { DEG } from '../../engine/math';
import { WOOD } from '../palette';

export interface FenceParams {
  /** Ground points, structure-local metres. */
  points: Array<[number, number]>;
  closed: boolean;
  /** Index of the segment left open (a gate), or -1. */
  gate: number;
  style: 'picket' | 'rail' | 'stone';
  height: number;
  color: string;
}

export const DEFAULT_FENCE: FenceParams = { points: [[-3, 0], [3, 0]], closed: false, gate: -1, style: 'picket', height: 1.1, color: '#d9a05b' };

export function fence(params: Partial<FenceParams>, _ctx: GenContext, decals: Parts['decals']): Structure {
  const p: FenceParams = { ...DEFAULT_FENCE, ...params };
  const pts = p.points.slice(0, 24);
  const b = new Parts(decals);
  const h = Math.max(0.5, Math.min(2.5, p.height));
  const mat: MaterialName = p.style === 'stone' ? 'stone' : 'plank';
  const postW = p.style === 'stone' ? 0.5 : 0.14;
  const segs = p.closed ? pts.length : pts.length - 1;
  for (let i = 0; i < pts.length; i++) {
    if (!p.closed && (i === 0 || i === pts.length - 1) && p.style === 'stone') continue;
    const [x, z] = pts[i];
    if (p.style === 'stone') b.box(x, 0, z, postW, h + 0.15, postW, mat, '#8d9399');
    else {
      b.box(x, 0, z, postW, h + 0.12, postW, mat, p.color);
      b.box(x, h + 0.12, z, postW + 0.06, 0.08, postW + 0.06, mat, p.color);
    }
  }
  for (let i = 0; i < segs; i++) {
    const a = pts[i];
    const c = pts[(i + 1) % pts.length];
    const dx = c[0] - a[0];
    const dz = c[1] - a[1];
    const len = Math.hypot(dx, dz);
    if (len < 0.2) continue;
    const mx = (a[0] + c[0]) / 2;
    const mz = (a[1] + c[1]) / 2;
    // a box's local x runs along the segment: rotateY([1,0,0], rot) = [cos rot, 0, -sin rot]
    const rot = Math.atan2(-dz, dx) / DEG;
    if (i === p.gate) {
      // an open gate: a short rail section swung outward from the first post
      const gw = Math.min(1.4, len * 0.45);
      const ox = Math.cos((rot + 90) * DEG) * (gw / 2 + postW / 2);
      const oz = -Math.sin((rot + 90) * DEG) * (gw / 2 + postW / 2);
      const gx = a[0] + ox;
      const gz = a[1] + oz;
      if (p.style === 'stone') continue;
      b.box(gx, h * 0.35, gz, gw, 0.08, 0.06, mat, p.color, { rot: rot + 90 });
      b.box(gx, h * 0.75, gz, gw, 0.08, 0.06, mat, p.color, { rot: rot + 90 });
      const n = Math.max(2, Math.round(gw / 0.3));
      for (let k = 0; k < n; k++) {
        const t = -gw / 2 + 0.15 + (k * (gw - 0.3)) / Math.max(1, n - 1);
        const px = gx + Math.cos((rot + 90) * DEG) * t;
        const pz = gz - Math.sin((rot + 90) * DEG) * t;
        b.box(px, 0.08, pz, 0.12, h - 0.1, 0.04, mat, p.color, { rot: rot + 90, ghost: true });
      }
      continue;
    }
    if (p.style === 'stone') {
      b.box(mx, 0, mz, len, h, 0.4, 'stone', '#9da3a8', { rot });
      continue;
    }
    const inner = len - postW;
    b.box(mx, h * 0.3, mz, inner, 0.09, 0.07, mat, p.color, { rot });
    b.box(mx, h * 0.72, mz, inner, 0.09, 0.07, mat, p.color, { rot });
    if (p.style === 'picket') {
      const n = Math.max(1, Math.floor(inner / 0.32));
      for (let k = 0; k < n; k++) {
        const t = -inner / 2 + 0.16 + ((k + 0.5) * (inner - 0.32)) / n;
        const px = mx + Math.cos(rot * DEG) * t;
        const pz = mz - Math.sin(rot * DEG) * t;
        b.box(px, 0.1, pz, 0.12, h - 0.14, 0.04, mat, p.color, { rot, ghost: true, noInk: false });
        b.prism(px, h - 0.04, pz, 4, 0.085, 0.14, mat, p.color, { rTop: 0, ghost: true });
      }
    }
  }
  return tidy(b.finish('fence', { style: p.style, closed: p.closed, gate: p.gate, height: h, color: p.color, points: JSON.stringify(pts) }));
}

export interface YardParams {
  w: number;
  d: number;
  style: FenceParams['style'];
  height: number;
  color: string;
}

/** A rectangular fenced yard with its gate centred on the front (+z) side. */
export function yard(params: Partial<YardParams>, ctx: GenContext, decals: Parts['decals']): Structure {
  const w = Math.max(3, Math.min(30, params.w ?? 9));
  const d = Math.max(3, Math.min(30, params.d ?? 7));
  const color = params.color ?? pick(ctx.rng, WOOD);
  const hw = w / 2;
  const hd = d / 2;
  const gateW = 1.3;
  // front edge split at the gate; the gate segment is the one between the two centre posts
  const points: Array<[number, number]> = [
    [-gateW / 2, hd],
    [-hw, hd],
    [-hw, -hd],
    [hw, -hd],
    [hw, hd],
    [gateW / 2, hd],
  ];
  const s = fence({ points, closed: true, gate: 5, style: params.style ?? 'picket', height: params.height ?? 1.1, color }, ctx, decals);
  s.gen = 'yard';
  s.params = { w, d, style: params.style ?? 'picket', height: params.height ?? 1.1, color };
  return s;
}
