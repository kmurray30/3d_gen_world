import * as THREE from 'three';
import type { Vec3 } from '../../shared/types';
import type { WorldModel } from '../../shared/engine/world';
import { renderHeight, renderWidth } from '../../shared/engine/sizing';

type Shape = 'drop' | 'flame' | 'puff' | 'star' | 'heart' | 'flake' | 'dust' | 'flash';
type Dir = 'up' | 'down' | 'out' | 'spray';
type Origin = 'base' | 'mid' | 'top' | 'above' | 'area';

interface Spec {
  shape: Shape;
  colors: string[];
  rate: number;
  burst?: number;
  life: [number, number];
  size: [number, number];
  speed: [number, number];
  dir: Dir;
  spread: number;
  gravity: number;
  grow: number;
  drift: number;
  origin: Origin;
  areaR: number;
  sway?: boolean;
  twinkle?: boolean;
  scaleWithEntity?: boolean;
  defaultLoop?: boolean;
}

const SPECS: Record<string, Spec> = {
  fire: { shape: 'flame', colors: ['#ff9a1f', '#ffd23f', '#ff5a1f'], rate: 22, life: [0.5, 0.9], size: [0.25, 0.5], speed: [0.8, 1.6], dir: 'up', spread: 0.3, gravity: 0, grow: -0.6, drift: 0.1, origin: 'mid', areaR: 0, scaleWithEntity: true, defaultLoop: true },
  smoke: { shape: 'puff', colors: ['#8d8d8d', '#b5b5b5', '#6f6f6f'], rate: 4, life: [1.8, 2.6], size: [0.3, 0.55], speed: [0.5, 1], dir: 'up', spread: 0.4, gravity: 0, grow: 0.8, drift: 0.3, origin: 'top', areaR: 0, scaleWithEntity: true, defaultLoop: true },
  steam: { shape: 'puff', colors: ['#ffffff', '#eef6ff'], rate: 14, life: [0.8, 1.4], size: [0.3, 0.5], speed: [1.2, 2], dir: 'up', spread: 0.5, gravity: 0, grow: 1, drift: 0.2, origin: 'mid', areaR: 0, scaleWithEntity: true },
  rain: { shape: 'drop', colors: ['#5fb7ff', '#8ad0ff'], rate: 45, life: [1.2, 1.4], size: [0.12, 0.2], speed: [6, 7], dir: 'down', spread: 0.05, gravity: 0, grow: 0, drift: 0, origin: 'above', areaR: 3 },
  water_spray: { shape: 'drop', colors: ['#5fb7ff', '#9ad8ff'], rate: 36, life: [0.7, 1], size: [0.1, 0.18], speed: [1.5, 2.5], dir: 'spray', spread: 0.5, gravity: 6, grow: 0, drift: 0, origin: 'mid', areaR: 0 },
  sparkle: { shape: 'star', colors: ['#fff7a8', '#ffffff', '#ffd84d'], rate: 16, life: [0.5, 0.9], size: [0.15, 0.35], speed: [0.3, 0.9], dir: 'out', spread: 1, gravity: -0.5, grow: 0, drift: 0, origin: 'mid', areaR: 0, twinkle: true, scaleWithEntity: true },
  explosion: { shape: 'dust', colors: ['#c9a86a', '#8b6f47', '#ff9a1f', '#ffd23f'], rate: 0, burst: 36, life: [0.6, 1.1], size: [0.3, 0.7], speed: [3, 7], dir: 'out', spread: 1, gravity: 5, grow: 0.4, drift: 0, origin: 'mid', areaR: 0 },
  snow: { shape: 'flake', colors: ['#ffffff', '#eaf6ff'], rate: 24, life: [3.5, 5], size: [0.12, 0.22], speed: [0.8, 1.2], dir: 'down', spread: 0.1, gravity: 0, grow: 0, drift: 0, origin: 'above', areaR: 4, sway: true },
  hearts: { shape: 'heart', colors: ['#ff6b9d', '#ff9ec4'], rate: 4, life: [1.4, 1.8], size: [0.2, 0.3], speed: [0.6, 1], dir: 'up', spread: 0.3, gravity: 0, grow: 0.2, drift: 0, origin: 'top', areaR: 0, sway: true, scaleWithEntity: true },
  dust: { shape: 'dust', colors: ['#d8c39a', '#bfa97a'], rate: 0, burst: 10, life: [0.4, 0.7], size: [0.2, 0.4], speed: [0.8, 1.6], dir: 'out', spread: 0.2, gravity: 3, grow: 0.8, drift: 0, origin: 'base', areaR: 0 },
};

