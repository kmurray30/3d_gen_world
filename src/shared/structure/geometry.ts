/**
 * Turns a structure's parts into plain mesh data (no three.js here, so it is unit testable and could run on the
 * server). Every face is a flat polygon: textured by metres so tiles never stretch, shaded by its normal so boxes
 * read as boxes without lights, and its perimeter becomes ink outline segments unless the neighbouring face is
 * coplanar.
 */
import type { SpriteRef } from '../types';
import { DEG, rotateY } from '../engine/math';
import type { MaterialName, Part, PrismPart, RibbonPart, RoofPart, StairsPart, Structure, WallPart } from './types';

type V3 = [number, number, number];

export interface MeshData {
  pos: number[];
  nrm: number[];
  uv: number[];
  /** Per-vertex brightness 0..1 multiplied into the tint. */
  shade: number[];
  idx: number[];
}

export interface MeshGroup {
  mat: MaterialName;
  color: string;
  mesh: MeshData;
  /** Lit at night (windows, lamps). */
  glow?: boolean;
  /** Set for decal quads: draw the sprite (or a text card) instead of a material tile. */
  decal?: { sprite: SpriteRef; text?: string; role?: 'door' | 'window'; part: number };
  /** Moves with this joint. */
  joint?: string;
}

export interface StructureMesh {
  groups: MeshGroup[];
  /** Flat xyz pairs: outline segments in structure-local space, of the parts that stay put. */
  edges: number[];
  /** Outline segments of each joint's parts, which move with it. */
  jointEdges: Record<string, number[]>;
}

/** Key light for the fake shading, in structure-local space. */
const LIGHT: V3 = norm([0.45, 0.8, 0.55]);
const SHADE_MIN = 0.72;
const CREASE_DEG = 14;

function norm(v: V3): V3 {
  const l = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
}
function cross(a: V3, b: V3): V3 {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}
function dot(a: V3, b: V3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

/** Newell's method: works for concave and slightly non-planar polygons. */
function polygonNormal(pts: V3[]): V3 {
  let x = 0;
  let y = 0;
  let z = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    x += (a[1] - b[1]) * (a[2] + b[2]);
    y += (a[2] - b[2]) * (a[0] + b[0]);
    z += (a[0] - b[0]) * (a[1] + b[1]);
  }
  return norm([x, y, z]);
}

/** Ear clipping on the 2D projection; returns index triples. Polygons here are small, so O(n^2) is fine. */
function triangulate(pts: V3[], n: V3): number[] {
  const count = pts.length;
  if (count < 3) return [];
  if (count === 3) return [0, 1, 2];
  // project onto the plane that drops the dominant normal axis, keeping orientation consistent with the normal
  const ax = Math.abs(n[0]);
  const ay = Math.abs(n[1]);
  const az = Math.abs(n[2]);
  const flat: Array<[number, number]> = pts.map((p) => {
    if (ax >= ay && ax >= az) return n[0] > 0 ? [p[1], p[2]] : [p[2], p[1]];
    if (ay >= az) return n[1] > 0 ? [p[2], p[0]] : [p[0], p[2]];
    return n[2] > 0 ? [p[0], p[1]] : [p[1], p[0]];
  });
  const area2 = (a: [number, number], b: [number, number], c: [number, number]) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  let signed = 0;
  for (let i = 0; i < count; i++) {
    const a = flat[i];
    const b = flat[(i + 1) % count];
    signed += a[0] * b[1] - b[0] * a[1];
  }
  const ccw = signed > 0;
  const inside = (p: [number, number], a: [number, number], b: [number, number], c: [number, number]) => {
    const s1 = area2(a, b, p);
    const s2 = area2(b, c, p);
    const s3 = area2(c, a, p);
    return ccw ? s1 >= -1e-9 && s2 >= -1e-9 && s3 >= -1e-9 : s1 <= 1e-9 && s2 <= 1e-9 && s3 <= 1e-9;
  };
  const left = pts.map((_, i) => i);
  const out: number[] = [];
  let guard = 0;
  while (left.length > 3 && guard++ < 1000) {
    let clipped = false;
    for (let i = 0; i < left.length; i++) {
      const i0 = left[(i + left.length - 1) % left.length];
      const i1 = left[i];
      const i2 = left[(i + 1) % left.length];
      const a = flat[i0];
      const b = flat[i1];
      const c = flat[i2];
      const convex = ccw ? area2(a, b, c) > 1e-9 : area2(a, b, c) < -1e-9;
      if (!convex) continue;
      let ok = true;
      for (const j of left) {
        if (j === i0 || j === i1 || j === i2) continue;
        if (inside(flat[j], a, b, c)) {
          ok = false;
          break;
        }
      }
      if (!ok) continue;
      out.push(i0, i1, i2);
      left.splice(i, 1);
      clipped = true;
      break;
    }
    if (!clipped) break; // degenerate; fall through with a fan of what is left
  }
  if (left.length === 3) out.push(left[0], left[1], left[2]);
  else for (let i = 1; i + 1 < left.length; i++) out.push(left[0], left[i], left[i + 1]);
  return out;
}

