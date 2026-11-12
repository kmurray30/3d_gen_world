/**
 * One structure entity on screen: a mesh per material slot (crayon tile times tint times face shade), decal quads
 * for doors, windows and signs, and ink outlines drawn as fat lines with a width in metres so near and far edges
 * match the sprites' outlines. Parts can fade when they stand between the camera and the player.
 *
 * Moving pieces each get a group of their own about their joint (a mailbox door on its hinge, a bucket on its
 * rope, a lamp that switches off). Window drawings are cut into a frame and two sashes that swing out with a
 * dark room behind them. The "apart" gesture builds every part on its own for a moment and floats them out.
 */
import * as THREE from 'three';
import { LineSegments2 } from 'three/examples/jsm/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/examples/jsm/lines/LineSegmentsGeometry.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import type { Entity, Vec3 } from '../../shared/types';
import { DEG, clamp } from '../../shared/engine/math';
import type { Transient } from '../../shared/engine/world';
import { buildStructureMesh, type MeshGroup } from '../../shared/structure/geometry';
import { doorMover, doorParts, jointOn, windowParts } from '../../shared/structure/joints';
import { WINDOW_SASH } from '../../shared/structure/openings';
import type { Joint, Structure } from '../../shared/structure/types';
import { MaterialTiles } from './materials';
import { applyCrayon } from './crayon';
import type { TextureStore } from './textures';
import { LIGHT, tinted } from './tint';

const INK = '#2b2b2b';
const INK_WIDTH_M = 0.045;
const FADE_ALPHA = 0.22;
const FADE_SPEED = 7;
const SASH = WINDOW_SASH;
const SASH_OPEN = 1.75;
const ROOM = '#2c2621';
const LAMP_OFF = new THREE.Color('#b8b6aa');

const ease = (k: number) => k * k * (3 - 2 * k);

/** A window drawing with the sashes' rectangle cut out of it and a line of ink round the hole. */
const frames = new Map<string, Promise<THREE.Texture>>();
function windowFrame(textures: TextureStore, file: string): Promise<THREE.Texture> {
  let p = frames.get(file);
  if (!p) {
    p = textures.load(file).then((tex) => {
      const img = tex.image as CanvasImageSource & { width: number; height: number };
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      const x = SASH.x0 * img.width;
      const y = SASH.y0 * img.height;
      const w = (SASH.x1 - SASH.x0) * img.width;
      const h = (SASH.y1 - SASH.y0) * img.height;
      ctx.clearRect(x, y, w, h);
      ctx.strokeStyle = '#1f1d1b';
      ctx.lineWidth = Math.max(2, img.width * 0.012);
      ctx.strokeRect(x, y, w, h);
      const out = new THREE.CanvasTexture(canvas);
      out.colorSpace = tex.colorSpace;
      out.anisotropy = tex.anisotropy;
      return out;
    });
    frames.set(file, p);
  }
  return p;
}

export interface StructureAssets {
  tiles: MaterialTiles;
  textures: TextureStore;
  /** Soft glow sprite for lamps at night. */
  halo?: THREE.Texture;
}

/** One drawable group with its own fade state. */
interface Piece {
  mesh: THREE.Mesh;
  mat: THREE.MeshBasicMaterial;
  box: THREE.Box3;
  alpha: number;
  target: number;
  /** Doors: swing amount 0..1, the rotation sign that opens inward, and the state key that opens it. */
  door?: { k: number; sign: number; key: string };
}

/** A moving piece: its parts' meshes and outline under a group placed at the joint. */
interface JointView {
  joint: Joint;
  group: THREE.Group;
  /** Where the move is, 0 (built) to 1. */
  k: number;
  spin: number;
  axis: THREE.Vector3;
  mats: THREE.MeshBasicMaterial[];
  /** A lamp's own night glow level, so it can be switched off. */
  glow?: { value: number };
  colors?: THREE.Color[];
}

/** A window cut into its frame and two sashes that swing out about their outer edges. */
interface WindowView {
  key: string;
  sashes: Array<{ group: THREE.Group; sign: number }>;
  k: number;
}

