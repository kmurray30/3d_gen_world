import type { PlayerState, Vec3 } from '../../shared/types';
import { WORLD_RADIUS } from '../../shared/types';

const WALK = 3;
const SPRINT = 6;
const GRAVITY = 20;
const JUMP = 7;
const PITCH_LIMIT = (70 * Math.PI) / 180;

export class PlayerController {
  private vy = 0;
  /** Set by the collision layer (M6) to push the player out of solids. */
  resolveCollisions?: (pos: Vec3) => void;

  constructor(readonly state: PlayerState) {}

  update(dt: number, move: [number, number], look: [number, number], lookSens: number, sprint: boolean, jump: boolean): void {
    const s = this.state;
    s.yaw -= look[0] * lookSens;
    s.pitch -= look[1] * lookSens;
    s.pitch = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, s.pitch));

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
    if (jump && s.pos[1] <= 0.001) this.vy = JUMP;
    if (s.pos[1] > 0 || this.vy > 0) {
      this.vy -= GRAVITY * dt;
      s.pos[1] = Math.max(0, s.pos[1] + this.vy * dt);
      if (s.pos[1] === 0) this.vy = 0;
    }
    const r = Math.hypot(s.pos[0], s.pos[2]);
    if (r > WORLD_RADIUS) {
      s.pos[0] *= WORLD_RADIUS / r;
      s.pos[2] *= WORLD_RADIUS / r;
    }
    this.resolveCollisions?.(s.pos);
  }

  get moving(): boolean {
    return false;
  }
}
