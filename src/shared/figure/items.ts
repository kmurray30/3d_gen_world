/**
 * The sample set: 27 things drawn by code. People and animals come from the kits; props are short hand-written
 * part lists. `figureFor(word)` maps vocabulary words (and a few synonyms) to these.
 */
import type { Figure, Vec3 } from './types';
import { Parts, bird, dragon, figure, person, quadruped, shadeHex } from './kit';
import { catalog } from './catalog/index';

const SKIN = { light: '#f6d2b4', fair: '#f0c39f', tan: '#d9a173', brown: '#a8714a', deep: '#7a4b2e' };

const builders: Record<string, () => Figure> = {
  /* ---------- people ---------- */
  man: () =>
    person('man', { height: 1.75, skin: SKIN.fair, hair: '#5a3a22', hairStyle: 'short', shirt: '#4f8fd6', pants: '#3d4f7a', shoes: '#5a3a22', beard: '#5a3a22' }),
  woman: () =>
    person('woman', { height: 1.66, skin: SKIN.tan, hair: '#7a3b1e', hairStyle: 'long', shirt: '#e86f7d', pants: '#5b3f8c', skirt: '#7b58b8', legs: SKIN.tan, shoes: '#3b2a4a', blush: '#e88a80' }),
  boy: () =>
    person('boy', { height: 1.38, headScale: 1.2, skin: SKIN.light, hair: '#3b2a1e', hairStyle: 'spiky', shirt: '#55b05f', pants: '#4a6fa5', shoes: '#d9482b' }),
  girl: () =>
    person('girl', { height: 1.36, headScale: 1.22, skin: SKIN.brown, hair: '#2a1d16', hairStyle: 'pigtails', shirt: '#fdf6e8', skirt: '#ef6f9a', legs: SKIN.brown, pants: '#ef6f9a', shoes: '#c43d5c', blush: '#d9706a' }),
  knight: () =>
    person('knight', {
      height: 1.78,
      skin: SKIN.fair,
      hair: '#8f969e',
      hairStyle: 'none',
      shirt: '#b8c0c8',
      pants: '#9aa3ad',
      shoes: '#6c747d',
      longSleeves: true,
      build: 1.12,
      extras: (p, d) => {
        // helmet: a steel dome over the head with the face open, a red plume, and a blue tabard over the armour
        p.add({ name: 'helmet', parent: 'head', at: [0, 0, 0], shape: 'ball', size: [d.headW * 1.12, d.headH * 1.08, d.headD * 1.04], off: [0, d.headY + d.headH * 0.08, -d.headD * 0.13], color: '#a9b2bb', layer: -1 });
        p.add({ name: 'brow', parent: 'head', at: [0, 0, 0], shape: 'box', size: [d.headW * 1.1, d.headH * 0.2, d.headD * 0.9], off: [0, d.headY + d.headH * 0.36, d.headD * 0.12], round: 0.8, color: '#c3cad1', layer: 2 });
        p.add({ name: 'plume', parent: 'head', at: [0, d.headY + d.headH * 0.55, -d.headD * 0.1], rot: [-25, 0, 0], shape: 'capsule', size: [d.headW * 0.28, d.headH * 0.7, d.headW * 0.5], off: [0, d.headH * 0.25, 0], color: '#d6453a', layer: -2 });
        p.add({ name: 'tabard', parent: 'torso', at: [0, 0, 0], shape: 'box', size: [d.tw * 0.7, d.torsoH * 1.05, d.td * 1.08], off: [0, d.torsoH * 0.46, 0], round: 0.3, color: '#3f6fb5', layer: 1 });
        p.add({ name: 'belt', parent: 'hips', at: [0, 0, 0], shape: 'box', size: [d.tw * 1.02, d.lw * 0.45, d.td * 1.05], off: [0, d.lw * 0.3, 0], round: 0.5, color: '#6b4a2a', layer: 2 });
        p.pair({ name: 'pauldron', parent: 'torso', at: [d.tw * 0.52, d.torsoH * 0.92, 0], shape: 'ball', size: [d.aw * 2.1, d.aw * 1.4, d.td * 1.1], color: '#c3cad1', layer: 2 });
        // sword in the right hand (blade up), shield on the left forearm facing out front
        p.add({ name: 'sword', parent: 'handR', at: [0, -d.aw * 0.2, d.aw * 0.25], rot: [150, 0, 0], shape: 'box', size: [d.aw * 0.55, d.H * 0.42, d.aw * 0.15], off: [0, d.H * 0.24, 0], color: '#dfe5ea', layer: 2 });
        p.add({ name: 'guard', parent: 'handR', at: [0, -d.aw * 0.2, d.aw * 0.25], rot: [150, 0, 0], shape: 'box', size: [d.aw * 2.2, d.aw * 0.35, d.aw * 0.4], off: [0, d.aw * 0.5, 0], color: '#d4a537', layer: 3 });
        p.add({ name: 'shield', parent: 'foreL', at: [d.aw * 0.4, -d.lower * 0.45, d.aw * 0.5], shape: 'cyl', segs: 6, size: [d.H * 0.27, d.aw * 0.35, d.H * 0.3], srot: [90, 0, 0], color: '#3f6fb5', layer: 3 });
        p.add({ name: 'boss', parent: 'foreL', at: [d.aw * 0.4, -d.lower * 0.45, d.aw * 0.5 + d.aw * 0.25], shape: 'ball', size: [d.H * 0.07, d.H * 0.07, d.aw * 0.4], color: '#d4a537', layer: 4 });
      },
    }),

  /* ---------- animals ---------- */
  dog: () =>
    quadruped('dog', { color: '#d9a35f', belly: '#f3dcb5', body: [0.56, 0.28, 0.24], legL: 0.2, legW: 0.085, neckL: 0.1, neckLean: 30, head: [0.25, 0.22, 0.21], snout: { len: 0.13, h: 0.1, w: 0.12, color: '#f0d3a6' }, ears: 'floppy', earSize: 0.15, earColor: '#9a6535', tail: 'fluffy', tailAngle: 40 }),
  cat: () =>
    quadruped('cat', { color: '#8f9099', belly: '#e9e6e2', body: [0.42, 0.17, 0.15], legL: 0.13, legW: 0.055, neckL: 0.05, neckLean: 25, head: [0.17, 0.15, 0.17], snout: { len: 0.04, h: 0.05, w: 0.08, color: '#efe9e4' }, nose: '#e88a9a', ears: 'pointy', earSize: 0.08, tail: 'long', tailAngle: 25, extras: (p, d) => {
      for (const [i, z] of [[0, 0.1], [1, -0.02], [2, -0.14]] as const) p.pair({ name: `stripe${i}`, parent: 'body', at: [d.body[2] * 0.44, d.body[1] * 0.18, z], shape: 'ball', size: [0.012, 0.09, 0.035], color: '#5f6068', layer: 2, noInk: true });
    } }),
  horse: () =>
    quadruped('horse', { color: '#9b6440', body: [1.25, 0.58, 0.42], legL: 0.78, legW: 0.12, hoof: '#3a2c22', hoofH: 0.1, neckL: 0.55, neckLean: 32, neckW: 0.28, head: [0.52, 0.26, 0.24], snout: { len: 0.24, h: 0.2, w: 0.2, color: '#86543a' }, ears: 'pointy', earSize: 0.14, tail: 'long', tailColor: '#3a2a20', tailAngle: 140, extras: (p) => {
      p.add({ name: 'mane', parent: 'neck', at: [0, 0.05, -0.12], rot: [-6, 0, 0], shape: 'capsule', size: [0.08, 0.7, 0.14], off: [0, 0.3, 0], color: '#3a2a20', layer: -1 });
      p.add({ name: 'forelock', parent: 'head', at: [0, 0.18, 0.02], shape: 'ball', size: [0.1, 0.12, 0.14], color: '#3a2a20', layer: 3 });
      p.add({ name: 'blaze', parent: 'head', at: [0, 0.05, 0.25], shape: 'ball', size: [0.06, 0.08, 0.2], color: '#f1e6d6', layer: 4, noInk: true });
    } }),
  cow: () =>
    quadruped('cow', { color: '#f5f1e8', body: [1.3, 0.66, 0.56], bodyShape: 'box', legL: 0.6, legW: 0.14, hoof: '#4a3a30', hoofH: 0.09, neckL: 0.18, neckLean: 60, neckW: 0.34, head: [0.4, 0.34, 0.3], snout: { len: 0.14, h: 0.2, w: 0.27, color: '#f2b8b0', shape: 'box' }, nose: '#c9787a', ears: 'side', earSize: 0.17, tail: 'tuft', tailColor: '#2b2622', extras: (p) => {
      const spots: Array<[number, number, number, number]> = [[0.29, 0.1, 0.3, 0.32], [0.29, -0.05, -0.25, 0.4], [-0.29, 0.08, 0.05, 0.36], [0.29, 0.18, -0.02, 0.18]];
      spots.forEach(([x, y, z, s], i) => p.add({ name: `spot${i}`, parent: 'body', at: [x, y, z], shape: 'ball', size: [0.03, s * 0.7, s], color: '#2b2622', layer: 2, noInk: true }));
      p.add({ name: 'headSpot', parent: 'head', at: [0.12, 0.12, 0.02], shape: 'ball', size: [0.03, 0.16, 0.18], color: '#2b2622', layer: 4, noInk: true });
      p.pair({ name: 'horn', parent: 'head', at: [0.13, 0.22, -0.02], rot: [0, 0, -40], shape: 'cyl', taper: 0, size: [0.06, 0.13, 0.06], off: [0, 0.05, 0], color: '#efe6c8', layer: 1 });
      p.add({ name: 'udder', parent: 'body', at: [0, -0.33, -0.25], shape: 'ball', size: [0.22, 0.14, 0.24], color: '#f2b8b0', layer: -1 });
    } }),
  pig: () =>
    quadruped('pig', { color: '#f7b9bf', body: [0.82, 0.48, 0.46], bodyShape: 'ball', legL: 0.17, legW: 0.11, hoof: '#c97f88', hoofH: 0.05, neckL: 0.04, neckLean: 70, neckW: 0.3, head: [0.3, 0.3, 0.32], snout: { len: 0.1, h: 0.13, w: 0.15, color: '#f394a2', shape: 'cyl' }, nose: '#c45f70', ears: 'floppy', earSize: 0.12, earColor: '#f19aa6', tail: 'curl' }),
  sheep: () =>
    quadruped('sheep', { color: '#f6f2e6', body: [0.78, 0.52, 0.5], bodyShape: 'ball', legL: 0.26, legW: 0.07, legColor: '#3a3330', hoof: '#221d1b', hoofH: 0.05, neckL: 0.08, neckLean: 50, neckW: 0.22, headColor: '#3a3330', head: [0.26, 0.2, 0.18], snout: { len: 0.06, h: 0.11, w: 0.12, color: '#3a3330' }, nose: '#1a1615', ears: 'side', earSize: 0.11, tail: 'stub', extras: (p) => {
      const puffs: Vec3[] = [[0.2, 0.2, 0.25], [-0.2, 0.2, 0.25], [0.22, 0.22, -0.15], [-0.22, 0.22, -0.15], [0, 0.27, 0.05], [0.25, 0.02, 0.05], [-0.25, 0.02, 0.05], [0, 0.18, 0.35], [0, 0.2, -0.33]];
      puffs.forEach((at, i) => p.add({ name: `wool${i}`, parent: 'body', at, shape: 'ball', size: [0.26, 0.24, 0.26], color: i % 2 ? '#fbf8ef' : '#f1ecdc', layer: at[0] > 0 ? 1 : -1 }));
      p.add({ name: 'topknot', parent: 'head', at: [0, 0.12, -0.02], shape: 'ball', size: [0.16, 0.1, 0.14], color: '#f6f2e6', layer: 3 });
    } }),
  rooster: () => bird('rooster', { height: 0.62, color: '#c8572e', wing: '#8a3b22', beak: '#f2b134', legs: '#f2b134', comb: '#e63b2e', tail: ['#1f4a3a', '#2c6e52', '#173a2d', '#2c6e52'] }),

  /* ---------- fantasy ---------- */
  dragon: () => dragon('dragon', { size: 1.9, scales: '#3f9a6e', belly: '#f2d58a', wing: '#e0634a', spikes: '#f2a33a', horns: '#f6ecd2' }),

  /* ---------- nature ---------- */
  tree: () => {
    const p = new Parts();
    p.add({ name: 'trunk', at: [0, 0, 0], shape: 'cyl', taper: 0.65, segs: 9, size: [0.5, 2.3, 0.5], off: [0, 1.15, 0], color: '#8a5a35' });
    p.add({ name: 'branch', parent: 'trunk', at: [0.12, 1.6, 0], rot: [0, 0, -45], shape: 'cyl', taper: 0.5, segs: 6, size: [0.16, 0.7, 0.16], off: [0, 0.3, 0], color: '#8a5a35' });
    p.add({ name: 'top', parent: 'trunk', at: [0, 2.2, 0], shape: 'ball', size: [2.5, 2.1, 2.3], off: [0, 1.0, 0], color: '#5aa553' });
    const puffs: Array<[Vec3, Vec3, string]> = [
      [[-0.95, 0.65, 0.35], [1.4, 1.3, 1.3], '#4f9a4a'],
      [[0.95, 0.75, 0.3], [1.5, 1.35, 1.35], '#63b05b'],
      [[-0.3, 1.75, 0.2], [1.5, 1.3, 1.4], '#6dba63'],
      [[0.55, 1.6, -0.35], [1.3, 1.2, 1.2], '#559f4f'],
      [[0.1, 0.55, 0.8], [1.2, 1.0, 1.0], '#5aa553'],
    ];
    puffs.forEach(([at, size, color], i) => p.add({ name: `leaves${i}`, parent: 'top', at, shape: 'ball', size, color, layer: Math.round(at[2] * 3) }));
    return { ...figure('tree', 'nature', 'prop', 'front', p), paperCross: true };
  },
  'pine tree': () => {
    const p = new Parts();
    p.add({ name: 'trunk', at: [0, 0, 0], shape: 'cyl', taper: 0.8, segs: 8, size: [0.36, 1.0, 0.36], off: [0, 0.5, 0], color: '#7a4f30' });
    p.add({ name: 'top', parent: 'trunk', at: [0, 0.8, 0], shape: 'cyl', taper: 0, segs: 10, size: [2.4, 1.9, 2.4], off: [0, 0.95, 0], color: '#2f7a4f' });
    p.add({ name: 'mid', parent: 'top', at: [0, 1.2, 0], shape: 'cyl', taper: 0, segs: 10, size: [1.9, 1.7, 1.9], off: [0, 0.85, 0], color: '#378a58', layer: 1 });
    p.add({ name: 'tip', parent: 'mid', at: [0, 1.1, 0], shape: 'cyl', taper: 0, segs: 10, size: [1.35, 1.5, 1.35], off: [0, 0.75, 0], color: '#3f9862', layer: 2 });
    return { ...figure('pine tree', 'nature', 'prop', 'front', p), paperCross: true };
  },
  bush: () => {
    const p = new Parts();
    p.add({ name: 'top', at: [0, 0, 0], shape: 'ball', size: [1.0, 0.8, 0.9], off: [0, 0.42, 0], color: '#4f9a4a' });
    const puffs: Array<[Vec3, number, string]> = [[[-0.45, 0.35, 0.1], 0.65, '#5aa553'], [[0.45, 0.33, 0.1], 0.7, '#63b05b'], [[0, 0.68, 0.05], 0.62, '#6dba63'], [[0.05, 0.3, 0.38], 0.55, '#559f4f']];
    puffs.forEach(([at, s, color], i) => p.add({ name: `puff${i}`, parent: 'top', at, shape: 'ball', size: [s, s * 0.85, s], color, layer: Math.round(at[2] * 5) }));
    for (const [i, at] of ([[-0.25, 0.55, 0.42], [0.3, 0.45, 0.43], [0.05, 0.75, 0.33]] as Vec3[]).entries()) p.add({ name: `berry${i}`, parent: 'top', at, shape: 'ball', size: [0.09, 0.09, 0.09], color: '#d93a4a', layer: 4 });
    return { ...figure('bush', 'nature', 'prop', 'front', p), paperCross: true };
  },
  flower: () => {
    const p = new Parts();
    p.add({ name: 'stem', at: [0, 0, 0], shape: 'capsule', size: [0.03, 0.42, 0.03], off: [0, 0.2, 0], color: '#4f9a4a' });
    p.pair({ name: 'leaf', parent: 'stem', at: [0.0, 0.14, 0], rot: [0, 0, -55], shape: 'ball', size: [0.06, 0.15, 0.02], off: [0, 0.07, 0], color: '#5aa553', layer: -1 });
    p.add({ name: 'head', parent: 'stem', at: [0, 0.4, 0], shape: 'ball', size: [0.09, 0.09, 0.06], color: '#f6c445', layer: 3 });
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * 360;
      p.add({ name: `petal${i}`, parent: 'head', at: [0, 0, -0.005], rot: [0, 0, a], shape: 'ball', size: [0.07, 0.12, 0.025], off: [0, 0.07, 0], color: i % 2 ? '#f07aa0' : '#f48fb1', layer: 1 });
    }
    return { ...figure('flower', 'nature', 'prop', 'front', p), paperCross: true };
  },
  rock: () => {
    const p = new Parts();
    p.add({ name: 'rock', at: [0, 0, 0], shape: 'ball', size: [0.9, 0.55, 0.75], off: [0, 0.27, 0], color: '#9c9a94' });
    p.add({ name: 'rock2', at: [0.38, 0, 0.1], shape: 'ball', size: [0.5, 0.35, 0.45], off: [0, 0.17, 0], color: '#8a8883', layer: 1 });
    p.add({ name: 'rock3', at: [-0.3, 0.35, 0.05], shape: 'ball', size: [0.42, 0.3, 0.4], off: [0, 0.08, 0], color: '#aaa8a2', layer: 1 });
    p.add({ name: 'moss', at: [-0.1, 0.48, 0.12], shape: 'ball', size: [0.3, 0.1, 0.3], color: '#7fae5a', layer: 2, noInk: true });
    return { ...figure('rock', 'nature', 'prop', 'front', p), paperCross: true };
  },

  /* ---------- village ---------- */
  house: () => {
    const p = new Parts();
    const W = 3.2, H = 2.4, D = 2.6;
    p.add({ name: 'walls', at: [0, 0, 0], shape: 'box', size: [W, H, D], off: [0, H / 2, 0], round: 0.04, color: '#f3e2c0' });
    p.add({ name: 'roof', parent: 'walls', at: [0, H, 0], shape: 'wedge', size: [W + 0.6, 1.5, D + 0.5], off: [0, 0.75, 0], color: '#c9573c', layer: 1 });
    p.add({ name: 'chimney', parent: 'walls', at: [W * 0.28, H + 0.6, -0.3], shape: 'box', size: [0.4, 1.3, 0.4], off: [0, 0.4, 0], color: '#a8563f', layer: 0 });
    // the door hangs from its left edge so the 'door' clip can swing it open
    p.add({ name: 'doorway', parent: 'walls', at: [-0.55, 0, D / 2 - 0.01], shape: 'box', size: [0.8, 1.55, 0.04], off: [0, 0.78, 0], color: '#3b2a1e', layer: 1, noInk: true });
    p.add({ name: 'door', parent: 'walls', at: [-0.95, 0, D / 2 + 0.03], shape: 'box', size: [0.8, 1.55, 0.08], off: [0.4, 0.78, 0], round: 0.2, color: '#8a5a35', layer: 2 });
    p.add({ name: 'knob', parent: 'door', at: [0.68, 0.8, 0.06], shape: 'ball', size: [0.08, 0.08, 0.06], color: '#e8c05a', layer: 3 });
    p.add({ name: 'window', parent: 'walls', at: [0.75, 1.35, D / 2], shape: 'box', size: [0.85, 0.75, 0.08], round: 0.15, color: '#9fd3f2', layer: 2 });
    p.add({ name: 'frameH', parent: 'window', at: [0, 0, 0.05], shape: 'box', size: [0.85, 0.06, 0.04], color: '#fdf6e8', layer: 3, noInk: true });
    p.add({ name: 'frameV', parent: 'window', at: [0, 0, 0.05], shape: 'box', size: [0.06, 0.75, 0.04], color: '#fdf6e8', layer: 3, noInk: true });
    p.add({ name: 'sill', parent: 'window', at: [0, -0.42, 0.06], shape: 'box', size: [1.0, 0.08, 0.16], color: '#fdf6e8', layer: 3 });
    p.add({ name: 'step', parent: 'walls', at: [-0.55, 0, D / 2 + 0.2], shape: 'box', size: [1.1, 0.14, 0.4], off: [0, 0.07, 0], color: '#a7a7a0', layer: 3 });
    return figure('house', 'village', 'prop', 'front', p);
  },
  well: () => {
    const p = new Parts();
    p.add({ name: 'base', at: [0, 0, 0], shape: 'cyl', segs: 10, size: [1.3, 0.75, 1.3], off: [0, 0.375, 0], color: '#a7a7a0' });
    p.add({ name: 'rim', parent: 'base', at: [0, 0.75, 0], shape: 'cyl', segs: 10, size: [1.42, 0.12, 1.42], color: '#bdbdb6', layer: 1 });
    p.add({ name: 'water', parent: 'base', at: [0, 0.8, 0], shape: 'cyl', segs: 10, size: [1.1, 0.02, 1.1], color: '#4f8fd6', only: 'toon', noInk: true });
    p.pair({ name: 'post', parent: 'base', at: [0.58, 0.75, 0], shape: 'box', size: [0.12, 1.3, 0.12], off: [0, 0.65, 0], color: '#8a5a35', layer: 2 });
    p.add({ name: 'roof', parent: 'base', at: [0, 2.0, 0], shape: 'wedge', size: [1.75, 0.65, 1.3], off: [0, 0.3, 0], color: '#b4553c', layer: 3 });
    p.add({ name: 'crank', parent: 'base', at: [0, 1.65, 0], shape: 'cyl', size: [0.1, 1.25, 0.1], srot: [0, 0, 90], color: '#6b4a2a', layer: 2 });
    p.add({ name: 'handle', parent: 'crank', at: [0.7, 0, 0], shape: 'box', size: [0.06, 0.28, 0.06], off: [0, -0.1, 0], color: '#6b4a2a', layer: 3 });
    p.add({ name: 'rope', parent: 'base', at: [0, 1.65, 0], shape: 'cyl', size: [0.025, 0.55, 0.025], off: [0, -0.3, 0], color: '#d9c28f', layer: 1, noInk: true });
    p.add({ name: 'bucket', parent: 'base', at: [0, 1.05, 0], shape: 'cyl', taper: 1.25, segs: 10, size: [0.26, 0.24, 0.26], off: [0, -0.1, 0], color: '#8a6440', layer: 2 });
    return figure('well', 'village', 'prop', 'front', p);
  },
  fence: () => {
    const p = new Parts();
    p.add({ name: 'root', at: [0, 0, 0], shape: 'box', size: [0.02, 0.02, 0.02], color: '#c8955a', only: 'toon', noInk: true });
    for (let i = 0; i < 4; i++) {
      const x = -1.2 + i * 0.8;
      p.add({ name: `post${i}`, parent: 'root', at: [x, 0, 0], shape: 'box', size: [0.16, 1.0, 0.1], off: [0, 0.5, 0], color: i % 2 ? '#c8955a' : '#d3a066', layer: 1 });
      p.add({ name: `cap${i}`, parent: `post${i}`, at: [0, 1.0, 0], shape: 'cyl', taper: 0, segs: 4, size: [0.2, 0.18, 0.13], off: [0, 0.09, 0], color: i % 2 ? '#c8955a' : '#d3a066', layer: 1 });
    }
    for (const [i, y] of [[0, 0.35], [1, 0.75]] as const) p.add({ name: `rail${i}`, parent: 'root', at: [0, y, -0.07], shape: 'box', size: [2.7, 0.12, 0.05], color: '#b07d48', layer: 0 });
    return figure('fence', 'village', 'prop', 'front', p);
  },
  barrel: () => {
    const p = new Parts();
    // two tapered halves meeting under the middle hoop make the bulge
    p.add({ name: 'body', at: [0, 0, 0], shape: 'cyl', segs: 14, taper: 1.13, size: [0.6, 0.43, 0.6], off: [0, 0.215, 0], color: '#b0703f' });
    p.add({ name: 'upper', parent: 'body', at: [0, 0.43, 0], shape: 'cyl', segs: 14, taper: 0.885, size: [0.68, 0.43, 0.68], off: [0, 0.215, 0], color: '#b0703f' });
    for (const [i, y] of [[0, 0.12], [1, 0.43], [2, 0.74]] as const) p.add({ name: `hoop${i}`, parent: 'body', at: [0, y, 0], shape: 'torus', tube: 0.08, size: [y === 0.43 ? 0.71 : 0.65, y === 0.43 ? 0.71 : 0.65, 0.05], srot: [90, 0, 0], color: '#5a4a3a', layer: 1 });
    p.add({ name: 'lid', parent: 'body', at: [0, 0.86, 0], shape: 'cyl', segs: 14, size: [0.56, 0.03, 0.56], color: '#9a6038', layer: 1 });
    return { ...figure('barrel', 'village', 'prop', 'front', p), paperCross: true };
  },
  wheelbarrow: () => {
    const p = new Parts();
    p.add({ name: 'tray', at: [0, 0.42, 0.05], rot: [6, 0, 0], shape: 'cyl', taper: 1.45, segs: 4, size: [0.5, 0.3, 0.75], color: '#4f8f5a' });
    p.add({ name: 'wheel', at: [0, 0.2, 0.5], shape: 'torus', tube: 0.3, size: [0.4, 0.4, 0.08], srot: [0, 90, 0], color: '#3a3330' });
    p.add({ name: 'hub', parent: 'wheel', at: [0, 0, 0], shape: 'cyl', size: [0.1, 0.1, 0.1], srot: [0, 0, 90], color: '#c9c3b8', layer: 1 });
    p.pair({ name: 'handle', at: [0.2, 0.42, -0.35], rot: [-75, 0, 0], shape: 'capsule', size: [0.05, 0.85, 0.05], off: [0, 0.3, 0], color: '#8a5a35', layer: 1 });
    p.pair({ name: 'stand', at: [0.18, 0, -0.25], shape: 'box', size: [0.05, 0.36, 0.05], off: [0, 0.18, 0], color: '#3a3330', layer: 1 });
    return figure('wheelbarrow', 'village', 'prop', 'side', p);
  },
  lamppost: () => {
    const p = new Parts();
    p.add({ name: 'base', at: [0, 0, 0], shape: 'cyl', segs: 8, taper: 0.7, size: [0.36, 0.3, 0.36], off: [0, 0.15, 0], color: '#3d4a52' });
    p.add({ name: 'pole', parent: 'base', at: [0, 0.3, 0], shape: 'cyl', segs: 8, taper: 0.8, size: [0.14, 2.5, 0.14], off: [0, 1.25, 0], color: '#3d4a52' });
    p.add({ name: 'lamp', parent: 'pole', at: [0, 2.5, 0], shape: 'cyl', segs: 4, taper: 1.3, size: [0.34, 0.42, 0.34], off: [0, 0.22, 0], color: '#ffe9a0', role: 'glow', layer: 1 });
    p.add({ name: 'cap', parent: 'lamp', at: [0, 0.44, 0], shape: 'cyl', segs: 4, taper: 0, size: [0.56, 0.3, 0.56], off: [0, 0.14, 0], color: '#2f3a40', layer: 2 });
    p.add({ name: 'finial', parent: 'cap', at: [0, 0.3, 0], shape: 'ball', size: [0.08, 0.08, 0.08], color: '#2f3a40', layer: 2 });
    return { ...figure('lamppost', 'village', 'prop', 'front', p), paperCross: true };
  },

  /* ---------- things ---------- */
  bench: () => {
    const p = new Parts();
    p.add({ name: 'seat', at: [0, 0.42, 0], shape: 'box', size: [1.6, 0.07, 0.42], round: 0.3, color: '#b5814e' });
    p.add({ name: 'back', parent: 'seat', at: [0, 0.05, -0.2], rot: [-10, 0, 0], shape: 'box', size: [1.6, 0.36, 0.06], off: [0, 0.24, 0], round: 0.3, color: '#a97545', layer: -1 });
    for (const [i, x] of [[0, -0.65], [1, 0.65]] as const) {
      p.add({ name: `leg${i}`, parent: 'seat', at: [x, 0, 0.12], shape: 'box', size: [0.07, 0.42, 0.07], off: [0, -0.21, 0], color: '#3d4a52', layer: 1 });
      p.add({ name: `legB${i}`, parent: 'seat', at: [x, 0, -0.14], shape: 'box', size: [0.07, 0.42, 0.07], off: [0, -0.21, 0], color: '#3d4a52', layer: -1 });
    }
    return figure('bench', 'things', 'prop', 'front', p);
  },
  table: () => {
    const p = new Parts();
    p.add({ name: 'top', at: [0, 0.72, 0], shape: 'box', size: [1.4, 0.08, 0.9], round: 0.3, color: '#b5814e' });
    for (const [i, x, z] of [[0, -0.6, 0.36], [1, 0.6, 0.36], [2, -0.6, -0.36], [3, 0.6, -0.36]] as const)
      p.add({ name: `leg${i}`, parent: 'top', at: [x, 0, z], shape: 'box', size: [0.08, 0.72, 0.08], off: [0, -0.36, 0], color: '#9a6a3c', layer: z > 0 ? 1 : -1 });
    return figure('table', 'things', 'prop', 'front', p);
  },
  apple: () => {
    const p = new Parts();
    p.add({ name: 'apple', at: [0, 0, 0], shape: 'ball', size: [0.095, 0.088, 0.095], off: [0, 0.044, 0], color: '#d93a3a' });
    p.add({ name: 'shine', parent: 'apple', at: [-0.022, 0.06, 0.03], shape: 'ball', size: [0.018, 0.026, 0.012], color: '#f7a19a', layer: 2, noInk: true });
    p.add({ name: 'stem', parent: 'apple', at: [0, 0.085, 0], rot: [0, 0, 10], shape: 'capsule', size: [0.008, 0.03, 0.008], off: [0, 0.012, 0], color: '#6b4a2a', layer: 1 });
    p.add({ name: 'leaf', parent: 'apple', at: [0.006, 0.092, 0], rot: [0, 0, -60], shape: 'ball', size: [0.018, 0.04, 0.008], off: [0, 0.018, 0], color: '#5aa553', layer: 2 });
    return figure('apple', 'things', 'prop', 'front', p);
  },
  sword: () => {
    const p = new Parts();
    p.add({ name: 'blade', at: [0, 0.08, 0], shape: 'box', size: [0.07, 0.62, 0.014], off: [0, 0.31, 0], color: '#dfe5ea' });
    p.add({ name: 'tip', parent: 'blade', at: [0, 0, 0], rot: [0, 0, 180], shape: 'cyl', taper: 0, segs: 4, size: [0.07, 0.1, 0.014], off: [0, 0.04, 0], srot: [0, 45, 0], color: '#dfe5ea' });
    p.add({ name: 'fuller', parent: 'blade', at: [0, 0.32, 0.008], shape: 'box', size: [0.012, 0.5, 0.004], color: '#b9c2ca', layer: 1, noInk: true });
    p.add({ name: 'guard', parent: 'blade', at: [0, 0.64, 0], shape: 'box', size: [0.24, 0.04, 0.05], round: 0.6, color: '#d4a537', layer: 1 });
    p.add({ name: 'grip', parent: 'blade', at: [0, 0.66, 0], shape: 'cyl', size: [0.035, 0.15, 0.035], off: [0, 0.075, 0], color: '#6b4a2a' });
    p.add({ name: 'pommel', parent: 'blade', at: [0, 0.83, 0], shape: 'ball', size: [0.055, 0.055, 0.055], color: '#d4a537', layer: 1 });
    return figure('sword', 'things', 'prop', 'front', p);
  },
};

