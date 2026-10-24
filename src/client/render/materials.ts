/**
 * Crayon tiles for structures, drawn once on a canvas per material and tinted per part. Every tile is a light
 * base with darker scribble and ink pattern lines, so multiplying by the part colour gives "that colour, coloured
 * in with crayon". Tiles repeat every `metres`; geometry carries UVs in metres so nothing stretches.
 */
import * as THREE from 'three';
import type { MaterialName } from '../../shared/structure/types';

interface TileSpec {
  metres: number;
  draw: (ctx: CanvasRenderingContext2D, s: number, rnd: () => number) => void;
}

const SIZE = 256;
const INK = 'rgba(40,40,40,0.9)';

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

/** Diagonal crayon strokes: slightly darker streaks that leave the base showing through. */
function scribble(ctx: CanvasRenderingContext2D, s: number, rnd: () => number, strength = 0.1, count = 120, angle = -0.7): void {
  // The shared crayon grain (crayon.ts) now provides the wax texture at a fixed world size; tiles keep only a
  // whisper of their own streaks so patterns with different tile sizes do not fight it.
  strength *= 0.35;
  ctx.save();
  ctx.lineCap = 'round';
  for (let i = 0; i < count; i++) {
    const x = rnd() * s * 1.4 - s * 0.2;
    const y = rnd() * s * 1.4 - s * 0.2;
    const len = 14 + rnd() * 40;
    const a = angle + (rnd() - 0.5) * 0.25;
    ctx.strokeStyle = `rgba(60,50,40,${(strength * (0.5 + rnd())).toFixed(3)})`;
    ctx.lineWidth = 2 + rnd() * 3;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len);
    ctx.stroke();
  }
  ctx.restore();
}

/** A hand-drawn line: slight wobble, so pattern lines do not look ruled. */
function inkLine(ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, rnd: () => number, width = 3): void {
  ctx.strokeStyle = INK;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  const n = 4;
  for (let i = 1; i <= n; i++) {
    const t = i / n;
    const wob = (rnd() - 0.5) * 1.6;
    ctx.lineTo(x0 + (x1 - x0) * t + wob, y0 + (y1 - y0) * t + wob);
  }
  ctx.stroke();
}