export class StructureView {
  readonly root = new THREE.Group();
  private readonly pieces: Piece[] = [];
  private readonly lineSets: LineSegments2[] = [];
  private lineMat: LineMaterial | null = null;
  private built: Structure | null = null;
  private fadeAll = 1;
  private readonly bounds = new THREE.Box3();
  /** The lighthouse's sweeping beam, when this structure has a beacon, and the lamp joint that switches it. */
  private beam: THREE.Group | null = null;
  private beamJoint: JointView | undefined;
  /** Night halos round lamp parts, and the lamp joint each belongs to. */
  private readonly halos: Array<{ sprite: THREE.Sprite; joint?: JointView }> = [];
  private readonly joints = new Map<string, JointView>();
  private readonly windows: WindowView[] = [];
  /** Windows not cut yet: a window stays one quad until it first opens. */
  private readonly uncut = new Map<string, { g: MeshGroup; geo: THREE.BufferGeometry; n: number; mat: THREE.MeshBasicMaterial; hole: boolean }>();
  /** The exploded view while the "apart" gesture plays: every part on its own, floating out from the middle. */
  private apart: { group: THREE.Group; parts: Array<{ obj: THREE.Object3D; home: THREE.Vector3; dir: THREE.Vector3; spin: THREE.Vector3 }>; lines: LineSegments2[] } | null = null;

  constructor(
    public readonly id: string,
    private readonly assets: StructureAssets,
  ) {
    this.root.userData.entityId = id;
  }

  /** The meshes a raycaster can hit (for targeting). */
  get pickables(): THREE.Object3D[] {
    return this.pieces.map((p) => p.mesh);
  }

