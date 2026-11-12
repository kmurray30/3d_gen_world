/**
 * Crayon face marks drawn on a canvas once and shared by every puppet: mouths for expressions and talking,
 * eyebrows, and closed-eye arcs. They are only shown when a face changes; a calm face is the original drawing.
 */
import * as THREE from 'three';

export const MOUTHS = ['smile', 'grin', 'frown', 'flat', 'o', 'open', 'talk', 'laugh', 'wavy'] as const;
export type MouthShape = (typeof MOUTHS)[number];
export type InkMark = MouthShape | 'brow' | 'lid' | 'lid_up';

const CELL_W = 128;
const CELL_H = 64;
const INK = '#2a1d17';
const INSIDE = '#7a2a2a';
const TONGUE = '#e7787c';
const COLS = 4;

/** Atlas cells: where each mark is, as UVs (v up). Mouth cells are 2:1. */
export interface InkAtlas {
  texture: THREE.CanvasTexture;
  uv(mark: InkMark): [number, number, number, number];
}

let shared: InkAtlas | null = null;

export function inkAtlas(): InkAtlas {
  if (shared) return shared;
  const marks: InkMark[] = [...MOUTHS, 'brow', 'lid', 'lid_up'];
  const rows = Math.ceil(marks.length / COLS);
  const canvas = document.createElement('canvas');
  canvas.width = CELL_W * COLS;
  canvas.height = CELL_H * rows;
  const ctx = canvas.getContext('2d')!;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const at = new Map<InkMark, [number, number]>();
  marks.forEach((m, i) => {
    const cx = (i % COLS) * CELL_W;
    const cy = Math.floor(i / COLS) * CELL_H;
    at.set(m, [cx, cy]);
    ctx.save();
    ctx.translate(cx, cy);
    draw(ctx, m);
    ctx.restore();
  });
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  shared = {
    texture,
    uv(mark) {
      const [x, y] = at.get(mark)!;
      return [x / canvas.width, 1 - (y + CELL_H) / canvas.height, (x + CELL_W) / canvas.width, 1 - y / canvas.height];
    },
  };
  return shared;
}

/** One mark inside its 128 x 64 cell; mouths are drawn to span most of the cell's width. */
function draw(c: CanvasRenderingContext2D, m: InkMark): void {
  const W = CELL_W;
  const H = CELL_H;
  const stroke = (w = 7) => {
    c.strokeStyle = INK;
    c.lineWidth = w;
    c.stroke();
  };
  // a slight wobble so marks look hand drawn
  const wob = (x: number, y: number, k: number) => [x + Math.sin(k * 7.3) * 1.2, y + Math.cos(k * 5.1) * 1.2] as const;
  switch (m) {
    case 'smile':
      c.beginPath();
      c.moveTo(...wob(14, 20, 1));
      c.quadraticCurveTo(W / 2, 62, W - 14, 20);
      stroke();
      break;
    case 'frown':
      c.beginPath();
      c.moveTo(...wob(16, 48, 2));
      c.quadraticCurveTo(W / 2, 6, W - 16, 48);
      stroke();
      break;
    case 'flat':
      c.beginPath();
      c.moveTo(...wob(22, 34, 3));
      c.lineTo(...wob(W - 22, 31, 4));
      stroke();
      break;
    case 'wavy':
      c.beginPath();
      c.moveTo(18, 34);
      for (let i = 1; i <= 6; i++) c.lineTo(18 + ((W - 36) * i) / 6, 34 + (i % 2 ? -8 : 8));
      stroke(6);
      break;
    case 'o':
      c.beginPath();
      c.ellipse(W / 2, H / 2, 17, 21, 0, 0, Math.PI * 2);
      c.fillStyle = INSIDE;
      c.fill();
      stroke(6);
      break;
    case 'talk':
    case 'open': {
      const ry = m === 'talk' ? 13 : 20;
      c.beginPath();
      c.ellipse(W / 2, H / 2 - 2, 34, ry, 0, 0, Math.PI * 2);
      c.fillStyle = INSIDE;
      c.fill();
      c.save();
      c.clip();
      c.beginPath();
      c.ellipse(W / 2, H / 2 + ry, 24, ry * 0.75, 0, 0, Math.PI * 2);
      c.fillStyle = TONGUE;
      c.fill();
      c.restore();
      c.beginPath();
      c.ellipse(W / 2, H / 2 - 2, 34, ry, 0, 0, Math.PI * 2);
      stroke(6);
      break;
    }
    case 'grin':
    case 'laugh': {
      // a D: flat top lip, round bottom
      const top = m === 'laugh' ? 12 : 18;
      const depth = m === 'laugh' ? 58 : 48;
      c.beginPath();
      c.moveTo(14, top);
      c.lineTo(W - 14, top);
      c.quadraticCurveTo(W / 2, depth + 18, 14, top);
      c.closePath();
      c.fillStyle = INSIDE;
      c.fill();
      c.save();
      c.clip();
      c.fillStyle = '#ffffff';
      c.fillRect(0, top, W, 9);
      c.beginPath();
      c.ellipse(W / 2, depth + 6, 30, 14, 0, 0, Math.PI * 2);
      c.fillStyle = TONGUE;
      c.fill();
      c.restore();
      c.beginPath();
      c.moveTo(14, top);
      c.lineTo(W - 14, top);
      c.quadraticCurveTo(W / 2, depth + 18, 14, top);
      c.closePath();
      stroke(6);
      break;
    }
    case 'brow':
      c.beginPath();
      c.moveTo(...wob(12, 40, 5));
      c.quadraticCurveTo(W / 2, 18, W - 12, 36);
      stroke(11);
      break;
    case 'lid':
      // a closed eye, smiling (^)
      c.beginPath();
      c.moveTo(20, 44);
      c.quadraticCurveTo(W / 2, 4, W - 20, 44);
      stroke(9);
      break;
    case 'lid_up':
      // a closed eye, resting (u)
      c.beginPath();
      c.moveTo(20, 22);
      c.quadraticCurveTo(W / 2, 58, W - 20, 22);
      stroke(9);
      break;
  }
}
