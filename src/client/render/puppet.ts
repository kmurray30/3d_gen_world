/**
 * A drawing as a paper puppet: each piece a flat card hung on its joint, nested the way the rig says (a hand
 * on its arm, an arm on the body), layered a hair apart front to back. Units: the drawing is 1 tall with its
 * bottom middle at the origin, so the puppet scales like the flat sprite it replaces. Poses come from
 * PuppetMotion; this only applies them.
 */
import * as THREE from 'three';
import { rigOrder, type RigPiece } from '../../shared/rig';
import type { CutPiece, PuppetAsset } from './rig-cut';
import { inkAtlas, type InkMark, type MouthShape } from './face-ink';
import { tinted } from './tint';

/** Gap between paper layers, in drawing heights. */
const DZ = 0.004;

export interface JointPose {
  rot: number;
  x: number;
  y: number;
  sx: number;
  sy: number;
  /** Bring in front of the body for the move (hands meeting in a clap). */
  front: boolean;
  hidden: boolean;
}

export interface FacePose {
  /** Per eye (image-left, image-right): 1 open, 0 shut. */
  eyeOpen: [number, number];
  /** Drawn over shut eyes: a happy arc or a resting one. */
  lid: 'lid' | 'lid_up' | null;
  /** Where the eyes look, -1..1 across and up the drawing. */
  look: [number, number];
  /** Eyes grow (surprise) or shrink. */
  eyeScale: number;
  /** null shows the drawing's own mouth. */
  mouth: MouthShape | null;
  /** inner ends up (+, sad) or down (-, angry); raise in eye heights; alpha for drawn-on brows. */
  brows: { raise: number; tilt: number; alpha: number };
}

export interface Pose {
  joints: Map<string, JointPose>;
  face: FacePose;
}

export function restJoint(): JointPose {
  return { rot: 0, x: 0, y: 0, sx: 1, sy: 1, front: false, hidden: false };
}

interface Joint {
  piece: RigPiece;
  group: THREE.Group;
  mesh: THREE.Mesh;
  base: THREE.Vector3;
  /** Size of the piece in drawing units. */
  size: [number, number];
}

interface Mark {
  mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  shape: InkMark | null;
}

export class Puppet {
  readonly root = new THREE.Group();
  readonly aspect: number;
  private readonly joints = new Map<string, Joint>();
  private readonly mat: THREE.MeshBasicMaterial;
  private readonly inkMat: THREE.MeshBasicMaterial;
  private mouth: Mark | null = null;
  private readonly brows: Mark[] = [];
  private readonly lids: Mark[] = [];
  private readonly eyes: Joint[] = [];
  private readonly pupils: Joint[] = [];
  private readonly ownBrows: Joint[] = [];
  private ownMouth: Joint | null = null;
  private readonly W: number;
  private readonly H: number;

  constructor(
    readonly asset: PuppetAsset,
    entityId: string,
    /** Only this piece and what hangs from it (a hat that came off), standing on its own bottom. */
    only?: string,
  ) {
    const { rig } = asset;
    this.W = rig.w;
    this.H = rig.h;
    this.mat = tinted(new THREE.MeshBasicMaterial({ map: asset.texture, transparent: true, alphaTest: 0.4, side: THREE.DoubleSide }));
    this.inkMat = tinted(new THREE.MeshBasicMaterial({ map: inkAtlas().texture, transparent: true, alphaTest: 0.35, side: THREE.DoubleSide, depthWrite: false }));
    const pieces = rigOrder(rig);
    const keep = only ? descendants(pieces, only) : null;
    const layer = new Map<string, number>();
    let bottom = 0;
    let centreX = 0;
    if (only) {
      const cut = asset.pieces.get(only);
      if (cut) {
        bottom = cut.rect[3];
        centreX = (cut.rect[0] + cut.rect[2]) / 2;
      }
    }
    let minX = Infinity;
    let maxX = -Infinity;
    for (const p of pieces) {
      if (keep && !keep.has(p.id)) continue;
      const cut = asset.pieces.get(p.id);
      if (!cut) continue;
      const isRoot = only ? p.id === only : !p.parent || !this.joints.has(p.parent);
      const parent = isRoot ? undefined : this.joints.get(p.parent!);
      const pv = only && isRoot ? this.unit(centreX, bottom) : this.unit(p.pivot[0] * (this.W - 1), p.pivot[1] * (this.H - 1));
      const ppv = parent ? this.unitOfPivot(parent.piece, only, centreX, bottom) : new THREE.Vector2(0, 0);
      const myLayer = (parent ? (layer.get(parent.piece.id) ?? 0) : 0) + (isRoot ? 0 : p.z);
      layer.set(p.id, myLayer);
      const group = new THREE.Group();
      const base = new THREE.Vector3(pv.x - ppv.x, pv.y - ppv.y, (myLayer - (parent ? (layer.get(parent.piece.id) ?? 0) : 0)) * DZ);
      group.position.copy(base);
      const mesh = this.cardMesh(cut);
      const c = this.unit((cut.rect[0] + cut.rect[2]) / 2, (cut.rect[1] + cut.rect[3]) / 2);
      mesh.position.set(c.x - pv.x, c.y - pv.y, 0);
      mesh.userData.entityId = entityId;
      mesh.userData.piece = p.id;
      mesh.userData.asset = asset;
      group.add(mesh);
      (parent ? parent.group : this.root).add(group);
      const size: [number, number] = [(cut.rect[2] - cut.rect[0]) / this.H, (cut.rect[3] - cut.rect[1]) / this.H];
      const j: Joint = { piece: p, group, mesh, base, size };
      this.joints.set(p.id, j);
      minX = Math.min(minX, c.x - size[0] / 2);
      maxX = Math.max(maxX, c.x + size[0] / 2);
      if (p.kind === 'eye') this.eyes.push(j);
      if (p.kind === 'pupil') this.pupils.push(j);
      if (p.kind === 'brow') this.ownBrows.push(j);
      if (p.kind === 'mouth') this.ownMouth = j;
    }
    if (only) {
      // a piece on its own stands 1 tall like a whole drawing
      const cut = asset.pieces.get(only);
      const tall = cut ? Math.max(1e-3, (cut.rect[3] - cut.rect[1]) / this.H) : 1;
      this.root.scale.setScalar(1 / tall);
      this.aspect = Math.max(0.05, maxX - minX) / tall;
    } else this.aspect = this.W / this.H;
    if (!only) this.addFaceMarks(entityId);
  }

