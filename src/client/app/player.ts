import type { PlayerState, Vec3 } from '../../shared/types';
import { WORLD_RADIUS } from '../../shared/types';

const WALK = 3;
const SPRINT = 6;
const GRAVITY = 20;
const JUMP = 7;
/** How fast the feet climb a step they are standing on (metres per second); stairs feel smooth, not teleporty. */
const STEP_CLIMB = 9;
const PITCH_LIMIT = (70 * Math.PI) / 180;

export class PlayerController {
  private vy = 0;
  /** Set by the app: pushes the player out of solids and returns the height they can stand on there. */
  resolveCollisions?: (pos: Vec3) => number;
  /** Height of whatever the player stands on (0 = the meadow). */
  ground = 0;
  private grounded = true;
  /** Pitch range in radians; the camera rig widens it for the overhead views. */
  pitchLimits: [number, number] = [-PITCH_LIMIT, PITCH_LIMIT];

  constructor(readonly state: PlayerState) {}

  update(dt: number, move: [number, number], look: [number, number], lookSens: number, sprint: boolean, jump: boolean): void {
    const s = this.state;
    s.yaw -= look[0] * lookSens;
    s.pitch -= look[1] * lookSens;
    s.pitch = Math.max(this.pitchLimits[0], Math.min(this.pitchLimits[1], s.pitch));

    let [ax, ay] = move;
    const len = Math.hypot(ax, ay);
    if (len > 1) {
      ax /= len;
      ay /= len;
    }
    if (len > 0) {
      const speed = sprint ? SPRINT : WALK;
      const fx = -Math.sin(s.yaw);
      const fz = -Math.cos(s.yaw);
      const rx = Math.cos(s.yaw);
      const rz = -Math.sin(s.yaw);
      s.pos[0] += (rx * ax + fx * ay) * speed * dt;
      s.pos[2] += (rz * ax + fz * ay) * speed * dt;
    }
    const r = Math.hypot(s.pos[0], s.pos[2]);
    if (r > WORLD_RADIUS) {
      s.pos[0] *= WORLD_RADIUS / r;
      s.pos[2] *= WORLD_RADIUS / r;
    }
    const wasGrounded = this.grounded;
    this.ground = this.resolveCollisions?.(s.pos) ?? 0;
    // walking down a slope or off a low step: keep the feet on the ground instead of hopping
    if (wasGrounded && this.vy <= 0 && s.pos[1] > this.ground && s.pos[1] - this.ground < 0.6) s.pos[1] = this.ground;
    const onGround = s.pos[1] <= this.ground + 0.001 && this.vy <= 0;
    if (jump && onGround) this.vy = JUMP;
    if (s.pos[1] < this.ground && this.vy <= 0) {
      // stepped onto something higher: climb up to it
      s.pos[1] = Math.min(this.ground, s.pos[1] + STEP_CLIMB * dt);
      this.vy = 0;
    } else if (s.pos[1] > this.ground || this.vy > 0) {
      this.vy -= GRAVITY * dt;
      s.pos[1] = Math.max(this.ground, s.pos[1] + this.vy * dt);
      if (s.pos[1] === this.ground) this.vy = 0;
    }
    this.grounded = s.pos[1] <= this.ground + 0.001 && this.vy <= 0;
  }

  get moving(): boolean {
    return false;
  }
}
