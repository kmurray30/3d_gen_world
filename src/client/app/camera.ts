/**
 * Where the eye is. First person sits in the player's head; third person orbits behind the avatar at one of a few
 * preset angles (behind, high, bird, top); the free camera detaches and flies on its own while the avatar waits.
 */
import type { PlayerState, Vec3 } from '../../shared/types';
import { PLAYER_EYE_HEIGHT, WORLD_RADIUS } from '../../shared/types';
import { DEG, clamp, lerp } from '../../shared/engine/math';

export type ViewMode = 'first' | 'third' | 'free';
export const VIEW_MODES: ViewMode[] = ['first', 'third', 'free'];

export interface AnglePreset {
  name: string;
  /** Degrees the camera looks down. */
  down: number;
  dist: number;
}

/** Camera angles for third person, cycled by the angle button; "top" is the 2.5D overhead view. */
export const ANGLES: AnglePreset[] = [
  { name: 'behind', down: 12, dist: 4.6 },
  { name: 'high', down: 35, dist: 7.5 },
  { name: 'bird', down: 58, dist: 11 },
  { name: 'top', down: 84, dist: 15 },
];

export interface CameraPose {
  pos: Vec3;
  yaw: number;
  pitch: number;
}

export interface FlyInput {
  /** [strafe, forward] in -1..1 */
  move: [number, number];
  up: number;
  fast: boolean;
}

const FLY_SPEED = 7;
const FLY_FAST = 18;
const MIN_Y = 0.35;
const PITCH_LIMIT_FIRST = 70 * DEG;
const ORBIT_SMOOTH = 10;

export class CameraRig {
  mode: ViewMode = 'first';
  angle = 1;
  /** Ground height under a point, so the camera never dips into a hill. */
  ground: (x: number, z: number) => number = () => 0;
  /** Pitch the third-person camera is easing toward after an angle change (null = the player steers it). */
  private pitchGoal: number | null = null;
  readonly pose: CameraPose = { pos: [0, PLAYER_EYE_HEIGHT, 0], yaw: 0, pitch: 0 };
  /** The free camera's own state, kept between visits. */
  private readonly free: CameraPose = { pos: [0, 3, 6], yaw: 0, pitch: -0.3 };
  private dist = ANGLES[1].dist;
  private down = ANGLES[1].down * DEG;

  /** Pitch limits the player controller should apply in the current mode (radians). */
  get pitchLimits(): [number, number] {
    return this.mode === 'third' ? [-88 * DEG, 25 * DEG] : [-PITCH_LIMIT_FIRST, PITCH_LIMIT_FIRST];
  }

  /** Whether player input should walk the avatar (false while flying). */
  get drivesPlayer(): boolean {
    return this.mode !== 'free';
  }

  get showsAvatar(): boolean {
    return this.mode !== 'first';
  }

  setMode(mode: ViewMode, player: PlayerState): void {
    if (mode === this.mode) return;
    if (mode === 'free') {
      // start the free camera where the eye currently is, so the switch does not jump
      this.free.pos = [...this.pose.pos];
      this.free.yaw = this.pose.yaw;
      this.free.pitch = this.pose.pitch;
    }
    if (mode === 'third' && this.mode === 'first') {
      // swing out from the head and ease down to the preset angle
      this.pitchGoal = -this.down;
      this.dist = 0.5;
    }
    if (mode === 'first') player.pitch = clamp(player.pitch, -PITCH_LIMIT_FIRST, PITCH_LIMIT_FIRST);
    this.mode = mode;
  }

  /** Put the free camera somewhere (tests and screenshots): switches to free mode. */
  teleport(pos: Vec3, yaw: number, pitch: number, player: PlayerState): void {
    this.setMode('free', player);
    this.free.pos = [...pos];
    this.free.yaw = yaw;
    this.free.pitch = pitch;
  }

  cycleMode(player: PlayerState): ViewMode {
    const next = VIEW_MODES[(VIEW_MODES.indexOf(this.mode) + 1) % VIEW_MODES.length];
    this.setMode(next, player);
    return next;
  }

  setAngle(index: number, player: PlayerState): AnglePreset {
    this.angle = ((index % ANGLES.length) + ANGLES.length) % ANGLES.length;
    const a = ANGLES[this.angle];
    this.down = a.down * DEG;
    if (this.mode === 'third') this.pitchGoal = -this.down;
    void player;
    return a;
  }

