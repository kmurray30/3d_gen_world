/**
 * Paper style: every part of a figure is a flat cutout (its outline on the paper plane, coloured with crayon and
 * inked), and the cutouts are re-laid every frame from the 3D pose. A swinging arm shortens and slides in front of
 * or behind the body, a turning head slides across, the far legs of an animal stay behind its body. Seen from
 * behind, the layers reverse, the face disappears and the back of the hair shows.
 */
import * as THREE from 'three';
import type { Expr, Pose } from '../../../shared/figure/anim';
import type { FigPart, Figure, Vec3 } from '../../../shared/figure/types';
import { apply, hull, mul, shapePoints, solve, viewMatrix, type M3 } from '../../../shared/figure/math';
import { drawCrayonGrain } from '../crayon';
import { drawFace } from './face';
import { inkFor, printText } from './label';
import { tinted } from '../tint';

const PLANE = new THREE.PlaneGeometry(1, 1);
const INK = '#2b2b2b';

interface Piece {
  part: FigPart;
  mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  /** Paper axes in the part's joint frame at rest. */
  a: Vec3;
  b: Vec3;
  /** Outline bounds on those axes (metres). */
  cu: number;
  cv: number;
  w: number;
  h: number;
  centroid: Vec3;
}

/** Shared drawings per figure: the same dog drawn once for every dog. */
interface Drawn {
  canvas: Record<string, HTMLCanvasElement>;
  layout: Map<string, { a: Vec3; b: Vec3; cu: number; cv: number; w: number; h: number; centroid: Vec3; poly: Array<[number, number]> }>;
  ppm: number;
  ink: number;
  textures: Map<string, THREE.Texture>;
}
const drawnCache = new Map<string, Drawn>();
const paperFigCache = new Map<string, Figure>();

/** The figure as the paper renderer poses it: parts with a paper rest rotation use it. */
function paperFigure(fig: Figure): Figure {
  if (!fig.parts.some((p) => p.paperRot)) return fig;
  const hit = paperFigCache.get(fig.key);
  if (hit) return hit;
  const f: Figure = { ...fig, parts: fig.parts.map((p) => (p.paperRot ? { ...p, rot: p.paperRot } : p)) };
  paperFigCache.set(fig.key, f);
  return f;
}

/** Clip rotations re-aimed for paper: a part's flap about z becomes a swing within the paper's plane. */
function paperPose(fig: Figure, pose: Pose): Pose {
  let j: Record<string, Vec3> | null = null;
  for (const p of fig.parts) {
    if (!p.paperFlap) continue;
    const d = pose.j[p.name];
    if (!d) continue;
    j ??= { ...pose.j };
    const v: Vec3 = [0, 0, 0];
    v[p.paperFlap.axis] = d[2] * p.paperFlap.k;
    j[p.name] = v;
  }
  return j ? { ...pose, j } : pose;
}

function rowOf(m: M3, r: number): Vec3 {
  return [m[r * 3], m[r * 3 + 1], m[r * 3 + 2]];
}

function layoutFigure(fig: Figure): Drawn {
  const hit = drawnCache.get(fig.key);
  if (hit) return hit;
  const V = viewMatrix(fig.view);
  const rest = solve(fig);
  const ink = Math.min(0.03, Math.max(0.0035, fig.heightM * 0.011));
  // pixels per metre: the whole figure about 640 px tall (400 on phones, to save memory), small pieces capped
  const tall = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches ? 400 : 640;
  const ppm = Math.min(6000, tall / Math.max(0.1, fig.heightM));
  const layout: Drawn['layout'] = new Map();
  for (const p of fig.parts) {
    if (p.only === 'toon') continue;
    const VR = mul(V, rest.get(p.name)!.R);
    const a = rowOf(VR, 0);
    const b = rowOf(VR, 1);
    const pts = shapePoints(p);
    const flat = pts.map((q) => [q[0] * a[0] + q[1] * a[1] + q[2] * a[2], q[0] * b[0] + q[1] * b[1] + q[2] * b[2]] as [number, number]);
    const poly = hull(flat);
    let u0 = Infinity, u1 = -Infinity, v0 = Infinity, v1 = -Infinity;
    for (const [u, v] of poly) {
      u0 = Math.min(u0, u), u1 = Math.max(u1, u), v0 = Math.min(v0, v), v1 = Math.max(v1, v);
    }
    const pad = ink * 0.75;
    const centroid: Vec3 = pts.reduce((s, q) => [s[0] + q[0] / pts.length, s[1] + q[1] / pts.length, s[2] + q[2] / pts.length], [0, 0, 0] as Vec3);
    layout.set(p.name, { a, b, cu: (u0 + u1) / 2, cv: (v0 + v1) / 2, w: u1 - u0 + pad * 2, h: v1 - v0 + pad * 2, centroid, poly });
  }
  const d: Drawn = { canvas: {}, layout, ppm, ink, textures: new Map() };
  drawnCache.set(fig.key, d);
  return d;
}