const TILES: Record<MaterialName, TileSpec> = {
  plaster: { metres: 2, draw: (c, s, r) => scribble(c, s, r, 0.09, 140) },
  flat: { metres: 2, draw: (c, s, r) => scribble(c, s, r, 0.05, 80) },
  concrete: {
    metres: 2,
    draw: (c, s, r) => {
      scribble(c, s, r, 0.08, 160, 0.2);
      for (let i = 0; i < 90; i++) {
        c.fillStyle = `rgba(40,40,40,${(0.08 + r() * 0.12).toFixed(2)})`;
        c.beginPath();
        c.arc(r() * s, r() * s, 1 + r() * 2.2, 0, Math.PI * 2);
        c.fill();
      }
    },
  },
  brick: {
    metres: 1,
    draw: (c, s, r) => {
      scribble(c, s, r, 0.1, 120);
      const rows = 8;
      const rh = s / rows;
      const bw = s / 4;
      for (let i = 0; i <= rows; i++) inkLine(c, 0, i * rh, s, i * rh, r, 3);
      for (let i = 0; i < rows; i++) {
        const ofs = i % 2 ? bw / 2 : 0;
        for (let x = ofs; x < s + bw; x += bw) inkLine(c, x, i * rh, x, (i + 1) * rh, r, 3);
      }
    },
  },
  plank: {
    metres: 1,
    draw: (c, s, r) => {
      scribble(c, s, r, 0.12, 160, 0.03);
      const rows = 5;
      const rh = s / rows;
      for (let i = 0; i <= rows; i++) inkLine(c, 0, i * rh, s, i * rh, r, 3.5);
      // board ends and knots
      for (let i = 0; i < rows; i++) {
        const x = (r() * 0.8 + 0.1) * s;
        inkLine(c, x, i * rh, x, (i + 1) * rh, r, 2.5);
        if (r() < 0.5) {
          c.fillStyle = 'rgba(40,40,40,0.35)';
          c.beginPath();
          c.ellipse(r() * s, i * rh + rh / 2, 5, 3, 0, 0, Math.PI * 2);
          c.fill();
        }
      }
    },
  },
  shingle: {
    metres: 1,
    draw: (c, s, r) => {
      scribble(c, s, r, 0.1, 120, 0.4);
      const rows = 6;
      const rh = s / rows;
      const sw = s / 5;
      for (let i = 0; i < rows; i++) {
        const y = (i + 1) * rh;
        inkLine(c, 0, y, s, y, r, 3);
        const ofs = i % 2 ? sw / 2 : 0;
        for (let x = ofs; x < s + sw; x += sw) inkLine(c, x, y - rh, x, y, r, 2.5);
      }
    },
  },
  stone: {
    metres: 1.5,
    draw: (c, s, r) => {
      scribble(c, s, r, 0.1, 140, 0.9);
      // rounded cobbles in rows
      const rows = 5;
      const rh = s / rows;
      for (let i = 0; i < rows; i++) {
        let x = i % 2 ? -rh * 0.4 : 0;
        while (x < s) {
          const w = rh * (0.9 + r() * 0.9);
          c.strokeStyle = INK;
          c.lineWidth = 3;
          c.beginPath();
          c.ellipse(x + w / 2, i * rh + rh / 2, w / 2 - 2, rh / 2 - 3, 0, 0, Math.PI * 2);
          c.stroke();
          c.fillStyle = 'rgba(40,40,40,0.08)';
          c.fill();
          x += w;
        }
      }
    },
  },
  thatch: {
    metres: 1,
    draw: (c, s, r) => {
      scribble(c, s, r, 0.14, 260, Math.PI / 2 + 0.15);
      for (let i = 0; i < 70; i++) {
        const x = r() * s;
        const y = r() * s;
        inkLine(c, x, y, x + (r() - 0.5) * 6, y + 14 + r() * 24, r, 1.6);
      }
      const rows = 4;
      for (let i = 1; i <= rows; i++) inkLine(c, 0, (i * s) / rows, s, (i * s) / rows, r, 2.5);
    },
  },
  gingerbread: {
    metres: 1,
    draw: (c, s, r) => {
      scribble(c, s, r, 0.14, 200, 0.5);
      for (let i = 0; i < 120; i++) {
        c.fillStyle = `rgba(40,30,20,${(0.1 + r() * 0.2).toFixed(2)})`;
        c.beginPath();
        c.arc(r() * s, r() * s, 1.5 + r() * 2.5, 0, Math.PI * 2);
        c.fill();
      }
    },
  },
  icing: {
    metres: 1,
    draw: (c, s, r) => {
      scribble(c, s, r, 0.05, 80);
      // scalloped rows
      const rows = 4;
      const rh = s / rows;
      for (let i = 0; i < rows; i++) {
        c.strokeStyle = 'rgba(40,40,40,0.55)';
        c.lineWidth = 2.5;
        c.beginPath();
        const y = (i + 1) * rh;
        for (let x = 0; x <= s; x += rh) c.arc(x + rh / 2, y - rh * 0.35, rh / 2, Math.PI, 0, true);
        c.stroke();
      }
    },
  },
  stripe: {
    metres: 0.5,
    draw: (c, s, r) => {
      scribble(c, s, r, 0.05, 60);
      c.fillStyle = 'rgba(40,40,40,0.55)';
      const n = 4;
      for (let i = 0; i < n; i++) {
        c.beginPath();
        c.moveTo((i * s) / n, 0);
        c.lineTo(((i + 0.5) * s) / n, 0);
        c.lineTo(((i + 0.5) * s) / n + s, s);
        c.lineTo((i * s) / n + s, s);
        c.closePath();
        c.fill();
      }
    },
  },
  glass: {
    metres: 1,
    draw: (c, s, r) => {
      scribble(c, s, r, 0.04, 60);
      c.strokeStyle = 'rgba(255,255,255,0.9)';
      c.lineWidth = 10;
      c.beginPath();
      c.moveTo(s * 0.1, s * 0.9);
      c.lineTo(s * 0.9, s * 0.1);
      c.stroke();
      inkLine(c, s / 2, 0, s / 2, s, r, 3);
      inkLine(c, 0, s / 2, s, s / 2, r, 3);
    },
  },
  metal: {
    metres: 1,
    draw: (c, s, r) => {
      scribble(c, s, r, 0.07, 120, 0.1);
      inkLine(c, 0, s / 2, s, s / 2, r, 2.5);
      for (let i = 0; i < 8; i++) {
        c.fillStyle = 'rgba(40,40,40,0.5)';
        c.beginPath();
        c.arc(((i + 0.5) * s) / 8, s / 2 + (i % 2 ? 10 : -10), 2.5, 0, Math.PI * 2);
        c.fill();
      }
    },
  },
};

export const TILE_METRES: Record<MaterialName, number> = Object.fromEntries(Object.entries(TILES).map(([k, v]) => [k, v.metres])) as Record<MaterialName, number>;

/** Textures by material name, created on first use and shared by every structure. */
export class MaterialTiles {
  private readonly cache = new Map<MaterialName, THREE.Texture>();

  get(name: MaterialName): THREE.Texture {
    const hit = this.cache.get(name);
    if (hit) return hit;
    const spec = TILES[name] ?? TILES.flat;
    const canvas = document.createElement('canvas');
    canvas.width = SIZE;
    canvas.height = SIZE;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, SIZE, SIZE);
    // paper grain
    const r = rng(name.length * 977 + 13);
    for (let i = 0; i < 400; i++) {
      ctx.fillStyle = `rgba(0,0,0,${(r() * 0.05).toFixed(3)})`;
      ctx.fillRect(r() * SIZE, r() * SIZE, 2, 2);
    }
    spec.draw(ctx, SIZE, r);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(1 / spec.metres, 1 / spec.metres);
    tex.anisotropy = 4;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.needsUpdate = true;
    this.cache.set(name, tex);
    return tex;
  }

  dispose(): void {
    for (const t of this.cache.values()) t.dispose();
    this.cache.clear();
  }
}