interface Particle {
  sprite: THREE.Sprite;
  mat: THREE.SpriteMaterial;
  vel: Vec3;
  age: number;
  life: number;
  size: number;
  grow: number;
  phase: number;
  sway: boolean;
  twinkle: boolean;
  gravity: number;
}

interface Emitter {
  key: string;
  name: string;
  spec: Spec;
  entityId?: string;
  pos?: Vec3;
  loop: boolean;
  remaining: number;
  acc: number;
  done: boolean;
  persistent: boolean;
}

export interface EntityShape {
  pos: Vec3;
  h: number;
  w: number;
}

const POOL = 320;

/** Pooled sprite particles for the named effects. Emitters follow entities or sit at a position. */
export class ParticleSystem {
  private readonly textures = new Map<Shape, THREE.Texture>();
  private readonly pool: Particle[] = [];
  private readonly live: Particle[] = [];
  private readonly emitters = new Map<string, Emitter>();
  private readonly group = new THREE.Group();
  shake = 0;

  constructor(scene: THREE.Scene) {
    scene.add(this.group);
    for (let i = 0; i < POOL; i++) {
      const mat = new THREE.SpriteMaterial({ transparent: true, depthWrite: false, opacity: 1 });
      const sprite = new THREE.Sprite(mat);
      sprite.visible = false;
      this.group.add(sprite);
      this.pool.push({ sprite, mat, vel: [0, 0, 0], age: 0, life: 1, size: 0.3, grow: 0, phase: 0, sway: false, twinkle: false, gravity: 0 });
    }
  }

  start(key: string, name: string, opts: { entityId?: string; pos?: Vec3; dur?: number; loop?: boolean; persistent?: boolean }): void {
    const spec = SPECS[name];
    if (!spec) return;
    if (this.emitters.has(key)) return;
    const loop = opts.loop ?? (opts.persistent ? true : false);
    const em: Emitter = {
      key,
      name,
      spec,
      entityId: opts.entityId,
      pos: opts.pos ? [...opts.pos] : undefined,
      loop,
      remaining: loop ? Infinity : (opts.dur ?? 2),
      acc: 0,
      done: false,
      persistent: !!opts.persistent,
    };
    this.emitters.set(key, em);
    if (name === 'explosion') this.shake = Math.max(this.shake, 0.7);
  }

  stop(key: string): void {
    this.emitters.delete(key);
  }

  stopEntity(entityId: string): void {
    for (const [k, em] of this.emitters) if (em.entityId === entityId) this.emitters.delete(k);
  }

  /** Keep looping emitters in step with each entity's persistent `effects` list. */
  syncPersistent(model: WorldModel): void {
    const wanted = new Set<string>();
    for (const e of model.entities.values()) {
      if (e.hidden) continue;
      for (const name of e.effects) {
        const key = `p:${e.id}:${name}`;
        wanted.add(key);
        if (!this.emitters.has(key)) this.start(key, name, { entityId: e.id, loop: true, persistent: true });
      }
    }
    for (const [k, em] of this.emitters) if (em.persistent && !wanted.has(k)) this.emitters.delete(k);
  }

