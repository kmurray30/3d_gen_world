/**
 * 3D style: each part is its solid (sphere, capsule, rounded box, cylinder, cone, ring, gable prism) with a soft
 * three-band toon ramp, a little rim light and an outline drawn as a slightly larger back-facing copy in a darker
 * shade of the part's colour. Joints are real pivots, so the same clips that drive the paper cutouts pose it.
 */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import type { Expr, Pose } from '../../../shared/figure/anim';
import type { FigPart, Figure, Vec3 } from '../../../shared/figure/types';
import { drawFace } from './face';
import { chainShaderHook, tinted } from '../tint';

const DEG = Math.PI / 180;

let ramp: THREE.DataTexture | null = null;
function gradientMap(): THREE.DataTexture {
  if (ramp) return ramp;
  const data = new Uint8Array([150, 150, 150, 255, 205, 205, 205, 255, 255, 255, 255, 255]);
  ramp = new THREE.DataTexture(data, 3, 1, THREE.RGBAFormat);
  ramp.minFilter = THREE.NearestFilter;
  ramp.magFilter = THREE.NearestFilter;
  ramp.needsUpdate = true;
  return ramp;
}

function toonMaterial(color: string, map?: THREE.Texture): THREE.MeshToonMaterial {
  const mat = new THREE.MeshToonMaterial({ color: map ? '#ffffff' : color, map: map ?? null, gradientMap: gradientMap() });
  // a soft rim of light on edges facing away from the camera, like painted highlights; then the time-of-day tint
  chainShaderHook(mat, 'toon-rim', (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <opaque_fragment>',
      'float rimK = 1.0 - clamp(dot(normalize(vViewPosition), normal), 0.0, 1.0);\n outgoingLight += diffuseColor.rgb * 0.35 * pow(rimK, 3.0);\n#include <opaque_fragment>',
    );
  });
  return tinted(mat);
}

function outlineColor(hex: string): THREE.Color {
  const c = new THREE.Color(hex);
  const hsl = { h: 0, s: 0, l: 0 };
  c.getHSL(hsl);
  return new THREE.Color().setHSL(hsl.h, Math.min(1, hsl.s * 0.9), Math.max(0.06, hsl.l * 0.32));
}

/** A gable prism: triangle across x (base w at y = -h/2, apex at +h/2), along z. */
function wedgeGeometry(w: number, h: number, d: number): THREE.BufferGeometry {
  const x = w / 2, y = h / 2, z = d / 2;
  const A: Vec3 = [-x, -y, z], B: Vec3 = [x, -y, z], C: Vec3 = [0, y, z];
  const A2: Vec3 = [-x, -y, -z], B2: Vec3 = [x, -y, -z], C2: Vec3 = [0, y, -z];
  const tris: Vec3[] = [A, B, C, B2, A2, C2, A, C, C2, A, C2, A2, B, B2, C2, B, C2, C, A, A2, B2, A, B2, B];
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(tris.flat(), 3));
  g.computeVertexNormals();
  return g;
}

/** Geometry for a part at its actual size, plus the scale that turns it into its outline shell. */
function geometryFor(p: FigPart): { geo: THREE.BufferGeometry; scale: Vec3 } {
  const [w, h, d] = p.size;
  switch (p.shape) {
    case 'ball':
      return { geo: new THREE.SphereGeometry(0.5, 28, 18), scale: [w, h, d] };
    case 'capsule': {
      if (h <= w) return { geo: new THREE.SphereGeometry(0.5, 24, 16), scale: [w, h, d] };
      const geo = new THREE.CapsuleGeometry(w / 2, h - w, 6, 16);
      return { geo, scale: [1, 1, d / w] };
    }
    case 'box': {
      const r = Math.min(w, h, d) * 0.5 * Math.min(0.98, p.round ?? 0);
      const geo = r > 0.001 ? new RoundedBoxGeometry(w, h, d, 3, r) : new THREE.BoxGeometry(w, h, d);
      return { geo, scale: [1, 1, 1] };
    }
    case 'cyl': {
      const n = p.segs ?? 24;
      const geo = new THREE.CylinderGeometry((w / 2) * (p.taper ?? 1), w / 2, h, n, 1, false, p.segs ? Math.PI / 2 - Math.PI / n : 0);
      return { geo, scale: [1, 1, d / w] };
    }
    case 'torus': {
      const r = (p.tube ?? 0.25) * (w / 2);
      const geo = new THREE.TorusGeometry(w / 2 - r, r, 10, 32);
      return { geo, scale: [1, h / w, d / (2 * r)] };
    }
    case 'wedge':
      return { geo: wedgeGeometry(w, h, d), scale: [1, 1, 1] };
  }
}

