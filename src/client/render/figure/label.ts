/** Printed text for label cards (letters, numbers, signs): black or white ink, whichever reads on the card. */
import * as THREE from 'three';

const cache = new Map<string, THREE.Texture>();

export function inkFor(card: string): string {
  const n = parseInt(card.slice(1), 16);
  const l = 0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255);
  return l > 140 ? '#231f1c' : '#fbf8f0';
}

/** Draw text centred in a box, shrinking the font until it fits (up to two lines). */
export function printText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, w: number, h: number, ink: string): void {
  const words = text.split(/\s+/);
  const lines = words.length > 1 && text.length > 8 ? [words.slice(0, Math.ceil(words.length / 2)).join(' '), words.slice(Math.ceil(words.length / 2)).join(' ')] : [text];
  let size = (h / lines.length) * 0.82;
  ctx.fillStyle = ink;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (;;) {
    ctx.font = `800 ${size}px "Trebuchet MS", "Segoe UI", system-ui, sans-serif`;
    if (Math.max(...lines.map((l) => ctx.measureText(l).width)) <= w * 0.9 || size < 6) break;
    size *= 0.9;
  }
  const lh = size * 1.05;
  lines.forEach((l, i) => ctx.fillText(l, x + w / 2, y + h / 2 + (i - (lines.length - 1) / 2) * lh));
}

/** The text alone on a transparent texture sized to the card's aspect. */
export function labelTexture(text: string, card: string, aspect: number): THREE.Texture {
  const key = `${text}|${card}|${aspect.toFixed(2)}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const W = 256;
  const H = Math.max(16, Math.round(W / Math.max(0.2, aspect)));
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = Math.min(512, H);
  printText(canvas.getContext('2d')!, text, 0, 0, W, canvas.height, inkFor(card));
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  cache.set(key, tex);
  return tex;
}

const PLANE = new THREE.PlaneGeometry(1, 1);

/** A printed face for a label part, to add next to its solid (card front faces +z). */
export function labelFace(text: string, card: string, size: [number, number, number]): THREE.Mesh {
  const mat = new THREE.MeshBasicMaterial({ map: labelTexture(text, card, size[0] / size[1]), transparent: true, alphaTest: 0.3, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 });
  mat.userData.keepTransparent = true;
  const mesh = new THREE.Mesh(PLANE, mat);
  mesh.scale.set(size[0], size[1], 1);
  mesh.position.z = size[2] / 2 + 0.002;
  mesh.renderOrder = 2;
  return mesh;
}