  update(dt: number, shapeOf: (id: string) => EntityShape | null, camera: THREE.Camera): void {
    this.shake = Math.max(0, this.shake - dt * 1.6);
    for (const [key, em] of this.emitters) {
      const anchor = em.entityId ? shapeOf(em.entityId) : em.pos ? { pos: em.pos, h: 1, w: 1 } : null;
      if (!anchor) {
        this.emitters.delete(key);
        continue;
      }
      if (em.spec.burst && !em.done) {
        for (let i = 0; i < em.spec.burst; i++) this.spawn(em, anchor);
        em.done = true;
        em.remaining = Math.min(em.remaining, 0.05);
      } else if (em.spec.rate > 0) {
        const mul = em.spec.scaleWithEntity ? clamp(anchor.h * 0.35, 0.5, 3) : 1;
        em.acc += dt * em.spec.rate * mul;
        while (em.acc >= 1) {
          em.acc -= 1;
          this.spawn(em, anchor);
        }
      }
      em.remaining -= dt;
      if (em.remaining <= 0) this.emitters.delete(key);
    }
    const camDir = new THREE.Vector3();
    camera.getWorldDirection(camDir);
    for (let i = this.live.length - 1; i >= 0; i--) {
      const p = this.live[i];
      p.age += dt;
      if (p.age >= p.life) {
        p.sprite.visible = false;
        this.live.splice(i, 1);
        this.pool.push(p);
        continue;
      }
      p.vel[1] -= p.gravity * dt;
      const s = p.sprite.position;
      s.x += p.vel[0] * dt + (p.sway ? Math.sin(p.age * 3 + p.phase) * 0.4 * dt : 0);
      s.y += p.vel[1] * dt;
      s.z += p.vel[2] * dt;
      if (s.y < 0.02 && p.vel[1] < 0) {
        s.y = 0.02;
        p.vel[1] = 0;
        p.vel[0] *= 0.8;
        p.vel[2] *= 0.8;
      }
      const t = p.age / p.life;
      const size = p.size * (1 + p.grow * t) * (p.twinkle ? 0.7 + 0.5 * Math.abs(Math.sin(p.age * 14 + p.phase)) : 1);
      p.sprite.scale.set(size, size, 1);
      p.mat.opacity = t < 0.7 ? 1 : 1 - (t - 0.7) / 0.3;
      p.mat.rotation += dt * (p.phase - 3) * 0.5;
    }
  }

  private spawn(em: Emitter, anchor: EntityShape): void {
    const p = this.pool.pop();
    if (!p) return;
    const spec = em.spec;
    const rnd = (a: number, b: number) => a + Math.random() * (b - a);
    const mul = spec.scaleWithEntity ? clamp(anchor.h * 0.35, 0.6, 3) : 1;
    const [x0, y0, z0] = anchor.pos;
    const halfW = Math.max(0.05, anchor.w * 0.35);
    let x = x0 + rnd(-halfW, halfW);
    let z = z0 + rnd(-halfW, halfW) * 0.4;
    let y = y0;
    switch (spec.origin) {
      case 'mid':
        y = y0 + anchor.h * rnd(0.25, 0.6);
        break;
      case 'top':
        y = y0 + anchor.h * rnd(0.9, 1.05);
        break;
      case 'above':
        y = y0 + anchor.h + 5 + rnd(0, 1.5);
        x = x0 + rnd(-spec.areaR, spec.areaR);
        z = z0 + rnd(-spec.areaR, spec.areaR);
        break;
      case 'area':
        x = x0 + rnd(-spec.areaR, spec.areaR);
        z = z0 + rnd(-spec.areaR, spec.areaR);
        break;
      case 'base':
      default:
        y = y0 + 0.05;
        break;
    }
    const speed = rnd(spec.speed[0], spec.speed[1]);
    const a = Math.random() * Math.PI * 2;
    const sp = spec.spread;
    let vel: Vec3;
    switch (spec.dir) {
      case 'down':
        vel = [Math.cos(a) * speed * sp, -speed, Math.sin(a) * speed * sp];
        break;
      case 'out': {
        const up = Math.random() * sp;
        vel = [Math.cos(a) * speed, speed * up * 0.8, Math.sin(a) * speed];
        break;
      }
      case 'spray':
        vel = [Math.cos(a) * speed * sp, -speed * 0.5, Math.sin(a) * speed * sp];
        break;
      case 'up':
      default:
        vel = [Math.cos(a) * speed * sp + rnd(-spec.drift, spec.drift), speed, Math.sin(a) * speed * sp];
        break;
    }
    p.vel = vel;
    p.age = 0;
    p.life = rnd(spec.life[0], spec.life[1]);
    p.size = rnd(spec.size[0], spec.size[1]) * mul;
    p.grow = spec.grow;
    p.phase = Math.random() * 6.28;
    p.sway = !!spec.sway;
    p.twinkle = !!spec.twinkle;
    p.gravity = spec.gravity;
    p.mat.map = this.texture(spec.shape);
    p.mat.color.set(spec.colors[Math.floor(Math.random() * spec.colors.length)]);
    p.mat.opacity = 1;
    p.mat.rotation = Math.random() * 6.28;
    p.mat.needsUpdate = true;
    p.sprite.position.set(x, y, z);
    p.sprite.scale.set(p.size, p.size, 1);
    p.sprite.visible = true;
    this.live.push(p);
  }

