/**
 * Drawn things that stand as simple solids instead of flat paper:
 *  - RoundDecor turns the drawing's own outline into a ten-sided solid (a lathe): each row of the picture becomes
 *    a ring as wide as the drawing is at that height. Its texture is mapped from the viewer's side, so from any
 *    direction the front shows the drawing, while the silhouette, depth and facet shading are truly 3D.
 *  - CrossDecor stands two copies of the drawing crossed at right angles, like the paper trees.
 * analyseSprite reads a drawing's outline once (and judges whether it is symmetric enough to turn).
 */
import * as THREE from 'three';
import { tinted, chainShaderHook } from './tint';

const SIDES = 10;
const ROWS = 40;
const LIGHT = new THREE.Vector3(0.45, 0.8, 0.55).normalize();

export interface SpriteProfile {
  /** Half-width of the drawing per row, bottom to top, as a fraction of the picture's half-width (0..1). */
  radii: number[];
  /** How mirror-symmetric the drawing is about its middle (0..1). */
  symmetry: number;
}

const profiles = new Map<string, SpriteProfile | null>();

/** Outline of a loaded sprite texture; null when its pixels cannot be read. Cached per image. */
export function analyseSprite(tex: THREE.Texture): SpriteProfile | null {
  const img = tex.image as (HTMLImageElement | ImageBitmap | HTMLCanvasElement) & { src?: string; width: number; height: number } | undefined;
  if (!img || !img.width || !img.height) return null;
  const key = img.src ?? tex.uuid;
  if (profiles.has(key)) return profiles.get(key)!;
  let result: SpriteProfile | null = null;
  try {
    const h = Math.min(160, img.height);
    const w = Math.max(8, Math.round((img.width / img.height) * h));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
    ctx.drawImage(img as CanvasImageSource, 0, 0, w, h);
    const data = ctx.getImageData(0, 0, w, h).data;
    const solid = (x: number, y: number) => data[(y * w + x) * 4 + 3] > 110;
    const cx = (w - 1) / 2;
    const radii: number[] = [];
    let match = 0;
    let total = 0;
    for (let k = 0; k < ROWS; k++) {
      // rows bottom to top; average a small band so thin lines do not vanish between samples
      const y0 = Math.floor(h - 1 - (k / ROWS) * h);
      const y1 = Math.max(0, Math.floor(h - 1 - ((k + 1) / ROWS) * h));
      let left = Infinity;
      let right = -Infinity;
      for (let y = y1; y <= y0; y++) {
        for (let x = 0; x < w; x++) {
          if (!solid(x, y)) continue;
          if (x < left) left = x;
          if (x > right) right = x;
          total++;
          if (solid(Math.round(2 * cx - x), y)) match++;
        }
      }
      const half = right >= left ? Math.max(cx - left, right - cx) + 0.5 : 0;
      radii.push(Math.min(1, half / (w / 2)));
    }
    // a gentle smoothing so the solid does not stair-step between rows
    const smooth = radii.map((r, i) => (i === 0 || i === radii.length - 1 ? r : Math.max(r, (radii[i - 1] + 2 * r + radii[i + 1]) / 4)));
    result = { radii: smooth, symmetry: total ? match / total : 0 };
  } catch {
    result = null;
  }
  profiles.set(key, result);
  return result;
}

/** Symmetric enough that turning it round looks like the same thing. */
export function canTurn(p: SpriteProfile | null): boolean {
  return !!p && p.symmetry >= 0.8 && p.radii.some((r) => r > 0.05);
}

/**
 * Map the sprite from the viewer's side: u is the point's sideways offset from the object's axis as seen from
 * the camera, so the visible half always reads as the drawing.
 */
function viewMappedUv(m: THREE.Material): void {
  chainShaderHook(m, 'turned', (shader) => {
    shader.vertexShader = shader.vertexShader.replace(
      '#include <uv_vertex>',
      `#include <uv_vertex>
      {
        vec3 wp = (modelMatrix * vec4(position, 1.0)).xyz;
        vec3 c = (modelMatrix * vec4(0.0, position.y, 0.0, 1.0)).xyz;
        vec2 toCam = normalize(cameraPosition.xz - c.xz + vec2(1e-5));
        vec2 right = vec2(toCam.y, -toCam.x);
        float width = length(modelMatrix[0].xyz);
        vMapUv = vec2(0.5 + dot(wp.xz - c.xz, right) / width, uv.y);
      }`,
    );
  });
}

export class RoundDecor {
  readonly group = new THREE.Group();
  private readonly mesh: THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>;

