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

const DEG = Math.PI / 180;

/* ----- the sculpt cache and its worker ----- */

const ready = new Map<string, Sculpt>();
/** Phones get lighter models (about half the triangles). */
const DETAIL = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches ? 0.7 : 1;
const asked = new Set<string>();
let worker: Worker | null | undefined;

function startWorker(): Worker | null {
  if (worker !== undefined) return worker;
  try {
    worker = new Worker(new URL('./sculpt-worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (ev: MessageEvent<{ key: string; sculpt?: Sculpt }>) => {
      if (ev.data.sculpt) ready.set(ev.data.key, ev.data.sculpt);
    };
    worker.onerror = () => {
      worker = null;
      for (const k of asked) if (!ready.has(k)) setTimeout(() => sculptHere(k), 0);
    };
  } catch {
    worker = null;
  }
  return worker;
}

function sculptHere(key: string): void {
  const fig = getFigure(key);
  if (fig && !ready.has(key)) ready.set(key, sculpt(fig, { detail: DETAIL }));
}

/** The sculpted model for a figure if it is ready; asks for it otherwise. */
export function sculptFor(key: string): Sculpt | null {
  const hit = ready.get(key);
  if (hit) return hit;
  if (!asked.has(key)) {
    asked.add(key);
    const w = startWorker();
    if (w) w.postMessage({ key, detail: DETAIL });
    else setTimeout(() => sculptHere(key), 0);
  }
  return null;
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
    // the sculpted skin and its outline
    const geo = skinGeometry(fig.key, s);
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
      if (p.role === 'eye') {
        mesh.userData.baseY = mesh.scale.y;
        this.eyes.push(mesh);
      }
      if (!p.noInk && p.role !== 'glow') {
        const omat = tinted(new THREE.MeshBasicMaterial({ color: shadeOf(p.color, 0.3), side: THREE.BackSide }));
        this.mats.push(omat);
        const shell = new THREE.Mesh(g, omat);
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
  }
}
