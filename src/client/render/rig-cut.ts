/**
 * Cutting a drawing into its paper pieces, in the browser. Each piece of a rig carries its exact pixel mask
 * (made offline, outline ink along its seams and a tuck under its parent included), so cutting is only drawing:
 * the picture is stamped through each mask into one atlas, and the paint under face marks is filled with the
 * colour around them (so a blink shows skin, not a hole). Nothing is read back from a canvas: browsers that
 * guard against fingerprinting add noise to such reads, which would scatter pixels across pieces.
 */
import * as THREE from 'three';
import { FACE_KINDS, RigSchema, decodeMask, type Rig, type RigPiece } from '../../shared/rig';

const PAD = 2;

export interface CutPiece {
  piece: RigPiece;
  /** The piece's rectangle in the drawing, pixels: x0, y0, x1, y1 (exclusive). */
  rect: [number, number, number, number];
  /** Its rectangle in the atlas, UV: u0, v0, u1, v1 (v up). */
  uv: [number, number, number, number];
}

export interface PuppetAsset {
  rig: Rig;
  texture: THREE.CanvasTexture;
  pieces: Map<string, CutPiece>;
  /** The atlas's alpha, for picking only where a piece is actually painted. */
  alpha: Uint8Array;
  atlasW: number;
  atlasH: number;
}

/** Whether the atlas is painted at a UV (v up). */
export function paintedAt(asset: PuppetAsset, u: number, v: number): boolean {
  const x = Math.min(asset.atlasW - 1, Math.max(0, Math.floor(u * asset.atlasW)));
  const y = Math.min(asset.atlasH - 1, Math.max(0, Math.floor((1 - v) * asset.atlasH)));
  return asset.alpha[y * asset.atlasW + x] > 100;
}

/** Which drawings have rigs, and their cut-up atlases once loaded. */
export class RigStore {
  private files: Set<string> | null = null;
  private readonly assets = new Map<string, Promise<PuppetAsset | null>>();
  private readonly ready = new Map<string, PuppetAsset>();
  private indexLoad: Promise<void> | null = null;

  constructor(private readonly base = '/rigs') {}

  /** Fetch the list of rigged drawings once. */
  init(): Promise<void> {
    this.indexLoad ??= fetch(`${this.base}/index.json`)
      .then((r) => (r.ok ? r.json() : { files: [] }))
      .then((j: { files?: string[] }) => {
        this.files = new Set(j.files ?? []);
      })
      .catch(() => {
        this.files = new Set();
      });
    return this.indexLoad;
  }

  has(file: string): boolean {
    return !!this.files?.has(file);
  }

  /** The rig of a loaded drawing, if it is ready (engine lookups). */
  rigOf(file: string): Rig | undefined {
    return this.ready.get(file)?.rig;
  }

  /** Load and cut a drawing's rig; `image` is the drawing as already loaded for its texture. */
  load(file: string, image: CanvasImageSource): Promise<PuppetAsset | null> {
    let p = this.assets.get(file);
    if (!p) {
      const stem = file.replace(/\.webp$/, '');
      p = fetch(`${this.base}/${encodeURIComponent(stem)}.json`)
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`rig ${r.status}`))))
        .then((json) => {
          const rig = RigSchema.parse(json);
          const asset = cutRig(rig, image);
          this.ready.set(file, asset);
          return asset;
        })
        .catch((e) => {
          console.warn(`[rig] ${file}: ${(e as Error).message}`);
          return null;
        });
      this.assets.set(file, p);
    }
    return p;
  }
}

