/**
 * Custom structures: the model describes parts by relation ("a cone on the cylinder", "stairs in front of the
 * box") and this lays them out. No coordinates cross the wire, so nothing can float or sink; the worst case is an
 * odd-looking pile of shapes.
 */
import type { GenContext, MaterialName, Structure } from '../types';
import { MATERIALS } from '../types';
import { Parts, pick, tidy } from '../build';
import { ROOF_COLORS, WALL_COLORS } from '../palette';

export const CUSTOM_SHAPES = ['box', 'cylinder', 'cone', 'wedge', 'pyramid', 'stairs', 'dome'] as const;
export const CUSTOM_AT = ['top', 'center', 'front', 'back', 'left', 'right'] as const;

export interface CustomPartSpec {
  name?: string;
  shape: (typeof CUSTOM_SHAPES)[number];
  w?: number;
  d?: number;
  h?: number;
  r?: number;
  sides?: number;
  mat?: string;
  color?: string;
  /** Name of the part this one sits on or beside; "ground" when omitted. */
  on?: string;
  at?: (typeof CUSTOM_AT)[number];
  dx?: number;
  dz?: number;
  rot?: number;
  /** Lean of a cone's tip, metres. */
  lean?: [number, number];
  noInk?: boolean;
}

export const MAX_CUSTOM_PARTS = 40;
const DIM = (v: number | undefined, def: number, lo = 0.1, hi = 30) => (typeof v === 'number' && Number.isFinite(v) ? Math.max(lo, Math.min(hi, v)) : def);

interface Placed {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  bottom: number;
  top: number;
  cx: number;
  cz: number;
}

export function customStructure(specs: CustomPartSpec[], ctx: GenContext, decals: Parts['decals'], label = 'custom'): Structure {
  const b = new Parts(decals);
  const placed = new Map<string, Placed>();
  let last: Placed | undefined;
  const mats = new Set<string>(MATERIALS);
  for (const spec of specs.slice(0, MAX_CUSTOM_PARTS)) {
    const shape = CUSTOM_SHAPES.includes(spec.shape) ? spec.shape : 'box';
    const h = DIM(spec.h, 2);
    const r = DIM(spec.r, Math.max(DIM(spec.w, 2), DIM(spec.d, 2)) / 2);
    const w = spec.shape === 'cylinder' || spec.shape === 'cone' || spec.shape === 'dome' ? DIM(spec.w, r * 2) : DIM(spec.w, 2);
    const d = spec.shape === 'cylinder' || spec.shape === 'cone' || spec.shape === 'dome' ? DIM(spec.d, r * 2) : DIM(spec.d, w);
    const anchor = spec.on && spec.on !== 'ground' ? (placed.get(spec.on) ?? last) : undefined;
    const at = spec.at ?? (anchor ? 'top' : 'center');
    let cx = anchor ? anchor.cx : 0;
    let cz = anchor ? anchor.cz : 0;
    let y = 0;
    if (anchor) {
      if (at === 'top' || at === 'center') y = anchor.top - 0.02;
      else {
        y = anchor.bottom;
        if (at === 'front') cz = anchor.maxZ + d / 2;
        if (at === 'back') cz = anchor.minZ - d / 2;
        if (at === 'left') cx = anchor.minX - w / 2;
        if (at === 'right') cx = anchor.maxX + w / 2;
      }
    }
    cx += DIM(spec.dx, 0, -30, 30);
    cz += DIM(spec.dz, 0, -30, 30);
    const mat = (mats.has(spec.mat ?? '') ? spec.mat : defaultMat(shape)) as MaterialName;
    const color = typeof spec.color === 'string' && /^#[0-9a-f]{6}$/i.test(spec.color) ? spec.color : shape === 'wedge' || shape === 'cone' || shape === 'pyramid' ? pick(ctx.rng, ROOF_COLORS) : pick(ctx.rng, WALL_COLORS);
    const rot = DIM(spec.rot, 0, -360, 360);
    const extra = { rot, noInk: spec.noInk };
    const sides = Math.max(3, Math.min(24, Math.round(spec.sides ?? 12)));
    switch (shape) {
      case 'box':
        b.box(cx, y, cz, w, h, d, mat, color, extra);
        break;
      case 'cylinder':
        b.prism(cx, y, cz, sides, w / 2, h, mat, color, { rz: d / 2, ...extra });
        break;
      case 'cone':
        b.prism(cx, y, cz, sides, w / 2, h, mat, color, { rz: d / 2, rTop: 0, lean: spec.lean, ...extra });
        break;
      case 'dome':
        b.prism(cx, y, cz, sides, w / 2, h * 0.6, mat, color, { rz: d / 2, rTop: (w / 2) * 0.6, ...extra });
        b.prism(cx, y + h * 0.6 - 0.02, cz, sides, (w / 2) * 0.6, h * 0.4, mat, color, { rz: (d / 2) * 0.6, rTop: 0, noInk: spec.noInk });
        break;
      case 'wedge':
        b.roof(cx, y, cz, 'gable', w, h, d, mat, color, extra);
        break;
      case 'pyramid':
        b.roof(cx, y, cz, 'hip', w, h, d, mat, color, extra);
        break;
      case 'stairs':
        b.stairs(cx, y, cz, w, h, d, Math.max(2, Math.round(h / 0.25)), mat, color, extra);
        break;
    }
    const rec: Placed = { minX: cx - w / 2, maxX: cx + w / 2, minZ: cz - d / 2, maxZ: cz + d / 2, bottom: y, top: y + h, cx, cz };
    if (spec.name) placed.set(spec.name, rec);
    last = rec;
  }
  if (!b.parts.length) b.box(0, 0, 0, 2, 2, 2, 'plaster', '#f6e27a');
  return tidy(b.finish('custom', { label, parts: specs.length }));
}

function defaultMat(shape: (typeof CUSTOM_SHAPES)[number]): MaterialName {
  switch (shape) {
    case 'cylinder':
    case 'dome':
      return 'stone';
    case 'cone':
    case 'wedge':
    case 'pyramid':
      return 'shingle';
    case 'stairs':
      return 'stone';
    default:
      return 'plaster';
  }
}
