/**
 * Origami trees and bushes: drawn paper pieces in a diorama instead of one camera-facing cutout. A trunk is two
 * crossed vertical planes (four points from above); the canopy is a handful of cloud-shaped leaf cutouts standing
 * at different depths and heights around the trunk top. Colours are sampled from the entity's own sprite so the
 * tree matches the rest of the art.
 */
import * as THREE from 'three';
import { CRAYON_METRES, drawCrayonGrain } from './crayon';
import { tinted } from './tint';

export interface TreeColors {
  leaf: string;
  trunk: string;
}
export const DEFAULT_TREE_COLORS: TreeColors = { leaf: '#5aa553', trunk: '#8c5a2b' };

const PLANE = new THREE.PlaneGeometry(1, 1);
const INK = '#2b2b2b';
const texCache = new Map<string, THREE.Texture>();

function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shade(hex: string, k: number): string {
  const c = new THREE.Color(hex);
  c.r = Math.min(1, c.r * k);
  c.g = Math.min(1, c.g * k);
  c.b = Math.min(1, c.b * k);
  return `#${c.getHexString()}`;
}

/** Draw a shape: colour plus crayon grain clipped to the path, then a bold ink outline. `path` is replayed because the
 *  grain strokes reset the canvas path. */
function paperShape(ctx: CanvasRenderingContext2D, path: () => void, color: string, size: number, seed: number, outline = 22): void {
  ctx.save();
  path();
  ctx.clip();
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, size, size);
  drawCrayonGrain(ctx, size, seed, 0.75, 0.12);
  ctx.restore();
  path();
  ctx.lineJoin = 'round';
  ctx.lineWidth = outline;
  ctx.strokeStyle = INK;
  ctx.stroke();
}

/** A scalloped cloud silhouette: bumps along the top and sides, flatter underneath. */
function cloudPath(ctx: CanvasRenderingContext2D, s: number, r: () => number): void {
  const cx = s / 2;
  const cy = s * 0.56;
  const rx = s * 0.42;
  const ry = s * 0.34;
  const bumps = 5 + Math.floor(r() * 2);
  ctx.beginPath();
  for (let i = 0; i <= bumps; i++) {
    const a0 = Math.PI + (i / bumps) * Math.PI; // top half, left to right
    const a1 = Math.PI + ((i + 0.5) / bumps) * Math.PI;
    const x0 = cx + Math.cos(a0) * rx;
    const y0 = cy + Math.sin(a0) * ry;
    if (i === 0) ctx.moveTo(x0, y0);
    const bulge = 1.22 + r() * 0.2;
    const xm = cx + Math.cos(a1) * rx * bulge;
    const ym = cy + Math.sin(a1) * ry * bulge;
    const x1 = cx + Math.cos(Math.PI + ((i + 1) / bumps) * Math.PI) * rx;
    const y1 = cy + Math.sin(Math.PI + ((i + 1) / bumps) * Math.PI) * ry;
    if (i < bumps) ctx.quadraticCurveTo(xm, ym, x1, y1);
  }
  // gently scalloped bottom edge back to the start
  const bottom = 3;
  for (let i = 1; i <= bottom; i++) {
    const t = i / bottom;
    const x = cx + rx - t * 2 * rx;
    const xm = x + rx / bottom;
    ctx.quadraticCurveTo(xm, cy + ry * 1.28, x, cy + ry * 0.98);
  }
  ctx.closePath();
}

