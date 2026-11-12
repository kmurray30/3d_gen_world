/**
 * The sky: a CSS gradient behind the transparent canvas (one layer per time of day, cross-faded), a paper sun and
 * moon far away in the scene, stars, and the matching fog colour and world tint. Changing the time eases every
 * value over a couple of seconds.
 */
import * as THREE from 'three';
import type { TimeOfDay } from '../../shared/types';
import { TIMES_OF_DAY } from '../../shared/types';
import { LIGHT } from './tint';

interface Palette {
  gradient: string;
  fog: string;
  tint: [number, number, number];
  glow: number;
  sun: { az: number; elev: number; color: string; size: number; alpha: number };
  moon: { alpha: number };
  stars: number;
}

export const PALETTES: Record<TimeOfDay, Palette> = {
  dawn: {
    gradient: 'linear-gradient(#7d8fd3 0%, #f2b0c4 52%, #ffe0b2 100%)',
    fog: '#f3d3c6',
    tint: [0.97, 0.87, 0.86],
    glow: 0.25,
    sun: { az: 95, elev: 7, color: '#ffc27a', size: 46, alpha: 1 },
    moon: { alpha: 0 },
    stars: 0.12,
  },
  day: {
    gradient: 'linear-gradient(#6db3ff 0%, #9fd0ff 55%, #d9efff 100%)',
    fog: '#d9efff',
    tint: [1, 1, 1],
    glow: 0,
    sun: { az: 215, elev: 52, color: '#ffe066', size: 34, alpha: 1 },
    moon: { alpha: 0 },
    stars: 0,
  },
  sunset: {
    gradient: 'linear-gradient(#34468f 0%, #e7866a 58%, #ffcd86 100%)',
    fog: '#efb58f',
    tint: [1, 0.8, 0.68],
    glow: 0.5,
    sun: { az: 285, elev: 5, color: '#ff8a4a', size: 52, alpha: 1 },
    moon: { alpha: 0.25 },
    stars: 0.2,
  },
  night: {
    gradient: 'linear-gradient(#050920 0%, #121e48 60%, #253666 100%)',
    fog: '#1b2950',
    tint: [0.34, 0.4, 0.66],
    glow: 1,
    sun: { az: 285, elev: -20, color: '#ff8a4a', size: 40, alpha: 0 },
    moon: { alpha: 1 },
    stars: 1,
  },
};

const DIST = 300;
const EASE = 1.4;

export class SkyView {
  time: TimeOfDay = 'day';
  private readonly layers = new Map<TimeOfDay, HTMLDivElement>();
  private readonly sun: THREE.Sprite;
  private readonly moon: THREE.Sprite;
  private readonly stars: THREE.Points<THREE.BufferGeometry, THREE.PointsMaterial>;
  private readonly cur = { tint: new THREE.Color(1, 1, 1), fog: new THREE.Color(), glow: 0, az: 215, elev: 52, sunSize: 34, sunAlpha: 1, moonAlpha: 0, stars: 0, sunColor: new THREE.Color('#ffe066') };

  constructor(
    private readonly scene: THREE.Scene,
    host: HTMLElement,
  ) {
    const wrap = document.createElement('div');
    wrap.className = 'sky';
    for (const t of TIMES_OF_DAY) {
      const layer = document.createElement('div');
      layer.className = `sky-layer sky-${t}`;
      layer.style.background = PALETTES[t].gradient;
      layer.style.opacity = t === 'day' ? '1' : '0';
      wrap.appendChild(layer);
      this.layers.set(t, layer);
    }
    host.prepend(wrap);
    this.sun = new THREE.Sprite(new THREE.SpriteMaterial({ map: sunTexture(), fog: false, depthWrite: false, transparent: true }));
    this.moon = new THREE.Sprite(new THREE.SpriteMaterial({ map: moonTexture(), fog: false, depthWrite: false, transparent: true }));
    this.sun.renderOrder = this.moon.renderOrder = -5;
    this.stars = makeStars();
    scene.add(this.sun, this.moon, this.stars);
    this.cur.fog.set(PALETTES.day.fog);
    this.set('day', true);
  }

  set(time: TimeOfDay, instant = false): void {
    this.time = time;
    for (const [t, el] of this.layers) {
      el.style.transition = instant ? 'none' : 'opacity 2.4s ease';
      el.style.opacity = t === time ? '1' : '0';
    }
    if (instant) this.update(100, new THREE.Vector3());
  }