  cycleAngle(player: PlayerState): AnglePreset {
    if (this.mode === 'first') this.setMode('third', player);
    return this.setAngle(this.angle + 1, player);
  }

  /**
   * Advance the camera. `look` is this frame's mouse/touch delta: the free camera steers with it; in third person
   * the player already turned with it, and any vertical look cancels an angle change still easing in.
   */
  update(dt: number, player: PlayerState, look: [number, number], lookSens: number, fly: FlyInput): CameraPose {
    const p = this.pose;
    if (this.mode === 'first') {
      this.pitchGoal = null;
      p.pos = [player.pos[0], player.pos[1] + PLAYER_EYE_HEIGHT, player.pos[2]];
      p.yaw = player.yaw;
      p.pitch = player.pitch;
      return p;
    }
    if (this.mode === 'third') {
      if (this.pitchGoal !== null) {
        if (look[1] !== 0) this.pitchGoal = null;
        else {
          player.pitch += (this.pitchGoal - player.pitch) * Math.min(1, dt * 6);
          if (Math.abs(this.pitchGoal - player.pitch) < 0.002) {
            player.pitch = this.pitchGoal;
            this.pitchGoal = null;
          }
        }
      }
      const target: Vec3 = [player.pos[0], player.pos[1] + 1.25, player.pos[2]];
      const want = ANGLES[this.angle].dist;
      this.dist = lerp(this.dist, want, Math.min(1, dt * ORBIT_SMOOTH));
      const yaw = player.yaw;
      const pitch = player.pitch;
      const fx = -Math.sin(yaw) * Math.cos(pitch);
      const fy = Math.sin(pitch);
      const fz = -Math.cos(yaw) * Math.cos(pitch);
      const cx = target[0] - fx * this.dist;
      const cz = target[2] - fz * this.dist;
      p.pos = [cx, Math.max(this.ground(cx, cz) + MIN_Y, target[1] - fy * this.dist), cz];
      p.yaw = yaw;
      p.pitch = pitch;
      return p;
    }
    // free flight
    const f = this.free;
    f.yaw -= look[0] * lookSens;
    f.pitch = clamp(f.pitch - look[1] * lookSens, -89 * DEG, 89 * DEG);
    const speed = fly.fast ? FLY_FAST : FLY_SPEED;
    let [ax, ay] = fly.move;
    const len = Math.hypot(ax, ay);
    if (len > 1) {
      ax /= len;
      ay /= len;
    }
    const fx = -Math.sin(f.yaw) * Math.cos(f.pitch);
    const fy = Math.sin(f.pitch);
    const fz = -Math.cos(f.yaw) * Math.cos(f.pitch);
    const rx = Math.cos(f.yaw);
    const rz = -Math.sin(f.yaw);
    f.pos[0] += (rx * ax + fx * ay) * speed * dt;
    f.pos[1] += (fy * ay + fly.up) * speed * dt;
    f.pos[2] += (rz * ax + fz * ay) * speed * dt;
    f.pos[1] = clamp(f.pos[1], this.ground(f.pos[0], f.pos[2]) + MIN_Y, 90);
    const r = Math.hypot(f.pos[0], f.pos[2]);
    if (r > WORLD_RADIUS + 20) {
      f.pos[0] *= (WORLD_RADIUS + 20) / r;
      f.pos[2] *= (WORLD_RADIUS + 20) / r;
    }
    p.pos = [...f.pos];
    p.yaw = f.yaw;
    p.pitch = f.pitch;
    return p;
  }
}

export interface ViewSettings {
  mode: ViewMode;
  angle: number;
  fade: boolean;
}

const KEY = 'pw.view';

export function loadViewSettings(): ViewSettings {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const v = JSON.parse(raw) as Partial<ViewSettings>;
      return { mode: VIEW_MODES.includes(v.mode as ViewMode) ? (v.mode as ViewMode) : 'first', angle: clamp(Number(v.angle ?? 1), 0, ANGLES.length - 1) | 0, fade: v.fade !== false };
    }
  } catch {
    /* ignore */
  }
  return { mode: 'first', angle: 1, fade: true };
}

export function saveViewSettings(v: ViewSettings): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(v));
  } catch {
    /* ignore */
  }
}
