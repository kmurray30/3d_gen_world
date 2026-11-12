/**
 * One figure in the world: a paper or 3D rendering of a code-drawn figure, its shadow, and the animator that picks
 * idle / walk / run from how fast the entity moves and plays reactions when it is poked or talks.
 *
 * Orientation follows the cutout rules: a paper figure stands in its entity's yaw plane and mirrors with `flip`.
 * A 3D figure faces where it walks; standing still it adopts the entity's yaw whenever a command or idle turn
 * changes it (front-view figures face the paper normal, profile figures the way their cutout would look).
 */
import * as THREE from 'three';
import type { Entity, Vec3 } from '../../../shared/types';
import type { Figure } from '../../../shared/figure/types';
import { Animator, type Expr } from '../../../shared/figure/anim';
import { lerpAngle } from '../../../shared/engine/facing';
import { PaperFigure } from './paper';
import { ToonFigure } from './toon';

export type FigureStyle = 'paper' | 'toon';
const DEG = Math.PI / 180;
const SHADOW = new THREE.CircleGeometry(0.5, 28).rotateX(-Math.PI / 2);
const PITCH_FOLLOW = 0.35;
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

export class FigureView {
  readonly root = new THREE.Group();
  /** Paper: yaw + lean; 3D: facing. */
  private readonly pivot = new THREE.Group();
  private readonly inner = new THREE.Group();
  private readonly shadow: THREE.Mesh<THREE.CircleGeometry, THREE.MeshBasicMaterial>;
  readonly animator: Animator;
  private readonly paper: PaperFigure | null = null;
  /** The second, crossed cutout of a round thing. */
  private readonly paper2: PaperFigure | null = null;
  private readonly toon: ToonFigure | null = null;
  private last: Vec3 | null = null;
  private speed = 0;
  private dir: [number, number] | null = null;
  /** 3D facing in degrees (spec +z turned by this). */
  private facing: number | null = null;
  private wantFacing = 0;
  private seenYaw: number | undefined;
  private seenFlip: boolean | undefined;
  private alpha = 1;