/** Parts at least this big in some direction get their own mesh so they can fade on their own (walls, roofs). */
const SPLIT_FROM_M = 1.6;

function partSize(part: Part): number {
  switch (part.t) {
    case 'box':
    case 'wall':
    case 'roof':
    case 'stairs':
      return Math.max(part.w, part.h, part.d);
    case 'prism':
      return Math.max(part.r * 2, (part.rz ?? part.r) * 2, part.h);
    case 'ribbon':
      return Math.max(...part.path.map((q) => Math.hypot(q[0], q[1])));
    default:
      return 0;
  }
}

/** Collects faces for one material slot. */
class SlotBuilder {
  readonly mesh: MeshData = { pos: [], nrm: [], uv: [], shade: [], idx: [] };

  polygon(pts: V3[], n: V3, shade: number, uvs?: Array<[number, number]>): void {
    const base = this.mesh.pos.length / 3;
    // tangent frame for metre-based UVs: u runs horizontally along the face, v up (or along z for flat faces)
    const t: V3 = Math.abs(n[1]) < 0.99 ? norm(cross([0, 1, 0], n)) : [1, 0, 0];
    const b: V3 = cross(n, t);
    pts.forEach((p, i) => {
      this.mesh.pos.push(p[0], p[1], p[2]);
      this.mesh.nrm.push(n[0], n[1], n[2]);
      if (uvs) this.mesh.uv.push(uvs[i][0], uvs[i][1]);
      else this.mesh.uv.push(dot(p, t), dot(p, b));
      this.mesh.shade.push(shade);
    });
    for (const i of triangulate(pts, n)) this.mesh.idx.push(base + i);
  }
}

interface EdgeRec {
  a: V3;
  b: V3;
  normals: V3[];
}

/** One structure's faces across all material slots, plus candidate outline edges. */
class StructureBuilder {
  readonly slots = new Map<string, { group: MeshGroup; builder: SlotBuilder }>();
  /** Outline candidates per joint ('' for the parts that stay put). */
  readonly edges = new Map<string, Map<string, EdgeRec>>();
  readonly decals: MeshGroup[] = [];
  /** The joint the faces being added move with. */
  joint = '';

  /** Small parts share a slot per material; big ones (`own` set) get a slot of their own; moving ones one per joint. */
  slot(mat: MaterialName, color: string, own?: string, glow = false): SlotBuilder {
    const key = `${mat}|${color}|${own ?? ''}|${glow ? 'g' : ''}|${this.joint}`;
    let s = this.slots.get(key);
    if (!s) {
      const builder = new SlotBuilder();
      s = { group: { mat, color, mesh: builder.mesh, ...(glow ? { glow } : {}), ...(this.joint ? { joint: this.joint } : {}) }, builder };
      this.slots.set(key, s);
    }
    return s.builder;
  }

