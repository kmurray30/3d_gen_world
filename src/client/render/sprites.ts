import * as THREE from 'three';
import type { Entity, Vec3 } from '../../shared/types';
import { footprintRadius, renderHeight, renderWidth } from '../../shared/engine/sizing';
import type { TextureStore } from './textures';
import { DEFAULT_TREE_COLORS, OrigamiPlant, sampleTreeColors, type TreeColors } from './origami';
import { LIGHT, tinted } from './tint';
import type { RigStore, PuppetAsset } from './rig-cut';
import { Puppet } from './puppet';
import { PuppetMotion, wholeCardGesture } from './puppet-motion';

const PLANE = new THREE.PlaneGeometry(1, 1);
const SHADOW = new THREE.CircleGeometry(0.5, 28).rotateX(-Math.PI / 2);
const UP = new THREE.Vector3(0, 1, 0);

/** What drives a sprite's life this frame beyond its entity: time, speech, what to look at, a gesture. */
export interface LifeInput {
  dt: number;
  time: number;
  talking: boolean;
  /** Where something worth looking at is across and up the drawing (-1..1), or null. */
  look: [number, number] | null;
  gesture?: { name: string; t: number; dur: number };
}

/** What the ground looks like under a sprite: its height and slope. Flat meadow when absent. */
export interface GroundView {
  height(x: number, z: number): number;
  normal(x: number, z: number): [number, number, number];
}

/** Words whose things give off light at night. */
const LAMPS = /\b(lamp|lamppost|lantern|torch|candle|campfire|bonfire|street ?light|fire ?place|jack-o-lantern)\b/;

const DEG = Math.PI / 180;

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
 * One entity on screen: a shadow blob flat on the ground and an upright paper cutout with its own yaw in the world.
 * root sits at the feet; `pivot` carries the yaw; `body` is the textured plane centred at half height so tilts
 * rotate about the sprite centre. Trees and bushes become origami pieces instead.
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
  /** When set, the paper's horizontal scale (-1..1) instead of the plain mirror: a paper turn in progress. */
  turn: number | null = null;
  /** The drawing cut into paper pieces, once its rig has loaded (rigged drawings only). */
  private puppet: Puppet | null = null;
  private motion: PuppetMotion | null = null;
  private readonly holder = new THREE.Group();
  private puppetFor = '';
  private lastPos: Vec3 | null = null;
  private speed = 0;

  constructor(
    public readonly id: string,
    shadowTex: THREE.Texture,
    private readonly haloTex?: THREE.Texture,
    private readonly rigs?: RigStore,
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
    this.pivot.add(this.holder);
    this.root.add(this.pivot, this.shadow);
  }

  update(e: Entity, pos: Vec3, camYaw: number, textures: TextureStore, flip: boolean, sq = 1, origami: 'tree' | 'bush' | null = null, ground?: GroundView, life?: LifeInput): void {
    if (life && life.dt > 0) {
      const v = this.lastPos ? Math.hypot(pos[0] - this.lastPos[0], pos[2] - this.lastPos[2]) / life.dt : 0;
      this.speed += (Math.min(8, v) - this.speed) * Math.min(1, life.dt * 10);
      this.lastPos = [pos[0], pos[1], pos[2]];
    }
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
      // Paper keeps its own yaw in the world and always stands upright: the camera looking up or down never tips
      // it. Only scripted tilts (pouring, bowing, falling over) lean it, about its centre.
      const yaw = e.yaw === undefined ? camYaw : e.yaw * DEG;
      const tilt = (e.tilt * Math.PI) / 180;
      const mirror = flip && this.hasRealTexture;
      const xs = this.turn !== null && this.hasRealTexture ? this.turn : mirror ? -1 : 1;
      this.pivot.rotation.set(0, yaw, 0, 'YXZ');
      this.pivot.position.y = hs / 2;
      // a drawing without a rig still acts out gestures with its whole card
      const card = life?.gesture && !this.puppet ? wholeCardGesture(life.gesture.name, life.gesture.t / Math.max(0.01, life.gesture.dur)) : null;
      this.body.position.set(card ? card.x * hs : 0, card ? card.y * hs : 0, 0);
      this.body.rotation.set(0, 0, tilt + (card ? (card.tilt * Math.PI) / 180 : 0), 'YXZ');
      this.body.scale.set(ws * xs, hs * (card?.sq ?? 1), 1);
      this.body.visible = !this.puppet;
      if (this.puppet && this.motion) {
        this.holder.visible = true;
        this.holder.rotation.set(0, 0, tilt);
        this.holder.scale.set((ws / this.puppet.aspect) * xs, hs, hs);
        this.puppet.root.position.y = -0.5;
        this.puppet.setOpacity(mat.opacity);
        const look = life?.look ? ([life.look[0] * xs, life.look[1]] as [number, number]) : null;
        const pose = this.motion.update({
          dt: life?.dt ?? 0,
          time: life?.time ?? 0,
          speed: this.speed,
          airborne: ground ? pos[1] - ground.height(pos[0], pos[2]) > 0.3 : pos[1] > 0.3,
          talking: life?.talking ?? false,
          expression: typeof e.state.expression === 'string' ? e.state.expression : undefined,
          gesture: life?.gesture,
          look,
          metres: hs,
          state: e.state,
        });
        this.puppet.apply(pose);
      } else this.holder.visible = false;
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
      this.setPuppet(null);
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
            // a rigged drawing comes apart into its paper pieces
            const only = e.sprite.piece;
            if (this.rigs?.has(file) && tex.image) {
              const want = `${file}|${only ?? ''}`;
              void this.rigs.load(file, tex.image as HTMLImageElement).then((asset) => {
                if (asset && this.wantedFile === file && this.puppetFor !== want) this.setPuppet(asset, only, want);
              });
            }
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

  private setPuppet(asset: PuppetAsset | null, only?: string, key = ''): void {
    if (this.puppet) {
      this.holder.remove(this.puppet.root);
      this.puppet.dispose();
      this.puppet = null;
      this.motion = null;
    }
    this.puppetFor = key;
    if (!asset) return;
    this.puppet = new Puppet(asset, this.id, only);
    this.motion = only ? null : new PuppetMotion(asset.rig);
    if (only) this.motion = new PuppetMotion({ ...asset.rig, pieces: asset.rig.pieces.filter((p) => this.puppet!.pieces.includes(p)) });
    this.holder.add(this.puppet.root);
  }

  /** The piece ids this sprite is made of (empty without a rig). */
  get pieceIds(): string[] {
    return this.puppet ? this.puppet.pieces.map((p) => p.id) : [];
  }

  /** Meshes that count for picking. */
  get pickables(): THREE.Object3D[] {
    if (this.origami) return this.origami.pickables;
    return this.puppet ? this.puppet.pickables : [this.body];
  }

  dispose(): void {
    this.setOrigami(null, { id: this.id, word: '' } as Entity);
    this.setPuppet(null);
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
