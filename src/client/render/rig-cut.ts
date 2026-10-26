/**
 * Cutting a drawing into its paper pieces, in the browser. A rig's piece map says which piece owns each pixel;
 * each piece also takes the outline ink along its edges (so a moved arm keeps its outline and the body keeps
 * its own), pieces tucked behind their parent reach a few pixels under it (so a turning joint never opens a
 * gap), and the paint under face marks is filled with the colour around them (so a blink shows skin, not a
 * hole). The pieces are packed into one atlas texture per drawing.
 */
import * as THREE from 'three';
import { FACE_KINDS, RigSchema, type Rig, type RigPiece } from '../../shared/rig';

const INK_MAX = 72;
const SEAM = 4;
const TUCK = 6;
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
  load(file: string, image: CanvasImageSource & { width: number; height: number }): Promise<PuppetAsset | null> {
    let p = this.assets.get(file);
    if (!p) {
      const stem = file.replace(/\.webp$/, '');
      p = Promise.all([
        fetch(`${this.base}/${encodeURIComponent(stem)}.json`).then((r) => (r.ok ? r.json() : Promise.reject(new Error(`rig ${r.status}`)))),
        fetch(`${this.base}/${encodeURIComponent(stem)}.png`)
          .then((r) => (r.ok ? r.blob() : Promise.reject(new Error(`rig map ${r.status}`))))
          .then((b) => createImageBitmap(b, { colorSpaceConversion: 'none', premultiplyAlpha: 'none' })),
      ])
        .then(([json, map]) => {
          const rig = RigSchema.parse(json);
          const asset = cutRig(rig, map, image);
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

/** Cut the drawing into pieces and pack them into an atlas. */
export function cutRig(rig: Rig, map: CanvasImageSource, image: CanvasImageSource): PuppetAsset {
  const W = rig.w;
  const H = rig.h;
  const src = canvasOf(W, H);
  src.ctx.drawImage(image, 0, 0, W, H);
  const px = src.ctx.getImageData(0, 0, W, H).data;
  const lab = canvasOf(W, H);
  lab.ctx.imageSmoothingEnabled = false;
  lab.ctx.drawImage(map, 0, 0, W, H);
  const ld = lab.ctx.getImageData(0, 0, W, H).data;
  const owner = new Int16Array(W * H);
  const ink = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) {
    owner[i] = ld[i * 4] - 1;
    const a = px[i * 4 + 3];
    ink[i] = a > 128 && Math.max(px[i * 4], px[i * 4 + 1], px[i * 4 + 2]) < INK_MAX ? 1 : 0;
  }
  const index = new Map(rig.pieces.map((p, i) => [p.id, i]));
  const masks: Uint8Array[] = [];
  const rects: Array<[number, number, number, number]> = [];
  rig.pieces.forEach((p, k) => {
    const own = new Uint8Array(W * H);
    for (let i = 0; i < W * H; i++) if (owner[i] === k) own[i] = 1;
    const parent = p.parent !== undefined ? index.get(p.parent) : undefined;
    // a face mark keeps exactly its own pixels; other pieces take the ink along their edges, and pieces tucked
    // behind their parent reach a little under it
    const mask = own.slice();
    if (!FACE_KINDS.includes(p.kind)) {
      const near = dilate(own, W, H, Math.max(SEAM, TUCK));
      const seam = dilate(own, W, H, SEAM);
      for (let i = 0; i < W * H; i++) {
        if (mask[i] || owner[i] < 0) continue;
        if (seam[i] && ink[i]) mask[i] = 1;
        else if (near[i] && p.z < 0 && parent !== undefined && owner[i] === parent) mask[i] = 1;
      }
    }
    masks.push(mask);
    rects.push(bounds(mask, W, H));
  });
  // pixels of each piece, with the paint under its face marks filled in
  const layers = rig.pieces.map((p, k) => {
    const [x0, y0, x1, y1] = rects[k];
    const w = Math.max(1, x1 - x0);
    const h = Math.max(1, y1 - y0);
    const out = new ImageData(w, h);
    const m = masks[k];
    for (let y = y0; y < y1; y++)
      for (let x = x0; x < x1; x++) {
        const i = y * W + x;
        if (!m[i]) continue;
        const o = ((y - y0) * w + (x - x0)) * 4;
        out.data[o] = px[i * 4];
        out.data[o + 1] = px[i * 4 + 1];
        out.data[o + 2] = px[i * 4 + 2];
        out.data[o + 3] = px[i * 4 + 3];
      }
    return out;
  });
  rig.pieces.forEach((f, k) => {
    if (!FACE_KINDS.includes(f.kind) || !f.parent) return;
    const holder = index.get(f.parent);
    if (holder === undefined) return;
    const [r, g, b] = hex(f.fill ?? '#ffffff');
    const grow = dilate(masks[k], W, H, 1);
    const [x0, y0, x1, y1] = rects[holder];
    const layer = layers[holder];
    const w = x1 - x0;
    for (let y = y0; y < y1; y++)
      for (let x = x0; x < x1; x++) {
        const i = y * W + x;
        if (!grow[i]) continue;
        const o = ((y - y0) * w + (x - x0)) * 4;
        layer.data[o] = r;
        layer.data[o + 1] = g;
        layer.data[o + 2] = b;
        layer.data[o + 3] = 255;
      }
  });
  // shelf-pack the layers into one atlas
  const order = rig.pieces.map((_, k) => k).sort((a, b) => layers[b].height - layers[a].height);
  const atlasW = Math.min(2048, Math.max(64, nextPow2(Math.ceil(W * 1.25))));
  let x = 0;
  let y = 0;
  let shelf = 0;
  const at: Array<[number, number]> = [];
  for (const k of order) {
    const l = layers[k];
    if (x + l.width + PAD > atlasW) {
      x = 0;
      y += shelf + PAD;
      shelf = 0;
    }
    at[k] = [x, y];
    x += l.width + PAD;
    shelf = Math.max(shelf, l.height);
  }
  const atlasH = Math.max(64, y + shelf + PAD);
  const atlas = canvasOf(atlasW, atlasH);
  for (const k of order) atlas.ctx.putImageData(layers[k], at[k][0], at[k][1]);
  const texture = new THREE.CanvasTexture(atlas.canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  const pieces = new Map<string, CutPiece>();
  rig.pieces.forEach((p, k) => {
    const [ax, ay] = at[k];
    const l = layers[k];
    pieces.set(p.id, {
      piece: p,
      rect: rects[k],
      uv: [ax / atlasW, 1 - (ay + l.height) / atlasH, (ax + l.width) / atlasW, 1 - ay / atlasH],
    });
  });
  const ad = atlas.ctx.getImageData(0, 0, atlasW, atlasH).data;
  const alpha = new Uint8Array(atlasW * atlasH);
  for (let i = 0; i < alpha.length; i++) alpha[i] = ad[i * 4 + 3];
  return { rig, texture, pieces, alpha, atlasW, atlasH };
}

function canvasOf(w: number, h: number): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  return { canvas, ctx: canvas.getContext('2d', { willReadFrequently: true })! };
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

function bounds(m: Uint8Array, W: number, H: number): [number, number, number, number] {
  let x0 = W;
  let y0 = H;
  let x1 = 0;
  let y1 = 0;
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++)
      if (m[y * W + x]) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
  if (x1 < x0) return [0, 0, 1, 1];
  return [x0, y0, x1 + 1, y1 + 1];
}

function nextPow2(v: number): number {
  return 2 ** Math.ceil(Math.log2(Math.max(1, v)));
}

function hex(c: string): [number, number, number] {
  const n = parseInt(c.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
