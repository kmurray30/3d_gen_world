import * as THREE from 'three';
import type { Entity, PlayerState, SpriteRef, Vec3 } from '../../shared/types';
import { worldPos } from '../../shared/engine/transform';
import type { WorldModel } from '../../shared/engine/world';
import { SpriteView, origamiKind, type GroundView } from './sprites';
import { applyCrayon, crayonTexture, CRAYON_METRES } from './crayon';
import { flipFor, lerpAngle, visibleYaw, yawAlong, yawFacing } from '../../shared/engine/facing';
import { StructureView } from './structures';
import { MaterialTiles } from './materials';
import { TextureStore, makeGroundTexture, makeShadowTexture } from './textures';
import { ParticleSystem, shapeOfEntity } from './effects';
import { BubbleLayer } from './labels';
import { TerrainView } from './terrain';
import { SkyView, haloTexture } from './sky';
import { tinted } from './tint';
import type { TerrainField } from '../../shared/terrain/field';
import type { CameraPose } from '../app/camera';

export const SKY_TOP = '#6db3ff';
export const SKY_HORIZON = '#d9efff';

export interface AvatarSpec {
  word: string;
  sprite: SpriteRef;
  heightM: number;
}

export class SceneView {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera: THREE.PerspectiveCamera;
  readonly textures: TextureStore;
  readonly tiles = new MaterialTiles();
  readonly views = new Map<string, SpriteView>();
  readonly structures = new Map<string, StructureView>();
  readonly effects: ParticleSystem;
  readonly bubbles: BubbleLayer;
  /** Fade structures standing between the camera and the avatar (third person and free camera only). */
  fadeWalls = true;
  private clock = 0;
  private readonly shadowTex = makeShadowTexture();
  private readonly raycaster = new THREE.Raycaster();
  private readonly coarse = matchMedia('(pointer: coarse)').matches;
  private avatar: SpriteView | null = null;
  private avatarEntity: Entity | null = null;
  private avatarPhase = 0;
  private lastCam: CameraPose = { pos: [0, 1.6, 0], yaw: 0, pitch: 0 };
  readonly sky: SkyView;
  private readonly haloTex = haloTexture();
  private readonly flatGround: THREE.Mesh;
  private terrain: TerrainView | null = null;
  private groundView: GroundView | undefined;