  /** Add a face given in structure-local space (vertices counter-clockwise seen from outside). */
  face(pts: V3[], mat: MaterialName, color: string, ink: boolean, own?: string, glow = false): void {
    const n = polygonNormal(pts);
    if (!Number.isFinite(n[0]) || (n[0] === 0 && n[1] === 0 && n[2] === 0)) return;
    const lit = Math.max(0, dot(n, LIGHT));
    const shade = n[1] > 0.9 ? 1 : SHADE_MIN + (1 - SHADE_MIN) * (0.35 + 0.65 * lit);
    this.slot(mat, color, own, glow || mat === 'glass').polygon(pts, n, Math.min(1, shade));
    if (!ink) return;
    for (let i = 0; i < pts.length; i++) this.edge(pts[i], pts[(i + 1) % pts.length], n);
  }

  private edge(a: V3, b: V3, n: V3): void {
    const ka = key3(a);
    const kb = key3(b);
    if (ka === kb) return;
    const key = ka < kb ? `${ka}>${kb}` : `${kb}>${ka}`;
    let set = this.edges.get(this.joint);
    if (!set) this.edges.set(this.joint, (set = new Map()));
    const rec = set.get(key);
    if (rec) rec.normals.push(n);
    else set.set(key, { a, b, normals: [n] });
  }

  decal(pts: V3[], sprite: SpriteRef, color: string, part: number, text?: string, role?: 'door' | 'window', glow = false): void {
    const n = polygonNormal(pts);
    const b = new SlotBuilder();
    b.polygon(
      pts,
      n,
      1,
      [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1],
      ],
    );
    this.decals.push({ mat: 'flat', color, mesh: b.mesh, decal: { sprite, text, role, part }, ...(glow ? { glow } : {}), ...(this.joint ? { joint: this.joint } : {}) });
  }

  finish(): StructureMesh {
    const cosCrease = Math.cos(CREASE_DEG * DEG);
    const jointEdges: Record<string, number[]> = {};
    let edges: number[] = [];
    for (const [joint, set] of this.edges) {
      const out: number[] = [];
      for (const rec of set.values()) {
        let crease = rec.normals.length === 1;
        if (!crease) {
          for (let i = 0; i < rec.normals.length && !crease; i++)
            for (let j = i + 1; j < rec.normals.length; j++)
              if (dot(rec.normals[i], rec.normals[j]) < cosCrease) {
                crease = true;
                break;
              }
        }
        if (crease) out.push(rec.a[0], rec.a[1], rec.a[2], rec.b[0], rec.b[1], rec.b[2]);
      }
      if (joint) jointEdges[joint] = out;
      else edges = out;
    }
    return { groups: [...[...this.slots.values()].map((s) => s.group), ...this.decals], edges, jointEdges };
  }
}

function key3(p: V3): string {
  return `${Math.round(p[0] * 500)},${Math.round(p[1] * 500)},${Math.round(p[2] * 500)}`;
}

/** Part-local -> structure-local. */
function placer(part: Part): (p: V3) => V3 {
  const rot = (part.rot ?? 0) * DEG;
  const [px, py, pz] = part.pos;
  return (p) => {
    const r = rot ? rotateY(p, rot) : p;
    return [r[0] + px, r[1] + py, r[2] + pz];
  };
}

function boxFaces(w: number, h: number, d: number): V3[][] {
  const x = w / 2;
  const z = d / 2;
  const p = (a: number, b: number, c: number): V3 => [a, b, c];
  return [
    [p(-x, 0, z), p(x, 0, z), p(x, h, z), p(-x, h, z)], // front +z
    [p(x, 0, -z), p(-x, 0, -z), p(-x, h, -z), p(x, h, -z)], // back -z
    [p(x, 0, z), p(x, 0, -z), p(x, h, -z), p(x, h, z)], // right +x
    [p(-x, 0, -z), p(-x, 0, z), p(-x, h, z), p(-x, h, -z)], // left -x
    [p(-x, h, z), p(x, h, z), p(x, h, -z), p(-x, h, -z)], // top
    [p(-x, 0, -z), p(x, 0, -z), p(x, 0, z), p(-x, 0, z)], // bottom
  ];
}