  /** Drawing pixels -> puppet units (bottom middle origin, 1 = drawing height). */
  private unit(x: number, y: number): THREE.Vector2 {
    return new THREE.Vector2((x - this.W / 2) / this.H, (this.H - y) / this.H);
  }

  private unitOfPivot(p: RigPiece, only: string | undefined, cx: number, bottom: number): THREE.Vector2 {
    if (only && p.id === only) return this.unit(cx, bottom);
    return this.unit(p.pivot[0] * (this.W - 1), p.pivot[1] * (this.H - 1));
  }

  private cardMesh(cut: CutPiece): THREE.Mesh {
    const w = (cut.rect[2] - cut.rect[0]) / this.H;
    const h = (cut.rect[3] - cut.rect[1]) / this.H;
    const geo = new THREE.PlaneGeometry(w, h);
    setCorners(geo, cut.uv);
    return new THREE.Mesh(geo, this.mat);
  }

  private inkMark(w: number, h: number): Mark {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), this.inkMat);
    mesh.visible = false;
    mesh.renderOrder = 2;
    return { mesh, shape: null };
  }

  /** Drawn-on mouth, brows and closed-eye lids, hidden until a face needs them. */
  private addFaceMarks(entityId: string): void {
    const { rig } = this.asset;
    const head = this.ownMouth?.piece.parent ?? this.eyes[0]?.piece.parent;
    const holder = head ? this.joints.get(head) : undefined;
    if (!holder) return;
    const hp = this.unit(holder.piece.pivot[0] * (this.W - 1), holder.piece.pivot[1] * (this.H - 1));
    const place = (m: Mark, x: number, y: number, z = 6) => {
      m.mesh.position.set(x - hp.x, y - hp.y, z * DZ);
      m.mesh.userData.entityId = entityId;
      holder.group.add(m.mesh);
    };
    const mouthCut = this.ownMouth ? this.asset.pieces.get(this.ownMouth.piece.id) : undefined;
    let mx: number | undefined;
    let my: number | undefined;
    let mw = 0;
    if (mouthCut) {
      const c = this.unit((mouthCut.rect[0] + mouthCut.rect[2]) / 2, (mouthCut.rect[1] + mouthCut.rect[3]) / 2);
      mx = c.x;
      my = c.y;
      mw = ((mouthCut.rect[2] - mouthCut.rect[0]) / this.H) * 1.2;
    } else if (rig.mouth_at) {
      const c = this.unit(rig.mouth_at[0] * (this.W - 1), rig.mouth_at[1] * (this.H - 1));
      mx = c.x;
      my = c.y;
      mw = (rig.mouth_at[2] * this.W) / this.H;
    }
    if (mx !== undefined && my !== undefined) {
      const headW = holder.size[0];
      mw = Math.max(mw, headW * 0.16);
      this.mouth = this.inkMark(mw, mw / 2);
      place(this.mouth, mx, my);
    }
    for (const eye of this.eyes) {
      const cut = this.asset.pieces.get(eye.piece.id)!;
      const c = this.unit((cut.rect[0] + cut.rect[2]) / 2, (cut.rect[1] + cut.rect[3]) / 2);
      const ew = eye.size[0];
      const eh = eye.size[1];
      const lid = this.inkMark(Math.max(ew * 1.5, 0.02), Math.max(ew * 0.75, 0.01));
      place(lid, c.x, c.y, 7);
      this.lids.push(lid);
      if (!this.ownBrows.length) {
        const bw = Math.max(ew * 1.8, holder.size[0] * 0.14);
        const brow = this.inkMark(bw, bw / 2);
        place(brow, c.x, c.y + eh * 0.5 + bw * 0.22);
        brow.mesh.userData.side = eye.piece.side;
        this.brows.push(brow);
      }
    }
  }

  private setMark(m: Mark, shape: InkMark | null): void {
    m.mesh.visible = shape !== null;
    if (shape === null || shape === m.shape) {
      m.shape = shape ?? m.shape;
      return;
    }
    m.shape = shape;
    setCorners(m.mesh.geometry, inkAtlas().uv(shape));
  }

  /** Every piece id, by kind (for the motion system). */
  get pieces(): RigPiece[] {
    return [...this.joints.values()].map((j) => j.piece);
  }

  sizeOf(id: string): [number, number] {
    return this.joints.get(id)?.size ?? [0, 0];
  }

  apply(pose: Pose): void {
    for (const j of this.joints.values()) {
      const p = pose.joints.get(j.piece.id) ?? REST;
      j.group.position.set(j.base.x + p.x, j.base.y + p.y, j.base.z + (p.front ? 12 * DZ : 0));
      j.group.rotation.z = p.rot;
      j.group.scale.set(p.sx, p.sy, 1);
      j.group.visible = !p.hidden;
    }
    const f = pose.face;
    const pupils = this.pupils.length > 0;
    this.eyes.forEach((eye, i) => {
      const side = eye.piece.side === 'r' ? 1 : eye.piece.side === 'l' ? 0 : i;
      const open = f.eyeOpen[Math.min(1, side)];
      const jp = pose.joints.get(eye.piece.id) ?? REST;
      eye.group.scale.set(jp.sx * f.eyeScale, jp.sy * f.eyeScale * Math.max(0.06, open), 1);
      if (!pupils) {
        eye.group.position.x = eye.base.x + jp.x + f.look[0] * eye.size[0] * 0.22;
        eye.group.position.y = eye.base.y + jp.y + f.look[1] * eye.size[1] * 0.18;
      }
      const lid = this.lids[i];
      if (lid) this.setMark(lid, open < 0.3 && f.lid ? f.lid : null);
    });
    for (const p of this.pupils) {
      const parent = p.piece.parent ? this.joints.get(p.piece.parent) : undefined;
      const room = parent ? parent.size : p.size;
      p.group.position.x = p.base.x + f.look[0] * Math.max(0, room[0] - p.size[0]) * 0.45;
      p.group.position.y = p.base.y + f.look[1] * Math.max(0, room[1] - p.size[1]) * 0.4;
    }
    if (this.ownMouth) this.ownMouth.group.visible = f.mouth === null || !this.mouth;
    if (this.mouth) this.setMark(this.mouth, f.mouth);
    for (const b of this.ownBrows) {
      const jp = pose.joints.get(b.piece.id) ?? REST;
      const sign = b.piece.side === 'r' ? -1 : 1;
      b.group.position.y = b.base.y + jp.y + f.brows.raise * b.size[1] * 2.2;
      b.group.rotation.z = jp.rot + f.brows.tilt * sign * 0.45;
    }
    for (const b of this.brows) {
      const show = f.brows.alpha > 0.04;
      this.setMark(b, show ? 'brow' : null);
      if (!show) continue;
      const sign = b.mesh.userData.side === 'r' ? -1 : 1;
      b.mesh.rotation.z = f.brows.tilt * sign * 0.45;
      b.mesh.scale.setScalar(0.6 + 0.4 * f.brows.alpha);
      b.mesh.userData.raise ??= b.mesh.position.y;
      b.mesh.position.y = (b.mesh.userData.raise as number) + f.brows.raise * (b.mesh.geometry.parameters.height * 0.6);
    }
  }

  setOpacity(a: number): void {
    this.mat.opacity = a;
    this.inkMat.opacity = a;
  }

  get pickables(): THREE.Object3D[] {
    return [...this.joints.values()].filter((j) => j.group.visible).map((j) => j.mesh);
  }

  dispose(): void {
    for (const j of this.joints.values()) j.mesh.geometry.dispose();
    for (const m of [this.mouth, ...this.brows, ...this.lids]) m?.mesh.geometry.dispose();
    this.mat.dispose();
    this.inkMat.dispose();
  }
}

const REST = restJoint();

/** Map a plane's four corners (top-left, top-right, bottom-left, bottom-right) onto a texture rectangle. */
function setCorners(geo: THREE.PlaneGeometry, [u0, v0, u1, v1]: [number, number, number, number]): void {
  const uv = geo.attributes.uv as THREE.BufferAttribute;
  for (let i = 0; i < 4; i++) uv.setXY(i, i % 2 ? u1 : u0, i < 2 ? v1 : v0);
  uv.needsUpdate = true;
}

function descendants(pieces: RigPiece[], id: string): Set<string> {
  const out = new Set<string>([id]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const p of pieces)
      if (p.parent && out.has(p.parent) && !out.has(p.id)) {
        out.add(p.id);
        grew = true;
      }
  }
  return out;
}
