import * as THREE from 'three';
import type { Entity, Vec3 } from '../../shared/types';
import { footprintRadius, renderHeight, renderWidth } from '../../shared/engine/sizing';
import type { TextureStore } from './textures';
import { LIGHT, tinted } from './tint';

const PLANE = new THREE.PlaneGeometry(1, 1);
const SHADOW = new THREE.CircleGeometry(0.5, 28).rotateX(-Math.PI / 2);
const UP = new THREE.Vector3(0, 1, 0);

/**
 * How far sprites tip back to face a camera that looks down at them (0 = always upright, 1 = full billboard).
 * They lean away from the camera, pivoting at their feet, so from above they read upright on screen like a 2.5D
 * game; looking up, they stay upright rather than toppling over the viewer.
 */
const PITCH_FOLLOW = 0.65;

/** What the ground looks like under a sprite: its height and slope. Flat meadow when absent. */
export interface GroundView {
  height(x: number, z: number): number;
  normal(x: number, z: number): [number, number, number];
}

/** Words whose things give off light at night. */
const LAMPS = /\b(lamp|lamppost|lantern|torch|candle|campfire|bonfire|street ?light|fire ?place|jack-o-lantern)\b/;

/**
 * One entity on screen: a shadow blob lying on the ground under it and an upright paper cutout that turns to face
 * the camera. root sits at the feet; `pivot` carries the billboard rotation; `body` is the textured plane centred
 * at half height so tilts rotate about the sprite centre.
 */
export class SpriteView {
  readonly root = new THREE.Group();
  readonly pivot = new THREE.Group();
  readonly body: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  readonly shadow: THREE.Mesh<THREE.CircleGeometry, THREE.MeshBasicMaterial>;
  /** Last mirror state, so things walking straight toward or away from the camera do not flicker. */
  lastFlip = false;
  private halo: THREE.Sprite | null = null;
  private spriteKey = '';
  private wantedFile: string | null = null;
  private hasRealTexture = false;

  constructor(
    public readonly id: string,
    private readonly shadowTex: THREE.Texture,
    private readonly haloTex?: THREE.Texture,
  ) {
    const mat = tinted(
      new THREE.MeshBasicMaterial({
        transparent: true,
        alphaTest: 0.4,
        depthWrite: true,
        side: THREE.DoubleSide,
      }),
    );
    this.body = new THREE.Mesh(PLANE, mat);
    this.body.userData.entityId = id;
    this.pivot.add(this.body);
    this.shadow = new THREE.Mesh(
      SHADOW,
      new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false, opacity: 0.9, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }),
    );
    this.shadow.renderOrder = -1;
    this.root.add(this.pivot, this.shadow);
  }

  update(e: Entity, pos: Vec3, camYaw: number, camPitch: number, textures: TextureStore, flip: boolean, sq = 1, ground?: GroundView): void {
    this.lastFlip = flip;
    this.root.position.set(pos[0], pos[1], pos[2]);
    this.root.visible = !e.hidden;
    const h = renderHeight(e);
    const w = renderWidth(e);
    this.pivot.rotation.set(Math.min(0, camPitch) * PITCH_FOLLOW, camYaw, 0, 'YXZ');
    const hs = h * sq;
    const ws = w * (1 + (1 - sq) * 0.6);
    this.body.position.y = hs / 2;
    const mirror = flip && this.hasRealTexture;
    this.body.scale.set(mirror ? -ws : ws, hs, 1);
    this.body.rotation.z = (e.tilt * Math.PI) / 180;
    const mat = this.body.material;
    mat.opacity = e.alpha ?? 1;
    // Shadow lies on the ground under the entity, tilted with the slope; shrinks and fades as the entity rises.
    const g = ground ? ground.height(pos[0], pos[2]) : 0;
    const r = footprintRadius(e) * 2.2;
    const lift = Math.max(0, pos[1] - g);
    const k = 1 / (1 + lift * 0.6);
    this.shadow.scale.set(r * k, 1, r * 0.75 * k);
    this.shadow.material.opacity = 0.9 * k;
    this.shadow.position.y = 0.03 - pos[1] + g;
    if (ground) {
      const [nx, ny, nz] = ground.normal(pos[0], pos[2]);
      this.shadow.quaternion.setFromUnitVectors(UP, new THREE.Vector3(nx, ny, nz));
    }
    // lamps glow at night
    if (this.haloTex && LAMPS.test(e.word)) {
      if (!this.halo) {
        this.halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.haloTex, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, fog: false }));
        this.halo.renderOrder = 3;
        this.root.add(this.halo);
      }
      const glow = LIGHT.glow.value;
      this.halo.visible = glow > 0.03 && !e.hidden;
      this.halo.position.set(0, hs * (/lamppost|street/.test(e.word) ? 0.86 : 0.6), 0);
      this.halo.scale.setScalar(Math.max(1.6, h * 1.1));
      this.halo.material.opacity = glow * 0.9 * (e.alpha ?? 1);
    } else if (this.halo) {
      this.halo.visible = false;
    }

    const key = `${e.sprite.file ?? 'ph'}|${e.label}|${e.kind}|${(e.sprite.w / e.sprite.h).toFixed(2)}`;
    if (key !== this.spriteKey) {
      this.spriteKey = key;
      this.wantedFile = e.sprite.file;
      mat.map = textures.placeholder(e.label, e.kind, e.sprite.w / Math.max(1, e.sprite.h));
      mat.needsUpdate = true;
      this.hasRealTexture = false;
      if (e.sprite.file) {
        const file = e.sprite.file;
        textures
          .load(file)
          .then((tex) => {
            if (this.wantedFile !== file) return;
            this.hasRealTexture = true;
            mat.map = tex;
            mat.needsUpdate = true;
          })
          .catch(() => {
            /* keep placeholder */
          });
      }
    }
  }

  dispose(): void {
    this.body.material.dispose();
    this.shadow.material.dispose();
    this.halo?.material.dispose();
  }
}