export function prismRing(part: Pick<PrismPart, 'sides' | 'r' | 'rz'>, radius: number, rzScale: number, y: number, ofs: [number, number] = [0, 0]): V3[] {
  const n = Math.max(3, Math.round(part.sides));
  const rz = (part.rz ?? part.r) * rzScale;
  const ring: V3[] = [];
  for (let i = 0; i < n; i++) {
    const a = Math.PI / n + (i / n) * Math.PI * 2;
    ring.push([Math.cos(a) * radius + ofs[0], y, Math.sin(a) * rz + ofs[1]]);
  }
  return ring;
}

function prismFaces(part: PrismPart): V3[][] {
  if (part.lie) return lyingFaces(part);
  if (part.hole && part.hole > 0.01 && part.hole < part.r) return tubeFaces(part, part.hole);
  const rTop = part.rTop ?? part.r;
  const bottom = prismRing(part, part.r, 1, 0);
  const faces: V3[][] = [];
  const n = bottom.length;
  if (rTop <= 1e-4) {
    const apex: V3 = [part.lean?.[0] ?? 0, part.h, part.lean?.[1] ?? 0];
    for (let i = 0; i < n; i++) faces.push([bottom[(i + 1) % n], bottom[i], apex]);
  } else {
    const top = prismRing(part, rTop, rTop / part.r, part.h, part.lean);
    for (let i = 0; i < n; i++) faces.push([bottom[(i + 1) % n], bottom[i], top[i], top[(i + 1) % n]]);
    faces.push([...top]);
  }
  faces.push([...bottom].reverse());
  return faces;
}

/** A prism on its side: its cross-section in the x-y plane (resting on y = 0), extruded along z. */
function lyingFaces(part: PrismPart): V3[][] {
  const n = Math.max(3, Math.round(part.sides));
  const rz = part.rz ?? part.r;
  const cy = part.half ? 0 : rz;
  const section: Array<[number, number]> = [];
  if (part.half) {
    const k = Math.max(2, Math.round(n / 2));
    for (let i = 0; i <= k; i++) {
      const a = (i / k) * Math.PI;
      section.push([Math.cos(a) * part.r, Math.sin(a) * rz]);
    }
  } else {
    for (let i = 0; i < n; i++) {
      const a = Math.PI / n + (i / n) * Math.PI * 2;
      section.push([Math.cos(a) * part.r, cy + Math.sin(a) * rz]);
    }
  }
  const z0 = -part.h / 2;
  const z1 = part.h / 2;
  const faces: V3[][] = [];
  const m = section.length;
  for (let i = 0; i < m; i++) {
    const [ax, ay] = section[i];
    const [bx, by] = section[(i + 1) % m];
    const out: V3 = [(ax + bx) / 2, (ay + by) / 2 - cy, 0];
    faces.push(want([[ax, ay, z1], [bx, by, z1], [bx, by, z0], [ax, ay, z0]], out[0] === 0 && out[1] === 0 ? [0, -1, 0] : out));
  }
  faces.push(want(section.map(([x, y]): V3 => [x, y, z1]), [0, 0, 1]));
  faces.push(want(section.map(([x, y]): V3 => [x, y, z0]), [0, 0, -1]));
  return faces;
}

/** A hollow prism: outer sides facing out, inner sides facing the axis, and flat rings on top and bottom. */
function tubeFaces(part: PrismPart, hole: number): V3[][] {
  const rTop = Math.max(1e-3, part.rTop ?? part.r);
  const k = rTop / part.r;
  const ob = prismRing(part, part.r, 1, 0);
  const ot = prismRing(part, rTop, k, part.h, part.lean);
  const ib = prismRing(part, hole, hole / part.r, 0);
  const it = prismRing(part, hole * k, (hole * k) / part.r, part.h, part.lean);
  const faces: V3[][] = [];
  const n = ob.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const mid = (a: V3, b: V3): V3 => [(a[0] + b[0]) / 2, 0, (a[2] + b[2]) / 2];
    const out = mid(ob[i], ob[j]);
    faces.push(want([ob[j], ob[i], ot[i], ot[j]], out));
    faces.push(want([ib[i], ib[j], it[j], it[i]], [-out[0], 0, -out[2]]));
    faces.push(want([ot[i], ot[j], it[j], it[i]], [0, 1, 0]));
    faces.push(want([ob[j], ob[i], ib[i], ib[j]], [0, -1, 0]));
  }
  return faces;
}

