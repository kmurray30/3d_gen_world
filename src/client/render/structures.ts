/**
 * One structure entity on screen: a mesh per material slot (crayon tile times tint times face shade), decal quads
 * for doors, windows and signs, and ink outlines drawn as fat lines with a width in metres so near and far edges
 * match the sprites' outlines. Parts can fade when they stand between the camera and the player.
 */
import * as THREE from 'three';
import { LineSegments2 } from 'three/examples/jsm/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/examples/jsm/lines/LineSegmentsGeometry.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import type { Entity, Vec3 } from '../../shared/types';
import { DEG } from '../../shared/engine/math';
import { buildStructureMesh, type MeshGroup } from '../../shared/structure/geometry';
import type { Structure } from '../../shared/structure/types';
import { MaterialTiles } from './materials';
import type { TextureStore } from './textures';

const INK = '#2b2b2b';
const INK_WIDTH_M = 0.045;
const FADE_ALPHA = 0.22;
const FADE_SPEED = 7;

export interface StructureAssets {
  tiles: MaterialTiles;
  textures: TextureStore;
}

/** One drawable group with its own fade state. */
interface Piece {
  mesh: THREE.Mesh;
  mat: THREE.MeshBasicMaterial;
  box: THREE.Box3;
  alpha: number;
  target: number;
}

export class StructureView {
  readonly root = new THREE.Group();
  private readonly pieces: Piece[] = [];
  private lines: LineSegments2 | null = null;
  private lineMat: LineMaterial | null = null;
  private built: Structure | null = null;
  private fadeAll = 1;
  private readonly bounds = new THREE.Box3();

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
    for (const g of data.groups) this.addGroup(g);
    if (data.edges.length) {
      const geo = new LineSegmentsGeometry();
      geo.setPositions(data.edges);
      this.lineMat = new LineMaterial({ color: new THREE.Color(s.ink ?? INK).getHex(), linewidth: INK_WIDTH_M, worldUnits: true, transparent: true, depthWrite: false });
      this.lineMat.polygonOffset = true;
      this.lineMat.polygonOffsetFactor = -2;
      this.lineMat.polygonOffsetUnits = -2;
      this.lines = new LineSegments2(geo, this.lineMat);
      this.lines.renderOrder = 1;
      this.lines.frustumCulled = false;
      this.root.add(this.lines);
    }
    this.bounds.makeEmpty();
    for (const p of this.pieces) this.bounds.union(p.box);
  }

  private addGroup(g: MeshGroup): void {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(g.mesh.pos, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(g.mesh.nrm, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(g.mesh.uv, 2));
    const colors: number[] = [];
    for (const s of g.mesh.shade) colors.push(s, s, s);
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geo.setIndex(g.mesh.idx);
    geo.computeBoundingBox();
    const mat = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.FrontSide });
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
        this.assets.textures
          .load(file)
          .then((tex) => {
            mat.map = tex;
            mat.needsUpdate = true;
          })
          .catch(() => undefined);
      }
    } else {
      mat.map = this.assets.tiles.get(g.mat);
      mat.color.set(g.color);
    }
    const mesh = new THREE.Mesh(geo, mat);
    mesh.userData.entityId = this.id;
    this.root.add(mesh);
    this.pieces.push({ mesh, mat, box: geo.boundingBox!.clone(), alpha: 1, target: 1 });
  }

  update(e: Entity, pos: Vec3, dt: number): void {
    if (e.structure && e.structure !== this.built) this.build(e.structure);
    this.root.position.set(pos[0], pos[1], pos[2]);
    this.root.rotation.set(0, (e.yaw ?? 0) * DEG, 0);
    const sc = Math.max(0.001, e.scale);
    this.root.scale.set(sc, sc, sc);
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
    for (const p of this.pieces) {
      this.root.remove(p.mesh);
      p.mesh.geometry.dispose();
      p.mat.dispose();
    }
    this.pieces.length = 0;
    if (this.lines) {
      this.root.remove(this.lines);
      this.lines.geometry.dispose();
      this.lineMat?.dispose();
      this.lines = null;
      this.lineMat = null;
    }
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