  /** Ease toward the current time's palette and keep the far-away things centred on the camera. */
  update(dt: number, camPos: THREE.Vector3): void {
    const p = PALETTES[this.time];
    const k = 1 - Math.exp(-dt * EASE);
    const c = this.cur;
    c.tint.lerp(new THREE.Color(p.tint[0], p.tint[1], p.tint[2]), k);
    c.fog.lerp(new THREE.Color(p.fog), k);
    c.glow += (p.glow - c.glow) * k;
    c.az += (shortest(c.az, p.sun.az)) * k;
    c.elev += (p.sun.elev - c.elev) * k;
    c.sunSize += (p.sun.size - c.sunSize) * k;
    c.sunAlpha += (p.sun.alpha - c.sunAlpha) * k;
    c.moonAlpha += (p.moon.alpha - c.moonAlpha) * k;
    c.stars += (p.stars - c.stars) * k;
    c.sunColor.lerp(new THREE.Color(p.sun.color), k);

    LIGHT.tint.value.copy(c.tint);
    LIGHT.glow.value = c.glow;
    if (this.scene.fog) (this.scene.fog as THREE.Fog).color.copy(c.fog);

    const dir = (az: number, elev: number) => {
      const a = (az * Math.PI) / 180;
      const e = (elev * Math.PI) / 180;
      return new THREE.Vector3(Math.sin(a) * Math.cos(e), Math.sin(e), -Math.cos(a) * Math.cos(e));
    };
    this.sun.position.copy(camPos).addScaledVector(dir(c.az, c.elev), DIST);
    this.sun.scale.setScalar(c.sunSize);
    this.sun.material.opacity = c.sunAlpha;
    this.sun.material.color.copy(c.sunColor);
    this.sun.visible = c.sunAlpha > 0.02;
    this.moon.position.copy(camPos).addScaledVector(dir(130, 38), DIST);
    this.moon.scale.setScalar(26);
    this.moon.material.opacity = c.moonAlpha;
    this.moon.visible = c.moonAlpha > 0.02;
    this.stars.position.copy(camPos);
    this.stars.material.opacity = c.stars;
    this.stars.visible = c.stars > 0.02;
  }

  /** 0 by day, 1 at night: how lit lamps and windows are. */
  get glow(): number {
    return this.cur.glow;
  }
}

function shortest(from: number, to: number): number {
  let d = (to - from) % 360;
  if (d > 180) d -= 360;
  if (d < -180) d += 360;
  return d;
}

function makeStars(): THREE.Points<THREE.BufferGeometry, THREE.PointsMaterial> {
  const n = 420;
  const pos = new Float32Array(n * 3);
  let s = 12345;
  const r = () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
  for (let i = 0; i < n; i++) {
    const a = r() * Math.PI * 2;
    const e = Math.asin(0.08 + r() * 0.92);
    pos[i * 3] = Math.cos(a) * Math.cos(e) * DIST * 1.05;
    pos[i * 3 + 1] = Math.sin(e) * DIST * 1.05;
    pos[i * 3 + 2] = Math.sin(a) * Math.cos(e) * DIST * 1.05;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({ color: '#fff8dc', size: 2.6, sizeAttenuation: false, transparent: true, opacity: 0, fog: false, depthWrite: false });
  const pts = new THREE.Points(geo, mat);
  pts.renderOrder = -6;
  pts.frustumCulled = false;
  return pts;
}

function canvasTexture(draw: (ctx: CanvasRenderingContext2D, s: number) => void): THREE.CanvasTexture {
  const s = 256;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = s;
  const ctx = canvas.getContext('2d')!;
  draw(ctx, s);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** A paper sun: a white disc and rays (tinted by the material colour) with ink outlines and crayon streaks. */
function sunTexture(): THREE.CanvasTexture {
  return canvasTexture((ctx, s) => {
    const c = s / 2;
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#2b2b2b';
    ctx.lineWidth = 6;
    const rays = 12;
    for (let i = 0; i < rays; i++) {
      const a = (i / rays) * Math.PI * 2;
      const w = 0.17;
      ctx.beginPath();
      ctx.moveTo(c + Math.cos(a - w) * 66, c + Math.sin(a - w) * 66);
      ctx.lineTo(c + Math.cos(a) * 118, c + Math.sin(a) * 118);
      ctx.lineTo(c + Math.cos(a + w) * 66, c + Math.sin(a + w) * 66);
      ctx.closePath();
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(c, c, 72, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.lineWidth = 7;
    ctx.stroke();
    ctx.save();
    ctx.clip();
    ctx.strokeStyle = 'rgba(200,120,0,0.18)';
    ctx.lineWidth = 5;
    for (let i = 0; i < 40; i++) {
      const x = c - 80 + ((i * 37) % 160);
      const y = c - 80 + ((i * 53) % 160);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 26, y - 18);
      ctx.stroke();
    }
    ctx.restore();
  });
}

/** A crescent moon with an ink outline. */
function moonTexture(): THREE.CanvasTexture {
  return canvasTexture((ctx, s) => {
    const c = s / 2;
    ctx.beginPath();
    ctx.arc(c, c, 92, 0, Math.PI * 2);
    ctx.arc(c + 44, c - 26, 80, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.fillStyle = '#fff4c2';
    ctx.fill('evenodd');
    ctx.lineWidth = 7;
    ctx.strokeStyle = '#2b2b2b';
    ctx.stroke();
  });
}

/** Soft warm halo for lamps at night (additive). */
export function haloTexture(): THREE.CanvasTexture {
  return canvasTexture((ctx, s) => {
    const g = ctx.createRadialGradient(s / 2, s / 2, 4, s / 2, s / 2, s / 2);
    g.addColorStop(0, 'rgba(255,236,170,0.95)');
    g.addColorStop(0.25, 'rgba(255,214,120,0.45)');
    g.addColorStop(1, 'rgba(255,200,100,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, s, s);
  });
}
