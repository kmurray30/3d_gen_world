/**
 * The ground of a world with terrain: a height-grid mesh (the same triangles the engine walks on) coloured by a
 * painted map (grass, sand banks, dirt roads, footpaths, the plaza) times a fine crayon detail tile, shaded by
 * slope through vertex colours, with an ink line where it meets the water. Water is one flat translucent sheet at
 * the water level: wherever the ground dips under it, there is a river or a pond.
 */
import * as THREE from 'three';
import type { TerrainField } from '../../shared/terrain/field';
import { fbm } from '../../shared/terrain/noise';
import { injectTint, tinted } from './tint';

const LIGHT_DIR = new THREE.Vector3(0.45, 0.8, 0.55).normalize();
/** The painted map covers this square (metres either side of the centre); the hills beyond are plain rim green. */
const PAINT_HALF = 84;

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

const mix = (a: number[], b: number[], t: number) => a.map((v, i) => v + (b[i] - v) * Math.max(0, Math.min(1, t)));
const GRASS = [143, 207, 106];
const GRASS_LIGHT = [166, 219, 120];
const GRASS_DARK = [112, 182, 88];
const RIM = [104, 168, 92];
const SAND = [228, 207, 149];
const BED = [150, 170, 140];

export class TerrainView {
  readonly group = new THREE.Group();
  private readonly water: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  private readonly disposables: Array<{ dispose(): void }> = [];

  constructor(
    readonly field: TerrainField,
    coarse: boolean,
  ) {
    const { mesh, geo } = this.buildMesh(coarse);
    this.group.add(mesh);
    this.disposables.push(geo, mesh.material as THREE.Material);
    // the plateau beyond the grid, out to the fog
    const far = new THREE.Mesh(new THREE.RingGeometry(field.size - 12, 420, 64, 1).rotateX(-Math.PI / 2), tinted(new THREE.MeshBasicMaterial({ color: new THREE.Color(`rgb(${RIM.join(',')})`).multiplyScalar(0.95) })));
    far.position.y = field.edge - 0.02;
    this.group.add(far);
    this.disposables.push(far.geometry, far.material);
    // water
    const wtex = waterTile();
    wtex.repeat.set((field.size * 2) / 7, (field.size * 2) / 7);
    const wmat = tinted(new THREE.MeshBasicMaterial({ color: '#7cc6ee', map: wtex, transparent: true, opacity: 0.8, depthWrite: false }));
    this.water = new THREE.Mesh(new THREE.PlaneGeometry(field.size * 2, field.size * 2).rotateX(-Math.PI / 2), wmat);
    this.water.position.y = field.waterLevel;
    this.water.renderOrder = 2;
    this.water.name = 'water';
    this.group.add(this.water);
    this.disposables.push(this.water.geometry, wmat, wtex);
  }

