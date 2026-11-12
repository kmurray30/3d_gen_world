/**
 * Cel style: a sculpted model per figure (one continuous, skinned mesh from shared/figure/sculpt) with hard
 * two-tone cel shading, a soft rim light, and an ink outline that follows the skin as it bends. Small, thin and
 * glowing details (eyes, claws, wing membranes, blades, a flame) ride on their bones as smooth pieces of their own.
 *
 * Sculpting takes a few dozen milliseconds per figure, so it runs in a worker; the 3D style stands in until the
 * model arrives, and each model is built once per figure and shared.
 */
import * as THREE from 'three';
import type { Expr, Pose } from '../../../shared/figure/anim';
import type { FigPart, Figure, Vec3 } from '../../../shared/figure/types';
import { getFigure } from '../../../shared/figure/items';
import { bindPose, sculpt, type Sculpt } from '../../../shared/figure/sculpt';
import { chainShaderHook, tinted } from '../tint';
import { drawFace } from './face';
import { shadeOf, smoothGeometry } from './toon';
import { labelFace } from './label';

const DEG = Math.PI / 180;

/* ----- the sculpt cache and its workers ----- */

/**
 * Models are sculpted on demand by a couple of workers, nearest first (each view says how far away it is), and
 * kept in a small LRU: a model nobody is showing is dropped once the cache is over budget, so walking through the
 * thousands of things in the Atlas keeps memory flat.
 */
const ready = new Map<string, Sculpt>();
const lastUse = new Map<string, number>();
const inUse = new Map<string, number>();
const wanted = new Map<string, number>();
const inFlight = new Set<string>();
const workers: Array<{ w: Worker; busy: boolean }> = [];
let workersFailed = false;
let detail = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches ? 0.7 : 1;
const BUDGET = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches ? 90 : 220;
let clock = 0;

/** Lighter models (fewer triangles) for crowded worlds. Call before anything is sculpted. */
export function setSculptDetail(d: number): void {
  detail = d;
}

function startWorkers(): void {
  if (workers.length || workersFailed) return;
  const n = Math.max(1, Math.min(3, (navigator.hardwareConcurrency || 2) - 1));
  try {
    for (let i = 0; i < n; i++) {
      const w = new Worker(new URL('./sculpt-worker.ts', import.meta.url), { type: 'module' });
      const slot = { w, busy: false };
      w.onmessage = (ev: MessageEvent<{ key: string; sculpt?: Sculpt }>) => {
        inFlight.delete(ev.data.key);
        if (ev.data.sculpt) {
          ready.set(ev.data.key, ev.data.sculpt);
          lastUse.set(ev.data.key, clock);
        }
        slot.busy = false;
        pump();
      };
      w.onerror = () => {
        workersFailed = true;
      };
      workers.push(slot);
    }
  } catch {
    workersFailed = true;
  }
}

/** Hand the nearest wanted models to idle workers. */
function pump(): void {
  for (const slot of workers) {
    if (slot.busy) continue;
    let best: string | null = null;
    let bestD = Infinity;
    for (const [k, d] of wanted) if (!inFlight.has(k) && d < bestD) (best = k), (bestD = d);
    if (!best) return;
    wanted.delete(best);
    const fig = getFigure(best);
    if (!fig) continue;
    inFlight.add(best);
    slot.busy = true;
    // the spec travels with the request, so the worker bundle needs no catalog of its own
    slot.w.postMessage({ fig, detail });
  }
}

function sculptHere(key: string): void {
  const fig = getFigure(key);
  if (fig && !ready.has(key)) ready.set(key, sculpt(fig, { detail }));
}

/** The sculpted model for a figure if it is ready; otherwise asks for it, `distance` away from the camera. */
export function sculptFor(key: string, distance = 0): Sculpt | null {
  clock++;
  const hit = ready.get(key);
  if (hit) {
    lastUse.set(key, clock);
    return hit;
  }
  startWorkers();
  if (workersFailed) {
    if (!inFlight.has(key)) {
      inFlight.add(key);
      setTimeout(() => {
        sculptHere(key);
        inFlight.delete(key);
      }, 0);
    }
    return null;
  }
  if (!inFlight.has(key)) wanted.set(key, Math.min(distance, wanted.get(key) ?? Infinity));
  pump();
  return null;
}

/** A view stopped wanting a model (it was culled before the model arrived). */
export function unwantSculpt(key: string): void {
  wanted.delete(key);
}

