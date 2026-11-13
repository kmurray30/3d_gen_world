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
import { smoothGeometry } from './toon';
import { toCreasedNormals } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
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

/** One separate piece's geometry, in its piece bone's frame, before merging. */
interface PieceGeo {
  geo: THREE.BufferGeometry;
  bone: number;
  color: THREE.Color;
  ink: boolean;
}

const CREASE = (35 * Math.PI) / 180;

/** Normals averaged over every vertex at the same spot: the outline pushes along these, so it stays closed over
 *  the crisp edges of sharp pieces. */
function weldedNormals(geo: THREE.BufferGeometry): Float32Array {
  const pos = geo.attributes.position, nor = geo.attributes.normal;
  const sum = new Map<string, [number, number, number]>();
  const keyOf = (i: number) => `${Math.round(pos.getX(i) * 1e4)},${Math.round(pos.getY(i) * 1e4)},${Math.round(pos.getZ(i) * 1e4)}`;
  for (let i = 0; i < pos.count; i++) {
    const k = keyOf(i);
    const a = sum.get(k) ?? [0, 0, 0];
    a[0] += nor.getX(i), a[1] += nor.getY(i), a[2] += nor.getZ(i);
    sum.set(k, a);
  }
  const out = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    const a = sum.get(keyOf(i))!;
    const l = Math.hypot(a[0], a[1], a[2]) || 1;
    out.set([a[0] / l, a[1] / l, a[2] / l], i * 3);
  }
  return out;
}

/**
 * Merge pieces into one rigidly skinned geometry (each vertex fully on its piece's bone), in model space at the
 * bind pose. With `outline`, the normals are the welded ones and only inked pieces are included.
 */
function mergePieces(list: PieceGeo[], bones: THREE.Bone[], outline: boolean): THREE.BufferGeometry | null {
  const use = outline ? list.filter((x) => x.ink) : list;
  if (!use.length) return null;
  const n = use.reduce((k, x) => k + x.geo.attributes.position.count, 0);
  const position = new Float32Array(n * 3), normal = new Float32Array(n * 3), color = new Float32Array(n * 3);
  const skinIndex = new Uint16Array(n * 4), skinWeight = new Float32Array(n * 4);
  const v = new THREE.Vector3();
  const nm = new THREE.Matrix3();
  let o = 0;
  for (const x of use) {
    const m = bones[x.bone].matrixWorld;
    nm.getNormalMatrix(m);
    const pos = x.geo.attributes.position;
    const nor = outline ? weldedNormals(x.geo) : (x.geo.attributes.normal.array as Float32Array);
    for (let i = 0; i < pos.count; i++) {
      v.set(pos.getX(i), pos.getY(i), pos.getZ(i)).applyMatrix4(m);
      position.set([v.x, v.y, v.z], (o + i) * 3);
      v.set(nor[i * 3], nor[i * 3 + 1], nor[i * 3 + 2]).applyMatrix3(nm).normalize();
      normal.set([v.x, v.y, v.z], (o + i) * 3);
      color.set([x.color.r, x.color.g, x.color.b], (o + i) * 3);
      skinIndex[(o + i) * 4] = x.bone;
      skinWeight[(o + i) * 4] = 1;
    }
    o += pos.count;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(position, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(normal, 3));
  g.setAttribute('color', new THREE.BufferAttribute(color, 3));
  g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(skinIndex, 4));
  g.setAttribute('skinWeight', new THREE.BufferAttribute(skinWeight, 4));
  g.computeBoundingSphere();
  return g;
}

export class CelFigure {
  /** Figure space: feet at 0, +z is the front. */
  readonly group = new THREE.Group();
  private readonly joints: Joint[] = [];
  private readonly solids: THREE.Mesh[] = [];
  private readonly mats: THREE.Material[] = [];
  private readonly geos: THREE.BufferGeometry[] = [];
  /** Eye piece bones (blinking squashes them). */
  private readonly eyes: THREE.Bone[] = [];
  /** Switchable lights: their mesh and its lit and unlit materials. */
  private readonly lights = new Map<string, { mesh: THREE.Mesh; on: THREE.Material; off: THREE.Material }>();
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