/** Synonyms that should use one of the sample figures. */
const ALIASES: Record<string, string> = {
  chicken: 'rooster',
  hen: 'rooster',
  cart: 'wheelbarrow',
  'lamp post': 'lamppost',
  'street lamp': 'lamppost',
  streetlight: 'lamppost',
  puppy: 'dog',
  wyvern: 'dragon',
  'baby dragon': 'dragon',
  kitten: 'cat',
  pony: 'horse',
  stone: 'rock',
  boulder: 'rock',
  shrub: 'bush',
  pine: 'pine tree',
  'fir tree': 'pine tree',
  'oak tree': 'tree',
  oak: 'tree',
  cottage: 'house',
  lady: 'woman',
  gentleman: 'man',
  guy: 'man',
};

export const FIGURE_KEYS = Object.keys(builders);
const cache = new Map<string, Figure>();

export function getFigure(key: string): Figure | null {
  const hit = cache.get(key);
  if (hit) return hit;
  const b = builders[key] ?? catalog().get(key)?.f;
  if (!b) return null;
  let f: Figure;
  try {
    f = b();
  } catch {
    return null;
  }
  // a broken entry (non-finite size) falls back to the word's sprite or card rather than poisoning layout and rendering
  if (![f.heightM, f.halfW, f.halfD].every((v) => Number.isFinite(v) && v > 0)) return null;
  // the catalog builds figures under their own word; make sure the key matches what was asked for
  if (f.key !== key) f = { ...f, key };
  cache.set(key, f);
  return f;
}

/** Every word that has a figure: the hand-made samples and the catalog. */
export function figureKeys(): string[] {
  return [...new Set([...Object.keys(builders), ...catalog().keys()])];
}

/** The sample figure for a vocabulary word, or null. */
export function figureFor(word: string): Figure | null {
  const w = word.toLowerCase().trim().replace(/^(a|an|the)\s+/, '');
  return getFigure(w) ?? (ALIASES[w] ? getFigure(ALIASES[w]) : null);
}

export { shadeHex };