/** Paint a face onto an equirectangular head texture (the front of a Three sphere is at u = 0.25). */
function headTexture(fig: Figure, skin: string, expr: Expr, cache: Map<string, THREE.Texture>): THREE.Texture {
  const key = `${fig.key}|${expr}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const W = 512, H = 256;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = skin;
  ctx.fillRect(0, 0, W, H);
  // the face spans ~110 degrees across and down the front
  const fw = W * 0.3;
  const fh = H * 0.62;
  if (fig.face) drawFace(ctx, W * 0.25 - fw / 2, H * 0.5 - fh / 2 + H * 0.02, fw, fh, fig.face, expr);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  cache.set(key, tex);
  return tex;
}

const faceCache = new Map<string, THREE.Texture>();

interface Joint {
  part: FigPart;
  node: THREE.Object3D;
  rest: Vec3;
  at: Vec3;
  meshes: THREE.Mesh[];
}

export class ToonFigure {
  /** Figure space: feet at 0, +z is the front. */
  readonly group = new THREE.Group();
  private readonly joints: Joint[] = [];
  private readonly solids: THREE.Mesh[] = [];
  private readonly mats: THREE.Material[] = [];
  private readonly eyes: THREE.Mesh[] = [];
  private head: { mat: THREE.MeshToonMaterial; skin: string } | null = null;
  private expr: Expr = 'neutral';

  constructor(
    readonly fig: Figure,
    entityId: string,
  ) {
    const nodes = new Map<string, THREE.Object3D>();
    const outline = Math.min(0.025, Math.max(0.003, fig.heightM * 0.0085));
    const parts = fig.parts.filter((p) => p.only !== 'paper');
    const byName = new Map(parts.map((p) => [p.name, p]));
    const build = (p: FigPart): THREE.Object3D => {
      const have = nodes.get(p.name);
      if (have) return have;
      const parent = p.parent && byName.has(p.parent) ? build(byName.get(p.parent)!) : this.group;
      const node = new THREE.Object3D();
      node.position.set(...p.at);
      const rest: Vec3 = p.rot ?? [0, 0, 0];
      node.rotation.set(rest[0] * DEG, rest[1] * DEG, rest[2] * DEG, 'XYZ');
      parent.add(node);
      nodes.set(p.name, node);
      const { geo, scale } = geometryFor(p);
      const holder = new THREE.Object3D();
      if (p.off) holder.position.set(...p.off);
      if (p.srot) holder.rotation.set(p.srot[0] * DEG, p.srot[1] * DEG, p.srot[2] * DEG, 'XYZ');
      node.add(holder);
      let mat: THREE.Material;
      if (p.role === 'glow') mat = tinted(new THREE.MeshBasicMaterial({ color: p.color }), true);
      else if (p.role === 'head' && fig.face) {
        const m = toonMaterial(p.color, headTexture(fig, p.color, 'neutral', faceCache));
        this.head = { mat: m, skin: p.color };
        mat = m;
      } else mat = toonMaterial(p.color);
      this.mats.push(mat);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.scale.set(...scale);
      mesh.userData.entityId = entityId;
      holder.add(mesh);
      this.solids.push(mesh);
      if (p.role === 'eye') {
        mesh.userData.baseY = mesh.scale.y;
        this.eyes.push(mesh);
      }
      const meshes = [mesh];
      if (!p.noInk) {
        const omat = tinted(new THREE.MeshBasicMaterial({ color: outlineColor(p.color), side: THREE.BackSide }));
        this.mats.push(omat);
        const shell = new THREE.Mesh(geo, omat);
        const real: Vec3 = [p.size[0], p.size[1], p.size[2]];
        shell.scale.set(scale[0] * (1 + (2 * outline) / Math.max(0.01, real[0])), scale[1] * (1 + (2 * outline) / Math.max(0.01, real[1])), scale[2] * (1 + (2 * outline) / Math.max(0.01, real[2])));
        holder.add(shell);
        meshes.push(shell);
      }
      this.joints.push({ part: p, node, rest, at: p.at, meshes });
      return node;
    };
    for (const p of parts) build(p);
  }

  get pickables(): THREE.Object3D[] {
    return this.solids;
  }

  setOpacity(alpha: number): void {
    for (const m of this.mats) {
      m.transparent = alpha < 1;
      m.opacity = alpha;
    }
  }

  update(pose: Pose, expr: Expr): void {
    this.group.position.set(...pose.root);
    this.group.rotation.set(pose.rootRot[0] * DEG, pose.rootRot[1] * DEG, pose.rootRot[2] * DEG, 'XYZ');
    for (const j of this.joints) {
      const d = pose.j[j.part.name];
      j.node.rotation.set((j.rest[0] + (d?.[0] ?? 0)) * DEG, (j.rest[1] + (d?.[1] ?? 0)) * DEG, (j.rest[2] + (d?.[2] ?? 0)) * DEG, 'XYZ');
      const t = pose.t?.[j.part.name];
      j.node.position.set(j.at[0] + (t?.[0] ?? 0), j.at[1] + (t?.[1] ?? 0), j.at[2] + (t?.[2] ?? 0));
    }
    if (expr !== this.expr) {
      this.expr = expr;
      if (this.head) {
        this.head.mat.map = headTexture(this.fig, this.head.skin, expr, faceCache);
        this.head.mat.needsUpdate = true;
      }
      const blink = expr === 'blink';
      for (const e of this.eyes) e.scale.y = (e.userData.baseY as number) * (blink ? 0.15 : 1);
    }
  }

  dispose(): void {
    for (const m of this.mats) m.dispose();
    for (const s of this.solids) s.geometry.dispose();
  }
}