  constructor(
    public readonly canvas: HTMLCanvasElement,
    spriteVersion = 'dev',
    hudRoot?: HTMLElement,
  ) {
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: !this.coarse,
      powerPreference: 'high-performance',
    });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.camera = new THREE.PerspectiveCamera(70, 1, 0.05, 400);
    this.camera.rotation.order = 'YXZ';
    this.scene.fog = new THREE.Fog(new THREE.Color(SKY_HORIZON), 30, 170);

    const size = this.coarse ? 256 : 512;
    const budget = this.coarse ? 40 * 1024 * 1024 : 96 * 1024 * 1024;
    this.textures = new TextureStore(budget, `/sprites/${spriteVersion}/${size}`);

    const groundMat = tinted(new THREE.MeshBasicMaterial({ map: makeGroundTexture() }));
    applyCrayon(groundMat, () => 1, 0.45);
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400).rotateX(-Math.PI / 2), groundMat);
    // the ground plane's UVs span 0..1; the crayon shader expects metres, so hand it metre UVs
    const guv = ground.geometry.attributes.uv as THREE.BufferAttribute;
    for (let i = 0; i < guv.count; i++) guv.setXY(i, guv.getX(i) * 400, guv.getY(i) * 400);
    (groundMat.map as THREE.Texture).repeat.set(1 / 6, 1 / 6);
    void crayonTexture;
    void CRAYON_METRES;
    ground.name = 'ground';
    this.scene.add(ground);
    this.flatGround = ground;
    this.sky = new SkyView(this.scene, canvas.parentElement ?? document.body);
    this.effects = new ParticleSystem(this.scene);
    this.bubbles = new BubbleLayer(hudRoot ?? document.body);

    this.resize();
    window.addEventListener('resize', () => this.resize());
    window.visualViewport?.addEventListener('resize', () => this.resize());
  }

  resize(): void {
    const w = this.canvas.clientWidth || window.innerWidth;
    const h = this.canvas.clientHeight || window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.fov = w < h ? 80 : 70;
    this.camera.updateProjectionMatrix();
    const pr = this.renderer.getPixelRatio();
    for (const s of this.structures.values()) s.setResolution(w * pr, h * pr);
  }

  /** Show this world's terrain (or the flat meadow when null). Cheap to call every frame: rebuilds only on change. */
  setTerrain(field: TerrainField | null): void {
    if ((this.terrain?.field ?? null) === field) return;
    if (this.terrain) {
      this.scene.remove(this.terrain.group);
      this.terrain.dispose();
      this.terrain = null;
    }
    this.flatGround.visible = !field;
    this.groundView = undefined;
    if (field) {
      this.terrain = new TerrainView(field, this.coarse);
      this.scene.add(this.terrain.group);
      this.groundView = { height: (x, z) => field.height(x, z), normal: (x, z) => field.normal(x, z) };
    }
  }

  /** The player's own cutout, shown in third person and free camera. */
  setAvatar(spec: AvatarSpec | null): void {
    if (this.avatar) {
      this.scene.remove(this.avatar.root);
      this.avatar.dispose();
      this.avatar = null;
      this.avatarEntity = null;
    }
    if (!spec) return;
    this.avatarEntity = {
      id: 'player',
      word: spec.word,
      label: 'you',
      sprite: { ...spec.sprite },
      pos: [0, 0, 0],
      flip: false,
      scale: 1,
      heightM: spec.heightM,
      tilt: 0,
      state: {},
      effects: [],
      kind: 'human',
      solid: true,
      massClass: 'person',
      huge: false,
      createdAt: 0,
    };
    this.avatar = new SpriteView('player', this.shadowTex, this.haloTex);
    this.scene.add(this.avatar.root);
  }

  /** Create, update and remove views so the scene mirrors the world's entity list. */
  sync(model: WorldModel, dt = 0, cam: CameraPose = this.lastCam): void {
    this.clock += dt;
    this.lastCam = cam;
    const byId = model.entities;
    const seen = new Set<string>();
    const camState: PlayerState = { pos: cam.pos, yaw: cam.yaw, pitch: cam.pitch };
    const w = this.canvas.clientWidth || window.innerWidth;
    const h = this.canvas.clientHeight || window.innerHeight;
    const pr = this.renderer.getPixelRatio();
    for (const e of byId.values()) {
      seen.add(e.id);
      const pos = model.renderPos(e);
      if (e.structure) {
        const spriteView = this.views.get(e.id);
        if (spriteView) {
          this.scene.remove(spriteView.root);
          spriteView.dispose();
          this.views.delete(e.id);
        }
        let view = this.structures.get(e.id);
        if (!view) {
          view = new StructureView(e.id, { tiles: this.tiles, textures: this.textures, halo: this.haloTex });
          this.structures.set(e.id, view);
          this.scene.add(view.root);
          view.setResolution(w * pr, h * pr);
        }
        view.update(e, pos, dt);
        continue;
      }
      const structView = this.structures.get(e.id);
      if (structView) {
        this.scene.remove(structView.root);
        structView.dispose();
        this.structures.delete(e.id);
      }
      let view = this.views.get(e.id);
      if (!view) {
        view = new SpriteView(e.id, this.shadowTex, this.haloTex);
        this.views.set(e.id, view);
        this.scene.add(view.root);
      }
      let sq = model.transient.get(e.id)?.sq ?? 1;
      const living = e.kind === 'animal' || e.kind === 'human' || e.kind === 'humanoid';
      const phase = hashPhase(e.id);
      if (living) sq *= 1 + 0.015 * Math.sin(this.clock * 2.2 + phase);
      if (living && !e.parent && pos[1] - model.ground(pos[0], pos[2]) > 0.3) pos[1] += 0.08 * Math.sin(this.clock * 1.8 + phase);
      view.update(e, pos, cam.yaw, this.textures, this.resolveFlip(e, pos, byId, camState), sq, e.parent ? null : origamiKind(e.word), this.groundView);
    }
    this.terrain?.update(dt);
    this.effects.syncPersistent(model);
    this.effects.update(dt, (id) => shapeOfEntity(model, id), this.camera);
    this.bubbles.update(this.camera, model, w, h);
    for (const [id, view] of this.views) {
      if (!seen.has(id)) {
        this.scene.remove(view.root);
        view.dispose();
        this.views.delete(id);
      }
    }
    for (const [id, view] of this.structures) {
      if (!seen.has(id)) {
        this.scene.remove(view.root);
        view.dispose();
        this.structures.delete(id);
      }
    }
  }

  /**
   * Draw the avatar at the player's feet (or hide it in first person). `moving` adds the walk bob; `faceRight` is
   * decided on screen by the caller (which way the player last walked across the view), so turning the camera never
   * flips the character.
   */
  updateAvatar(player: PlayerState, visible: boolean, moving: boolean, faceDir: [number, number] | null, cam: CameraPose, dt: number): void {
    if (!this.avatar || !this.avatarEntity) return;
    const e = this.avatarEntity;
    e.hidden = !visible;
    if (!visible) {
      this.avatar.root.visible = false;
      return;
    }
    const pos: Vec3 = [player.pos[0], player.pos[1], player.pos[2]];
    if (faceDir) {
      e.faceDir = faceDir;
      const want = visibleYaw(yawAlong(faceDir[0], faceDir[1]), pos, cam.pos, 0.6);
      e.yaw = lerpAngle(e.yaw ?? want, want, Math.min(1, dt * 8));
      e.flip = flipFor(e.yaw, faceDir[0], faceDir[1]);
    } else if (e.yaw === undefined) e.yaw = yawFacing(pos, cam.pos);
    let sq = 1;
    if (moving) {
      this.avatarPhase += dt;
      pos[1] += Math.abs(Math.sin(this.avatarPhase * 9)) * 0.06;
      sq = 1 + Math.sin(this.avatarPhase * 18) * 0.02;
    }
    const camState: PlayerState = { pos: cam.pos, yaw: cam.yaw, pitch: cam.pitch };
    this.avatar.update(e, pos, cam.yaw, this.textures, this.resolveFlip(e, pos, new Map(), camState), sq, null, this.groundView);
  }


  /** Fade structures between the eye and the avatar (feet, chest, head); nothing fades in first person. */
  updateFades(cam: CameraPose, player: PlayerState, thirdPerson: boolean): void {
    const enabled = this.fadeWalls && thirdPerson;
    const eye = enabled ? new THREE.Vector3(cam.pos[0], cam.pos[1], cam.pos[2]) : null;
    const [x, y, z] = player.pos;
    const targets = enabled ? [new THREE.Vector3(x, y + 0.2, z), new THREE.Vector3(x, y + 0.9, z), new THREE.Vector3(x, y + 1.5, z)] : [];
    for (const s of this.structures.values()) s.setFade(enabled, eye, targets);
  }

  /** Mirror so the sprite looks toward its facing target along its own paper plane (art faces left by default). */
  private resolveFlip(e: Entity, pos: [number, number, number], byId: Map<string, Entity>, cam: PlayerState): boolean {
    if (!e.facing) return e.flip;
    const yaw = e.yaw ?? (cam.yaw * 180) / Math.PI;
    let tx: number;
    let tz: number;
    if (e.facing === 'player') {
      [tx, , tz] = cam.pos;
    } else {
      const t = byId.get(e.facing);
      if (!t) return e.flip;
      [tx, , tz] = worldPos(t, (id) => byId.get(id));
    }
    return flipFor(yaw, tx - pos[0], tz - pos[2]);
  }

  render(cam: CameraPose, dt = 0): void {
    const k = this.effects.shake;
    const sx = k ? (Math.random() - 0.5) * k * 0.14 : 0;
    const sy = k ? (Math.random() - 0.5) * k * 0.1 : 0;
    this.camera.position.set(cam.pos[0] + sx, cam.pos[1] + sy, cam.pos[2]);
    this.sky.update(dt, this.camera.position);
    this.camera.rotation.set(cam.pitch, cam.yaw, k ? (Math.random() - 0.5) * k * 0.02 : 0, 'YXZ');
    this.renderer.render(this.scene, this.camera);
  }

  /** Entity under a screen point (normalised device coords), nearest first. */
  pick(ndcX: number, ndcY: number): string | null {
    this.raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), this.camera);
    const bodies: THREE.Object3D[] = [];
    for (const v of this.views.values()) if (v.root.visible) bodies.push(...v.pickables);
    for (const s of this.structures.values()) if (s.root.visible) bodies.push(...s.pickables);
    const hits = this.raycaster.intersectObjects(bodies, false);
    for (const hit of hits) {
      if (hit.distance > 40) break;
      const id = hit.object.userData.entityId as string | undefined;
      if (id) return id;
    }
    return null;
  }
}

function hashPhase(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return (h & 0xffff) / 0xffff * 6.28;
}