function retain(key: string): void {
  inUse.set(key, (inUse.get(key) ?? 0) + 1);
}

function release(key: string): void {
  const n = (inUse.get(key) ?? 1) - 1;
  if (n > 0) inUse.set(key, n);
  else inUse.delete(key);
  evict();
}

/** Drop the least recently used models nobody is showing, down to the budget. */
function evict(): void {
  if (ready.size <= BUDGET) return;
  const idle = [...ready.keys()].filter((k) => !inUse.has(k)).sort((a, b) => (lastUse.get(a) ?? 0) - (lastUse.get(b) ?? 0));
  for (const k of idle) {
    if (ready.size <= BUDGET) break;
    ready.delete(k);
    lastUse.delete(k);
    const g = geoCache.get(k);
    if (g) {
      g.dispose();
      geoCache.delete(k);
    }
  }
}

/* ----- materials ----- */

let ramp: THREE.DataTexture | null = null;
/** Hard cel ramp: shadow and light, nothing in between. */
function celRamp(): THREE.DataTexture {
  if (ramp) return ramp;
  ramp = new THREE.DataTexture(new Uint8Array([158, 158, 158, 255, 255, 255, 255, 255]), 2, 1, THREE.RGBAFormat);
  ramp.minFilter = ramp.magFilter = THREE.NearestFilter;
  ramp.needsUpdate = true;
  return ramp;
}

/**
 * Cel shading of its own, independent of the soft sky fill the other styles use: each surface is either lit by the
 * sun or in shadow, with a crisp edge between, the shadow a cooler shade of the colour (the way painted anime and
 * Breath of the Wild style shadows go blue), and a thin rim of light along lit edges.
 */
function celMaterial(color: string, vertexColors: boolean): THREE.MeshToonMaterial {
  const mat = new THREE.MeshToonMaterial({ color: vertexColors ? '#ffffff' : color, vertexColors, gradientMap: celRamp() });
  chainShaderHook(mat, 'cel-light', (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      'vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;',
      `#if NUM_DIR_LIGHTS > 0
  float celN = dot( normal, directionalLights[ 0 ].direction );
#else
  float celN = 1.0;
#endif
  float celLit = smoothstep( -0.03, 0.05, celN );
  vec3 outgoingLight = mix( diffuseColor.rgb * vec3( 0.56, 0.6, 0.76 ), diffuseColor.rgb, celLit ) + totalEmissiveRadiance;
  float celRim = 1.0 - clamp( dot( normalize( vViewPosition ), normal ), 0.0, 1.0 );
  outgoingLight += diffuseColor.rgb * 0.32 * smoothstep( 0.62, 0.9, celRim ) * celLit;`,
    );
  });
  return tinted(mat);
}

/** Ink outline for a skinned mesh: the back faces pushed out along the (skinned) normal, in a dark shade of the
 *  local colour. `width` is in figure metres. */
function outlineMaterial(width: number): THREE.MeshBasicMaterial {
  const mat = new THREE.MeshBasicMaterial({ color: '#3a3330', vertexColors: true, side: THREE.BackSide });
  const uWidth = { value: width };
  chainShaderHook(mat, 'cel-outline', (shader) => {
    shader.uniforms.uOutline = uWidth;
    shader.vertexShader = 'uniform float uOutline;\n' + shader.vertexShader.replace('#include <skinning_vertex>', '#include <skinning_vertex>\ntransformed += normalize(objectNormal) * uOutline;');
  });
  return tinted(mat);
}

/** The face drawn on a transparent sphere texture (front at u = 0.25), laid just over the sculpted head. */
const faceCache = new Map<string, THREE.Texture>();
function faceOverlay(fig: Figure, expr: Expr): THREE.Texture {
  const key = `${fig.key}|${expr}`;
  const hit = faceCache.get(key);
  if (hit) return hit;
  const W = 512, H = 256;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const fw = W * 0.3, fh = H * 0.62;
  if (fig.face) drawFace(canvas.getContext('2d')!, W * 0.25 - fw / 2, H * 0.5 - fh / 2 + H * 0.02, fw, fh, { ...fig.face, blush: fig.face.blush }, expr);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  faceCache.set(key, tex);
  return tex;
}

