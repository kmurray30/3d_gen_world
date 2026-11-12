/**
 * Solid styles: each part becomes its solid, posed by real joints, so the clips that drive the paper cutouts pose
 * these too.
 *
 * - toon (3D): smooth solids with a soft three-band toon ramp, a little rim light, an outline drawn as a slightly
 *   larger back-facing copy in a darker shade of the part's colour, and the face painted onto the head.
 * - origami (2.5D): the same solids folded from paper: a handful of flat facets each (a ball is an icosahedron, a
 *   rod a five-sided spindle), flat-shaded so every fold catches the light differently, faint crease lines, a
 *   slight tone change per facet like real paper, and the face as a drawn paper sticker on the head.
 */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import type { Expr, Pose } from '../../../shared/figure/anim';
import type { FigPart, Figure, Vec3 } from '../../../shared/figure/types';
import { drawFace } from './face';
import { chainShaderHook, tinted } from '../tint';

const DEG = Math.PI / 180;
export type SolidMode = 'toon' | 'origami';

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

function shadeOf(hex: string, l: number, s = 0.9): THREE.Color {
  const c = new THREE.Color(hex);
  const hsl = { h: 0, s: 0, l: 0 };
  c.getHSL(hsl);
  return new THREE.Color().setHSL(hsl.h, Math.min(1, hsl.s * s), Math.max(0.05, Math.min(0.95, hsl.l * l)));
}

/** A gable prism: triangle across x (base w at y = -h/2, apex at +h/2), along z. */
function wedgeGeometry(w: number, h: number, d: number, apex = 0): THREE.BufferGeometry {
  const x = w / 2, y = h / 2, z = d / 2, ax = apex * w;
  const A: Vec3 = [-x, -y, z], B: Vec3 = [x, -y, z], C: Vec3 = [ax, y, z];
  const A2: Vec3 = [-x, -y, -z], B2: Vec3 = [x, -y, -z], C2: Vec3 = [ax, y, -z];
  const tris: Vec3[] = [A, B, C, B2, A2, C2, A, C, C2, A, C2, A2, B, B2, C2, B, C2, C, A, A2, B2, A, B2, B];
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(tris.flat(), 3));
  g.computeVertexNormals();
  return g;
}

/** Geometry for a part at its actual size, plus the extra scale that sizes it. */
function smoothGeometry(p: FigPart): { geo: THREE.BufferGeometry; scale: Vec3 } {
  const [w, h, d] = p.size;
  switch (p.shape) {
    case 'ball':
      return { geo: new THREE.SphereGeometry(0.5, 28, 18), scale: [w, h, d] };
    case 'capsule': {
      if (h <= w) return { geo: new THREE.SphereGeometry(0.5, 24, 16), scale: [w, h, d] };
      return { geo: new THREE.CapsuleGeometry(w / 2, h - w, 6, 16), scale: [1, 1, d / w] };
    }
    case 'box': {
      const r = Math.min(w, h, d) * 0.5 * Math.min(0.98, p.round ?? 0);
      return { geo: r > 0.001 ? new RoundedBoxGeometry(w, h, d, 3, r) : new THREE.BoxGeometry(w, h, d), scale: [1, 1, 1] };
    }
    case 'cyl': {
      const n = p.segs ?? 24;
      return { geo: new THREE.CylinderGeometry((w / 2) * (p.taper ?? 1), w / 2, h, n, 1, false, p.segs ? Math.PI / 2 - Math.PI / n : 0), scale: [1, 1, d / w] };
    }
    case 'torus': {
      const r = (p.tube ?? 0.25) * (w / 2);
      return { geo: new THREE.TorusGeometry(w / 2 - r, r, 10, 32), scale: [1, h / w, d / (2 * r)] };
    }
    case 'wedge':
      return { geo: wedgeGeometry(w, h, d, p.apex), scale: [1, 1, 1] };
  }
}

