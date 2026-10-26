/**
 * Time-of-day lighting for unlit (MeshBasic) materials: every tinted material multiplies its colour by one shared
 * tint before fog, so night is a single uniform change. Glowing materials (windows, lamps) instead blend toward a
 * warm light colour as night falls, so they read as lit from inside.
 */
import * as THREE from 'three';

export const LIGHT = {
  tint: { value: new THREE.Color(1, 1, 1) },
  glowColor: { value: new THREE.Color(1, 0.86, 0.52) },
  /** 0 by day, 1 at night. */
  glow: { value: 0 },
};

type Shader = THREE.WebGLProgramParametersWithUniforms;

/** Inject the tint (and glow) into a compiled shader; call from an onBeforeCompile. */
export function injectTint(shader: Shader, glow = false, glowLevel: { value: number } = LIGHT.glow): void {
  shader.uniforms.uTint = LIGHT.tint;
  if (glow) {
    shader.uniforms.uGlowColor = LIGHT.glowColor;
    shader.uniforms.uGlow = glowLevel;
  }
  const head = glow ? 'uniform vec3 uTint;\nuniform vec3 uGlowColor;\nuniform float uGlow;\n' : 'uniform vec3 uTint;\n';
  const body = glow
    ? 'gl_FragColor.rgb = mix(gl_FragColor.rgb * uTint, gl_FragColor.rgb * 0.35 + uGlowColor * 0.85, uGlow);\n'
    : 'gl_FragColor.rgb *= uTint;\n';
  shader.fragmentShader = head + shader.fragmentShader.replace('#include <fog_fragment>', body + '#include <fog_fragment>');
}

/**
 * Make a material follow the time of day. `glow` = lit from inside at night; `glowLevel` gives it a level of its
 * own instead of the shared night one (a lamp that can be switched off). Chains onto other shader hooks.
 */
export function tinted<T extends THREE.Material>(m: T, glow = false, glowLevel?: { value: number }): T {
  chainShaderHook(m, glow ? 'tint-glow' : 'tint', (shader) => injectTint(shader, glow, glowLevel));
  return m;
}

/**
 * Add an onBeforeCompile step without dropping one already set (the crayon grain and the night tint both edit
 * the same shaders), and fold its name into the program cache key.
 */
export function chainShaderHook(m: THREE.Material, key: string, hook: (shader: Shader) => void): void {
  const prev = m.userData.shaderHooks as Array<{ key: string; hook: (shader: Shader) => void }> | undefined;
  const hooks = [...(prev ?? []), { key, hook }];
  m.userData.shaderHooks = hooks;
  m.onBeforeCompile = (shader) => {
    for (const h of hooks) h.hook(shader);
  };
  const cacheKey = hooks.map((h) => h.key).join('+');
  m.customProgramCacheKey = () => cacheKey;
}
