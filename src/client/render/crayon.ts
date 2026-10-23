/**
 * One shared crayon grain: waxy diagonal strokes that skip the paper tooth, tileable, drawn once. Everything
 * coloured in by code (structures, ground, origami trees) multiplies its colour by this at a fixed CRAYON_METRES
 * world size, so a hut and a castle have the same grain, and scaling a thing never stretches it.
 */
import * as THREE from 'three';

export const CRAYON_METRES = 2;
const SIZE = 512;

function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Draw the crayon grain into a context of size s (tileable: strokes wrap). `strength` is how dark the streaks get. */
export function drawCrayonGrain(ctx: CanvasRenderingContext2D, s: number, seed = 7, strength = 1, light = 1): void {
  const r = rng(seed);
  ctx.save();
  ctx.lineCap = 'round';
  // layer 1: long waxy strokes, mostly one direction like real colouring
  const stroke = (count: number, len: [number, number], width: [number, number], alpha: number, angle: number, lightStroke: boolean) => {
    for (let i = 0; i < count; i++) {
      const x = r() * s;
      const y = r() * s;
      const l = len[0] + r() * (len[1] - len[0]);
      const a = angle + (r() - 0.5) * 0.3;
      const w = width[0] + r() * (width[1] - width[0]);
      const al = alpha * (0.4 + r() * 0.8) * (lightStroke ? light : strength);
      ctx.strokeStyle = lightStroke ? `rgba(255,255,255,${al.toFixed(3)})` : `rgba(45,35,25,${al.toFixed(3)})`;
      ctx.lineWidth = w;
      for (const [ox, oy] of [[0, 0], [-s, 0], [s, 0], [0, -s], [0, s], [-s, -s], [s, s], [-s, s], [s, -s]]) {
        ctx.beginPath();
        ctx.moveTo(x + ox, y + oy);
        ctx.lineTo(x + ox + Math.cos(a) * l, y + oy + Math.sin(a) * l);
        ctx.stroke();
      }
    }
  };
  stroke(260, [30, 110], [2, 6], 0.11, -0.75, false);
  stroke(120, [20, 70], [2, 5], 0.08, -0.75 + 1.5, false);
  stroke(220, [20, 80], [2, 5], 0.16, -0.75, true);
  // layer 2: paper tooth, tiny light speckles where the wax skipped
  for (let i = 0; i < 2600 * Math.min(1, light); i++) {
    ctx.fillStyle = `rgba(255,255,255,${((0.12 + r() * 0.3) * Math.min(1, light)).toFixed(3)})`;
    ctx.fillRect(r() * s, r() * s, 1 + r() * 2, 1 + r() * 2);
  }
  for (let i = 0; i < 700; i++) {
    ctx.fillStyle = `rgba(40,30,20,${(0.05 + r() * 0.12).toFixed(3)})`;
    ctx.fillRect(r() * s, r() * s, 1, 1 + r() * 2);
  }
  ctx.restore();
}

let shared: THREE.Texture | null = null;

/** The shared tiling grain texture (light grey-white multiply map). */
export function crayonTexture(): THREE.Texture {
  if (shared) return shared;
  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#f4f1ea';
  ctx.fillRect(0, 0, SIZE, SIZE);
  drawCrayonGrain(ctx, SIZE, 7, 1);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 4;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  shared = tex;
  return tex;
}

/**
 * Multiply a material's colour by the crayon grain, sampled from the metre-based UVs at CRAYON_METRES, divided by
 * `scaleOf()` (the object's current uniform scale) so a scaled-up thing keeps the same grain size.
 */
export function applyCrayon(mat: THREE.MeshBasicMaterial, scaleOf: () => number, mix = 1): void {
  const uScale = { value: 1 / CRAYON_METRES };
  const uMix = { value: mix };
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uCrayon = { value: crayonTexture() };
    shader.uniforms.uCrayonScale = uScale;
    shader.uniforms.uCrayonMix = uMix;
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <map_pars_fragment>', '#include <map_pars_fragment>\nuniform sampler2D uCrayon;\nuniform float uCrayonScale;\nuniform float uCrayonMix;')
      .replace('#include <map_fragment>', '#include <map_fragment>\n{\n  vec3 grain = texture2D(uCrayon, vMapUv * uCrayonScale).rgb;\n  diffuseColor.rgb *= mix(vec3(1.0), grain, uCrayonMix);\n}');
  };
  mat.customProgramCacheKey = () => 'crayon';
  mat.userData.crayonUpdate = () => {
    uScale.value = scaleOf() / CRAYON_METRES;
  };
}