/** The folded-paper version: few facets, every triangle its own flat face. */
function foldedGeometry(p: FigPart): { geo: THREE.BufferGeometry; scale: Vec3 } {
  const [w, h, d] = p.size;
  let geo: THREE.BufferGeometry;
  let scale: Vec3 = [1, 1, 1];
  switch (p.shape) {
    case 'ball':
      geo = new THREE.IcosahedronGeometry(0.5, 0);
      scale = [w, h, d];
      break;
    case 'capsule': {
      // a five-sided spindle: pointed ends, straight sides
      const r = Math.min(w / 2, h / 2);
      const half = h / 2;
      const prof = [new THREE.Vector2(0, -half), new THREE.Vector2(r * 0.9, -half + r * 0.7), new THREE.Vector2(r, 0), new THREE.Vector2(r * 0.9, half - r * 0.7), new THREE.Vector2(0, half)];
      geo = new THREE.LatheGeometry(prof, 5);
      scale = [1, 1, d / w];
      break;
    }
    case 'box':
      geo = new THREE.BoxGeometry(w, h, d);
      break;
    case 'cyl': {
      const n = Math.min(p.segs ?? 6, 8);
      geo = new THREE.CylinderGeometry((w / 2) * (p.taper ?? 1), w / 2, h, n, 1, false, Math.PI / 2 - Math.PI / n);
      scale = [1, 1, d / w];
      break;
    }
    case 'torus': {
      const r = (p.tube ?? 0.25) * (w / 2);
      geo = new THREE.TorusGeometry(w / 2 - r, r, 3, 8);
      scale = [1, h / w, d / (2 * r)];
      break;
    }
    case 'wedge':
      geo = wedgeGeometry(w, h, d, p.apex);
      break;
  }
  const flat = geo.index ? geo.toNonIndexed() : geo;
  if (flat !== geo) geo.dispose();
  flat.computeVertexNormals();
  // each facet a slightly different tone of the same paper
  let seed = 7;
  for (let i = 0; i < p.name.length; i++) seed = (seed * 31 + p.name.charCodeAt(i)) | 0;
  const rnd = () => ((seed = (seed * 16807 + 11) % 2147483647) & 0xffff) / 0xffff;
  const n = flat.attributes.position.count;
  const colors = new Float32Array(n * 3);
  for (let t = 0; t < n; t += 3) {
    const k = 0.93 + rnd() * 0.1;
    for (let v = 0; v < 3 && t + v < n; v++) colors.set([k, k, k], (t + v) * 3);
  }
  flat.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return { geo: flat, scale };
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

/** The face alone on transparent paper, for the origami head's sticker. */
function stickerTexture(fig: Figure, aspect: number, expr: Expr, cache: Map<string, THREE.Texture>): THREE.Texture {
  const key = `${fig.key}|${expr}|sticker`;
  const hit = cache.get(key);
  if (hit) return hit;
  const W = 256;
  const H = Math.round(W * aspect);
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  if (fig.face) drawFace(canvas.getContext('2d')!, 0, 0, W, H, fig.face, expr);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  cache.set(key, tex);
  return tex;
}

const faceCache = new Map<string, THREE.Texture>();
const PLANE = new THREE.PlaneGeometry(1, 1);

interface Joint {
  part: FigPart;
  node: THREE.Object3D;
  holder: THREE.Object3D;
  rest: Vec3;
  at: Vec3;
}

export class ToonFigure {
  /** Figure space: feet at 0, +z is the front. */
  readonly group = new THREE.Group();
  private readonly joints: Joint[] = [];
  private readonly solids: THREE.Mesh[] = [];
  private readonly mats: THREE.Material[] = [];
  private readonly geos: THREE.BufferGeometry[] = [];
  private readonly eyes: THREE.Mesh[] = [];
  private head: { mat: THREE.MeshToonMaterial; skin: string } | null = null;
  private sticker: { mat: THREE.MeshBasicMaterial; aspect: number } | null = null;
  private expr: Expr = 'neutral';

  constructor(
    readonly fig: Figure,
    entityId: string,
    readonly mode: SolidMode = 'toon',
  ) {
    const origami = mode === 'origami';
    const nodes = new Map<string, THREE.Object3D>();
    const outline = Math.min(0.025, Math.max(0.003, fig.heightM * 0.0085));
    const parts = fig.parts.filter((p) => p.only !== 'paper' || (origami && p.role === 'face'));
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
      const holder = new THREE.Object3D();
      if (p.off) holder.position.set(...p.off);
      if (p.srot) holder.rotation.set(p.srot[0] * DEG, p.srot[1] * DEG, p.srot[2] * DEG, 'XYZ');
      node.add(holder);
      this.joints.push({ part: p, node, holder, rest, at: p.at });

      if (p.role === 'face') {
        // origami: the face is drawn on a paper sticker just in front of the folded head
        const aspect = p.size[1] / p.size[0];
        const mat = tinted(new THREE.MeshBasicMaterial({ map: stickerTexture(fig, aspect, 'neutral', faceCache), transparent: true, alphaTest: 0.3, depthWrite: false }));
        mat.userData.keepTransparent = true;
        this.mats.push(mat);
        this.sticker = { mat, aspect };
        const mesh = new THREE.Mesh(PLANE, mat);
        mesh.scale.set(p.size[0] * 0.92, p.size[1] * 0.92, 1);
        mesh.position.z = p.size[2] * 0.44;
        mesh.renderOrder = 2;
        holder.add(mesh);
        return node;
      }

      const { geo, scale } = origami ? foldedGeometry(p) : smoothGeometry(p);
      this.geos.push(geo);
      let mat: THREE.Material;
      if (p.role === 'glow') mat = tinted(new THREE.MeshBasicMaterial({ color: p.color, vertexColors: origami }), true);
      else if (origami) mat = tinted(new THREE.MeshLambertMaterial({ color: p.color, vertexColors: true, flatShading: true }));
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
      if (origami) {
        // creases: every fold drawn as a faint darker line
        if (!p.noInk && p.role !== 'glow') {
          const edges = new THREE.EdgesGeometry(geo, 10);
          this.geos.push(edges);
          const lmat = tinted(new THREE.LineBasicMaterial({ color: shadeOf(p.color, 0.62), transparent: true, opacity: 0.75 }));
          this.mats.push(lmat);
          const lines = new THREE.LineSegments(edges, lmat);
          lines.scale.copy(mesh.scale);
          holder.add(lines);
        }
      } else if (!p.noInk) {
        const omat = tinted(new THREE.MeshBasicMaterial({ color: shadeOf(p.color, 0.32), side: THREE.BackSide }));
        this.mats.push(omat);
        const shell = new THREE.Mesh(geo, omat);
        shell.scale.set(scale[0] * (1 + (2 * outline) / Math.max(0.01, p.size[0])), scale[1] * (1 + (2 * outline) / Math.max(0.01, p.size[1])), scale[2] * (1 + (2 * outline) / Math.max(0.01, p.size[2])));
        holder.add(shell);
      }
      if (p.scale !== undefined) {
        holder.scale.setScalar(Math.max(1e-4, p.scale));
        holder.visible = p.scale > 0.001;
      }
      return node;
    };
    for (const p of parts) build(p);
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
      j.node.rotation.set((j.rest[0] + (d?.[0] ?? 0)) * DEG, (j.rest[1] + (d?.[1] ?? 0)) * DEG, (j.rest[2] + (d?.[2] ?? 0)) * DEG, 'XYZ');
      const t = pose.t?.[j.part.name];
      j.node.position.set(j.at[0] + (t?.[0] ?? 0), j.at[1] + (t?.[1] ?? 0), j.at[2] + (t?.[2] ?? 0));
      const k = pose.sc?.[j.part.name];
      if (k !== undefined || j.part.scale !== undefined) {
        const size = k ?? j.part.scale ?? 1;
        j.holder.scale.setScalar(Math.max(1e-4, size));
        j.holder.visible = size > 0.001;
      }
    }
    if (expr !== this.expr) {
      this.expr = expr;
      if (this.head) {
        this.head.mat.map = headTexture(this.fig, this.head.skin, expr, faceCache);
        this.head.mat.needsUpdate = true;
      }
      if (this.sticker) {
        this.sticker.mat.map = stickerTexture(this.fig, this.sticker.aspect, expr, faceCache);
        this.sticker.mat.needsUpdate = true;
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
