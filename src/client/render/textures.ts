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
    if (text.startsWith('@map:') && townMap) {
      const tex = new THREE.CanvasTexture(drawTownMap(townMap, text));
      finishTexture(tex);
      this.slots.set(key, { tex, bytes: 1024 * 666 * 4, last: ++this.tick });
      return tex;
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


/* ----- the town's standing maps ----- */

import type { TownMap } from '../../shared/city/town';

let townMap: TownMap | null = null;
/** The town's layout, for its standing maps (set when the town loads). */
export function setTownMap(m: TownMap | null): void {
  townMap = m;
}

const ZONE_COLORS: Record<string, string> = { downtown: '#f0a46a', civic: '#c98ad6', residential: '#f6dc7a', parkland: '#7cc66a', industry: '#a9adb3', transport: '#8f97d6', waterfront: '#79cde0', farmland: '#d8b46a', wild: '#5aa553', fantasy: '#b48ae6', sky: '#a8d8f5' };

const ZONE_NAMES: Record<string, string> = { downtown: 'Downtown', civic: 'Civic', residential: 'Homes', parkland: 'Parks', industry: 'Industry', transport: 'Transport', waterfront: 'Waterfront', farmland: 'Farmland', wild: 'Wilds', fantasy: 'Fantasy', sky: 'Sky' };

/**
 * "@map:x,z,yaw": a mall-style standing map. On the left the whole town turned so the way you face when reading
 * it is up, you are here marked; on the right a directory of every place, by district, in the map's colours.
 */
function drawTownMap(m: TownMap, text: string): HTMLCanvasElement {
  const [hx, hz, hyaw] = text.slice(5).split(',').map(Number);
  const W = 1024, H = 666;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#f4ecd8';
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = '#2b2b2b';
  ctx.lineWidth = 10;
  ctx.strokeRect(5, 5, W - 10, H - 10);
  const font = (wt: number, px: number) => `${wt} ${px}px "Trebuchet MS", "Segoe UI", system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = font(800, 30);
  ctx.fillStyle = '#2b2b2b';
  ctx.fillText('EVERYTOWN', W / 2, 34);
  // fit the lots' extent, turned: "up" on the map is the way the reader faces, (-sin yaw, -cos yaw) in the world
  const a = (hyaw * Math.PI) / 180;
  const fwd = [-Math.sin(a), -Math.cos(a)], right = [Math.cos(a), -Math.sin(a)];
  const P = (x: number, z: number): [number, number] => [x * right[0] + z * right[1], -(x * fwd[0] + z * fwd[1])];
  let lo = [Infinity, Infinity], hi = [-Infinity, -Infinity];
  for (const l of m.lots) for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const p = P(l.x + (sx * l.w) / 2, l.z + (sz * l.d) / 2);
    lo = [Math.min(lo[0], p[0]), Math.min(lo[1], p[1])];
    hi = [Math.max(hi[0], p[0]), Math.max(hi[1], p[1])];
  }
  // the map gets the room its shape needs (up to 62% of the width); the directory takes the rest
  const top = 64, pad = 22;
  const boxH = H - top - pad;
  const k = Math.min((W * 0.62 - pad * 2) / (hi[0] - lo[0]), boxH / (hi[1] - lo[1]));
  const mapW = (hi[0] - lo[0]) * k;
  const ox = pad + 6 - lo[0] * k, oy = top + (boxH - (hi[1] - lo[1]) * k) / 2 - lo[1] * k;
  const S = (x: number, z: number): [number, number] => {
    const p = P(x, z);
    return [ox + p[0] * k, oy + p[1] * k];
  };
  ctx.lineCap = 'round';
  for (const st of m.streets) {
    ctx.strokeStyle = '#8e8a82';
    ctx.lineWidth = Math.max(2, st.width * k);
    ctx.beginPath();
    st.pts.forEach(([x, z], i) => {
      const [sx, sy] = S(x, z);
      if (i) ctx.lineTo(sx, sy);
      else ctx.moveTo(sx, sy);
    });
    ctx.stroke();
  }
  for (const l of m.lots) {
    const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sz]) => S(l.x + (sx * l.w) / 2, l.z + (sz * l.d) / 2));
    ctx.fillStyle = ZONE_COLORS[l.zone] ?? '#dddddd';
    ctx.globalAlpha = l.minor ? 0.55 : 1;
    ctx.strokeStyle = '#5a4a3a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    corners.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  // names only where they fit inside their own lot, so nothing piles up; the directory names the rest
  for (const l of m.lots) {
    if (l.minor) continue;
    const [x, y] = S(l.x, l.z);
    const corners = [[-1, -1], [1, 1], [1, -1], [-1, 1]].map(([sx, sz]) => S(l.x + (sx * l.w) / 2, l.z + (sz * l.d) / 2));
    const wpx = Math.max(...corners.map((p) => p[0])) - Math.min(...corners.map((p) => p[0]));
    const hpx = Math.max(...corners.map((p) => p[1])) - Math.min(...corners.map((p) => p[1]));
    for (let size = 13; size >= 8; size--) {
      ctx.font = font(700, size);
      if (ctx.measureText(l.title).width < wpx - 4 && size < hpx - 2) {
        ctx.fillStyle = '#2b2b2b';
        ctx.fillText(l.title, x, y);
        break;
      }
    }
  }
  const [px, py] = S(m.plaza.x, m.plaza.z);
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#5a4a3a';
  ctx.beginPath();
  ctx.arc(px, py, Math.max(6, m.plaza.r * k), 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.font = font(700, 11);
  ctx.fillStyle = '#2b2b2b';
  ctx.fillText('Plaza', px, py);
  // you are here
  const [yx, yy] = S(hx, hz);
  ctx.fillStyle = '#e0473b';
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(yx, yy, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.font = font(800, 18);
  const tag = 'YOU ARE HERE';
  const tw = ctx.measureText(tag).width + 14;
  const tx = Math.min(pad + mapW - tw / 2, Math.max(pad + tw / 2, yx)), ty = Math.max(top + 12, yy - 24);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(tx - tw / 2, ty - 12, tw, 24);
  ctx.fillStyle = '#e0473b';
  ctx.fillText(tag, tx, ty + 1);

  // the directory: every place by district, in columns
  const x0 = pad + mapW + 34, x1 = W - pad;
  ctx.strokeStyle = '#2b2b2b';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x0 - 16, top);
  ctx.lineTo(x0 - 16, H - pad);
  ctx.stroke();
  const byZone = new Map<string, string[]>();
  for (const l of m.lots) if (!l.minor) byZone.set(l.zone, [...(byZone.get(l.zone) ?? []), l.title]);
  const zones = Object.keys(ZONE_NAMES).filter((z) => byZone.has(z));
  const rows = zones.reduce((n, z) => n + 1.5 + new Set(byZone.get(z)).size, 0);
  // as many columns as it takes to fit, text shrinking a little before adding one
  let cols = 1, line = 16;
  for (; cols < 4; cols++) {
    line = Math.min(16, ((H - top - pad) * cols) / (rows + cols * 1.5));
    if (line >= 11.5) break;
  }
  const colW = (x1 - x0) / cols;
  let col = 0, y = top + line / 2;
  ctx.textAlign = 'left';
  for (const z of zones) {
    const names = [...new Set(byZone.get(z))].sort();
    if (y + line * 2.5 > H - pad && col < cols - 1) {
      col++;
      y = top + line / 2;
    }
    const cx = x0 + col * colW;
    ctx.fillStyle = ZONE_COLORS[z] ?? '#ddd';
    ctx.fillRect(cx, y - line * 0.42, line * 0.9, line * 0.84);
    ctx.strokeStyle = '#5a4a3a';
    ctx.lineWidth = 1;
    ctx.strokeRect(cx, y - line * 0.42, line * 0.9, line * 0.84);
    ctx.font = font(800, line * 0.95);
    ctx.fillStyle = '#2b2b2b';
    ctx.fillText(ZONE_NAMES[z].toUpperCase(), cx + line * 1.2, y + 1);
    y += line * 1.25;
    ctx.font = font(600, line * 0.82);
    for (const nm of names) {
      if (y + line > H - pad && col < cols - 1) {
        col++;
        y = top + line / 2;
      }
      let t = nm;
      while (t.length > 4 && ctx.measureText(t).width > colW - line * 1.4) t = t.slice(0, -2) + '…';
      ctx.fillText(t, x0 + col * colW + line * 0.6, y);
      y += line;
    }
    y += line * 0.25;
  }
  ctx.textAlign = 'center';
  return c;
}
