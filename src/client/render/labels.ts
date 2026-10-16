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
