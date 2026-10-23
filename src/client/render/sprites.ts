import * as THREE from 'three';
import type { Entity, Vec3 } from '../../shared/types';
import { footprintRadius, renderHeight, renderWidth } from '../../shared/engine/sizing';
import type { TextureStore } from './textures';

const PLANE = new THREE.PlaneGeometry(1, 1);
const SHADOW = new THREE.CircleGeometry(0.5, 28).rotateX(-Math.PI / 2);

/** How much upright sprites lean back toward the camera when it looks DOWN at them (0 = always upright). Looking up
 *  never leans them away: that is what used to squash the nearest tall thing. */
const PITCH_FOLLOW = 0.35;
const DEG = Math.PI / 180;
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/** Words drawn as crossed paper planes (origami) instead of a camera-facing cutout: scenery between structure and decor. */
const CROSS_WORDS = /(^|\s)(tree|trees|bush|shrub|hedge|cactus|sapling|stump|boulder|haystack|snowman|scarecrow|topiary|bonsai|fern|reeds?|tumbleweed|rosebush|mushroom|toadstool)$|^(palm|pine|oak|willow|maple|apple|cherry|christmas|birch|fir|spruce|cedar|redwood|bamboo|elm) tree$/;
const CROSS_ANGLES = [0, Math.PI / 4, Math.PI / 2, (3 * Math.PI) / 4];
/** Extra, smaller crossed copies of the upper part of the sprite: leaf bunches like paper clouds. */
const CANOPY_BUNCHES: Array<{ dx: number; dy: number; dz: number; s: number; yaw: number }> = [
  { dx: -0.34, dy: 0.62, dz: 0.1, s: 0.5, yaw: 0.5 },
  { dx: 0.36, dy: 0.66, dz: -0.08, s: 0.46, yaw: 1.1 },
  { dx: 0.02, dy: 0.8, dz: 0.3, s: 0.42, yaw: 1.8 },
];

export function isCrossWord(word: string): boolean {
  return CROSS_WORDS.test(word.toLowerCase());
}

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
  /** Origami mode: the sprite is drawn as crossed planes that do not turn with the camera. */
  private cross: THREE.Group | null = null;
  private crossBodies: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>[] = [];
  private crossBunches: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>[] = [];
  private canopyMat: THREE.MeshBasicMaterial | null = null;
  private crossYaw = 0;
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

  update(e: Entity, pos: Vec3, camYaw: number, camPitch: number, textures: TextureStore, flip: boolean, sq = 1, origami = false): void {
    this.root.position.set(pos[0], pos[1], pos[2]);
    this.root.visible = !e.hidden;
    const h = renderHeight(e);
    const w = renderWidth(e);
    const hs = h * sq;
    const ws = w * (1 + (1 - sq) * 0.6);
    const mat = this.body.material;
    mat.opacity = e.alpha ?? 1;
    if (origami && this.hasRealTexture) {
      this.setCross(true, e);
      this.cross!.rotation.y = this.crossYaw;
      this.cross!.scale.set(1, 1, 1);
      for (const b of this.crossBodies) {
        b.scale.set(ws, hs, 1);
        b.position.y = hs / 2;
        b.rotation.z = (e.tilt * Math.PI) / 180;
        b.material.opacity = mat.opacity;
      }
      this.crossBunches.forEach((b, i) => {
        const c = CANOPY_BUNCHES[i];
        b.scale.set(ws * c.s, hs * c.s * 0.55, 1);
        b.position.set(c.dx * ws, c.dy * hs, c.dz * ws);
        b.material.opacity = mat.opacity;
      });
    } else {
      this.setCross(false, e);
      // Turn toward the camera around the vertical axis. When the camera looks down, lean back toward it about the
      // sprite's centre: a little at shallow angles (paper stays upright), fully at steep angles so a cutout seen
      // from above faces the camera instead of foreshortening into a squashed sliver. Looking up never leans.
      const down = Math.max(0, -camPitch);
      const t = clamp01((down - 15 * DEG) / (50 * DEG));
      const follow = PITCH_FOLLOW + (1 - PITCH_FOLLOW) * t * t * (3 - 2 * t);
      const lean = down * follow;
      this.pivot.rotation.set(0, camYaw, 0, 'YXZ');
      this.pivot.position.y = hs / 2;
      this.body.position.y = 0;
      this.body.rotation.set(lean, 0, (e.tilt * Math.PI) / 180, 'YXZ');
      const mirror = flip && this.hasRealTexture;
      this.body.scale.set(mirror ? -ws : ws, hs, 1);
    }
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
            this.applyCrossMaps();
          })
          .catch(() => {
            /* keep placeholder */
          });
      }
    }
  }

  /** Build or tear down the crossed-planes version. The planes share the body material; bunches crop the canopy. */
  private setCross(on: boolean, e: Entity): void {
    if (on && !this.cross) {
      this.cross = new THREE.Group();
      this.crossYaw = (hashYaw(e.id) % 1) * Math.PI;
      for (const a of CROSS_ANGLES) {
        const m = new THREE.Mesh(PLANE, this.body.material);
        m.rotation.y = a;
        m.userData.entityId = this.id;
        this.cross.add(m);
        this.crossBodies.push(m);
      }
      if (isTreeWord(e.word)) {
        this.canopyMat = this.body.material.clone();
        for (const c of CANOPY_BUNCHES) {
          const geo = PLANE.clone();
          // crop to the upper 55% of the texture: the leaves
          const uv = geo.attributes.uv as THREE.BufferAttribute;
          for (let i = 0; i < uv.count; i++) uv.setY(i, 0.45 + uv.getY(i) * 0.55);
          const m = new THREE.Mesh(geo, this.canopyMat);
          m.rotation.y = c.yaw;
          m.userData.entityId = this.id;
          const m2 = new THREE.Mesh(geo, this.canopyMat);
          m2.rotation.y = c.yaw + Math.PI / 2;
          m2.userData.entityId = this.id;
          m.add(m2);
          this.cross.add(m);
          this.crossBunches.push(m);
        }
      }
      this.applyCrossMaps();
      this.root.add(this.cross);
      this.pivot.visible = false;
    } else if (!on && this.cross) {
      this.root.remove(this.cross);
      for (const b of this.crossBunches) b.geometry.dispose();
      this.canopyMat?.dispose();
      this.canopyMat = null;
      this.cross = null;
      this.crossBodies = [];
      this.crossBunches = [];
      this.pivot.visible = true;
    }
  }

  private applyCrossMaps(): void {
    if (this.canopyMat) {
      this.canopyMat.map = this.body.material.map;
      this.canopyMat.needsUpdate = true;
    }
  }

  /** Meshes that count for picking. */
  get pickables(): THREE.Object3D[] {
    return this.cross ? [...this.crossBodies] : [this.body];
  }

  dispose(): void {
    this.setCross(false, { id: this.id, word: '' } as Entity);
    this.body.material.dispose();
    this.shadow.material.dispose();
  }
}

/** Ground is flat at y=0 for now; the shadow projects to it. */
function groundUnder(_pos: Vec3): number {
  return 0;
}

function isTreeWord(word: string): boolean {
  return /tree|bush|shrub|hedge|sapling|topiary|bonsai/.test(word.toLowerCase());
}

function hashYaw(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return ((h & 0xffff) / 0xffff) * 7;
}
