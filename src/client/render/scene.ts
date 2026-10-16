import * as THREE from 'three';
import type { Entity, PlayerState, World } from '../../shared/types';
import { PLAYER_EYE_HEIGHT } from '../../shared/types';
import { worldPos } from '../../shared/engine/transform';
import type { WorldModel } from '../../shared/engine/world';
import { SpriteView } from './sprites';
import { TextureStore, makeGroundTexture, makeShadowTexture } from './textures';

export const SKY_TOP = '#6db3ff';
export const SKY_HORIZON = '#d9efff';

export class SceneView {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera: THREE.PerspectiveCamera;
  readonly textures: TextureStore;
  readonly views = new Map<string, SpriteView>();
  private readonly shadowTex = makeShadowTexture();
  private readonly raycaster = new THREE.Raycaster();
  private readonly coarse = matchMedia('(pointer: coarse)').matches;

  constructor(
    public readonly canvas: HTMLCanvasElement,
    spriteVersion = 'dev',
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

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(400, 400).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ map: makeGroundTexture() }),
    );
    ground.name = 'ground';
    this.scene.add(ground);

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
  }

  /** Create, update and remove sprite views so the scene mirrors the world's entity list. */
  sync(model: WorldModel): void {
    const byId = model.entities;
    const seen = new Set<string>();
    const cam = model.player;
    for (const e of byId.values()) {
      seen.add(e.id);
      let view = this.views.get(e.id);
      if (!view) {
        view = new SpriteView(e.id, this.shadowTex);
        this.views.set(e.id, view);
        this.scene.add(view.root);
      }
      const pos = model.renderPos(e);
      const sq = model.transient.get(e.id)?.sq ?? 1;
      view.update(e, pos, cam.yaw, cam.pitch, this.textures, this.resolveFlip(e, pos, byId, cam), sq);
    }
    for (const [id, view] of this.views) {
      if (!seen.has(id)) {
        this.scene.remove(view.root);
        view.dispose();
        this.views.delete(id);
      }
    }
  }

  /** Mirror so the sprite "looks" toward its facing target in camera space. Sprites are assumed to face left by default. */
  private resolveFlip(e: Entity, pos: [number, number, number], byId: Map<string, Entity>, cam: PlayerState): boolean {
    if (!e.facing) {
      if (e.faceDir) {
        const rx0 = Math.cos(cam.yaw);
        const rz0 = -Math.sin(cam.yaw);
        return e.faceDir[0] * rx0 + e.faceDir[1] * rz0 > 0;
      }
      return e.flip;
    }
    let tx: number;
    let tz: number;
    if (e.facing === 'player') {
      [tx, , tz] = cam.pos;
    } else {
      const t = byId.get(e.facing);
      if (!t) return e.flip;
      [tx, , tz] = worldPos(t, (id) => byId.get(id));
    }
    // Camera right vector in the ground plane.
    const rx = Math.cos(cam.yaw);
    const rz = -Math.sin(cam.yaw);
    const side = (tx - pos[0]) * rx + (tz - pos[2]) * rz;
    return side > 0;
  }

  render(player: PlayerState): void {
    this.camera.position.set(player.pos[0], player.pos[1] + PLAYER_EYE_HEIGHT, player.pos[2]);
    this.camera.rotation.set(player.pitch, player.yaw, 0, 'YXZ');
    this.renderer.render(this.scene, this.camera);
  }

  /** Entity under a screen point (normalised device coords), nearest first. */
  pick(ndcX: number, ndcY: number): string | null {
    this.raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), this.camera);
    const bodies: THREE.Object3D[] = [];
    for (const v of this.views.values()) if (v.root.visible) bodies.push(v.body);
    const hits = this.raycaster.intersectObjects(bodies, false);
    for (const hit of hits) {
      if (hit.distance > 40) break;
      const id = hit.object.userData.entityId as string | undefined;
      if (id) return id;
    }
    return null;
  }
}