/** Both sides of a paper strip along its path in the local x-y plane. */
function ribbonFaces(part: RibbonPart): V3[][] {
  const pts = part.path;
  if (pts.length < 2) return [];
  const left: V3[] = [];
  const right: V3[] = [];
  const wEnd = part.wEnd ?? part.w;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(pts.length - 1, i + 1)];
    const tx = b[0] - a[0];
    const ty = b[1] - a[1];
    const l = Math.hypot(tx, ty) || 1;
    const half = (part.w + (wEnd - part.w) * (i / (pts.length - 1))) / 2;
    // across the path, in its plane
    const nx = -ty / l;
    const ny = tx / l;
    left.push([pts[i][0] + nx * half, pts[i][1] + ny * half, 0]);
    right.push([pts[i][0] - nx * half, pts[i][1] - ny * half, 0]);
  }
  const outline = [...left, ...right.reverse()];
  return [want(outline, [0, 0, 1]), want([...outline].reverse(), [0, 0, -1])];
}

function roofFaces(part: RoofPart): { main: V3[][]; ends: V3[][] } {
  const x = part.w / 2;
  const z = part.d / 2;
  const h = part.h;
  const p = (a: number, b: number, c: number): V3 => [a, b, c];
  const bottom: V3[] = [p(-x, 0, -z), p(x, 0, -z), p(x, 0, z), p(-x, 0, z)];
  if (part.style === 'gable') {
    return {
      main: [
        [p(-x, 0, z), p(x, 0, z), p(x, h, 0), p(-x, h, 0)], // front slope
        [p(x, 0, -z), p(-x, 0, -z), p(-x, h, 0), p(x, h, 0)], // back slope
        bottom,
      ],
      ends: [
        [p(x, 0, z), p(x, 0, -z), p(x, h, 0)], // right gable
        [p(-x, 0, -z), p(-x, 0, z), p(-x, h, 0)], // left gable
      ],
    };
  }
  if (part.style === 'shed') {
    return {
      main: [
        [p(-x, 0, z), p(x, 0, z), p(x, h, -z), p(-x, h, -z)], // slope
        [p(x, 0, -z), p(-x, 0, -z), p(-x, h, -z), p(x, h, -z)], // back wall of the wedge
        bottom,
      ],
      ends: [
        [p(x, 0, z), p(x, 0, -z), p(x, h, -z)],
        [p(-x, 0, -z), p(-x, 0, z), p(-x, h, -z)],
      ],
    };
  }
  // hip: ridge along the longer axis
  if (part.w >= part.d) {
    const r = Math.max(0, (part.w - part.d) / 2);
    const r1: V3 = p(-r, h, 0);
    const r2: V3 = p(r, h, 0);
    return {
      main: [
        [p(-x, 0, z), p(x, 0, z), r2, r1], // front
        [p(x, 0, -z), p(-x, 0, -z), r1, r2], // back
        [p(x, 0, z), p(x, 0, -z), r2], // right
        [p(-x, 0, -z), p(-x, 0, z), r1], // left
        bottom,
      ],
      ends: [],
    };
  }
  const r = Math.max(0, (part.d - part.w) / 2);
  const r1: V3 = p(0, h, -r);
  const r2: V3 = p(0, h, r);
  return {
    main: [
      [p(-x, 0, z), p(x, 0, z), r2], // front
      [p(x, 0, -z), p(-x, 0, -z), r1], // back
      [p(x, 0, z), p(x, 0, -z), r1, r2], // right
      [p(-x, 0, -z), p(-x, 0, z), r2, r1], // left
      bottom,
    ],
    ends: [],
  };
}