  private buildMesh(coarse: boolean): { mesh: THREE.Mesh; geo: THREE.BufferGeometry } {
    const f = this.field;
    const n = f.n;
    const pos = new Float32Array(n * n * 3);
    const uv = new Float32Array(n * n * 2);
    const col = new Float32Array(n * n * 3);
    const nrm = new THREE.Vector3();
    for (let j = 0; j < n; j++) {
      for (let i = 0; i < n; i++) {
        const k = j * n + i;
        const x = -f.size + i * f.step;
        const z = -f.size + j * f.step;
        pos[k * 3] = x;
        pos[k * 3 + 1] = f.heights[k];
        pos[k * 3 + 2] = z;
        uv[k * 2] = (x + PAINT_HALF) / (2 * PAINT_HALF);
        uv[k * 2 + 1] = (z + PAINT_HALF) / (2 * PAINT_HALF);
        const [nx, ny, nz] = f.normal(x, z);
        nrm.set(nx, ny, nz);
        const lit = nrm.dot(LIGHT_DIR);
        const shade = Math.max(0.62, Math.min(1.08, 0.6 + 0.45 * lit));
        col[k * 3] = col[k * 3 + 1] = col[k * 3 + 2] = shade;
      }
    }
    const idx = new Uint32Array((n - 1) * (n - 1) * 6);
    let p = 0;
    for (let j = 0; j < n - 1; j++) {
      for (let i = 0; i < n - 1; i++) {
        const a = j * n + i;
        const b = a + 1;
        const c = a + n;
        const d = c + 1;
        // same split as TerrainField.height: (a, b, c) and (b, d, c), wound to face up
        idx[p++] = a;
        idx[p++] = c;
        idx[p++] = b;
        idx[p++] = b;
        idx[p++] = c;
        idx[p++] = d;
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    geo.setIndex(new THREE.BufferAttribute(idx, 1));
    geo.computeBoundingSphere();

    const paint = this.paint(coarse ? 1024 : 2048);
    const detail = detailTile();
    this.disposables.push(paint, detail);
    const mat = new THREE.MeshBasicMaterial({ map: paint, vertexColors: true });
    const water = f.waterLevel;
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uDetail = { value: detail };
      shader.uniforms.uWater = { value: water };
      shader.uniforms.uRim = { value: new THREE.Color(`rgb(${RIM.join(',')})`) };
      shader.vertexShader = 'varying vec3 vWPos;\n' + shader.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\nvWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;');
      shader.fragmentShader =
        'varying vec3 vWPos;\nuniform sampler2D uDetail;\nuniform float uWater;\nuniform vec3 uRim;\n' +
        shader.fragmentShader.replace(
          '#include <map_fragment>',
          `#include <map_fragment>
          float outside = smoothstep(${(PAINT_HALF - 3).toFixed(1)}, ${PAINT_HALF.toFixed(1)}, max(abs(vWPos.x), abs(vWPos.z)));
          diffuseColor.rgb = mix(diffuseColor.rgb, uRim, outside);
          diffuseColor.rgb *= texture2D(uDetail, vWPos.xz / 3.2).rgb;
          float shore = 1.0 - smoothstep(0.02, 0.07, abs(vWPos.y - uWater));
          diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.17, 0.17, 0.17), shore * 0.9);`,
        );
      injectTint(shader);
    };
    mat.customProgramCacheKey = () => 'terrain';
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = 'ground';
    return { mesh, geo };
  }

  /** The colour map: ground colours per pixel at low resolution, then roads and paths drawn crisp on top. */
  private paint(size: number): THREE.CanvasTexture {
    const f = this.field;
    const spec = f.spec;
    const low = 320;
    const half = PAINT_HALF;
    const lowCanvas = document.createElement('canvas');
    lowCanvas.width = lowCanvas.height = low;
    const lctx = lowCanvas.getContext('2d')!;
    const img = lctx.createImageData(low, low);
    for (let py = 0; py < low; py++) {
      for (let px = 0; px < low; px++) {
        const x = -half + ((px + 0.5) / low) * 2 * half;
        const z = -half + ((py + 0.5) / low) * 2 * half;
        const h = f.height(x, z);
        const above = h - f.waterLevel;
        const v = fbm(x / 9, z / 9, spec.seed + 3, 3);
        let c = v > 0 ? mix(GRASS, GRASS_LIGHT, v * 1.6) : mix(GRASS, GRASS_DARK, -v * 1.6);
        const r = Math.hypot(x, z);
        c = mix(c, RIM, (r - spec.rimFrom) / 25);
        if (above < 0.75) c = mix(c, SAND, (0.75 - above) / 0.35);
        if (above < 0) c = mix(SAND, BED, -above / 0.9);
        const o = (py * low + px) * 4;
        img.data[o] = c[0];
        img.data[o + 1] = c[1];
        img.data[o + 2] = c[2];
        img.data[o + 3] = 255;
      }
    }
    lctx.putImageData(img, 0, 0);
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(lowCanvas, 0, 0, size, size);
    const m = size / (2 * half); // pixels per metre
    const P = (x: number, z: number): [number, number] => [(x + half) * m, (z + half) * m];
    const r = rng(spec.seed + 11);
    const stroke = (pts: Array<readonly number[]>, width: number, color: string) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = width * m;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      pts.forEach((pt, i) => {
        const [sx, sy] = P(pt[0], pt[1]);
        if (i === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      });
      ctx.stroke();
    };
    const scribble = (pts: Array<readonly number[]>, width: number, color: string, count: number) => {
      ctx.strokeStyle = color;
      ctx.lineCap = 'round';
      for (let i = 0; i + 1 < pts.length; i++) {
        const [ax, az] = pts[i];
        const [bx, bz] = pts[i + 1];
        const len = Math.hypot(bx - ax, bz - az);
        for (let k = 0; k < count * len; k++) {
          const t = r();
          const off = (r() - 0.5) * width * 0.9;
          const dx = (bx - ax) / len;
          const dz = (bz - az) / len;
          const x = ax + (bx - ax) * t - dz * off;
          const z = az + (bz - az) * t + dx * off;
          const [sx, sy] = P(x, z);
          const a = -0.7 + (r() - 0.5) * 0.4;
          const l = (0.3 + r() * 0.5) * m;
          ctx.lineWidth = Math.max(1, m * 0.06);
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.lineTo(sx + Math.cos(a) * l, sy + Math.sin(a) * l);
          ctx.stroke();
        }
      }
    };
    for (const road of spec.roads) {
      stroke(road.pts, road.width + 0.35, '#8a6a3a');
      stroke(road.pts, road.width, '#d8b97f');
      scribble(road.pts, road.width, 'rgba(120,90,50,0.22)', 10);
    }
    for (const path of spec.paths) {
      stroke(path.pts, path.width + 0.25, '#9a7d4c');
      stroke(path.pts, path.width, '#e3cc98');
      scribble(path.pts, path.width, 'rgba(120,90,50,0.18)', 6);
    }
    // plaza: cobbles in a circle
    const plaza = spec.pads.find((p) => p.r !== undefined);
    if (plaza?.r) {
      const [cx, cy] = P(plaza.x, plaza.z);
      ctx.fillStyle = '#7a6a52';
      ctx.beginPath();
      ctx.arc(cx, cy, (plaza.r + 0.25) * m, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#d9caa6';
      ctx.beginPath();
      ctx.arc(cx, cy, plaza.r * m, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(90,75,55,0.45)';
      ctx.lineWidth = Math.max(1, m * 0.06);
      for (let i = 0; i < plaza.r * plaza.r * 3; i++) {
        const a = r() * Math.PI * 2;
        const d = Math.sqrt(r()) * plaza.r * 0.95;
        const [sx, sy] = P(plaza.x + Math.cos(a) * d, plaza.z + Math.sin(a) * d);
        ctx.beginPath();
        ctx.ellipse(sx, sy, 0.28 * m, 0.2 * m, r() * Math.PI, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.flipY = false;
    tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.anisotropy = 8;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.needsUpdate = true;
    return tex;
  }

  update(dt: number): void {
    const map = this.water.material.map;
    if (map) {
      map.offset.x = (map.offset.x + dt * 0.012) % 1;
      map.offset.y = (map.offset.y + dt * 0.006) % 1;
    }
  }

  dispose(): void {
    for (const d of this.disposables) d.dispose();
  }
}

/** Light crayon scribble on white, multiplied over the painted map so grass looks drawn up close. */
function detailTile(): THREE.CanvasTexture {
  const s = 256;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = s;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, s, s);
  const r = rng(5);
  ctx.lineCap = 'round';
  for (let i = 0; i < 220; i++) {
    const x = r() * s;
    const y = r() * s;
    const a = -0.9 + (r() - 0.5) * 0.5;
    const l = 8 + r() * 22;
    ctx.strokeStyle = `rgba(40,70,30,${(0.05 + r() * 0.08).toFixed(3)})`;
    ctx.lineWidth = 2 + r() * 3;
    for (const ox of [-s, 0, s])
      for (const oy of [-s, 0, s]) {
        ctx.beginPath();
        ctx.moveTo(x + ox, y + oy);
        ctx.lineTo(x + ox + Math.cos(a) * l, y + oy + Math.sin(a) * l);
        ctx.stroke();
      }
  }
  // grass ticks
  for (let i = 0; i < 90; i++) {
    const x = r() * s;
    const y = r() * s;
    ctx.strokeStyle = `rgba(30,60,25,${(0.12 + r() * 0.1).toFixed(3)})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (r() - 0.5) * 3, y - 5 - r() * 5);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

/** Wavy crayon lines on white for the water sheet (tinted blue by the material). */
function waterTile(): THREE.CanvasTexture {
  const s = 256;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = s;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, s, s);
  const r = rng(9);
  for (let i = 0; i < 160; i++) {
    const x = r() * s;
    const y = r() * s;
    ctx.strokeStyle = `rgba(20,60,120,${(0.06 + r() * 0.08).toFixed(3)})`;
    ctx.lineWidth = 3 + r() * 4;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 30 + r() * 30, y + (r() - 0.5) * 6);
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.9)';
  ctx.lineWidth = 3;
  for (let i = 0; i < 14; i++) {
    const x = r() * s;
    const y = r() * s;
    const w = 14 + r() * 16;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + w / 4, y - 5, x + w / 2, y);
    ctx.quadraticCurveTo(x + (3 * w) / 4, y + 5, x + w, y);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}