/** The crayon grain drawn once and reused as a fill pattern (drawing it per piece is far too slow). */
let grain: HTMLCanvasElement | null = null;
function grainCanvas(): HTMLCanvasElement {
  if (grain) return grain;
  grain = document.createElement('canvas');
  grain.width = grain.height = 256;
  drawCrayonGrain(grain.getContext('2d')!, 256, 11, 0.55, 0.1);
  return grain;
}

/** The drawing of one part (or the face for an expression). */
function pieceTexture(fig: Figure, d: Drawn, p: FigPart, expr: Expr): THREE.Texture {
  const key = p.role === 'face' ? `${p.name}|${expr}` : p.name;
  const hit = d.textures.get(key);
  if (hit) return hit;
  const L = d.layout.get(p.name)!;
  let k = d.ppm;
  const maxSide = Math.max(L.w, L.h) * k;
  if (maxSide > 512) k *= 512 / maxSide;
  if (maxSide < 24) k *= 24 / maxSide;
  const cw = Math.max(4, Math.ceil(L.w * k));
  const ch = Math.max(4, Math.ceil(L.h * k));
  const canvas = document.createElement('canvas');
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext('2d')!;
  const X = (u: number) => (u - L.cu + L.w / 2) * k;
  const Y = (v: number) => (L.cv + L.h / 2 - v) * k;
  const path = () => {
    ctx.beginPath();
    L.poly.forEach(([u, v], i) => (i ? ctx.lineTo(X(u), Y(v)) : ctx.moveTo(X(u), Y(v))));
    ctx.closePath();
  };
  if (p.role === 'face' && fig.face) {
    const pad = d.ink * 0.75 * k;
    drawFace(ctx, pad, pad, cw - pad * 2, ch - pad * 2, fig.face, expr);
  } else {
    ctx.save();
    path();
    ctx.clip();
    ctx.fillStyle = p.color;
    ctx.fillRect(0, 0, cw, ch);
    if (p.role !== 'eye' && p.role !== 'glow') {
      // a soft shade along the bottom edge reads as roundness on flat paper
      const g = ctx.createLinearGradient(0, 0, 0, ch);
      g.addColorStop(0.6, 'rgba(0,0,0,0)');
      g.addColorStop(1, 'rgba(40,25,10,0.1)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, cw, ch);
      const pat = ctx.createPattern(grainCanvas(), 'repeat');
      if (pat) {
        ctx.globalAlpha = 0.45;
        ctx.fillStyle = pat;
        ctx.fillRect(0, 0, cw, ch);
        ctx.globalAlpha = 1;
      }
    }
    ctx.restore();
    if (p.role === 'label' && p.text) printText(ctx, p.text, 0, 0, cw, ch, inkFor(p.color));
    if (!p.noInk) {
      path();
      ctx.lineJoin = 'round';
      ctx.lineWidth = d.ink * k * 1.5;
      ctx.strokeStyle = INK;
      ctx.stroke();
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  d.textures.set(key, tex);
  return tex;
}

export class PaperFigure {
  /** Paper axes: x along the paper, y up, z out of the front of the paper. */
  readonly group = new THREE.Group();
  private readonly pieces: Piece[] = [];
  private readonly drawn: Drawn;
  private readonly V: M3;
  private expr: Expr = 'neutral';
  private readonly order: number[] = [];

  readonly fig: Figure;

  constructor(fig: Figure, entityId: string) {
    fig = paperFigure(fig);
    this.fig = fig;
    this.drawn = layoutFigure(fig);
    this.V = viewMatrix(fig.view);
    for (const p of fig.parts) {
      if (p.only === 'toon') continue;
      const L = this.drawn.layout.get(p.name)!;
      const mat = tinted(new THREE.MeshBasicMaterial({ map: pieceTexture(fig, this.drawn, p, this.expr), alphaTest: 0.5, side: p.side === 'front' ? THREE.FrontSide : p.side === 'back' ? THREE.BackSide : THREE.DoubleSide }), p.role === 'glow');
      const mesh = new THREE.Mesh(PLANE, mat);
      mesh.matrixAutoUpdate = false;
      mesh.userData.entityId = entityId;
      this.group.add(mesh);
      this.pieces.push({ part: p, mesh, a: L.a, b: L.b, cu: L.cu, cv: L.cv, w: L.w, h: L.h, centroid: L.centroid });
      this.order.push(this.order.length);
    }
  }

  get pickables(): THREE.Object3D[] {
    return this.pieces.map((p) => p.mesh);
  }

  setOpacity(alpha: number): void {
    for (const p of this.pieces) {
      p.mesh.material.transparent = alpha < 1;
      p.mesh.material.opacity = alpha;
    }
  }

  update(pose: Pose, expr: Expr): void {
    if (expr !== this.expr) {
      this.expr = expr;
      for (const p of this.pieces) if (p.part.role === 'face') p.mesh.material.map = pieceTexture(this.fig, this.drawn, p.part, expr);
    }
    pose = paperPose(this.fig, pose);
    const frames = solve(this.fig, pose);
    const V = this.V;
    const depth = new Array<number>(this.pieces.length);
    const layerStep = this.fig.heightM * 0.004;
    this.pieces.forEach((pc, i) => {
      const f = frames.get(pc.part.name)!;
      // a part can be sized by the pose (a flame grows out of a mouth); size 0 hides it
      const k = pose.sc?.[pc.part.name] ?? pc.part.scale ?? 1;
      pc.mesh.visible = k > 0.001;
      const M = mul(V, f.R);
      const A = apply(M, pc.a).map((v) => v * k) as Vec3;
      const B = apply(M, pc.b).map((v) => v * k) as Vec3;
      const O = apply(V, f.T);
      const c = apply(M, pc.centroid);
      depth[i] = O[2] + c[2] + (pc.part.layer ?? 0) * layerStep;
      let bh = pc.h;
      if (pc.part.role === 'eye' && expr === 'blink') bh *= 0.15;
      const cx = O[0] + A[0] * pc.cu + B[0] * pc.cv;
      const cy = O[1] + A[1] * pc.cu + B[1] * pc.cv;
      // affine: unit plane -> the piece's outline box on the paper, foreshortened by the pose
      pc.mesh.matrix.set(A[0] * pc.w, B[0] * bh, 0, cx, A[1] * pc.w, B[1] * bh, 0, cy, 0, 0, 1, 0, 0, 0, 0, 1);
    });
    // stack the pieces a hair apart in depth order so they overlap like layered paper (and reverse from behind)
    this.order.sort((x, y) => depth[x] - depth[y]);
    const step = this.fig.heightM * 0.0022;
    const mid = (this.order.length - 1) / 2;
    this.order.forEach((idx, rank) => {
      const m = this.pieces[idx].mesh;
      m.matrix.elements[14] = (rank - mid) * step;
      m.matrixWorldNeedsUpdate = true;
    });
  }

  dispose(): void {
    for (const p of this.pieces) p.mesh.material.dispose();
  }
}