    // details that were not melted in (thin parts, sharp parts, pieces and movers): all plain ones merged into
    // one rigidly skinned mesh with its outline (crisp creased normals on sharp parts), glowing ones into an unlit
    // one; each rides a piece bone of its own, so pieces move, hide and blink by their bones
    const separate = new Set(s.separate);
    const plain: PieceGeo[] = [];
    const glow: PieceGeo[] = [];
    const pieceBones: THREE.Bone[] = [];
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
      const sharp = (p.edge ?? fig.edge) === 'sharp';
      const built = smoothGeometry(p);
      let g = built.geo;
      g.scale(...built.scale);
      if (sharp) {
        const c = toCreasedNormals(g, CREASE);
        if (c !== g) g.dispose();
        g = c;
      }
      if ((p.role === 'label' && p.text) || p.mover?.kind === 'light') {
        // printed cards and switchable lights keep a mesh of their own (a texture; a material that changes)
        const holder = new THREE.Object3D();
        if (p.off) holder.position.set(...p.off);
        if (p.srot) holder.rotation.set(p.srot[0] * DEG, p.srot[1] * DEG, p.srot[2] * DEG, 'XYZ');
        j.bone.add(holder);
        j.holder = holder;
        this.geos.push(g);
        const lit = celMaterial(p.color, false);
        const mat = p.mover?.kind === 'light' ? tinted(new THREE.MeshBasicMaterial({ color: p.color }), true) : lit;
        this.mats.push(lit, mat);
        const mesh = new THREE.Mesh(g, p.mover?.kind === 'light' && !p.mover.on ? lit : mat);
        mesh.userData.entityId = entityId;
        holder.add(mesh);
        this.solids.push(mesh);
        if (p.mover?.kind === 'light') this.lights.set(p.name, { mesh, on: mat, off: lit });
        if (p.role === 'label' && p.text) {
          const face = labelFace(p.text, p.color, p.size);
          this.mats.push(face.material as THREE.Material);
          holder.add(face);
        }
        continue;
      }
      const pb = new THREE.Bone();
      pb.name = `${p.name}#piece`;
      if (p.off) pb.position.set(...p.off);
      if (p.srot) pb.rotation.set(p.srot[0] * DEG, p.srot[1] * DEG, p.srot[2] * DEG, 'XYZ');
      j.bone.add(pb);
      const entry: PieceGeo = { geo: g, bone: pieceBones.length, color: new THREE.Color(p.color), ink: !p.noInk && p.role !== 'glow' && p.role !== 'eye' };
      pieceBones.push(pb);
      if (p.role === 'eye') this.eyes.push(pb);
      (p.role === 'glow' ? glow : plain).push(entry);
    }
    if (pieceBones.length) {
      this.group.updateMatrixWorld(true);
      const skeleton = new THREE.Skeleton(pieceBones);
      const add = (geo: THREE.BufferGeometry | null, mat: THREE.Material, kind: 'solid' | 'line') => {
        if (!geo) return;
        this.geos.push(geo);
        this.mats.push(mat);
        const mesh = new THREE.SkinnedMesh(geo, mat);
        mesh.frustumCulled = false;
        this.group.add(mesh);
        mesh.bind(skeleton);
        if (kind === 'solid') {
          mesh.userData.entityId = entityId;
          this.solids.push(mesh);
        } else this.nearOnly.push(mesh);
      };
      add(mergePieces(plain, pieceBones, false), celMaterial('#ffffff', true), 'solid');
      add(mergePieces(plain, pieceBones, true), outlineMaterial(ink), 'line');
      add(mergePieces(glow, pieceBones, false), tinted(new THREE.MeshBasicMaterial({ color: '#ffffff', vertexColors: true }), true), 'solid');
      for (const x of [...plain, ...glow]) x.geo.dispose();
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
      // a part's size (and a hidden or taken-off part) scales its joint: the part and what hangs off it
      const k = pose.sc?.[j.part.name] ?? j.part.scale;
      j.bone.scale.setScalar(k === undefined ? 1 : Math.max(1e-4, k));
    }
    if (expr !== this.expr) {
      this.expr = expr;
      if (this.face) {
        this.face.map = faceOverlay(this.fig, expr);
        this.face.needsUpdate = true;
      }
      const blink = expr === 'blink';
      for (const b of this.eyes) b.scale.y = blink ? 0.15 : 1;
    }
  }

  /** Switch a light part on or off (lamps, screens, headlights). */
  setLit(part: string, on: boolean): void {
    const l = this.lights.get(part);
    if (l) l.mesh.material = on ? l.on : l.off;
  }

  /** Which light parts it has. */
  get lightParts(): string[] {
    return [...this.lights.keys()];
  }

  dispose(): void {
    for (const m of this.mats) m.dispose();
    for (const g of this.geos) g.dispose();
    if (this.key) release(this.key);
  }
}