function leafTexture(color: string, variant: number): THREE.Texture {
  const key = `leaf:${color}:${variant}`;
  const hit = texCache.get(key);
  if (hit) return hit;
  const s = 512;
  const canvas = document.createElement('canvas');
  canvas.width = s;
  canvas.height = s;
  const ctx = canvas.getContext('2d')!;
  const path = () => cloudPath(ctx, s, rng(91 + variant * 37));
  paperShape(ctx, path, color, s, 300 + variant, 24);
  // lighter leaf dots like the reference
  const r = rng(500 + variant);
  ctx.save();
  path();
  ctx.clip();
  ctx.fillStyle = shade(color, 1.3);
  for (let i = 0; i < 22; i++) {
    ctx.beginPath();
    ctx.arc(s * 0.14 + r() * s * 0.72, s * 0.22 + r() * s * 0.56, 6 + r() * 9, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  texCache.set(key, tex);
  return tex;
}

function trunkTexture(color: string): THREE.Texture {
  const key = `trunk:${color}`;
  const hit = texCache.get(key);
  if (hit) return hit;
  const s = 512;
  const canvas = document.createElement('canvas');
  canvas.width = s;
  canvas.height = s;
  const ctx = canvas.getContext('2d')!;
  // tapered trunk with flared roots and two branch stubs
  const path = () => {
  ctx.beginPath();
  ctx.moveTo(s * 0.3, s * 0.98);
  ctx.quadraticCurveTo(s * 0.4, s * 0.8, s * 0.4, s * 0.45);
  ctx.lineTo(s * 0.2, s * 0.22);
  ctx.quadraticCurveTo(s * 0.17, s * 0.15, s * 0.26, s * 0.14);
  ctx.lineTo(s * 0.43, s * 0.3);
  ctx.lineTo(s * 0.46, s * 0.04);
  ctx.lineTo(s * 0.56, s * 0.04);
  ctx.lineTo(s * 0.58, s * 0.3);
  ctx.lineTo(s * 0.76, s * 0.12);
  ctx.quadraticCurveTo(s * 0.85, s * 0.12, s * 0.82, s * 0.2);
  ctx.lineTo(s * 0.61, s * 0.45);
  ctx.quadraticCurveTo(s * 0.62, s * 0.8, s * 0.72, s * 0.98);
  ctx.closePath();
  };
  paperShape(ctx, path, color, s, 77, 22);
  // bark lines
  ctx.strokeStyle = shade(color, 0.6);
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  for (let i = 0; i < 5; i++) {
    const x = s * (0.43 + i * 0.04);
    ctx.beginPath();
    ctx.moveTo(x, s * (0.5 + (i % 2) * 0.08));
    ctx.quadraticCurveTo(x + 6, s * 0.75, x - 4, s * 0.92);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  texCache.set(key, tex);
  return tex;
}

function piece(tex: THREE.Texture, entityId: string): THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial> {
  const m = new THREE.Mesh(PLANE, tinted(new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.4, side: THREE.DoubleSide })));
  m.userData.entityId = entityId;
  return m;
}

/** Leaf layers: [x, y, z] as fractions of width/height/width, yaw, size fraction of width, shade. */
const TREE_CANOPY: Array<{ p: [number, number, number]; yaw: number; s: number; k: number }> = [
  { p: [-0.1, 0.58, 0.36], yaw: 0, s: 1.15, k: 1.0 },
  { p: [0.14, 0.7, -0.34], yaw: 0, s: 1.25, k: 0.82 },
  { p: [0.38, 0.55, 0.06], yaw: Math.PI / 2, s: 0.95, k: 0.92 },
  { p: [-0.38, 0.64, -0.06], yaw: Math.PI / 2, s: 1.0, k: 0.88 },
  { p: [0.04, 0.84, 0.1], yaw: 0, s: 0.9, k: 1.08 },
  { p: [-0.04, 0.8, -0.12], yaw: Math.PI / 2, s: 0.85, k: 0.95 },
];
const BUSH_CANOPY: Array<{ p: [number, number, number]; yaw: number; s: number; k: number }> = [
  { p: [0, 0.3, 0.16], yaw: 0, s: 1.0, k: 1.0 },
  { p: [0, 0.34, -0.16], yaw: 0, s: 0.95, k: 0.86 },
  { p: [0.1, 0.32, 0], yaw: Math.PI / 2, s: 0.9, k: 0.94 },
];

/** Group of paper pieces for one tree or bush, sized to the entity. */
export class OrigamiPlant {
  readonly group = new THREE.Group();
  private pieces: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>[] = [];
  private colorsKey = '';

  constructor(
    private readonly entityId: string,
    private readonly kind: 'tree' | 'bush',
    yaw: number,
  ) {
    this.group.rotation.y = yaw;
  }

  /** (Re)build the pieces for these colours. Cheap: textures are cached by colour. */
  setColors(colors: TreeColors): void {
    const key = `${colors.leaf}|${colors.trunk}`;
    if (key === this.colorsKey) return;
    this.colorsKey = key;
    for (const p of this.pieces) {
      this.group.remove(p);
      p.material.dispose();
    }
    this.pieces = [];
    const add = (tex: THREE.Texture, yaw: number): THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial> => {
      const m = piece(tex, this.entityId);
      m.rotation.y = yaw;
      this.group.add(m);
      this.pieces.push(m);
      return m;
    };
    if (this.kind === 'tree') {
      const trunk = trunkTexture(colors.trunk);
      add(trunk, 0).userData.role = 'trunk';
      add(trunk, Math.PI / 2).userData.role = 'trunk';
    }
    const layout = this.kind === 'tree' ? TREE_CANOPY : BUSH_CANOPY;
    layout.forEach((c, i) => {
      const m = add(leafTexture(shade(colors.leaf, c.k), i), c.yaw);
      m.userData.role = 'leaf';
      m.userData.layout = c;
    });
  }

  /** Size and place the pieces for an entity of width w and height h (metres), with squash and opacity. */
  layout(w: number, h: number, sq: number, opacity: number): void {
    const hs = h * sq;
    for (const m of this.pieces) {
      m.material.opacity = opacity;
      if (m.userData.role === 'trunk') {
        const th = hs * 0.62;
        const tw = Math.max(w * 0.4, th * 0.5);
        m.scale.set(tw, th, 1);
        m.position.set(0, th / 2, 0);
      } else {
        const c = m.userData.layout as (typeof TREE_CANOPY)[number];
        const size = w * c.s * (this.kind === 'tree' ? 1 : 1.1);
        m.scale.set(size, size * 0.72, 1);
        m.position.set(c.p[0] * w, c.p[1] * hs, c.p[2] * w);
      }
    }
  }

  get pickables(): THREE.Object3D[] {
    return this.pieces;
  }

  dispose(): void {
    for (const p of this.pieces) p.material.dispose();
    this.pieces = [];
  }
}

/** Average leaf and trunk colours from a loaded sprite: the top band for leaves, the bottom centre for the trunk. */
export function sampleTreeColors(tex: THREE.Texture): TreeColors {
  const img = tex.image as CanvasImageSource & { width: number; height: number };
  if (!img || !img.width) return DEFAULT_TREE_COLORS;
  const s = 48;
  const canvas = document.createElement('canvas');
  canvas.width = s;
  canvas.height = s;
  const ctx = canvas.getContext('2d')!;
  try {
    ctx.drawImage(img, 0, 0, s, s);
  } catch {
    return DEFAULT_TREE_COLORS;
  }
  const data = ctx.getImageData(0, 0, s, s).data;
  const avg = (x0: number, x1: number, y0: number, y1: number, fallback: string): string => {
    let r = 0;
    let g = 0;
    let b = 0;
    let n = 0;
    for (let y = y0; y < y1; y++)
      for (let x = x0; x < x1; x++) {
        const i = (y * s + x) * 4;
        const a = data[i + 3];
        const lum = data[i] + data[i + 1] + data[i + 2];
        if (a < 200 || lum < 150 || lum > 560) continue; // skip transparent pixels, the ink outline and highlights
        r += data[i];
        g += data[i + 1];
        b += data[i + 2];
        n++;
      }
    if (n < 12) return fallback;
    return `#${new THREE.Color(r / n / 255, g / n / 255, b / n / 255).getHexString()}`;
  };
  const juice = (hex: string): string => {
    const c = new THREE.Color(hex);
    const hsl = { h: 0, s: 0, l: 0 };
    c.getHSL(hsl);
    c.setHSL(hsl.h, Math.min(1, hsl.s * 1.3 + 0.05), Math.min(0.55, hsl.l * 0.88));
    return `#${c.getHexString()}`;
  };
  return {
    leaf: juice(avg(6, s - 6, 4, Math.round(s * 0.5), DEFAULT_TREE_COLORS.leaf)),
    trunk: juice(avg(Math.round(s * 0.35), Math.round(s * 0.65), Math.round(s * 0.72), s - 2, DEFAULT_TREE_COLORS.trunk)),
  };
}

export const CRAYON_PIECE_METRES = CRAYON_METRES;