/** Stamp the drawing through each piece's mask and pack the pieces into one atlas. */
export function cutRig(rig: Rig, image: CanvasImageSource): PuppetAsset {
  const W = rig.w;
  const H = rig.h;
  const index = new Map(rig.pieces.map((p, i) => [p.id, i]));
  const rects = rig.pieces.map((p) => p.rect);
  const masks = rig.pieces.map((p) => decodeMask(p.mask, p.rect));
  const size = (k: number): [number, number] => [Math.max(1, rects[k][2] - rects[k][0]), Math.max(1, rects[k][3] - rects[k][1])];
  // the paint under each face mark, grown a pixel, in its holder's frame: filled with the colour around it
  const fills = rig.pieces.map(() => [] as Array<{ grid: Uint8Array; color: string }>);
  rig.pieces.forEach((f, k) => {
    if (!FACE_KINDS.includes(f.kind) || !f.parent) return;
    const holder = index.get(f.parent);
    if (holder === undefined) return;
    const [hw, hh] = size(holder);
    const [fw, fh] = size(k);
    const grid = new Uint8Array(hw * hh);
    const dx = rects[k][0] - rects[holder][0];
    const dy = rects[k][1] - rects[holder][1];
    for (let y = 0; y < fh; y++)
      for (let x = 0; x < fw; x++) {
        if (!masks[k][y * fw + x]) continue;
        const hx = x + dx;
        const hy = y + dy;
        if (hx >= 0 && hy >= 0 && hx < hw && hy < hh) grid[hy * hw + hx] = 1;
      }
    fills[holder].push({ grid: dilate(grid, hw, hh, 1), color: f.fill ?? '#ffffff' });
  });
  const cells = rig.pieces.map((_, k) => {
    const [w, h] = size(k);
    const cell = canvasOf(w, h);
    cell.ctx.drawImage(image, -rects[k][0], -rects[k][1], W, H);
    cell.ctx.globalCompositeOperation = 'destination-in';
    cell.ctx.drawImage(stencil(masks[k], w, h, [255, 255, 255]), 0, 0);
    cell.ctx.globalCompositeOperation = 'source-over';
    for (const f of fills[k]) cell.ctx.drawImage(stencil(f.grid, w, h, hex(f.color)), 0, 0);
    return cell.canvas;
  });
  // shelf-pack the cells into one atlas
  const order = rig.pieces.map((_, k) => k).sort((a, b) => cells[b].height - cells[a].height);
  const atlasW = Math.min(2048, Math.max(64, nextPow2(Math.ceil(W * 1.25))));
  let x = 0;
  let y = 0;
  let shelf = 0;
  const at: Array<[number, number]> = [];
  for (const k of order) {
    const c = cells[k];
    if (x + c.width + PAD > atlasW) {
      x = 0;
      y += shelf + PAD;
      shelf = 0;
    }
    at[k] = [x, y];
    x += c.width + PAD;
    shelf = Math.max(shelf, c.height);
  }
  const atlasH = Math.max(64, y + shelf + PAD);
  const atlas = canvasOf(atlasW, atlasH);
  for (const k of order) atlas.ctx.drawImage(cells[k], at[k][0], at[k][1]);
  const texture = new THREE.CanvasTexture(atlas.canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  // where the atlas is painted, for picking, straight from the masks
  const alpha = new Uint8Array(atlasW * atlasH);
  const pieces = new Map<string, CutPiece>();
  rig.pieces.forEach((p, k) => {
    const [w, h] = size(k);
    const [ax, ay] = at[k];
    for (let yy = 0; yy < h; yy++)
      for (let xx = 0; xx < w; xx++) if (masks[k][yy * w + xx] || fills[k].some((f) => f.grid[yy * w + xx])) alpha[(ay + yy) * atlasW + ax + xx] = 255;
    pieces.set(p.id, {
      piece: p,
      rect: rects[k],
      uv: [ax / atlasW, 1 - (ay + h) / atlasH, (ax + w) / atlasW, 1 - ay / atlasH],
    });
  });
  return { rig, texture, pieces, alpha, atlasW, atlasH };
}

/** A canvas that is `rgb` where the grid is set and clear elsewhere (written, never read). */
function stencil(grid: Uint8Array, w: number, h: number, [r, g, b]: [number, number, number]): HTMLCanvasElement {
  const c = canvasOf(w, h);
  const img = c.ctx.createImageData(w, h);
  for (let i = 0; i < w * h; i++) {
    if (!grid[i]) continue;
    img.data[i * 4] = r;
    img.data[i * 4 + 1] = g;
    img.data[i * 4 + 2] = b;
    img.data[i * 4 + 3] = 255;
  }
  c.ctx.putImageData(img, 0, 0);
  return c.canvas;
}

function canvasOf(w: number, h: number): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  return { canvas, ctx: canvas.getContext('2d')! };
}

/** Square dilation by r pixels (separable max filter). */
function dilate(m: Uint8Array, W: number, H: number, r: number): Uint8Array {
  if (r <= 0) return m.slice();
  const tmp = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) {
    let last = -1e9;
    for (let x = 0; x < W; x++) {
      if (m[y * W + x]) last = x;
      if (x - last <= r) tmp[y * W + x] = 1;
    }
    last = 1e9;
    for (let x = W - 1; x >= 0; x--) {
      if (m[y * W + x]) last = x;
      if (last - x <= r) tmp[y * W + x] = 1;
    }
  }
  const out = new Uint8Array(W * H);
  for (let x = 0; x < W; x++) {
    let last = -1e9;
    for (let y = 0; y < H; y++) {
      if (tmp[y * W + x]) last = y;
      if (y - last <= r) out[y * W + x] = 1;
    }
    last = 1e9;
    for (let y = H - 1; y >= 0; y--) {
      if (tmp[y * W + x]) last = y;
      if (last - y <= r) out[y * W + x] = 1;
    }
  }
  return out;
}

function nextPow2(v: number): number {
  return 2 ** Math.ceil(Math.log2(Math.max(1, v)));
}

function hex(c: string): [number, number, number] {
  const n = parseInt(c.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
