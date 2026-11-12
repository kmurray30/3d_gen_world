import * as THREE from 'three';
import type { WorldModel } from '../../shared/engine/world';
import { renderHeight } from '../../shared/engine/sizing';

interface Bubble {
  id: string;
  el: HTMLDivElement;
  until: number;
}

const MAX_BUBBLES = 10;

/** Speech bubbles positioned above entities by projecting their top point to the screen each frame. */
export class BubbleLayer {
  private readonly bubbles: Bubble[] = [];
  private readonly v = new THREE.Vector3();

  constructor(private readonly root: HTMLElement) {}

  say(id: string, text: string, dur: number): void {
    const existing = this.bubbles.find((b) => b.id === id);
    if (existing) existing.el.remove();
    const el = document.createElement('div');
    el.className = 'bubble';
    el.textContent = text;
    this.root.appendChild(el);
    const b: Bubble = { id, el, until: performance.now() + dur * 1000 };
    this.bubbles.push(b);
    if (existing) this.bubbles.splice(this.bubbles.indexOf(existing), 1);
    while (this.bubbles.length > MAX_BUBBLES) this.bubbles.shift()!.el.remove();
  }

  /** Whether this entity has a speech bubble up (its mouth moves). */
  talking(id: string): boolean {
    const now = performance.now();
    return this.bubbles.some((b) => b.id === id && b.until > now);
  }

  update(camera: THREE.Camera, model: WorldModel, width: number, height: number): void {
    const now = performance.now();
    for (let i = this.bubbles.length - 1; i >= 0; i--) {
      const b = this.bubbles[i];
      const e = model.get(b.id);
      if (now > b.until || !e || e.hidden) {
        b.el.remove();
        this.bubbles.splice(i, 1);
        continue;
      }
      const p = model.renderPos(e);
      this.v.set(p[0], p[1] + renderHeight(e) + 0.25, p[2]).project(camera);
      if (this.v.z > 1 || Math.abs(this.v.x) > 1.3 || Math.abs(this.v.y) > 1.3) {
        b.el.style.display = 'none';
        continue;
      }
      b.el.style.display = '';
      const x = ((this.v.x + 1) / 2) * width;
      const y = ((1 - this.v.y) / 2) * height;
      b.el.style.transform = `translate(${x.toFixed(0)}px, ${y.toFixed(0)}px) translate(-50%, -100%)`;
    }
  }
}

/**
 * Name tags: small labels over the nearest things in view, so a world of thousands of things reads like a visual
 * dictionary. Only the closest few are tagged, fading out with distance; elements are pooled.
 */
export class NameTags {
  private readonly pool: HTMLDivElement[] = [];
  private readonly v = new THREE.Vector3();

  constructor(
    private readonly root: HTMLElement,
    private readonly radius = 7,
    private readonly max = 24,
  ) {}

  update(camera: THREE.PerspectiveCamera, model: WorldModel, ids: Iterable<string>, width: number, height: number): void {
    const cam = camera.position;
    const near: Array<{ id: string; d: number }> = [];
    for (const id of ids) {
      const e = model.get(id);
      if (!e || e.hidden || e.structure || e.state.display) continue;
      const p = model.renderPos(e);
      const d = Math.hypot(p[0] - cam.x, p[2] - cam.z);
      if (d < this.radius) near.push({ id, d });
    }
    near.sort((a, b) => a.d - b.d);
    let used = 0;
    for (const { id, d } of near) {
      if (used >= this.max) break;
      const e = model.get(id)!;
      const p = model.renderPos(e);
      this.v.set(p[0], p[1] + renderHeight(e) + 0.08, p[2]).project(camera);
      if (this.v.z > 1 || Math.abs(this.v.x) > 1.05 || Math.abs(this.v.y) > 1.05) continue;
      let el = this.pool[used];
      if (!el) {
        el = document.createElement('div');
        el.className = 'nametag';
        this.root.appendChild(el);
        this.pool.push(el);
      }
      if (el.textContent !== e.label) el.textContent = e.label;
      el.style.display = '';
      el.style.opacity = String(Math.min(1, (this.radius - d) / 2.5));
      el.style.transform = `translate(${(((this.v.x + 1) / 2) * width).toFixed(0)}px, ${(((1 - this.v.y) / 2) * height).toFixed(0)}px) translate(-50%, -100%)`;
      used++;
    }
    for (let i = used; i < this.pool.length; i++) this.pool[i].style.display = 'none';
  }
}