/** One geometry per figure, shared by every copy of it. */
const geoCache = new Map<string, THREE.BufferGeometry>();
function skinGeometry(key: string, s: Sculpt): THREE.BufferGeometry {
  const hit = geoCache.get(key);
  if (hit) return hit;
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(s.positions, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(s.normals, 3));
  g.setAttribute('color', new THREE.BufferAttribute(s.colors, 3));
  g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(s.skinIndex, 4));
  g.setAttribute('skinWeight', new THREE.BufferAttribute(s.skinWeight, 4));
  g.setIndex(new THREE.BufferAttribute(s.indices, 1));
  g.computeBoundingSphere();
  geoCache.set(key, g);
  return g;
}

interface Joint {
  part: FigPart;
  bone: THREE.Bone;
  holder: THREE.Object3D | null;
  rest: Vec3;
  at: Vec3;
}

export class CelFigure {
  /** Figure space: feet at 0, +z is the front. */
  readonly group = new THREE.Group();
  private readonly joints: Joint[] = [];
  private readonly solids: THREE.Mesh[] = [];
  private readonly mats: THREE.Material[] = [];
  private readonly geos: THREE.BufferGeometry[] = [];
  private readonly eyes: THREE.Mesh[] = [];
  private face: THREE.MeshBasicMaterial | null = null;
  private expr: Expr = 'neutral';
  private key = '';
  /** Ink and tiny details: a few pixels when the figure is far away, but each still costs a draw call. */
  private readonly nearOnly: THREE.Object3D[] = [];
  private far = false;

  constructor(
    readonly fig: Figure,
    entityId: string,
    s: Sculpt,
  ) {
    const H = fig.heightM;
    const ink = Math.min(0.03, Math.max(0.004, H * 0.009));
    // a bone per part, bound in the pose the model was sculpted in (arms out), then posed like the joints of
    // the other styles
    const bind = bindPose(fig);
    const bones = new Map<string, THREE.Bone>();
    for (const p of fig.parts) {
      const bone = new THREE.Bone();
      bone.name = p.name;
      bone.position.set(...p.at);
      const rest: Vec3 = p.rot ?? [0, 0, 0];
      const b = bind[p.name] ?? [0, 0, 0];
      bone.rotation.set((rest[0] + b[0]) * DEG, (rest[1] + b[1]) * DEG, (rest[2] + b[2]) * DEG, 'XYZ');
      bones.set(p.name, bone);
      this.joints.push({ part: p, bone, holder: null, rest, at: p.at });
    }
    for (const p of fig.parts) {
      const parent = p.parent ? bones.get(p.parent) : undefined;
      (parent ?? this.group).add(bones.get(p.name)!);
    }
    // the sculpted skin and its outline (shared by every copy of this figure)
    const geo = skinGeometry(fig.key, s);
    retain(fig.key);
    this.key = fig.key;
    const skinMat = celMaterial('#ffffff', true);
    const lineMat = outlineMaterial(ink);
    this.mats.push(skinMat, lineMat);
    const skin = new THREE.SkinnedMesh(geo, skinMat);
    const line = new THREE.SkinnedMesh(geo, lineMat);
    for (const m of [skin, line]) {
      m.frustumCulled = false;
      this.group.add(m);
    }
    skin.userData.entityId = entityId;
    this.solids.push(skin);
    this.nearOnly.push(line);
    this.group.updateMatrixWorld(true);
    const skeleton = new THREE.Skeleton(s.bones.map((n) => bones.get(n)!));
    skin.bind(skeleton);
    line.bind(skeleton);

    // details that were not melted in ride on their bones as smooth pieces
    const separate = new Set(s.separate);
    for (const j of this.joints) {
      const p = j.part;
      if (p.only === 'paper' && p.role !== 'face') continue;
      if (p.role === 'face') {
        if (!fig.face) continue;
        const mat = tinted(new THREE.MeshBasicMaterial({ map: faceOverlay(fig, 'neutral'), transparent: true, alphaTest: 0.3, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 }));
        mat.userData.keepTransparent = true;
        this.mats.push(mat);
        this.face = mat;
        const ball = new THREE.SphereGeometry(0.5, 40, 24);
        this.geos.push(ball);
        const mesh = new THREE.Mesh(ball, mat);
        mesh.scale.set(p.size[0] * 1.035, p.size[1] * 1.035, p.size[2] * 1.035);
        mesh.renderOrder = 2;
        this.nearOnly.push(mesh);
        const holder = new THREE.Object3D();
        if (p.off) holder.position.set(...p.off);
        holder.add(mesh);
        j.bone.add(holder);
        continue;
      }
      if (!separate.has(p.name)) continue;
      const holder = new THREE.Object3D();
      if (p.off) holder.position.set(...p.off);
      if (p.srot) holder.rotation.set(p.srot[0] * DEG, p.srot[1] * DEG, p.srot[2] * DEG, 'XYZ');
      j.bone.add(holder);
      j.holder = holder;
      const { geo: g, scale } = smoothGeometry(p);
      this.geos.push(g);
      const mat = p.role === 'glow' ? tinted(new THREE.MeshBasicMaterial({ color: p.color }), true) : celMaterial(p.color, false);
      this.mats.push(mat);
      const mesh = new THREE.Mesh(g, mat);
      mesh.scale.set(...scale);
      mesh.userData.entityId = entityId;
      holder.add(mesh);
      this.solids.push(mesh);
      if (Math.max(...p.size) < fig.heightM * 0.06) this.nearOnly.push(mesh);
      if (p.role === 'eye') {
        mesh.userData.baseY = mesh.scale.y;
        this.eyes.push(mesh);
      }
      if (p.role === 'label' && p.text) {
        const face = labelFace(p.text, p.color, p.size);
        this.mats.push(face.material as THREE.Material);
        holder.add(face);
      }
      if (!p.noInk && p.role !== 'glow') {
        const omat = tinted(new THREE.MeshBasicMaterial({ color: shadeOf(p.color, 0.3), side: THREE.BackSide }));
        this.mats.push(omat);
        const shell = new THREE.Mesh(g, omat);
        this.nearOnly.push(shell);
        shell.scale.set(scale[0] * (1 + (2 * ink) / Math.max(0.01, p.size[0])), scale[1] * (1 + (2 * ink) / Math.max(0.01, p.size[1])), scale[2] * (1 + (2 * ink) / Math.max(0.01, p.size[2])));
        holder.add(shell);
      }
      if (p.scale !== undefined) {
        holder.scale.setScalar(Math.max(1e-4, p.scale));
        holder.visible = p.scale > 0.001;
      }
    }
  }

