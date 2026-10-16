import * as THREE from 'three';
import type { Entity, Vec3 } from '../../shared/types';
import { footprintRadius, renderHeight, renderWidth } from '../../shared/engine/sizing';
import type { TextureStore } from './textures';

const PLANE = new THREE.PlaneGeometry(1, 1);
const SHADOW = new THREE.CircleGeometry(0.5, 28).rotateX(-Math.PI / 2);

/** How much upright sprites lean toward the camera when it pitches (0 = always upright, 1 = full billboard). */
const PITCH_FOLLOW = 0.6;

/**
 * One entity on screen: a shadow blob flat on the ground and an upright paper cutout that turns to face the camera.
 * root sits at the feet; `pivot` carries the billboard rotation; `body` is the textured plane centred at half height
 * so tilts rotate about the sprite centre.
 */
export class SpriteView {
  readonly root = new THREE.Group();
  readonly pivot = new THREE.Group();
  readonly body: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  readonly shadow: THREE.Mesh<THREE.CircleGeometry, THREE.MeshBasicMaterial>;
  private spriteKey = '';
  private wantedFile: string | null = null;
  private hasRealTexture = false;

  constructor(
    public readonly id: string,
    shadowTex: THREE.Texture,
  ) {
    const mat = new THREE.MeshBasicMaterial({
      transparent: true,
      alphaTest: 0.4,
      depthWrite: true,
      side: THREE.DoubleSide,
    });
    this.body = new THREE.Mesh(PLANE, mat);
    this.body.userData.entityId = id;
    this.pivot.add(this.body);
    this.shadow = new THREE.Mesh(
      SHADOW,
      new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false, opacity: 0.9 }),
    );
    this.shadow.position.y = 0.012;
    this.shadow.renderOrder = -1;
    this.root.add(this.pivot, this.shadow);
  }

  update(e: Entity, pos: Vec3, camYaw: number, camPitch: number, textures: TextureStore, flip: boolean, sq = 1): void {
    this.root.position.set(pos[0], pos[1], pos[2]);
    this.root.visible = !e.hidden;
    const h = renderHeight(e);
    const w = renderWidth(e);
    this.pivot.rotation.set(-camPitch * PITCH_FOLLOW, camYaw, 0, 'YXZ');
    const hs = h * sq;
    const ws = w * (1 + (1 - sq) * 0.6);
    this.body.position.y = hs / 2;
    const mirror = flip && this.hasRealTexture;
    this.body.scale.set(mirror ? -ws : ws, hs, 1);
    this.body.rotation.z = (e.tilt * Math.PI) / 180;
    const mat = this.body.material;
    mat.opacity = e.alpha ?? 1;
    // Shadow shrinks and fades as the entity rises off the ground (relative to its parent/ground).
    const r = footprintRadius(e) * 2.2;
    const lift = Math.max(0, pos[1] - groundUnder(pos));
    const k = 1 / (1 + lift * 0.6);
    this.shadow.scale.set(r * k, 1, r * 0.75 * k);
    this.shadow.material.opacity = 0.9 * k;
    this.shadow.position.y = 0.012 - pos[1] + groundUnder(pos);

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
  }
}

/** Ground is flat at y=0 for now; the shadow projects to it. */
function groundUnder(_pos: Vec3): number {
  return 0;
}