  private texture(shape: Shape): THREE.Texture {
    let tex = this.textures.get(shape);
    if (tex) return tex;
    const s = 64;
    const c = document.createElement('canvas');
    c.width = s;
    c.height = s;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#2b2b2b';
    ctx.lineWidth = 5;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    switch (shape) {
      case 'drop':
        ctx.moveTo(32, 6);
        ctx.bezierCurveTo(44, 24, 54, 34, 54, 42);
        ctx.arc(32, 42, 22, 0, Math.PI, false);
        ctx.bezierCurveTo(10, 34, 20, 24, 32, 6);
        break;
      case 'flame':
        ctx.moveTo(32, 4);
        ctx.bezierCurveTo(50, 22, 58, 34, 54, 46);
        ctx.bezierCurveTo(50, 60, 14, 60, 10, 46);
        ctx.bezierCurveTo(6, 34, 20, 26, 32, 4);
        break;
      case 'star':
        for (let i = 0; i < 10; i++) {
          const r = i % 2 ? 12 : 28;
          const ang = (i / 10) * Math.PI * 2 - Math.PI / 2;
          ctx.lineTo(32 + Math.cos(ang) * r, 32 + Math.sin(ang) * r);
        }
        ctx.closePath();
        break;
      case 'heart':
        ctx.moveTo(32, 56);
        ctx.bezierCurveTo(4, 36, 8, 10, 32, 20);
        ctx.bezierCurveTo(56, 10, 60, 36, 32, 56);
        break;
      case 'flake':
        for (let i = 0; i < 6; i++) {
          const ang = (i / 6) * Math.PI * 2;
          ctx.moveTo(32, 32);
          ctx.lineTo(32 + Math.cos(ang) * 26, 32 + Math.sin(ang) * 26);
        }
        ctx.lineWidth = 6;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#2b2b2b';
        ctx.stroke();
        tex = new THREE.CanvasTexture(c);
        tex.colorSpace = THREE.SRGBColorSpace;
        this.textures.set(shape, tex);
        return tex;
      case 'flash':
        ctx.arc(32, 32, 28, 0, Math.PI * 2);
        break;
      case 'puff':
      case 'dust':
      default:
        ctx.arc(22, 36, 14, 0, Math.PI * 2);
        ctx.arc(34, 26, 16, 0, Math.PI * 2);
        ctx.arc(44, 38, 13, 0, Math.PI * 2);
        break;
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    this.textures.set(shape, tex);
    return tex;
  }
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

export function shapeOfEntity(model: WorldModel, id: string): EntityShape | null {
  const e = model.get(id);
  if (!e || e.hidden) return null;
  return { pos: model.renderPos(e), h: renderHeight(e), w: renderWidth(e) };
}