  constructor(
    readonly id: string,
    readonly fig: Figure,
    readonly style: FigureStyle,
    shadowTex: THREE.Texture,
  ) {
    this.animator = new Animator(fig);
    if (style === 'paper') {
      this.paper = new PaperFigure(fig, id);
      this.inner.add(this.paper.group);
      if (fig.paperCross) {
        this.paper2 = new PaperFigure(fig, id);
        this.paper2.group.rotation.y = Math.PI / 2;
        this.inner.add(this.paper2.group);
      }
    } else {
      this.toon = new ToonFigure(fig, id);
      this.inner.add(this.toon.group);
    }
    this.pivot.add(this.inner);
    this.shadow = new THREE.Mesh(SHADOW, new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false, opacity: 0.9 }));
    this.shadow.position.y = 0.012;
    this.shadow.renderOrder = -1;
    this.root.add(this.pivot, this.shadow);
  }

  get pickables(): THREE.Object3D[] {
    return this.paper ? [...this.paper.pickables, ...(this.paper2?.pickables ?? [])] : this.toon!.pickables;
  }

  react(name?: string, expr?: Expr): string {
    return this.animator.play(name, expr);
  }

  talk(seconds: number): void {
    this.animator.talk(seconds);
  }

  /** Display scale: the figure's own height times the entity's size multiplier. */
  private scaleOf(e: Entity): number {
    return e.scale;
  }

  update(e: Entity, pos: Vec3, camYaw: number, camPitch: number, flip: boolean, sq: number, dt: number, lookAt: [number, number] | null): void {
    this.root.position.set(pos[0], pos[1], pos[2]);
    this.root.visible = !e.hidden;
    // ground speed from how far the entity moved since last frame (smoothed so a stop does not flicker)
    if (this.last && dt > 0) {
      const dx = pos[0] - this.last[0];
      const dz = pos[2] - this.last[2];
      const v = Math.hypot(dx, dz) / dt;
      this.speed += (Math.min(v, 12) - this.speed) * Math.min(1, dt * 10);
      if (Math.hypot(dx, dz) > 1e-4) this.dir = [dx, dz];
    }
    this.last = [...pos];
    this.animator.setSpeed(this.speed);
    this.animator.update(dt);
    const pose = this.animator.pose();
    const expr = this.animator.expression();
    const s = this.scaleOf(e);
    const alpha = e.alpha ?? 1;
    if (alpha !== this.alpha) {
      this.alpha = alpha;
      this.paper?.setOpacity(alpha);
      this.paper2?.setOpacity(alpha);
      this.toon?.setOpacity(alpha);
    }
    const yawDeg = e.yaw ?? 0;
    if (this.paper) {
      this.paper.update(pose, expr);
      if (this.paper2) {
        this.paper2.update(pose, expr);
        this.paper2.group.position.y = -this.fig.heightM / 2;
      }
      // stand in the entity's paper plane; lean back toward a camera that looks down (like the cutouts)
      const down = Math.max(0, -camPitch);
      const t = clamp01((down - 15 * DEG) / (50 * DEG));
      const lean = down * (PITCH_FOLLOW + (1 - PITCH_FOLLOW) * t * t * (3 - 2 * t)) * Math.cos(yawDeg * DEG - camYaw);
      const h = this.fig.heightM * s;
      this.pivot.rotation.set(0, yawDeg * DEG, 0, 'YXZ');
      this.pivot.position.y = h / 2;
      this.inner.rotation.set(lean, 0, (e.tilt * Math.PI) / 180, 'YXZ');
      this.inner.position.set(0, 0, 0);
      this.paper.group.position.y = -this.fig.heightM / 2;
      this.inner.scale.set(flip ? -s : s, s * sq, s);
    } else if (this.toon) {
      this.toon.update(pose, expr);
      const moving = this.speed > 0.15 && this.dir;
      if (moving) this.wantFacing = Math.atan2(this.dir![0], this.dir![1]) / DEG;
      else if (lookAt) this.wantFacing = Math.atan2(lookAt[0] - pos[0], lookAt[1] - pos[2]) / DEG;
      else if (this.facing === null || yawDeg !== this.seenYaw || flip !== this.seenFlip) {
        this.wantFacing = this.fig.view === 'front' ? yawDeg : yawDeg + (flip ? 90 : -90);
      }
      this.seenYaw = yawDeg;
      this.seenFlip = flip;
      this.facing = this.facing === null ? this.wantFacing : lerpAngle(this.facing, this.wantFacing, Math.min(1, dt * 7));
      this.pivot.rotation.set(0, this.facing * DEG, 0);
      this.pivot.position.y = 0;
      // tilts (pouring, falling over) rotate about the middle
      const h = this.fig.heightM * s;
      this.inner.position.set(0, h / 2, 0);
      this.inner.rotation.set(0, 0, (e.tilt * Math.PI) / 180);
      this.inner.scale.set(s, s * sq, s);
      this.toon.group.position.y += -this.fig.heightM / 2;
    }
    // shadow: an oval the size of the footprint, fading as the thing rises
    const rw = Math.max(0.15, this.fig.halfW * 2.2) * s;
    const rd = Math.max(0.15, this.fig.halfD * 2.2) * s;
    const lift = Math.max(0, pos[1]);
    const k = 1 / (1 + lift * 0.6);
    const along = this.style === 'toon' ? (this.facing ?? 0) * DEG : yawDeg * DEG + (this.fig.view === 'side' ? Math.PI / 2 : 0);
    this.shadow.rotation.y = along;
    this.shadow.scale.set(rw * k, 1, rd * k);
    this.shadow.material.opacity = 0.9 * k * alpha;
    this.shadow.position.y = 0.012 - pos[1];
  }

  dispose(): void {
    this.paper?.dispose();
    this.paper2?.dispose();
    this.toon?.dispose();
    this.shadow.material.dispose();
  }
}