function stairsFaces(part: StairsPart): V3[][] {
  const x = part.w / 2;
  const z0 = -part.d / 2;
  const n = Math.max(1, Math.round(part.steps));
  const dz = part.d / n;
  const dy = part.h / n;
  const p = (a: number, b: number, c: number): V3 => [a, b, c];
  // side profile (z, y): along the ground, up the back, then down the saw-tooth; closes back to (z0, 0)
  const profile: Array<[number, number]> = [[z0, 0], [z0 + part.d, 0], [z0 + part.d, part.h]];
  for (let k = n - 1; k >= 0; k--) {
    const zk = z0 + k * dz;
    profile.push([zk, (k + 1) * dy]);
    if (k > 0) profile.push([zk, k * dy]);
  }
  const faces: V3[][] = [];
  faces.push(want(profile.map(([z, y]) => p(x, y, z)), [1, 0, 0]));
  faces.push(want(profile.map(([z, y]) => p(-x, y, z)), [-1, 0, 0]));
  for (let k = 0; k < n; k++) {
    const zk = z0 + k * dz;
    const yk = (k + 1) * dy;
    const yPrev = k * dy;
    faces.push(want([p(x, yPrev, zk), p(x, yk, zk), p(-x, yk, zk), p(-x, yPrev, zk)], [0, 0, -1])); // riser
    faces.push(want([p(-x, yk, zk), p(x, yk, zk), p(x, yk, zk + dz), p(-x, yk, zk + dz)], [0, 1, 0])); // tread
  }
  const zb = z0 + part.d;
  faces.push(want([p(-x, 0, zb), p(x, 0, zb), p(x, part.h, zb), p(-x, part.h, zb)], [0, 0, 1])); // back
  faces.push(want([p(-x, 0, z0), p(x, 0, z0), p(x, 0, zb), p(-x, 0, zb)], [0, -1, 0])); // bottom
  return faces;
}

/** A wall slab: front and back are one polygon each with doorway notches, plus ends, top and the door reveals. */
function wallFaces(part: WallPart): V3[][] {
  const x = part.w / 2;
  const z = part.d / 2;
  const h = part.h;
  const p = (a: number, b: number, c: number): V3 => [a, b, c];
  const openings = [...(part.openings ?? [])].sort((a, b) => a.at - b.at);
  // outline in the xy plane, counter-clockwise seen from +z
  const outline: Array<[number, number]> = [[-x, 0]];
  for (const o of openings) outline.push([o.at - o.w / 2, 0], [o.at - o.w / 2, o.h], [o.at + o.w / 2, o.h], [o.at + o.w / 2, 0]);
  outline.push([x, 0], [x, h], [-x, h]);
  const faces: V3[][] = [];
  faces.push(want(outline.map(([a, b]) => p(a, b, z)), [0, 0, 1]));
  faces.push(want(outline.map(([a, b]) => p(a, b, -z)), [0, 0, -1]));
  faces.push(want([p(-x, h, z), p(x, h, z), p(x, h, -z), p(-x, h, -z)], [0, 1, 0]));
  faces.push(want([p(x, 0, z), p(x, 0, -z), p(x, h, -z), p(x, h, z)], [1, 0, 0]));
  faces.push(want([p(-x, 0, -z), p(-x, 0, z), p(-x, h, z), p(-x, h, -z)], [-1, 0, 0]));
  for (const o of openings) {
    const l = o.at - o.w / 2;
    const r = o.at + o.w / 2;
    faces.push(want([p(l, 0, z), p(l, 0, -z), p(l, o.h, -z), p(l, o.h, z)], [1, 0, 0])); // left jamb faces into the doorway
    faces.push(want([p(r, 0, -z), p(r, 0, z), p(r, o.h, z), p(r, o.h, -z)], [-1, 0, 0]));
    faces.push(want([p(l, o.h, z), p(r, o.h, z), p(r, o.h, -z), p(l, o.h, -z)], [0, -1, 0])); // lintel underside
  }
  return faces;
}