  constructor(id: string, tex: THREE.Texture, profile: SpriteProfile) {
    const pos: number[] = [];
    const uv: number[] = [];
    const col: number[] = [];
    const idx: number[] = [];
    const radii = profile.radii;
    const n = radii.length;
    const ring = (k: number, j: number): [number, number, number] => {
      const a = (j / SIDES) * Math.PI * 2 + Math.PI / SIDES;
      const r = radii[k] * 0.5;
      return [Math.cos(a) * r, k / (n - 1), Math.sin(a) * r];
    };
    const quad = (a: number[], b: number[], c: number[], d: number[], v0: number, v1: number) => {
      // flat-shaded facet: its own four corners and one shade
      const e1 = new THREE.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
      const e2 = new THREE.Vector3(d[0] - a[0], d[1] - a[1], d[2] - a[2]);
      const nrm = new THREE.Vector3().crossVectors(e2, e1).normalize();
      const shade = Math.max(0.68, Math.min(1.05, 0.62 + 0.45 * Math.max(0, nrm.dot(LIGHT))));
      const base = pos.length / 3;
      for (const [p, v] of [
        [a, v0],
        [b, v0],
        [c, v1],
        [d, v1],
      ] as Array<[number[], number]>) {
        pos.push(p[0], p[1], p[2]);
        uv.push(0.5, v);
        col.push(shade, shade, shade);
      }
      idx.push(base, base + 2, base + 1, base, base + 3, base + 2);
    };
    for (let k = 0; k + 1 < n; k++) {
      if (radii[k] < 0.01 && radii[k + 1] < 0.01) continue;
      for (let j = 0; j < SIDES; j++) quad(ring(k, j), ring(k, j + 1), ring(k + 1, j + 1), ring(k + 1, j), k / (n - 1), (k + 1) / (n - 1));
    }
    // a lid on the topmost ring that has any width
    let top = n - 1;
    while (top > 0 && radii[top] < 0.01) top--;
    if (radii[top] > 0.01) {
      const centre = pos.length / 3;
      pos.push(0, top / (n - 1), 0);
      uv.push(0.5, top / (n - 1));
      col.push(1, 1, 1);
      for (let j = 0; j < SIDES; j++) {
        const p = ring(top, j);
        pos.push(p[0], p[1], p[2]);
        uv.push(0.5, top / (n - 1));
        col.push(1, 1, 1);
      }
      for (let j = 0; j < SIDES; j++) idx.push(centre, centre + 1 + ((j + 1) % SIDES), centre + 1 + j);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    geo.setIndex(idx);
    geo.computeBoundingSphere();
    const mat = new THREE.MeshBasicMaterial({ map: tex, vertexColors: true, transparent: true, alphaTest: 0.4, side: THREE.DoubleSide });
    viewMappedUv(mat);
    tinted(mat);
    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.userData.entityId = id;
    this.group.add(this.mesh);
  }

  /** Size the solid: w is the drawing's full width (the widest ring's diameter), h its height. */
  layout(w: number, h: number, opacity: number, tiltRad: number): void {
    this.mesh.scale.set(w, h, w);
    this.mesh.material.opacity = opacity;
    this.group.rotation.z = tiltRad;
  }

  get pickables(): THREE.Object3D[] {
    return [this.mesh];
  }

  dispose(): void {
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
  }
}

const PLANE = new THREE.PlaneGeometry(1, 1).translate(0, 0.5, 0);

export class CrossDecor {
  readonly group = new THREE.Group();
  private readonly sheets: Array<THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>> = [];

  constructor(id: string) {
    for (const [turn, shade] of [
      [0, 1],
      [Math.PI / 2, 0.86],
    ]) {
      const mat = tinted(new THREE.MeshBasicMaterial({ transparent: true, alphaTest: 0.4, side: THREE.DoubleSide, color: new THREE.Color(shade, shade, shade) }));
      const m = new THREE.Mesh(PLANE, mat);
      m.rotation.y = turn;
      m.userData.entityId = id;
      this.sheets.push(m);
      this.group.add(m);
    }
  }

  setMap(tex: THREE.Texture): void {
    for (const s of this.sheets) {
      if (s.material.map !== tex) {
        s.material.map = tex;
        s.material.needsUpdate = true;
      }
    }
  }

  layout(w: number, h: number, opacity: number, yawRad: number, tiltRad: number, mirror: boolean): void {
    this.group.rotation.set(0, yawRad, tiltRad, 'YXZ');
    for (const s of this.sheets) {
      s.scale.set(mirror ? -w : w, h, 1);
      s.material.opacity = opacity;
    }
  }

  get pickables(): THREE.Object3D[] {
    return this.sheets;
  }

  dispose(): void {
    for (const s of this.sheets) s.material.dispose();
  }
}