  get pickables(): THREE.Object3D[] {
    return this.solids;
  }

  /** Far away: drop the outline, the face, ink shells and tiny details (fewer draw calls where nobody can see them). */
  setFar(far: boolean): void {
    if (far === this.far) return;
    this.far = far;
    for (const o of this.nearOnly) o.visible = !far;
  }

  setOpacity(alpha: number): void {
    for (const m of this.mats) {
      m.transparent = alpha < 1 || m.userData.keepTransparent === true;
      m.opacity = alpha;
    }
  }

  update(pose: Pose, expr: Expr): void {
    this.group.position.set(...pose.root);
    this.group.rotation.set(pose.rootRot[0] * DEG, pose.rootRot[1] * DEG, pose.rootRot[2] * DEG, 'XYZ');
    for (const j of this.joints) {
      const d = pose.j[j.part.name];
      j.bone.rotation.set((j.rest[0] + (d?.[0] ?? 0)) * DEG, (j.rest[1] + (d?.[1] ?? 0)) * DEG, (j.rest[2] + (d?.[2] ?? 0)) * DEG, 'XYZ');
      const t = pose.t?.[j.part.name];
      j.bone.position.set(j.at[0] + (t?.[0] ?? 0), j.at[1] + (t?.[1] ?? 0), j.at[2] + (t?.[2] ?? 0));
      if (j.holder) {
        const k = pose.sc?.[j.part.name];
        if (k !== undefined || j.part.scale !== undefined) {
          const size = k ?? j.part.scale ?? 1;
          j.holder.scale.setScalar(Math.max(1e-4, size));
          j.holder.visible = size > 0.001;
        }
      }
    }
    if (expr !== this.expr) {
      this.expr = expr;
      if (this.face) {
        this.face.map = faceOverlay(this.fig, expr);
        this.face.needsUpdate = true;
      }
      const blink = expr === 'blink';
      for (const e of this.eyes) e.scale.y = (e.userData.baseY as number) * (blink ? 0.15 : 1);
    }
  }

  dispose(): void {
    for (const m of this.mats) m.dispose();
    for (const g of this.geos) g.dispose();
    if (this.key) release(this.key);
  }
}