/** Wind a face so its normal points the intended way. */
function want(face: V3[], outward: V3): V3[] {
  return dot(polygonNormal(face), outward) < 0 ? [...face].reverse() : face;
}

/** Reverse winding is used above for a couple of faces; fix any face whose normal points into its own part. */
function orientOut(faces: V3[][], centre: V3): V3[][] {
  return faces.map((f) => {
    const n = polygonNormal(f);
    const c: V3 = [0, 0, 0];
    for (const p of f) {
      c[0] += p[0] / f.length;
      c[1] += p[1] / f.length;
      c[2] += p[2] / f.length;
    }
    const toFace: V3 = [c[0] - centre[0], c[1] - centre[1], c[2] - centre[2]];
    return dot(n, toFace) < 0 ? [...f].reverse() : f;
  });
}

/**
 * Mesh data for a structure. `only` builds just those parts (the exploded view builds each part on its own);
 * parts on a joint get groups and outlines of their own, so they can move.
 */
export function buildStructureMesh(s: Structure, only?: ReadonlySet<number>): StructureMesh {
  const b = new StructureBuilder();
  const joints = new Set((s.joints ?? []).map((j) => j.id));
  s.parts.forEach((part, i) => {
    if (part.hidden || (only && !only.has(i))) return;
    b.joint = part.joint && joints.has(part.joint) ? part.joint : '';
    const place = placer(part);
    const ink = !part.noInk;
    const own = partSize(part) >= SPLIT_FROM_M ? `p${i}` : undefined;
    const glow = !!part.glow;
    switch (part.t) {
      case 'box': {
        const c: V3 = [0, part.h / 2, 0];
        for (const f of orientOut(boxFaces(part.w, part.h, part.d), c)) b.face(f.map(place), part.mat, part.color, ink, own, glow);
        break;
      }
      case 'prism': {
        const c: V3 = [0, part.h / 2, 0];
        // a tube's faces are wound as built: its inner sides face the axis on purpose
        const faces = part.hole || part.lie ? prismFaces(part) : orientOut(prismFaces(part), c);
        for (const f of faces) b.face(f.map(place), part.mat, part.color, ink, own, glow);
        break;
      }
      case 'ribbon': {
        for (const f of ribbonFaces(part)) b.face(f.map(place), part.mat, part.color, ink, own, glow);
        break;
      }
      case 'roof': {
        const c: V3 = [0, part.h / 3, part.style === 'shed' ? -part.d / 6 : 0];
        const { main, ends } = roofFaces(part);
        for (const f of orientOut(main, c)) b.face(f.map(place), part.mat, part.color, ink, own, glow);
        for (const f of orientOut(ends, c)) b.face(f.map(place), part.endMat ?? part.mat, part.endColor ?? part.color, ink, own, glow);
        break;
      }
      case 'stairs': {
        for (const f of stairsFaces(part)) b.face(f.map(place), part.mat, part.color, ink, own, glow);
        break;
      }
      case 'wall': {
        for (const f of wallFaces(part)) b.face(f.map(place), part.mat, part.color, ink, own, glow);
        break;
      }
      case 'decal': {
        const x = part.w / 2;
        const e = 0.012;
        const pts: V3[] = [
          [-x, 0, e],
          [x, 0, e],
          [x, part.h, e],
          [-x, part.h, e],
        ];
        const role = part.role ?? (/(^|\/)window\.webp$/.test(part.sprite.file ?? '') ? 'window' : undefined);
        b.decal(pts.map(place), part.sprite, part.color, i, part.text, role, glow || /window/.test(part.sprite.file ?? ''));
        break;
      }
    }
  });
  return b.finish();
}

export const _test = { triangulate, polygonNormal, stairsFaces, roofFaces, prismFaces, wallFaces, ribbonFaces };
