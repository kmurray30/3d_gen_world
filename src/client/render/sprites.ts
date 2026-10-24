import * as THREE from 'three';
import type { Entity, Vec3 } from '../../shared/types';
import { footprintRadius, renderHeight, renderWidth } from '../../shared/engine/sizing';
import type { TextureStore } from './textures';
import { DEFAULT_TREE_COLORS, OrigamiPlant, sampleTreeColors, type TreeColors } from './origami';
import { LIGHT, tinted } from './tint';

const PLANE = new THREE.PlaneGeometry(1, 1);
const SHADOW = new THREE.CircleGeometry(0.5, 28).rotateX(-Math.PI / 2);
const UP = new THREE.Vector3(0, 1, 0);

/** What the ground looks like under a sprite: its height and slope. Flat meadow when absent. */
export interface GroundView {
  height(x: number, z: number): number;
  normal(x: number, z: number): [number, number, number];
}

/** Words whose things give off light at night. */
const LAMPS = /\b(lamp|lamppost|lantern|torch|candle|campfire|bonfire|street ?light|fire ?place|jack-o-lantern)\b/;

/** How much upright sprites lean back toward the camera when it looks DOWN at them (0 = always upright). Looking up
 *  never leans them away: that is what used to squash the nearest tall thing. */
const PITCH_FOLLOW = 0.35;
const DEG = Math.PI / 180;
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/** Words drawn as origami paper pieces (trunk cross + leaf clouds) instead of a camera-facing cutout. */
const TREE_WORDS = /(^|\s)(tree|trees|sapling|topiary|bonsai)$|^(oak|willow|maple|apple|cherry|birch|elm|peach|pear|plum|orange|lemon|olive|magnolia|family|money) tree$/;
const BUSH_WORDS = /(^|\s)(bush|shrub|hedge|rosebush)$/;

export function origamiKind(word: string): 'tree' | 'bush' | null {
  const w = word.toLowerCase();
  if (TREE_WORDS.test(w)) return 'tree';
  if (BUSH_WORDS.test(w)) return 'bush';
  return null;
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
  /** Origami mode: drawn paper pieces that do not turn with the camera. */
  private origami: OrigamiPlant | null = null;
  private origamiColors: TreeColors = DEFAULT_TREE_COLORS;
  private spriteKey = '';
  private wantedFile: string | null = null;
  private hasRealTexture = false;
  private halo: THREE.Sprite | null = null;

  constructor(
    public readonly id: string,
    shadowTex: THREE.Texture,
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
    this.shadow.position.y = 0.012;
    this.shadow.renderOrder = -1;
    this.root.add(this.pivot, this.shadow);
  }

  update(e: Entity, pos: Vec3, camYaw: number, camPitch: number, textures: TextureStore, flip: boolean, sq = 1, origami: 'tree' | 'bush' | null = null, ground?: GroundView): void {
    this.root.position.set(pos[0], pos[1], pos[2]);
    this.root.visible = !e.hidden;
    const h = renderHeight(e);
    const w = renderWidth(e);
    const hs = h * sq;
    const ws = w * (1 + (1 - sq) * 0.6);
    const mat = this.body.material;
    mat.opacity = e.alpha ?? 1;
    if (origami) {
      this.setOrigami(origami, e);
      this.origami!.setColors(this.origamiColors);
      this.origami!.layout(ws, hs, 1, mat.opacity);
    } else {
      this.setOrigami(null, e);
      // Turn toward the camera around the vertical axis. When the camera looks down, lean back toward it about the
      // sprite's centre: a little at shallow angles (paper stays upright), fully at steep angles so a cutout seen
      // from above faces the camera instead of foreshortening into a squashed sliver. Looking up never leans.
      const down = Math.max(0, -camPitch);
      const t = clamp01((down - 15 * DEG) / (50 * DEG));
      const follow = PITCH_FOLLOW + (1 - PITCH_FOLLOW) * t * t * (3 - 2 * t);
      const lean = down * follow;
      // the paper keeps its own yaw in the world; only the lean (looking down) tracks the camera
      const yaw = e.yaw === undefined ? camYaw : e.yaw * DEG;
      this.pivot.rotation.set(0, yaw, 0, 'YXZ');
      this.pivot.position.y = hs / 2;
      this.body.position.y = 0;
      this.body.rotation.set(lean, 0, (e.tilt * Math.PI) / 180, 'YXZ');
      const mirror = flip && this.hasRealTexture;
      this.body.scale.set(mirror ? -ws : ws, hs, 1);
    }
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
            this.origamiColors = sampleTreeColors(tex);
          })
          .catch(() => {
            /* keep placeholder */
          });
      }
    }
  }

  private setOrigami(kind: 'tree' | 'bush' | null, e: Entity): void {
    if (kind && !this.origami) {
      this.origami = new OrigamiPlant(this.id, kind, (hashYaw(e.id) % 1) * Math.PI);
      this.root.add(this.origami.group);
      this.pivot.visible = false;
    } else if (!kind && this.origami) {
      this.root.remove(this.origami.group);
      this.origami.dispose();
      this.origami = null;
      this.pivot.visible = true;
    }
  }

  /** Meshes that count for picking. */
  get pickables(): THREE.Object3D[] {
    return this.origami ? this.origami.pickables : [this.body];
  }

  dispose(): void {
    this.setOrigami(null, { id: this.id, word: '' } as Entity);
    this.body.material.dispose();
    this.shadow.material.dispose();
    this.halo?.material.dispose();
  }
}


function hashYaw(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return ((h & 0xffff) / 0xffff) * 7;
}
