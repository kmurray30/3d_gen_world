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
import { flipFor, lerpAngle, yawAlong } from '../../../shared/engine/facing';
import { PaperFigure } from './paper';
import type { GroundView } from '../sprites';
import { ToonFigure } from './toon';
import { CelFigure, sculptFor } from './cel';

export type FigureStyle = 'paper' | 'origami' | 'toon' | 'cel';
const DEG = Math.PI / 180;
const SHADOW = new THREE.CircleGeometry(0.5, 28).rotateX(-Math.PI / 2);
const UP = new THREE.Vector3(0, 1, 0);

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
  /** The solid styles (origami, 3D, cel). A cel figure starts as the 3D one until its sculpted model is ready. */
  private toon: ToonFigure | CelFigure | null = null;
  private celPending = false;
  private last: Vec3 | null = null;
  private speed = 0;
  private dir: [number, number] | null = null;
  /** 3D facing in degrees (spec +z turned by this). */
  private facing: number | null = null;
  private wantFacing = 0;
  private seenYaw: number | undefined;
  private seenFlip: boolean | undefined;
  private alpha = 1;
  private orbitT = 0;
  private bank = 0;
  /** 3D: adopt the entity's yaw whenever it changes (off for the player's own character, which faces where it
   *  last walked). */
  followYaw = true;
  /** The oval shadow sits in this holder, which tilts with the ground's slope. */
  private readonly shadowTilt = new THREE.Group();

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
      const s = style === 'cel' ? sculptFor(fig.key) : null;
      this.toon = s ? new CelFigure(fig, id, s) : new ToonFigure(fig, id, style === 'origami' ? 'origami' : 'toon');
      this.celPending = style === 'cel' && !s;
      this.inner.add(this.toon.group);
    }
    this.pivot.add(this.inner);
    this.shadow = new THREE.Mesh(SHADOW, new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false, opacity: 0.9, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
    this.shadow.renderOrder = -1;
    this.shadowTilt.add(this.shadow);
    this.root.add(this.pivot, this.shadowTilt);
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

  update(e: Entity, pos: Vec3, camYaw: number, camPitch: number, flip: boolean, sq: number, dt: number, lookAt: [number, number] | null, ground?: GroundView): void {
    void camYaw;
    void camPitch;
    // a figure set to orbit (state.orbit = radius) flies circles around its spot: a display piece, drawn here
    // only, so it costs the engine nothing
    const orbit = typeof e.state.orbit === 'number' && e.state.orbit > 0 ? e.state.orbit : 0;
    let flyDir: [number, number] | null = null;
    if (orbit) {
      this.orbitT += dt;
      const speed = typeof e.state.orbitSpeed === 'number' ? e.state.orbitSpeed : 4;
      const a = (typeof e.state.orbitPhase === 'number' ? e.state.orbitPhase : 0) + (this.orbitT * speed) / orbit;
      pos = [pos[0] + Math.cos(a) * orbit, pos[1] + Math.sin(this.orbitT * 0.8) * 0.6, pos[2] - Math.sin(a) * orbit];
      flyDir = [-Math.sin(a), -Math.cos(a)];
    }
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
    // off the ground (a dragon in the sky) flying figures hover and fly instead of standing and walking
    const groundY = ground ? ground.height(pos[0], pos[2]) : 0;
    this.animator.setAirborne(pos[1] - groundY > 0.35);
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
    let yawDeg = e.yaw ?? 0;
    if (flyDir) {
      // on paper the cutout stands along its flight path, mirrored to face the way it flies
      yawDeg = yawAlong(flyDir[0], flyDir[1]);
      flip = flipFor(yawDeg, flyDir[0], flyDir[1]);
    }
    // bank into turns: lean toward the centre of the circle
    this.bank += ((orbit ? -18 : 0) - this.bank) * Math.min(1, dt * 3);
    if (this.paper) {
      this.paper.update(pose, expr);
      if (this.paper2) {
        this.paper2.update(pose, expr);
        this.paper2.group.position.y = -this.fig.heightM / 2;
      }
      // stand upright in the entity's paper plane, like every cutout; scripted tilts rotate about the middle
      const h = this.fig.heightM * s;
      this.pivot.rotation.set(0, yawDeg * DEG, 0, 'YXZ');
      this.pivot.position.y = h / 2;
      this.inner.rotation.set(0, 0, (e.tilt * Math.PI) / 180, 'YXZ');
      this.inner.position.set(0, 0, 0);
      this.paper.group.position.y = -this.fig.heightM / 2;
      this.inner.scale.set(flip ? -s : s, s * sq, s);
    } else if (this.toon) {
      if (this.celPending) {
        // the sculpted model arrived from the worker: swap it in for the stand-in
        const s = sculptFor(this.fig.key);
        if (s) {
          this.inner.remove(this.toon.group);
          this.toon.dispose();
          this.toon = new CelFigure(this.fig, this.id, s);
          this.inner.add(this.toon.group);
          if (this.alpha !== 1) this.toon.setOpacity(this.alpha);
          this.celPending = false;
        }
      }
      this.toon.update(pose, expr);
      const moving = this.speed > 0.15 && this.dir;
      if (moving) this.wantFacing = Math.atan2(this.dir![0], this.dir![1]) / DEG;
      else if (lookAt) this.wantFacing = Math.atan2(lookAt[0] - pos[0], lookAt[1] - pos[2]) / DEG;
      else if (this.facing === null || (this.followYaw && (yawDeg !== this.seenYaw || flip !== this.seenFlip))) {
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
      this.inner.rotation.set(0, 0, ((e.tilt + this.bank) * Math.PI) / 180);
      this.inner.scale.set(s, s * sq, s);
      this.toon.group.position.y += -this.fig.heightM / 2;
    }
    // shadow: an oval the size of the footprint on the ground under the thing, tilted with the slope, fading as
    // the thing rises
    const g = groundY;
    const rw = Math.max(0.15, this.fig.halfW * 2.2) * s;
    const rd = Math.max(0.15, this.fig.halfD * 2.2) * s;
    const lift = Math.max(0, pos[1] - g);
    const k = 1 / (1 + lift * 0.6);
    const along = this.style !== 'paper' ? (this.facing ?? 0) * DEG : yawDeg * DEG + (this.fig.view === 'side' ? Math.PI / 2 : 0);
    this.shadow.rotation.y = along;
    this.shadow.scale.set(rw * k, 1, rd * k);
    this.shadow.material.opacity = 0.9 * k * alpha;
    this.shadowTilt.position.y = 0.03 - pos[1] + g;
    if (ground) {
      const [nx, ny, nz] = ground.normal(pos[0], pos[2]);
      this.shadowTilt.quaternion.setFromUnitVectors(UP, new THREE.Vector3(nx, ny, nz));
    }
  }

  dispose(): void {
    this.paper?.dispose();
    this.paper2?.dispose();
    this.toon?.dispose();
    this.shadow.material.dispose();
  }
}
