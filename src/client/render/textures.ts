import * as THREE from 'three';
import type { Kind } from '../../shared/types';

const KIND_COLORS: Record<Kind, string> = {
  object: '#ffe08a',
  human: '#ffb3c1',
  humanoid: '#d6b3ff',
  animal: '#b3e6ff',
  other: '#c8f0c8',
};

interface Slot {
  tex: THREE.Texture;
  bytes: number;
  last: number;
}

/**
 * Textures by URL with a byte budget (LRU). Placeholder cards are drawn on a canvas and cached by label.
 * Sprite URLs are /sprites/<version>/<size>/<file>; the size is 256 on coarse-pointer devices.
 */
export class TextureStore {
  private slots = new Map<string, Slot>();
  private pending = new Map<string, Promise<THREE.Texture>>();
  private bytes = 0;
  private loader = new THREE.TextureLoader();
  private tick = 0;

  constructor(
    private readonly budgetBytes: number,
    public spriteBase: string,
  ) {}

  url(file: string): string {
    return `${this.spriteBase}/${encodeURIComponent(file)}`;
  }

  placeholder(label: string, kind: Kind, aspect: number): THREE.Texture {
    const key = `ph:${kind}:${aspect.toFixed(2)}:${label}`;
    const hit = this.slots.get(key);
    if (hit) {
      hit.last = ++this.tick;
      return hit.tex;
    }
    const h = 256;
    const w = Math.max(96, Math.min(640, Math.round(h * aspect)));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;
    const r = 22;
    const pad = 8;
    ctx.fillStyle = KIND_COLORS[kind] ?? '#eee';
    ctx.strokeStyle = '#2b2b2b';
    ctx.lineWidth = 7;
    roundRect(ctx, pad, pad, w - pad * 2, h - pad * 2, r);
    ctx.fill();
    ctx.stroke();
    // inner paper highlight
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    roundRect(ctx, pad + 10, pad + 10, w - pad * 2 - 20, (h - pad * 2) * 0.35, r - 8);
    ctx.fill();
    ctx.fillStyle = '#2b2b2b';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const lines = wrapLabel(label, Math.max(6, Math.floor(w / 24)));
    let size = Math.min(44, Math.floor((w - 32) / Math.max(...lines.map((l) => l.length)) * 1.9));
    size = Math.max(16, size);
    ctx.font = `700 ${size}px "Trebuchet MS", "Segoe UI", system-ui, sans-serif`;
    const lineH = size * 1.15;
    const y0 = h / 2 - ((lines.length - 1) * lineH) / 2;
    lines.forEach((line, i) => ctx.fillText(line, w / 2, y0 + i * lineH));
    const tex = new THREE.CanvasTexture(canvas);
    finishTexture(tex);
    this.insert(key, tex, w * h * 4);
    return tex;
  }

  /** A paper sign with text, for structures ("FIRE STATION"). */
  sign(text: string, color = '#fff3c4'): THREE.Texture {
    const key = `sign:${color}:${text}`;
    const hit = this.slots.get(key);
    if (hit) {
      hit.last = ++this.tick;
      return hit.tex;
    }
    const h = 128;
    const w = Math.max(128, Math.min(768, Math.round(h * (0.55 * Math.max(4, text.length) + 0.8))));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = color;
    ctx.strokeStyle = '#2b2b2b';
    ctx.lineWidth = 8;
    roundRect(ctx, 6, 6, w - 12, h - 12, 14);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#2b2b2b';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    let size = 64;
    ctx.font = `800 ${size}px "Trebuchet MS", "Segoe UI", system-ui, sans-serif`;
    while (size > 18 && ctx.measureText(text).width > w - 40) {
      size -= 4;
      ctx.font = `800 ${size}px "Trebuchet MS", "Segoe UI", system-ui, sans-serif`;
    }
    ctx.fillText(text, w / 2, h / 2 + 2);
    const tex = new THREE.CanvasTexture(canvas);
    finishTexture(tex);
    this.insert(key, tex, w * h * 4);
    return tex;
  }

  load(file: string): Promise<THREE.Texture> {
    const key = this.url(file);
    const hit = this.slots.get(key);
    if (hit) {
      hit.last = ++this.tick;
      return Promise.resolve(hit.tex);
    }
    const inflight = this.pending.get(key);
    if (inflight) return inflight;
    const p = new Promise<THREE.Texture>((resolve, reject) => {
      this.loader.load(
        key,
        (tex) => {
          finishTexture(tex);
          const img = tex.image as { width?: number; height?: number } | undefined;
          const bytes = (img?.width ?? 512) * (img?.height ?? 512) * 4 * 1.34;
          this.insert(key, tex, bytes);
          this.pending.delete(key);
          resolve(tex);
        },
        undefined,
        (err) => {
          this.pending.delete(key);
          reject(err);
        },
      );
    });
    this.pending.set(key, p);
    return p;
  }

  private insert(key: string, tex: THREE.Texture, bytes: number): void {
    this.slots.set(key, { tex, bytes, last: ++this.tick });
    this.bytes += bytes;
    this.evict();
  }

  /** Evict least recently used textures until under budget. Textures still referenced by a material keep drawing
   *  until the sprite view asks again; views re-request on every sprite change, so evicted textures get reloaded. */
  private evict(): void {
    if (this.bytes <= this.budgetBytes) return;
    const entries = [...this.slots.entries()].sort((a, b) => a[1].last - b[1].last);
    for (const [key, slot] of entries) {
      if (this.bytes <= this.budgetBytes * 0.8) break;
      if (this.tick - slot.last < 2) continue; // used this frame
      this.slots.delete(key);
      this.bytes -= slot.bytes;
      slot.tex.dispose();
    }
  }

  get usageBytes(): number {
    return this.bytes;
  }
}

function finishTexture(tex: THREE.Texture): void {
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = true;
  tex.anisotropy = 2;
  tex.needsUpdate = true;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function wrapLabel(label: string, maxChars: number): string[] {
  const words = label.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    if (!cur) cur = w;
    else if ((cur + ' ' + w).length <= maxChars) cur += ' ' + w;
    else {
      lines.push(cur);
      cur = w;
    }
  }
  if (cur) lines.push(cur);
  return lines.length ? lines : [label];
}

/** Soft radial shadow blob texture, shared by all sprites. */
export function makeShadowTexture(): THREE.Texture {
  const s = 128;
  const canvas = document.createElement('canvas');
  canvas.width = s;
  canvas.height = s;
  const ctx = canvas.getContext('2d')!;
  const g = ctx.createRadialGradient(s / 2, s / 2, 4, s / 2, s / 2, s / 2);
  g.addColorStop(0, 'rgba(20,30,20,0.55)');
  g.addColorStop(0.7, 'rgba(20,30,20,0.25)');
  g.addColorStop(1, 'rgba(20,30,20,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, s, s);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Ground texture: flat meadow green with faint paper speckle. */
export function makeGroundTexture(): THREE.Texture {
  const s = 256;
  const canvas = document.createElement('canvas');
  canvas.width = s;
  canvas.height = s;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#8fcf6a';
  ctx.fillRect(0, 0, s, s);
  let seed = 7;
  const rnd = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  for (let i = 0; i < 140; i++) {
    ctx.fillStyle = rnd() > 0.5 ? 'rgba(255,255,255,0.10)' : 'rgba(40,110,40,0.10)';
    ctx.beginPath();
    ctx.ellipse(rnd() * s, rnd() * s, 3 + rnd() * 9, 2 + rnd() * 4, rnd() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(60, 60);
  tex.anisotropy = 4;
  return tex;
}