  private build(s: Structure): void {
    this.clear();
    this.built = s;
    const data = buildStructureMesh(s);
    for (const j of s.joints ?? []) this.addJoint(j);
    const windowOf = new Map(windowParts(s).map((part, n) => [part, n]));
    const doors = doorParts(s);
    const doorOf = new Map(doors.map((part, n) => [part, doorMover(n, doors.length)]));
    for (const g of data.groups) this.addGroup(g, windowOf, doorOf);
    // small props (a mailbox, a lamp post) get a finer line, so the ink does not swallow them
    const ink = clamp(0.012 + Math.max(s.bounds.w, s.bounds.d) * 0.03, 0.02, INK_WIDTH_M);
    this.lineMat = new LineMaterial({ color: new THREE.Color(s.ink ?? INK).getHex(), linewidth: ink, worldUnits: true, transparent: true, depthWrite: false });
    this.lineMat.polygonOffset = true;
    this.lineMat.polygonOffsetFactor = -2;
    this.lineMat.polygonOffsetUnits = -2;
    if (data.edges.length) this.lineSets.push(this.makeLines(data.edges, this.root));
    for (const [id, edges] of Object.entries(data.jointEdges)) {
      const jv = this.joints.get(id);
      if (jv && edges.length) this.lineSets.push(this.makeLines(edges, jv.group, jv.joint.at));
    }
    this.bounds.makeEmpty();
    for (const p of this.pieces) this.bounds.union(p.box);
    const lamp = s.parts.find((p) => p.beacon);
    if (lamp && lamp.t === 'prism') {
      this.beam = new THREE.Group();
      this.beam.position.set(lamp.pos[0], lamp.pos[1] + lamp.h * 0.55, lamp.pos[2]);
      const geo = new THREE.ConeGeometry(4.5, 34, 20, 1, true).translate(0, -17, 0).rotateZ(Math.PI / 2);
      const mat = new THREE.MeshBasicMaterial({ color: '#fff1b8', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false });
      for (const turn of [0, Math.PI]) {
        const cone = new THREE.Mesh(geo, mat);
        cone.rotation.y = turn;
        this.beam.add(cone);
      }
      this.beam.renderOrder = 3;
      this.root.add(this.beam);
      this.beamJoint = lamp.joint ? this.joints.get(lamp.joint) : undefined;
    }
    if (this.assets.halo) {
      for (const part of s.parts) {
        if (!part.halo || !('h' in part)) continue;
        const size = part.t === 'prism' ? Math.max(part.r * 2, part.h) : Math.max(part.w, part.h);
        const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.assets.halo, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, fog: false }));
        halo.position.set(part.pos[0], part.pos[1] + part.h / 2, part.pos[2]);
        halo.scale.setScalar(Math.max(1.6, size * 4));
        halo.renderOrder = 3;
        halo.visible = false;
        this.root.add(halo);
        const joint = part.joint ? this.joints.get(part.joint) : undefined;
        this.halos.push({ sprite: halo, ...(joint?.joint.kind === 'light' ? { joint } : {}) });
      }
    }
  }

  private makeLines(edges: number[], parent: THREE.Object3D, at?: [number, number, number]): LineSegments2 {
    const pts = at ? edges.map((v, i) => v - at[i % 3]) : edges;
    const geo = new LineSegmentsGeometry();
    geo.setPositions(pts);
    const lines = new LineSegments2(geo, this.lineMat!);
    lines.renderOrder = 1;
    lines.frustumCulled = false;
    parent.add(lines);
    return lines;
  }

  private addJoint(j: Joint): void {
    const group = new THREE.Group();
    group.position.set(j.at[0], j.at[1], j.at[2]);
    this.root.add(group);
    this.joints.set(j.id, { joint: j, group, k: -1, spin: 0, axis: new THREE.Vector3(...j.axis).normalize(), mats: [], ...(j.kind === 'light' ? { glow: { value: 0 }, colors: [] } : {}) });
  }

  /** A material for a mesh group: a tinted crayon tile, or a decal's sprite (a window's frame when it is cut). */
  private material(g: MeshGroup, glowLevel?: { value: number }, frame = false): THREE.MeshBasicMaterial {
    const mat = tinted(new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.FrontSide }), !!g.glow, glowLevel);
    if (g.decal) {
      mat.transparent = true;
      mat.alphaTest = 0.4;
      mat.side = THREE.DoubleSide;
      mat.color.set('#ffffff');
      mat.polygonOffset = true;
      mat.polygonOffsetFactor = -1;
      mat.polygonOffsetUnits = -1;
      if (g.decal.text !== undefined) mat.map = this.assets.textures.sign(g.decal.text, g.color);
      else if (g.decal.sprite.file) {
        const file = g.decal.sprite.file;
        mat.map = this.assets.textures.placeholder('', 'object', g.decal.sprite.w / Math.max(1, g.decal.sprite.h));
        (frame ? windowFrame(this.assets.textures, file) : this.assets.textures.load(file))
          .then((tex) => {
            mat.map = tex;
            mat.needsUpdate = true;
          })
          .catch(() => undefined);
      }
    } else {
      mat.map = this.assets.tiles.get(g.mat);
      mat.color.set(g.color);
      applyCrayon(mat, () => this.root.scale.x);
    }
    return mat;
  }

  private geometry(g: MeshGroup, at?: [number, number, number]): THREE.BufferGeometry {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(g.mesh.pos, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(g.mesh.nrm, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(g.mesh.uv, 2));
    const colors: number[] = [];
    for (const s of g.mesh.shade) colors.push(s, s, s);
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geo.setIndex(g.mesh.idx);
    if (at) geo.translate(-at[0], -at[1], -at[2]);
    geo.computeBoundingBox();
    return geo;
  }

  private addGroup(g: MeshGroup, windowOf: Map<number, number>, doorOf: Map<number, { name: string; key: string }>): void {
    const jv = g.joint ? this.joints.get(g.joint) : undefined;
    const at = jv?.joint.at;
    const geo = this.geometry(g, at);
    const n = g.decal?.role === 'window' && g.decal.sprite.file ? windowOf.get(g.decal.part) : undefined;
    const mat = this.material(g, jv?.glow);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.userData.entityId = this.id;
    if (jv) mesh.userData.piece = jv.joint.id;
    (jv ? jv.group : this.root).add(mesh);
    const box = geo.boundingBox!.clone();
    if (at) box.translate(new THREE.Vector3(...at));
    const piece: Piece = { mesh, mat, box, alpha: 1, target: 1 };
    if (jv) {
      jv.mats.push(mat);
      jv.colors?.push(mat.color.clone());
    }
    const door = g.decal?.role === 'door' && !g.joint ? doorOf.get(g.decal.part) : undefined;
    if (door) {
      mesh.userData.piece = door.name;
      this.hingeDoor(piece, geo, door.key);
    }
    this.pieces.push(piece);
    if (n !== undefined) {
      mesh.userData.piece = `window_${n}`;
      this.uncut.set(`open_window_${n}`, { g, geo, n, mat, hole: !!g.decal?.hole });
    }
  }

  /**
   * Put a window's two sashes over its frame, each on a hinge at its outer edge so it swings out, and a dark room
   * behind them that lights up at night.
   */
  private cutWindow(g: MeshGroup, geo: THREE.BufferGeometry, n: number, frameMat: THREE.MeshBasicMaterial, hole: boolean): void {
    const p = geo.attributes.position as THREE.BufferAttribute;
    const nr = geo.attributes.normal as THREE.BufferAttribute;
    if (!p || p.count < 4 || !g.decal?.sprite.file) return;
    windowFrame(this.assets.textures, g.decal.sprite.file)
      .then((tex) => {
        frameMat.map = tex;
        frameMat.needsUpdate = true;
      })
      .catch(() => undefined);
    const v = (i: number) => new THREE.Vector3(p.getX(i), p.getY(i), p.getZ(i));
    const bl = v(0);
    const ax = v(1).sub(bl);
    const ay = v(3).sub(bl);
    const normal = new THREE.Vector3(nr.getX(0), nr.getY(0), nr.getZ(0)).normalize();
    const at = (u: number, w: number) => bl.clone().addScaledVector(ax, u).addScaledVector(ay, w);
    const v0 = 1 - SASH.y1;
    const v1 = 1 - SASH.y0;
    const quad = (u0: number, u1: number, origin: THREE.Vector3, back: number): THREE.BufferGeometry => {
      const corners = [at(u0, v0), at(u1, v0), at(u1, v1), at(u0, v1)].map((c) => c.sub(origin).addScaledVector(normal, -back));
      const q = new THREE.BufferGeometry();
      q.setAttribute('position', new THREE.Float32BufferAttribute(corners.flatMap((c) => [c.x, c.y, c.z]), 3));
      q.setAttribute('normal', new THREE.Float32BufferAttribute([0, 1, 2, 3].flatMap(() => [normal.x, normal.y, normal.z]), 3));
      q.setAttribute('uv', new THREE.Float32BufferAttribute([u0, v0, u1, v0, u1, v1, u0, v1], 2));
      q.setAttribute('color', new THREE.Float32BufferAttribute(new Array(12).fill(1), 3));
      q.setIndex([0, 1, 2, 0, 2, 3]);
      q.computeBoundingBox();
      return q;
    };
    const name = `window_${n}`;
    const add = (mesh: THREE.Mesh, mat: THREE.MeshBasicMaterial, parent: THREE.Object3D, offset: THREE.Vector3) => {
      mesh.userData.entityId = this.id;
      mesh.userData.piece = name;
      parent.add(mesh);
      this.pieces.push({ mesh, mat, box: mesh.geometry.boundingBox!.clone().translate(offset), alpha: 1, target: 1 });
    };
    if (!hole) {
      // nothing cut behind this one (a window on something solid): a dark room painted behind the sashes
      const roomMat = tinted(new THREE.MeshBasicMaterial({ color: ROOM, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }), true);
      add(new THREE.Mesh(quad(SASH.x0, SASH.x1, new THREE.Vector3(), 0.005), roomMat), roomMat, this.root, new THREE.Vector3());
    }
    const sashes: WindowView['sashes'] = [];
    for (const [u0, u1, hingeU] of [
      [SASH.x0, SASH.xm, SASH.x0],
      [SASH.xm, SASH.x1, SASH.x1],
    ] as const) {
      const hinge = at(hingeU, v0);
      const group = new THREE.Group();
      group.position.copy(hinge);
      this.root.add(group);
      const mat = this.material({ ...g, decal: { ...g.decal, role: undefined } });
      add(new THREE.Mesh(quad(u0, u1, hinge, -0.002), mat), mat, group, hinge);
      // swing the free edge out of the wall
      const free = ax.clone().multiplyScalar(hingeU === u0 ? 1 : -1);
      const swung = free.applyAxisAngle(new THREE.Vector3(0, 1, 0), 1);
      sashes.push({ group, sign: swung.dot(normal) > 0 ? 1 : -1 });
    }
    this.windows.push({ key: `open_window_${n}`, sashes, k: 0 });
  }

  /** Move a door quad's origin to its hinge edge so it can swing open about it. */
  private hingeDoor(piece: Piece, geo: THREE.BufferGeometry, key: string): void {
    const p = geo.attributes.position as THREE.BufferAttribute;
    const n = geo.attributes.normal as THREE.BufferAttribute;
    if (!p || !n || p.count < 3) return;
    const normal = new THREE.Vector3(n.getX(0), n.getY(0), n.getZ(0));
    normal.y = 0;
    if (normal.lengthSq() < 1e-6) return;
    normal.normalize();
    const right = new THREE.Vector3(0, 1, 0).cross(normal).normalize();
    let min = Infinity;
    let hinge = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) {
      const v = new THREE.Vector3(p.getX(i), p.getY(i), p.getZ(i));
      const d = v.dot(right);
      if (d < min - 1e-6) {
        min = d;
        hinge = v;
      }
    }
    geo.translate(-hinge.x, 0, -hinge.z);
    geo.computeBoundingBox();
    piece.mesh.position.set(hinge.x, 0, hinge.z);
    piece.box = geo.boundingBox!.clone().translate(new THREE.Vector3(hinge.x, 0, hinge.z));
    // swing inward (away from the outward normal): pick the rotation sign that moves the free edge that way
    const swung = right.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), 1);
    piece.door = { k: 0, sign: swung.dot(normal) < 0 ? 1 : -1, key };
  }

  update(e: Entity, pos: Vec3, dt: number, gesture?: Transient['gesture']): void {
    if (e.structure && e.structure !== this.built) this.build(e.structure);
    for (const p of this.pieces) {
      if (!p.door) continue;
      const open = e.state[p.door.key] === true ? 1 : 0;
      p.door.k += (open - p.door.k) * Math.min(1, dt * 6);
      if (Math.abs(p.door.k - open) < 0.005) p.door.k = open;
      p.mesh.rotation.y = p.door.sign * p.door.k * 1.8;
    }
    this.moveJoints(e, dt);
    if (this.uncut.size)
      for (const [key, w] of this.uncut)
        if (e.state[key] === true) {
          this.uncut.delete(key);
          this.cutWindow(w.g, w.geo, w.n, w.mat, w.hole);
        }
    for (const w of this.windows) {
      const want = e.state[w.key] === true ? 1 : 0;
      w.k = w.k < 0 ? want : w.k < want ? Math.min(want, w.k + dt / 0.5) : Math.max(want, w.k - dt / 0.5);
      for (const sash of w.sashes) sash.group.rotation.y = sash.sign * ease(w.k) * SASH_OPEN;
    }
    const apart = gesture?.name === 'apart' && this.built ? gesture : undefined;
    if (apart && !this.apart) this.explode(this.built!);
    else if (!apart && this.apart) this.unexplode();
    if (apart && this.apart) {
      const p = clamp(apart.t / Math.max(0.01, apart.dur), 0, 1);
      const amt = p < 0.3 ? ease(p / 0.3) : p > 0.72 ? ease((1 - p) / 0.28) : 1;
      for (const q of this.apart.parts) {
        q.obj.position.copy(q.home).addScaledVector(q.dir, amt);
        q.obj.rotation.set(q.spin.x * amt, q.spin.y * amt, q.spin.z * amt);
      }
    }
    this.root.position.set(pos[0], pos[1], pos[2]);
    this.root.rotation.set(0, (e.yaw ?? 0) * DEG, 0);
    const sc = Math.max(0.001, e.scale);
    this.root.scale.set(sc, sc, sc);
    for (const p of this.pieces) (p.mat.userData.crayonUpdate as (() => void) | undefined)?.();
    this.root.visible = !e.hidden;
    const base = e.alpha ?? 1;
    let anyFaded = false;
    let minAlpha = 1;
    for (const p of this.pieces) {
      const want = Math.min(base, p.target);
      p.alpha += (want - p.alpha) * Math.min(1, dt * FADE_SPEED);
      if (Math.abs(p.alpha - want) < 0.01) p.alpha = want;
      const faded = p.alpha < 0.999;
      const isDecal = !!p.mat.alphaTest;
      // faded pieces stop writing depth so the avatar behind them still draws; front-face culling keeps a
      // ghosted box from showing its far faces through its near ones
      if (p.mat.transparent !== (faded || isDecal)) {
        p.mat.transparent = faded || isDecal;
        p.mat.needsUpdate = true;
      }
      p.mat.opacity = p.alpha;
      p.mat.depthWrite = !faded;
      if (faded) anyFaded = true;
      minAlpha = Math.min(minAlpha, p.alpha);
    }
    if (this.lineMat) {
      // outlines go translucent with the structure, so a ghosted house does not keep bold ink
      const lineAlpha = anyFaded ? Math.max(0.25, minAlpha + 0.1) : base;
      this.lineMat.opacity = lineAlpha;
      this.lineMat.transparent = true;
    }
    this.fadeAll = base;
    if (this.beam) {
      const glow = LIGHT.glow.value;
      const on = this.beamJoint ? 1 - ease(Math.max(0, this.beamJoint.k)) : 1;
      this.beam.visible = glow * on > 0.05 && !e.hidden && !this.apart;
      this.beam.rotation.y += dt * 0.7;
      const mat = (this.beam.children[0] as THREE.Mesh).material as THREE.MeshBasicMaterial;
      mat.opacity = 0.16 * glow * on;
    }
    if (this.halos.length) {
      const glow = LIGHT.glow.value;
      for (const { sprite, joint } of this.halos) {
        const on = joint ? 1 - ease(Math.max(0, joint.k)) : 1;
        sprite.visible = glow * on > 0.03 && !e.hidden && !this.apart;
        sprite.material.opacity = glow * 0.9 * base * on;
      }
    }
  }

  /** Move each joint toward its state: hinges turn, slides slide, ropes stretch, water shrinks away, lamps go dark. */
  private moveJoints(e: Entity, dt: number): void {
    for (const jv of this.joints.values()) {
      const j = jv.joint;
      const want = jointOn(e, j) ? 1 : 0;
      const step = dt / Math.max(0.05, j.secs ?? 0.6);
      jv.k = jv.k < 0 ? want : jv.k < want ? Math.min(want, jv.k + step) : Math.max(want, jv.k - step);
      const k = ease(jv.k);
      const g = jv.group;
      switch (j.kind) {
        case 'hinge':
          g.quaternion.setFromAxisAngle(jv.axis, k * j.amount);
          break;
        case 'slide':
          g.position.set(j.at[0], j.at[1], j.at[2]).addScaledVector(jv.axis, k * j.amount);
          break;
        case 'stretch': {
          const f = k * j.amount;
          g.scale.set(1 + f * Math.abs(jv.axis.x), 1 + f * Math.abs(jv.axis.y), 1 + f * Math.abs(jv.axis.z));
          break;
        }
        case 'spin':
          jv.spin += dt * j.amount * k;
          g.quaternion.setFromAxisAngle(jv.axis, jv.spin);
          break;
        case 'shrink': {
          const f = Math.max(0.001, 1 - k);
          g.scale.setScalar(f);
          g.visible = f > 0.01 && !this.apart;
          break;
        }
        case 'light':
          if (jv.glow) jv.glow.value = LIGHT.glow.value * (1 - k);
          jv.mats.forEach((m, i) => {
            const c = jv.colors?.[i];
            if (c) m.color.copy(c).lerp(LAMP_OFF, k * 0.75);
          });
          break;
      }
    }
  }

  /** Build every part on its own, floating out from the middle by a little more than its size. */
  private explode(s: Structure): void {
    const group = new THREE.Group();
    const parts: NonNullable<StructureView['apart']>['parts'] = [];
    const lines: LineSegments2[] = [];
    for (const child of this.root.children) child.visible = false;
    this.root.add(group);
    const centre = this.bounds.getCenter(new THREE.Vector3());
    const size = this.bounds.getSize(new THREE.Vector3());
    const reach = Math.max(size.x, size.y, size.z) * 0.22 + 0.2;
    const bare = { ...s, joints: [] };
    s.parts.forEach((part, i) => {
      if (part.hidden) return;
      const data = buildStructureMesh(bare, new Set([i]));
      if (!data.groups.length) return;
      const box = new THREE.Box3();
      for (const g of data.groups) for (let k = 0; k < g.mesh.pos.length; k += 3) box.expandByPoint(new THREE.Vector3(g.mesh.pos[k], g.mesh.pos[k + 1], g.mesh.pos[k + 2]));
      const home = box.getCenter(new THREE.Vector3());
      const holder = new THREE.Group();
      holder.position.copy(home);
      for (const g of data.groups) {
        const mesh = new THREE.Mesh(this.geometry(g, [home.x, home.y, home.z]), this.material(g));
        mesh.userData.entityId = this.id;
        holder.add(mesh);
      }
      if (data.edges.length && this.lineMat) lines.push(this.makeLines(data.edges, holder, [home.x, home.y, home.z]));
      const out = home.clone().sub(centre);
      out.y = out.y * 0.6 + size.y * 0.12;
      if (out.lengthSq() < 1e-4) out.set(0, 1, 0);
      const r = (q: number) => ((Math.sin(i * 12.9898 + q * 78.233) * 43758.5453) % 1) * 0.35;
      parts.push({ obj: holder, home, dir: out.normalize().multiplyScalar(reach * (0.8 + Math.abs(r(3)))), spin: new THREE.Vector3(r(1), r(2), r(4)) });
      group.add(holder);
    });
    this.apart = { group, parts, lines };
  }

  private unexplode(): void {
    const a = this.apart;
    if (!a) return;
    this.root.remove(a.group);
    a.group.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        o.geometry.dispose();
        (o.material as THREE.Material).dispose();
      }
    });
    for (const l of a.lines) l.geometry.dispose();
    this.apart = null;
    for (const child of this.root.children) child.visible = true;
    // joints that hide when shrunk, and the beam and halos, set their own visibility again next frame
  }

  /**
   * Decide which pieces should fade: those a segment from the camera to any of the target points (the avatar's
   * feet, chest and head) passes through, or that the camera sits inside. World points; disabled = all opaque.
   */
  setFade(enabled: boolean, cam: THREE.Vector3 | null, targets: THREE.Vector3[]): void {
    if (!enabled || !cam || !targets.length) {
      for (const p of this.pieces) p.target = 1;
      return;
    }
    this.root.updateMatrixWorld();
    const inv = this.root.matrixWorld.clone().invert();
    const a = cam.clone().applyMatrix4(inv);
    const bs = targets.map((t) => t.clone().applyMatrix4(inv));
    // quick reject: every segment misses the whole structure
    const whole = this.bounds.clone().expandByScalar(0.05);
    if (!whole.containsPoint(a) && !bs.some((b) => segmentHitsBox(a, b, whole))) {
      for (const p of this.pieces) p.target = 1;
      return;
    }
    for (const p of this.pieces) {
      const box = p.box.clone().expandByScalar(0.03);
      p.target = bs.some((b) => segmentHitsBox(a, b, box)) ? FADE_ALPHA : 1;
    }
  }

  private clear(): void {
    this.unexplode();
    for (const p of this.pieces) {
      p.mesh.removeFromParent();
      p.mesh.geometry.dispose();
      p.mat.dispose();
    }
    this.pieces.length = 0;
    for (const jv of this.joints.values()) this.root.remove(jv.group);
    this.joints.clear();
    for (const w of this.windows) for (const sash of w.sashes) this.root.remove(sash.group);
    this.windows.length = 0;
    this.uncut.clear();
    if (this.beam) {
      this.root.remove(this.beam);
      const cone = this.beam.children[0] as THREE.Mesh;
      cone.geometry.dispose();
      (cone.material as THREE.Material).dispose();
      this.beam = null;
      this.beamJoint = undefined;
    }
    for (const h of this.halos) {
      this.root.remove(h.sprite);
      h.sprite.material.dispose();
    }
    this.halos.length = 0;
    for (const l of this.lineSets) {
      l.removeFromParent();
      l.geometry.dispose();
    }
    this.lineSets.length = 0;
    this.lineMat?.dispose();
    this.lineMat = null;
  }

  /** Called by the scene on resize so fat lines know the viewport. */
  setResolution(w: number, h: number): void {
    this.lineMat?.resolution.set(w, h);
  }

  dispose(): void {
    this.clear();
  }
}

const tmpDir = new THREE.Vector3();
const tmpRay = new THREE.Ray();
const tmpHit = new THREE.Vector3();

/** Whether the segment a-b intersects the box (either endpoint inside counts). */
function segmentHitsBox(a: THREE.Vector3, b: THREE.Vector3, box: THREE.Box3): boolean {
  if (box.containsPoint(a) || box.containsPoint(b)) return true;
  tmpDir.subVectors(b, a);
  const len = tmpDir.length();
  if (len < 1e-6) return false;
  tmpDir.divideScalar(len);
  tmpRay.set(a, tmpDir);
  const hit = tmpRay.intersectBox(box, tmpHit);
  return !!hit && hit.distanceTo(a) <= len;
}
