/**
 * Accessories for people and animals, so a pirate is one line:
 *   who('pirate', { top: 'white', bottom: 'black', beard: 'black', acc: [hat('pirate'), face('eyepatch'), held('sword')] })
 * Every helper returns an Extra: a function that adds parts to a person (or animal) in its own joint frames.
 */
import { measure } from './math';
import type { Figure, Vec3 } from './types';
import { Parts, person, quadruped, type HairStyle, type PersonDims, type PersonOpts, type QuadOpts } from './kit';
import { col } from './colors';

export type Extra = (p: Parts, d: PersonDims) => void;
const R = (v: number) => Math.round(v * 1000) / 1000;
let uid = 0;
const nm = (base: string) => `${base}_${uid++}`;

/* ----- hats and headwear ----- */

export type HatKind = 'cap' | 'top' | 'crown' | 'helmet' | 'hard' | 'cowboy' | 'wizard' | 'beanie' | 'chef' | 'beret' | 'bowler' | 'sombrero' | 'tiara' | 'headband' | 'hood' | 'halo' | 'pirate' | 'fez' | 'grad' | 'police' | 'turban' | 'bandana' | 'santa' | 'party' | 'viking' | 'astronaut' | 'nurse' | 'flower' | 'bow' | 'horns' | 'catears' | 'bunnyears' | 'antennae' | 'military' | 'straw' | 'jester' | 'veil' | 'headphones' | 'mohawk' | 'afro';

export function hat(kind: HatKind, color?: string): Extra {
  return (p, d) => {
    const top = d.headY + d.headH * 0.42;
    const W = d.headW, Hh = d.headH, D = d.headD;
    const c = col(color, '#3a3a3a');
    const add = (shape: Parameters<Parts['add']>[0]['shape'], size: Vec3, at: Vec3, o: Partial<Parameters<Parts['add']>[0]> = {}) =>
      p.add({ name: nm(`hat_${kind}`), parent: 'head', at, shape, size, color: c, layer: 3, ...o });
    switch (kind) {
      case 'cap':
        add('ball', [W * 1.08, Hh * 0.5, D * 1.04], [0, top - Hh * 0.08, 0]);
        add('cyl', [W * 0.8, Hh * 0.04, D * 0.55], [0, top - Hh * 0.2, D * 0.42], { layer: 4 });
        break;
      case 'top':
        add('cyl', [W * 1.5, Hh * 0.05, D * 1.4], [0, top, 0]);
        add('cyl', [W * 0.85, Hh * 0.75, D * 0.8], [0, top + Hh * 0.38, 0]);
        add('cyl', [W * 0.87, Hh * 0.1, D * 0.82], [0, top + Hh * 0.08, 0], { color: col('red') });
        break;
      case 'crown':
        add('cyl', [W * 0.9, Hh * 0.22, D * 0.85], [0, top + Hh * 0.05, 0], { color: c === '#3a3a3a' ? col('gold') : c });
        for (let i = 0; i < 5; i++) {
          const a = (i / 5) * Math.PI * 2;
          add('cyl', [W * 0.14, Hh * 0.2, W * 0.14], [Math.sin(a) * W * 0.4, top + Hh * 0.25, Math.cos(a) * D * 0.4], { taper: 0, segs: 4, color: c === '#3a3a3a' ? col('gold') : c });
        }
        add('ball', [W * 0.1, W * 0.1, W * 0.1], [0, top + Hh * 0.08, D * 0.43], { color: col('red'), layer: 5 });
        break;
      case 'helmet':
      case 'hard':
      case 'military':
        add('ball', [W * 1.15, Hh * 0.7, D * 1.12], [0, top - Hh * 0.05, -D * 0.02], { color: kind === 'hard' && !color ? col('yellow') : kind === 'military' && !color ? col('olive') : c });
        add('cyl', [W * 1.3, Hh * 0.04, D * 1.25], [0, top - Hh * 0.22, 0], { color: kind === 'hard' && !color ? col('yellow') : kind === 'military' && !color ? col('olive') : c });
        break;
      case 'cowboy':
      case 'straw':
      case 'sombrero': {
        const cc = color ? c : kind === 'cowboy' ? col('brown') : kind === 'straw' ? col('#e8cf7a') : col('#e0b95a');
        const brim = kind === 'sombrero' ? 2.6 : 1.8;
        add('cyl', [W * brim, Hh * 0.05, D * brim], [0, top - Hh * 0.04, 0], { color: cc });
        add(kind === 'sombrero' ? 'cyl' : 'ball', [W * 0.8, Hh * (kind === 'sombrero' ? 0.6 : 0.45), D * 0.75], [0, top + Hh * 0.18, 0], { color: cc, taper: 0.5 });
        break;
      }
      case 'wizard':
      case 'party':
      case 'santa':
      case 'jester': {
        const cc = color ? c : kind === 'santa' ? col('red') : kind === 'party' ? col('magenta') : col('purple');
        if (kind === 'wizard') add('cyl', [W * 1.7, Hh * 0.05, D * 1.6], [0, top - Hh * 0.04, 0], { color: cc });
        add('cyl', [W * (kind === 'party' ? 0.5 : 0.95), Hh * (kind === 'party' ? 0.6 : 0.95), D * (kind === 'party' ? 0.5 : 0.9)], [0, top + Hh * (kind === 'party' ? 0.3 : 0.42), kind === 'santa' ? -D * 0.1 : 0], { taper: 0, color: cc, srot: kind === 'santa' ? [-25, 0, 0] : undefined });
        if (kind === 'santa') add('torus', [W * 1.0, W * 1.0, Hh * 0.12], [0, top - Hh * 0.03, 0], { color: col('white'), srot: [90, 0, 0], tube: 0.25 });
        if (kind === 'santa' || kind === 'party' || kind === 'jester') add('ball', [W * 0.18, W * 0.18, W * 0.18], [0, top + Hh * (kind === 'party' ? 0.62 : 0.85), kind === 'santa' ? -D * 0.45 : 0], { color: col(kind === 'party' ? 'yellow' : 'white') });
        break;
      }
      case 'beanie':
        add('ball', [W * 1.08, Hh * 0.62, D * 1.05], [0, top - Hh * 0.02, 0]);
        add('ball', [W * 0.22, W * 0.22, W * 0.22], [0, top + Hh * 0.3, 0]);
        break;
      case 'chef':
        add('cyl', [W * 0.95, Hh * 0.3, D * 0.9], [0, top + Hh * 0.05, 0], { color: col(color ?? 'white') });
        add('ball', [W * 1.3, Hh * 0.55, D * 1.2], [0, top + Hh * 0.38, 0], { color: col(color ?? 'white') });
        break;
      case 'beret':
        add('ball', [W * 1.2, Hh * 0.28, D * 1.1], [W * 0.08, top + Hh * 0.02, 0], { srot: [0, 0, -10] });
        break;
      case 'bowler':
        add('cyl', [W * 1.35, Hh * 0.04, D * 1.3], [0, top - Hh * 0.04, 0]);
        add('ball', [W * 0.95, Hh * 0.55, D * 0.9], [0, top + Hh * 0.08, 0]);
        break;
      case 'tiara':
        add('torus', [W * 0.9, W * 0.9, Hh * 0.06], [0, top - Hh * 0.05, D * 0.05], { color: col(color ?? 'silver'), srot: [80, 0, 0], tube: 0.15 });
        add('cyl', [W * 0.2, Hh * 0.2, W * 0.08], [0, top + Hh * 0.04, D * 0.4], { taper: 0, segs: 4, color: col(color ?? 'silver') });
        break;
      case 'headband':
      case 'bandana':
        add('torus', [W * 1.06, D * 1.02, Hh * 0.14], [0, top - Hh * 0.22, 0], { srot: [90, 0, 0], tube: 0.18, color: col(color ?? 'red') });
        if (kind === 'bandana') add('ball', [W * 0.2, W * 0.12, W * 0.25], [0, top - Hh * 0.25, -D * 0.52], { color: col(color ?? 'red') });
        break;
      case 'hood':
        add('ball', [W * 1.25, Hh * 1.15, D * 1.2], [0, d.headY + Hh * 0.04, -D * 0.1], { color: col(color ?? 'brown'), layer: -2 });
        break;
      case 'halo':
        add('torus', [W * 0.9, W * 0.9, Hh * 0.05], [0, top + Hh * 0.28, 0], { srot: [90, 0, 0], tube: 0.18, color: col(color ?? 'gold'), role: 'glow', noInk: true });
        break;
      case 'pirate':
        add('wedge', [W * 1.7, Hh * 0.5, D * 0.9], [0, top + Hh * 0.12, 0], { color: col(color ?? 'black') });
        add('ball', [W * 0.18, W * 0.18, W * 0.04], [0, top + Hh * 0.12, D * 0.46], { color: col('white'), layer: 5, noInk: true });
        break;
      case 'fez':
        add('cyl', [W * 0.75, Hh * 0.35, D * 0.7], [0, top + Hh * 0.1, 0], { taper: 0.8, color: col(color ?? 'red') });
        break;
      case 'grad':
        add('cyl', [W * 0.95, Hh * 0.18, D * 0.9], [0, top, 0], { color: col(color ?? 'black') });
        add('box', [W * 1.5, Hh * 0.04, W * 1.5], [0, top + Hh * 0.1, 0], { color: col(color ?? 'black'), srot: [0, 45, 0] });
        add('capsule', [W * 0.04, Hh * 0.4, W * 0.04], [W * 0.5, top - Hh * 0.05, 0], { color: col('gold') });
        break;
      case 'police':
      case 'nurse':
        add('cyl', [W * 1.0, Hh * 0.3, D * 1.0], [0, top + Hh * 0.06, -D * 0.04], { taper: kind === 'police' ? 1.15 : 1, color: col(color ?? (kind === 'police' ? 'navy' : 'white')) });
        if (kind === 'police') add('cyl', [W * 0.8, Hh * 0.04, D * 0.5], [0, top - Hh * 0.08, D * 0.42], { color: col('black'), layer: 4 });
        else add('box', [W * 0.18, W * 0.18, W * 0.03], [0, top + Hh * 0.1, D * 0.5], { color: col('red'), layer: 5 });
        break;
      case 'turban':
        add('ball', [W * 1.25, Hh * 0.75, D * 1.2], [0, top + Hh * 0.05, 0], { color: col(color ?? 'white') });
        break;
      case 'viking':
        add('ball', [W * 1.12, Hh * 0.62, D * 1.1], [0, top - Hh * 0.04, 0], { color: col(color ?? 'steel') });
        for (const s of [1, -1]) add('cyl', [W * 0.18, Hh * 0.55, W * 0.18], [s * W * 0.62, top + Hh * 0.12, 0], { taper: 0, color: col('cream'), srot: [0, 0, -s * 45] });
        break;
      case 'astronaut':
        add('ball', [W * 1.45, Hh * 1.35, D * 1.45], [0, d.headY + Hh * 0.04, 0], { color: col(color ?? 'white'), layer: -2 });
        add('ball', [W * 1.0, Hh * 0.75, D * 0.3], [0, d.headY, D * 0.58], { color: col('#2b3f66'), layer: 6 });
        break;
      case 'flower':
        add('ball', [W * 0.3, W * 0.3, W * 0.12], [W * 0.42, top - Hh * 0.05, D * 0.15], { color: col(color ?? 'pink') });
        add('ball', [W * 0.12, W * 0.12, W * 0.12], [W * 0.42, top - Hh * 0.05, D * 0.22], { color: col('yellow'), layer: 5 });
        break;
      case 'bow':
        for (const s of [1, -1]) add('ball', [W * 0.3, W * 0.22, W * 0.12], [s * W * 0.17, top + Hh * 0.02, -D * 0.1], { color: col(color ?? 'pink'), srot: [0, 0, s * 20] });
        add('ball', [W * 0.12, W * 0.12, W * 0.12], [0, top + Hh * 0.02, -D * 0.08], { color: col(color ?? 'pink') });
        break;
      case 'horns':
        for (const s of [1, -1]) add('cyl', [W * 0.16, Hh * 0.35, W * 0.16], [s * W * 0.3, top + Hh * 0.05, 0], { taper: 0, color: col(color ?? 'red'), srot: [0, 0, -s * 25] });
        break;
      case 'catears':
      case 'bunnyears':
        for (const s of [1, -1]) add(kind === 'catears' ? 'cyl' : 'capsule', kind === 'catears' ? [W * 0.3, Hh * 0.3, W * 0.12] : [W * 0.2, Hh * 0.8, W * 0.08], [s * W * 0.28, top + Hh * (kind === 'catears' ? 0.08 : 0.35), 0], { taper: kind === 'catears' ? 0 : undefined, segs: kind === 'catears' ? 3 : undefined, color: col(color ?? 'white'), srot: [0, 0, -s * 15] });
        break;
      case 'antennae':
        for (const s of [1, -1]) {
          add('capsule', [W * 0.04, Hh * 0.5, W * 0.04], [s * W * 0.18, top + Hh * 0.22, 0], { color: col(color ?? 'black'), srot: [0, 0, -s * 20] });
          add('ball', [W * 0.12, W * 0.12, W * 0.12], [s * W * 0.27, top + Hh * 0.46, 0], { color: col(color ?? 'black') });
        }
        break;
      case 'veil':
        add('ball', [W * 1.3, Hh * 1.3, D * 0.5], [0, d.headY - Hh * 0.2, -D * 0.35], { color: col(color ?? 'white'), layer: -3 });
        break;
      case 'headphones':
        add('torus', [W * 1.2, Hh * 1.0, W * 0.1], [0, d.headY + Hh * 0.1, 0], { tube: 0.08, color: c });
        for (const s of [1, -1]) add('cyl', [W * 0.3, W * 0.12, W * 0.3], [s * W * 0.55, d.headY, 0], { color: c, srot: [0, 0, 90] });
        break;
      case 'mohawk':
        add('wedge', [W * 0.18, Hh * 0.35, D * 1.0], [0, top + Hh * 0.12, -D * 0.05], { color: col(color ?? 'magenta') });
        break;
      case 'afro':
        // a big round mass behind and above the face (not in front of it)
        add('ball', [W * 1.6, Hh * 1.3, D * 1.35], [0, d.headY + Hh * 0.2, -D * 0.28], { color: col(color ?? 'darkbrown'), layer: -2 });
        break;
    }
  };
}

/* ----- face ----- */

export type FaceKind = 'beard' | 'mustache' | 'glasses' | 'sunglasses' | 'eyepatch' | 'mask' | 'clownnose' | 'goggles' | 'monocle' | 'longbeard' | 'snorkel';

export function face(kind: FaceKind, color?: string): Extra {
  return (p, d) => {
    const W = d.headW, Hh = d.headH, D = d.headD, y = d.headY;
    const add = (shape: Parameters<Parts['add']>[0]['shape'], size: Vec3, at: Vec3, o: Partial<Parameters<Parts['add']>[0]> = {}) =>
      p.add({ name: nm(`face_${kind}`), parent: 'head', at, shape, size, color: col(color, '#3a2a20'), layer: 5, ...o });
    switch (kind) {
      case 'beard':
        add('ball', [W * 0.8, Hh * 0.45, D * 0.5], [0, y - Hh * 0.32, D * 0.25]);
        break;
      case 'longbeard':
        add('capsule', [W * 0.7, Hh * 0.95, D * 0.35], [0, y - Hh * 0.55, D * 0.28], { color: col(color ?? 'white') });
        break;
      case 'mustache':
        for (const s of [1, -1]) add('ball', [W * 0.26, Hh * 0.08, D * 0.1], [s * W * 0.12, y - Hh * 0.14, D * 0.47], { srot: [0, 0, s * 12] });
        break;
      case 'glasses':
      case 'sunglasses':
      case 'goggles':
        for (const s of [1, -1])
          add(kind === 'sunglasses' ? 'ball' : 'torus', kind === 'sunglasses' ? [W * 0.28, Hh * 0.16, W * 0.05] : [W * 0.3, W * 0.3, W * 0.05], [s * W * 0.2, y + Hh * 0.04, D * 0.48], { color: col(color ?? (kind === 'goggles' ? 'teal' : 'black')), tube: 0.2, noInk: kind !== 'goggles' });
        add('capsule', [W * 0.03, W * 0.14, W * 0.03], [0, y + Hh * 0.05, D * 0.5], { srot: [0, 0, 90], color: col(color ?? 'black') });
        break;
      case 'monocle':
        add('torus', [W * 0.3, W * 0.3, W * 0.04], [W * 0.2, y + Hh * 0.04, D * 0.48], { color: col(color ?? 'gold'), tube: 0.18 });
        break;
      case 'eyepatch':
        add('ball', [W * 0.25, Hh * 0.22, W * 0.06], [-W * 0.2, y + Hh * 0.05, D * 0.47], { color: col(color ?? 'black'), noInk: true });
        add('torus', [W * 1.05, D * 1.0, Hh * 0.04], [0, y + Hh * 0.15, 0], { srot: [90, 0, 12], tube: 0.04, color: col(color ?? 'black') });
        break;
      case 'mask':
        add('ball', [W * 0.75, Hh * 0.38, D * 0.25], [0, y - Hh * 0.18, D * 0.42], { color: col(color ?? 'skyblue') });
        break;
      case 'clownnose':
        add('ball', [W * 0.2, W * 0.2, W * 0.2], [0, y - Hh * 0.05, D * 0.52], { color: col(color ?? 'red') });
        break;
      case 'snorkel':
        add('capsule', [W * 0.08, Hh * 0.9, W * 0.08], [W * 0.45, y + Hh * 0.3, D * 0.1], { color: col(color ?? 'orange') });
        break;
    }
  };
}

/* ----- clothing and body ----- */

export type WearKind = 'cape' | 'apron' | 'coat' | 'labcoat' | 'robe' | 'vest' | 'tie' | 'bowtie' | 'belt' | 'backpack' | 'scarf' | 'necklace' | 'badge' | 'armor' | 'tutu' | 'overalls' | 'lifejacket' | 'suit' | 'sash' | 'toga' | 'tool belt' | 'medal' | 'stethoscope' | 'whistle' | 'cloak';

export function wear(kind: WearKind, color?: string): Extra {
  return (p, d) => {
    const { tw, td, torsoH, legLen, lw } = d;
    const add = (parent: string, shape: Parameters<Parts['add']>[0]['shape'], size: Vec3, at: Vec3, o: Partial<Parameters<Parts['add']>[0]> = {}) =>
      p.add({ name: nm(`wear_${kind}`), parent, at, shape, size, color: col(color, '#c33a3a'), layer: 2, ...o });
    switch (kind) {
      case 'cape':
      case 'cloak':
        add('torso', 'box', [tw * 1.15, torsoH + legLen * 0.75, td * 0.25], [0, torsoH - (torsoH + legLen * 0.75) / 2, -td * 0.6], { layer: -3, round: 0.3, taper: 1 });
        break;
      case 'apron':
        add('torso', 'box', [tw * 0.8, torsoH * 0.6 + legLen * 0.4, td * 0.12], [0, torsoH * 0.55 - (torsoH * 0.6 + legLen * 0.4) / 2, td * 0.55], { color: col(color ?? 'white'), round: 0.3 });
        break;
      case 'coat':
      case 'labcoat':
      case 'robe':
      case 'toga':
        add('hips', 'cyl', [tw * 1.45, legLen * (kind === 'robe' || kind === 'toga' ? 0.95 : 0.6), td * 1.6], [0, -legLen * (kind === 'robe' || kind === 'toga' ? 0.45 : 0.28), 0], { taper: 0.75, color: col(color ?? (kind === 'labcoat' ? 'white' : kind === 'toga' ? 'white' : 'brown')), layer: 1 });
        add('torso', 'box', [tw * 1.06, torsoH * 1.02, td * 1.08], [0, torsoH * 0.5, 0], { color: col(color ?? (kind === 'labcoat' ? 'white' : kind === 'toga' ? 'white' : 'brown')), round: 0.5, layer: 1 });
        break;
      case 'vest':
      case 'lifejacket':
        add('torso', 'box', [tw * 1.06, torsoH * 0.85, td * 1.1], [0, torsoH * 0.52, 0], { color: col(color ?? (kind === 'lifejacket' ? 'orange' : 'darkbrown')), round: 0.5, layer: 1 });
        break;
      case 'suit':
        add('torso', 'box', [tw * 1.06, torsoH * 1.02, td * 1.08], [0, torsoH * 0.5, 0], { color: col(color ?? 'navy'), round: 0.5, layer: 1 });
        add('torso', 'box', [tw * 0.25, torsoH * 0.5, td * 0.1], [0, torsoH * 0.7, td * 0.52], { color: col('white'), layer: 3 });
        add('torso', 'box', [tw * 0.08, torsoH * 0.42, td * 0.08], [0, torsoH * 0.66, td * 0.58], { color: col('red'), layer: 4 });
        break;
      case 'tie':
        add('torso', 'box', [tw * 0.12, torsoH * 0.55, td * 0.08], [0, torsoH * 0.62, td * 0.53], { color: col(color ?? 'red'), layer: 4, round: 0.4 });
        break;
      case 'bowtie':
        for (const s of [1, -1]) add('torso', 'ball', [tw * 0.18, tw * 0.12, td * 0.1], [s * tw * 0.09, torsoH * 0.92, td * 0.52], { color: col(color ?? 'black'), layer: 4 });
        break;
      case 'belt':
      case 'tool belt':
        add('hips', 'box', [tw * 1.02, lw * 0.4, td * 1.05], [0, lw * 0.3, 0], { color: col(color ?? 'darkbrown'), layer: 3 });
        if (kind === 'tool belt') for (const s of [1, -1]) add('hips', 'box', [tw * 0.3, lw * 0.6, td * 0.3], [s * tw * 0.38, 0, td * 0.45], { color: col(color ?? 'brown'), layer: 4 });
        break;
      case 'backpack':
        add('torso', 'box', [tw * 0.8, torsoH * 0.75, td * 0.6], [0, torsoH * 0.5, -td * 0.75], { color: col(color ?? 'red'), layer: -2, round: 0.5 });
        break;
      case 'scarf':
        add('torso', 'torus', [tw * 0.75, tw * 0.75, td * 0.3], [0, torsoH * 0.98, 0], { srot: [90, 0, 0], tube: 0.35, color: col(color ?? 'red'), layer: 4 });
        add('torso', 'box', [tw * 0.15, torsoH * 0.45, td * 0.1], [tw * 0.15, torsoH * 0.72, td * 0.5], { color: col(color ?? 'red'), layer: 4 });
        break;
      case 'necklace':
      case 'medal':
      case 'whistle':
      case 'stethoscope':
        add('torso', 'torus', [tw * 0.62, tw * 0.62, td * 0.06], [0, torsoH * 0.88, td * 0.12], { srot: [70, 0, 0], tube: 0.08, color: col(color ?? (kind === 'stethoscope' ? 'darkgray' : kind === 'whistle' ? 'black' : 'gold')), layer: 4 });
        add('torso', 'ball', [tw * 0.16, tw * 0.16, td * 0.1], [0, torsoH * 0.68, td * 0.52], { color: col(kind === 'medal' ? 'gold' : kind === 'whistle' ? 'silver' : kind === 'stethoscope' ? 'silver' : color ?? 'gold'), layer: 5 });
        break;
      case 'badge':
        add('torso', 'cyl', [tw * 0.16, td * 0.06, tw * 0.16], [tw * 0.25, torsoH * 0.72, td * 0.52], { srot: [90, 0, 0], segs: 6, color: col(color ?? 'gold'), layer: 5 });
        break;
      case 'armor':
        add('torso', 'box', [tw * 1.12, torsoH * 0.9, td * 1.18], [0, torsoH * 0.52, 0], { color: col(color ?? 'steel'), round: 0.6, layer: 1 });
        for (const s of [1, -1]) add('torso', 'ball', [d.aw * 2.1, d.aw * 1.4, td * 1.1], [s * tw * 0.52, torsoH * 0.92, 0], { color: col(color ?? 'steel'), layer: 2 });
        break;
      case 'tutu':
        add('hips', 'cyl', [tw * 2.2, lw * 0.5, td * 2.6], [0, 0, 0], { taper: 0.5, color: col(color ?? 'pink'), layer: 2 });
        break;
      case 'overalls':
        add('torso', 'box', [tw * 0.8, torsoH * 0.5, td * 1.08], [0, torsoH * 0.28, 0], { color: col(color ?? 'denim'), layer: 1, round: 0.4 });
        break;
      case 'sash':
        add('torso', 'box', [tw * 0.2, torsoH * 1.2, td * 1.12], [0, torsoH * 0.5, 0], { srot: [0, 0, 35], color: col(color ?? 'red'), layer: 3 });
        break;
    }
  };
}

/* ----- wings and tails ----- */

export type BodyKind = 'angelwings' | 'batwings' | 'fairywings' | 'devitail' | 'cattail' | 'fishtail' | 'tail' | 'shell' | 'jetpack';

export function body(kind: BodyKind, color?: string): Extra {
  return (p, d) => {
    const { tw, td, torsoH, legLen } = d;
    const add = (parent: string, shape: Parameters<Parts['add']>[0]['shape'], size: Vec3, at: Vec3, o: Partial<Parameters<Parts['add']>[0]> = {}) =>
      p.add({ name: nm(`body_${kind}`), parent, at, shape, size, color: col(color, '#ffffff'), layer: -3, ...o });
    switch (kind) {
      case 'angelwings':
      case 'batwings':
      case 'fairywings':
        for (const s of [1, -1]) {
          const big = kind === 'fairywings' ? 0.8 : 1.2;
          add('torso', kind === 'batwings' ? 'wedge' : 'ball', kind === 'batwings' ? [tw * 1.6, torsoH * 1.1, td * 0.06] : [tw * 1.5 * big, torsoH * 1.25 * big, td * 0.12], [s * tw * 0.75, torsoH * 0.75, -td * 0.62], { color: col(color ?? (kind === 'batwings' ? 'black' : kind === 'fairywings' ? '#cdeefb' : 'white')), srot: [0, s * 20, -s * 20] });
        }
        break;
      case 'devitail':
      case 'cattail':
      case 'tail':
        add('hips', 'capsule', [tw * 0.12, legLen * 0.8, tw * 0.12], [0, -legLen * 0.15, -td * 0.7], { srot: [-40, 0, 0], color: col(color ?? (kind === 'devitail' ? 'red' : 'brown')) });
        if (kind === 'devitail') add('hips', 'cyl', [tw * 0.3, tw * 0.3, tw * 0.06], [0, -legLen * 0.48, -td * 0.95], { taper: 0, segs: 3, srot: [-130, 0, 0], color: col(color ?? 'red') });
        break;
      case 'fishtail':
        add('hips', 'cyl', [tw * 1.2, legLen * 0.95, td * 1.1], [0, -legLen * 0.5, 0], { taper: 0.4, color: col(color ?? 'teal'), layer: 2, srot: [180, 0, 0] });
        add('hips', 'wedge', [tw * 1.4, legLen * 0.3, td * 0.15], [0, -legLen * 0.95, td * 0.1], { color: col(color ?? 'teal'), srot: [180, 0, 0], layer: 2 });
        break;
      case 'shell':
        add('torso', 'ball', [tw * 1.3, torsoH * 1.1, td * 1.2], [0, torsoH * 0.5, -td * 0.45], { color: col(color ?? 'green') });
        break;
      case 'jetpack':
        for (const s of [1, -1]) add('torso', 'cyl', [tw * 0.3, torsoH * 0.8, tw * 0.3], [s * tw * 0.18, torsoH * 0.5, -td * 0.75], { color: col(color ?? 'silver') });
        break;
    }
  };
}

/* ----- held things ----- */

export type HeldKind = 'sword' | 'staff' | 'wand' | 'umbrella' | 'briefcase' | 'bag' | 'book' | 'mic' | 'flag' | 'hammer' | 'wrench' | 'cup' | 'phone' | 'ball' | 'basket' | 'torch' | 'shield' | 'clipboard' | 'paintbrush' | 'pitchfork' | 'broom' | 'spatula' | 'bat' | 'racket' | 'guitar' | 'camera' | 'lantern' | 'bouquet' | 'scroll' | 'axe' | 'spear' | 'trident' | 'bow' | 'fishing rod' | 'magnifier' | 'pan' | 'blaster' | 'cane' | 'shovel' | 'saw' | 'knife' | 'balloon' | 'baton' | 'drumsticks' | 'violin' | 'trumpet' | 'scissors' | 'syringe' | 'gavel' | 'pickaxe' | 'lasso' | 'net' | 'leash' | 'gift' | 'pizza' | 'icecream' | 'tray' | 'map' | 'compass' | 'whip' | 'club' | 'mop' | 'rake' | 'hose' | 'trophy' | 'sign' | 'letter' | 'skateboard' | 'surfboard' | 'chainsaw' | 'pointer';

/** Something in a hand. side 'R' (default) or 'L'. */
export function held(kind: HeldKind, color?: string, side: 'L' | 'R' = 'R'): Extra {
  return (p, d) => {
    const H = d.H, a = d.aw;
    const hand = `hand${side}`;
    const c = (fallback: string) => col(color ?? fallback);
    const add = (shape: Parameters<Parts['add']>[0]['shape'], size: Vec3, at: Vec3, o: Partial<Parameters<Parts['add']>[0]> = {}) =>
      p.add({ name: nm(`held_${kind.replace(/\s+/g, '_')}`), parent: hand, at, shape, size, color: c('#8a5a35'), layer: 4, ...o });
    // a long thing held upright through the fist, extending up `up` and down `down` metres
    const upright = (up: number, down: number, thick: number, colr: string) => add('capsule', [thick, up + down, thick], [0, (up - down) / 2, a * 0.35], { color: colr });
    // a thing pointing down and forward from the fist (carried at the side)
    const carried = (len: number, thick: number, colr: string, shape: 'box' | 'capsule' = 'capsule') => add(shape, [thick, len, thick * (shape === 'box' ? 0.25 : 1)], [0, -len * 0.45, a * 0.6], { color: colr, srot: [25, 0, 0] });
    const atHand: Vec3 = [0, -a * 0.6, a * 0.5];
    switch (kind) {
      case 'sword':
        carried(H * 0.42, a * 0.55, c('silver'), 'box');
        add('box', [a * 2, a * 0.3, a * 0.4], [0, -a * 0.2, a * 0.5], { color: col('gold') });
        break;
      case 'knife':
        carried(H * 0.12, a * 0.4, c('silver'), 'box');
        break;
      case 'staff':
      case 'spear':
      case 'trident':
      case 'pitchfork':
      case 'broom':
      case 'mop':
      case 'rake':
      case 'shovel':
      case 'flag':
      case 'torch':
      case 'cane':
      case 'net':
      case 'sign': {
        const tall = kind === 'cane' ? H * 0.45 : H * 0.95;
        upright(kind === 'cane' ? H * 0.02 : tall * 0.65, kind === 'cane' ? H * 0.43 : tall * 0.35, a * 0.32, c(kind === 'spear' || kind === 'trident' ? 'wood' : 'wood'));
        const tipY = kind === 'cane' ? H * 0.02 : tall * 0.65;
        if (kind === 'spear') add('cyl', [a * 0.7, a * 2.2, a * 0.2], [0, tipY + a, a * 0.35], { taper: 0, segs: 4, color: col('silver') });
        if (kind === 'trident' || kind === 'pitchfork') for (const x of [-1, 0, 1]) add('capsule', [a * 0.15, a * 2.2, a * 0.15], [x * a * 0.5, tipY + a, a * 0.35], { color: col(kind === 'trident' ? 'gold' : 'silver') });
        if (kind === 'staff') add('ball', [a * 1.2, a * 1.2, a * 1.2], [0, tipY + a * 0.4, a * 0.35], { color: col(color ? 'purple' : 'cyan'), role: 'glow' });
        if (kind === 'broom') add('cyl', [a * 1.6, a * 2.8, a * 0.7], [0, -tall * 0.35 - a, a * 0.35], { taper: 0.4, color: col('#d9b56a'), srot: [180, 0, 0] });
        if (kind === 'mop') add('ball', [a * 1.8, a * 1.5, a * 1.5], [0, -tall * 0.35 - a * 0.5, a * 0.35], { color: col('white') });
        if (kind === 'rake') add('box', [a * 3, a * 0.3, a * 0.6], [0, -tall * 0.35, a * 0.35], { color: col('iron') });
        if (kind === 'shovel') add('box', [a * 1.6, a * 2, a * 0.2], [0, -tall * 0.35 - a, a * 0.35], { color: col('iron'), round: 0.6 });
        if (kind === 'flag') add('box', [a * 5, a * 3.2, a * 0.1], [a * 2.6, tipY - a * 1.5, a * 0.35], { color: c('red') });
        if (kind === 'sign') add('box', [a * 6, a * 4, a * 0.2], [0, tipY, a * 0.35], { color: col('white') });
        if (kind === 'torch') add('cyl', [a * 0.9, a * 1.4, a * 0.9], [0, tipY + a * 0.5, a * 0.35], { taper: 0, color: col('fire'), role: 'glow', noInk: true });
        if (kind === 'net') add('torus', [a * 3, a * 3, a * 0.2], [0, tipY + a, a * 0.35], { color: col('white'), tube: 0.08 });
        if (kind === 'cane') add('torus', [a * 1.6, a * 1.6, a * 0.3], [a * 0.6, tipY, a * 0.35], { color: c('wood'), tube: 0.2 });
        break;
      }
      case 'wand':
      case 'baton':
      case 'pointer':
      case 'drumsticks':
      case 'paintbrush':
        add('capsule', [a * 0.15, H * 0.17, a * 0.15], [0, a * 0.3, a * 1.2], { srot: [60, 0, 0], color: c(kind === 'wand' ? 'black' : 'wood') });
        if (kind === 'wand') add('cyl', [a * 0.7, a * 0.7, a * 0.15], [0, a * 1.2, a * 2.4], { taper: 0, segs: 5, color: col('yellow'), role: 'glow' });
        break;
      case 'umbrella':
        upright(H * 0.5, a * 0.6, a * 0.2, col('black'));
        add('cyl', [H * 0.55, H * 0.15, H * 0.55], [0, H * 0.55, a * 0.35], { taper: 0, segs: 8, color: c('red') });
        break;
      case 'balloon':
        add('capsule', [a * 0.04, H * 0.5, a * 0.04], [0, H * 0.25, a * 0.35], { color: col('white'), noInk: true });
        add('ball', [H * 0.15, H * 0.18, H * 0.15], [0, H * 0.55, a * 0.35], { color: c('red') });
        break;
      case 'briefcase':
      case 'bag':
      case 'basket':
      case 'lantern':
      case 'gift':
        add(kind === 'basket' ? 'cyl' : 'box', kind === 'basket' ? [a * 3, a * 2, a * 2.2] : [a * 3.2, a * 2.4, a * 1.0], [0, -a * 2, a * 0.5], { color: c(kind === 'briefcase' ? 'darkbrown' : kind === 'basket' ? 'tan' : kind === 'lantern' ? 'flame' : kind === 'gift' ? 'red' : 'pink'), taper: kind === 'basket' ? 1.2 : undefined, role: kind === 'lantern' ? 'glow' : undefined });
        break;
      case 'book':
      case 'clipboard':
      case 'phone':
      case 'map':
      case 'letter':
      case 'scroll':
        add(kind === 'scroll' ? 'cyl' : 'box', kind === 'phone' ? [a * 1.0, a * 1.8, a * 0.2] : kind === 'scroll' ? [a * 0.8, a * 3, a * 0.8] : [a * 2.4, a * 3, a * 0.4], [0, -a * 0.4, a * 1.2], { color: c(kind === 'book' ? 'red' : kind === 'clipboard' ? 'wood' : kind === 'phone' ? 'black' : 'paper'), srot: kind === 'scroll' ? [0, 0, 90] : [-20, 0, 0] });
        break;
      case 'mic':
        add('capsule', [a * 0.35, a * 2, a * 0.35], [0, a * 0.4, a * 1.0], { srot: [-30, 0, 0], color: col('black') });
        add('ball', [a * 0.7, a * 0.7, a * 0.7], [0, a * 1.4, a * 1.5], { color: col('darkgray') });
        break;
      case 'cup':
      case 'trophy':
      case 'icecream':
        add('cyl', [a * 1.1, a * 1.4, a * 1.1], [0, a * 0.2, a * 1.0], { taper: kind === 'icecream' ? 0 : 1.15, srot: kind === 'icecream' ? [180, 0, 0] : undefined, color: c(kind === 'trophy' ? 'gold' : kind === 'icecream' ? 'tan' : 'white') });
        if (kind === 'icecream') add('ball', [a * 1.2, a * 1.2, a * 1.2], [0, a * 1.2, a * 1.0], { color: col('pink') });
        break;
      case 'ball':
        add('ball', [a * 2.6, a * 2.6, a * 2.6], [0, -a * 0.3, a * 1.4], { color: c('red') });
        break;
      case 'hammer':
      case 'axe':
      case 'pickaxe':
      case 'wrench':
      case 'club':
      case 'bat':
      case 'gavel':
        carried(H * (kind === 'bat' || kind === 'club' ? 0.45 : 0.3), a * (kind === 'club' ? 0.8 : 0.4), c(kind === 'wrench' ? 'steel' : 'wood'));
        if (kind === 'hammer' || kind === 'gavel') add('box', [a * 0.9, a * 1.8, a * 0.9], [0, -H * 0.28, a * 1.0], { color: col(kind === 'gavel' ? 'darkwood' : 'iron'), srot: [25, 0, 90] });
        if (kind === 'axe') add('wedge', [a * 1.8, a * 1.6, a * 0.25], [a * 0.8, -H * 0.27, a * 1.0], { color: col('silver'), srot: [25, 0, -90] });
        if (kind === 'pickaxe') add('capsule', [a * 0.4, a * 4, a * 0.4], [0, -H * 0.28, a * 1.0], { color: col('iron'), srot: [25, 0, 90] });
        break;
      case 'shield':
        add('cyl', [H * 0.28, a * 0.3, H * 0.3], [a * 0.6, -a * 0.6, a * 0.5], { srot: [90, 0, 90], segs: 6, color: c('navy') });
        break;
      case 'spatula':
      case 'pan':
      case 'racket':
      case 'magnifier':
        carried(H * 0.16, a * 0.3, col(kind === 'racket' ? 'white' : 'black'));
        add(kind === 'pan' ? 'cyl' : kind === 'magnifier' ? 'torus' : kind === 'racket' ? 'torus' : 'box', kind === 'pan' ? [a * 3, a * 0.5, a * 3] : kind === 'racket' ? [a * 2.6, a * 3.4, a * 0.25] : kind === 'magnifier' ? [a * 1.8, a * 1.8, a * 0.3] : [a * 1.6, a * 2, a * 0.15], [0, -H * 0.2, a * 1.4], { color: c(kind === 'pan' ? 'iron' : kind === 'racket' ? 'red' : kind === 'magnifier' ? 'gold' : 'silver'), tube: 0.12, srot: [25, 0, 0] });
        break;
      case 'guitar': {
        // slung across the front of the body (on the torso, not the hand, so it stays put whatever the arms do)
        const T = d.torsoH, z = d.td / 2 + a * 0.75, bh = T * 0.62, nl = H * 0.3, ang = 52;
        const bx = -d.tw * 0.1, by = T * 0.3;
        const r = (ang * Math.PI) / 180;
        add('ball', [d.tw * 0.95, bh, a * 1.1], [bx, by, z], { parent: 'torso', color: c('wood') });
        add('cyl', [d.tw * 0.28, a * 0.3, d.tw * 0.28], [bx, by + bh * 0.05, z + a * 0.5], { parent: 'torso', srot: [90, 0, 0], color: col('#3a2414'), noInk: true });
        add('box', [a * 0.55, nl, a * 0.4], [bx + Math.sin(r) * (bh * 0.4 + nl / 2), by + Math.cos(r) * (bh * 0.4 + nl / 2), z], { parent: 'torso', srot: [0, 0, -ang], color: col('darkwood') });
        break;
      }
      case 'violin': {
        // tucked under the chin on the figure's left shoulder, neck pointing out along the left arm
        const T = d.torsoH, z = d.td / 2 + a * 0.5;
        add('ball', [d.tw * 0.42, T * 0.36, a * 0.7], [d.tw * 0.32, T * 0.86, z], { parent: 'torso', srot: [0, 0, 70], color: c('darkwood') });
        add('box', [a * 0.4, T * 0.45, a * 0.3], [d.tw * 0.85, T * 0.98, z + a * 0.3], { parent: 'torso', srot: [0, 0, 70], color: col('#2a1a10') });
        break;
      }
      case 'trumpet':
        add('cyl', [a * 0.4, H * 0.18, a * 0.4], [0, a * 0.8, a * 1.6], { srot: [70, 0, 0], color: c('brass') });
        add('cyl', [a * 1.4, a * 1.2, a * 1.4], [0, a * 1.8, a * 3.6], { taper: 0.3, srot: [-110, 0, 0], color: c('brass') });
        break;
      case 'camera':
      case 'compass':
        add('box', [a * 2.2, a * 1.5, a * 1.2], atHand, { color: c(kind === 'camera' ? 'black' : 'gold') });
        if (kind === 'camera') add('cyl', [a * 0.9, a * 0.8, a * 0.9], [0, -a * 0.6, a * 1.4], { srot: [90, 0, 0], color: col('darkgray') });
        break;
      case 'bouquet':
        add('cyl', [a * 1.0, a * 2.0, a * 1.0], [0, a * 0.2, a * 0.8], { taper: 2, color: col('green') });
        for (let i = 0; i < 4; i++) add('ball', [a * 0.9, a * 0.9, a * 0.9], [Math.cos(i * 1.6) * a * 0.6, a * 1.6, a * 0.8 + Math.sin(i * 1.6) * a * 0.6], { color: col(['red', 'pink', 'yellow', 'white'][i]) });
        break;
      case 'bow':
        add('torus', [a * 1.2, H * 0.5, a * 0.25], [a * 0.3, 0, a * 0.8], { color: c('wood'), tube: 0.15, srot: [0, 90, 0] });
        break;
      case 'fishing rod':
      case 'whip':
      case 'lasso':
      case 'hose':
      case 'leash':
        add('capsule', [a * 0.2, H * 0.6, a * 0.2], [0, H * 0.2, a * 2.5], { srot: [50, 0, 0], color: c(kind === 'hose' ? 'green' : kind === 'fishing rod' ? 'darkgray' : 'brown') });
        if (kind === 'lasso') add('torus', [a * 3, a * 3, a * 0.2], [0, H * 0.48, a * 4.5], { color: c('tan'), tube: 0.06, srot: [90, 0, 0] });
        break;
      case 'blaster':
        add('box', [a * 0.8, a * 1.0, a * 3.2], [0, -a * 0.3, a * 1.8], { color: c('silver') });
        break;
      case 'saw':
      case 'chainsaw':
        add('box', [a * 0.2, a * 2, H * 0.3], [0, -a * 1.2, H * 0.17], { color: c(kind === 'chainsaw' ? 'orange' : 'silver') });
        break;
      case 'scissors':
      case 'syringe':
        add('capsule', [a * 0.3, a * 2.5, a * 0.3], [0, a * 0.4, a * 1.2], { srot: [60, 0, 0], color: c('silver') });
        break;
      case 'pizza':
      case 'tray':
        add('cyl', [a * 4.5, a * 0.3, a * 4.5], [0, a * 0.4, a * 1.6], { color: c(kind === 'pizza' ? 'cheese' : 'silver') });
        break;
      case 'skateboard':
      case 'surfboard':
        add('capsule', [a * (kind === 'surfboard' ? 4 : 2.4), H * (kind === 'surfboard' ? 1.0 : 0.45), a * 0.4], [a * 0.5, kind === 'surfboard' ? H * 0.1 : -a, -a * 0.6], { color: c(kind === 'surfboard' ? 'cyan' : 'red') });
        break;
    }
  };
}

/* ----- people ----- */

const SKINS = ['#f6d2b4', '#f0c39f', '#e2ac83', '#d9a173', '#a8714a', '#8a5a3a', '#7a4b2e'];
const HAIRS = ['#2a1d16', '#3b2a1e', '#5a3a22', '#7a3b1e', '#a0522d', '#d9a441', '#e8c56a', '#8f969e', '#1d1d1d'];
const TOPS = ['#4f8fd6', '#e86f7d', '#55b05f', '#f2c14e', '#8a5fc4', '#3fa7a0', '#f0923b', '#e0473b', '#fdf6e8', '#5c6166'];
const BOTTOMS = ['#3d4f7a', '#4a6fa5', '#2a2726', '#5a3a22', '#7a7f85', '#c9b28a'];
const STYLES: HairStyle[] = ['short', 'short', 'long', 'ponytail', 'bun', 'spiky', 'short', 'pigtails'];

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

export interface WhoOpts {
  /** Height in metres, or 'kid' (1.35, bigger head), 'baby' (0.7), 'tall' (1.95), 'short' (1.5). */
  h?: number | 'kid' | 'baby' | 'tall' | 'short';
  skin?: string;
  hair?: string;
  style?: HairStyle;
  top?: string;
  bottom?: string;
  shoes?: string;
  skirt?: string;
  legs?: string;
  long?: boolean;
  build?: number;
  eyes?: string;
  beard?: string;
  glasses?: string;
  blush?: string;
  acc?: Extra[];
  /** Arms held in a pose at rest: wave (right hand up), arms_up, point (right arm out), hold (forearms forward,
   *  carrying), hips (hands on hips), reach (both arms forward), cross (arms folded), salute. */
  pose?: 'wave' | 'arms_up' | 'point' | 'hold' | 'hips' | 'reach' | 'cross' | 'salute';
  /** Head size multiplier at any height (big-headed gnomes, cartoon characters). */
  head?: number;
  /** Bare legs below shorts or a short skirt (the shins show skin). */
  shorts?: boolean;
}

/** Rest arm turns for each who() pose (joint deltas in degrees, right arm values; the left mirrors z and y). */
const ARM_POSES: Record<NonNullable<WhoOpts['pose']>, { armR: Vec3; foreR: Vec3; armL?: Vec3; foreL?: Vec3 }> = {
  wave: { armR: [-15, 0, -150], foreR: [-6, 0, 18], armL: [0, 0, 6], foreL: [0, 0, 0] },
  arms_up: { armR: [0, 0, -160], foreR: [0, 0, -10] },
  point: { armR: [-25, 0, -87], foreR: [0, 0, -4], armL: [0, 0, 6], foreL: [0, 0, 0] },
  hold: { armR: [-18, 0, -8], foreR: [-78, 0, 4] },
  hips: { armR: [-6, 0, -38], foreR: [-10, 0, 110] },
  reach: { armR: [-82, 0, -6], foreR: [-8, 0, 0] },
  cross: { armR: [-28, 0, -14], foreR: [-82, 0, 92] },
  salute: { armR: [-12, 0, -78], foreR: [-30, 0, -118], armL: [0, 0, 6], foreL: [0, 0, 0] },
};

/** A person: anything not given is picked from the name, so a crowd of different people all look different. */
export function who(key: string, o: WhoOpts = {}): Figure {
  uid = 0; // part names must come out the same every time this figure is built (the sculpting worker builds it too)
  const h = hash(key);
  const pick = <T>(arr: T[], salt: number) => arr[(h >>> salt) % arr.length];
  const height = o.h === 'kid' ? 1.35 : o.h === 'baby' ? 0.72 : o.h === 'tall' ? 1.95 : o.h === 'short' ? 1.5 : typeof o.h === 'number' ? o.h : 1.62 + ((h >>> 3) % 20) / 100;
  const kid = o.h === 'kid' || o.h === 'baby';
  const po: PersonOpts = {
    height,
    headScale: (o.h === 'baby' ? 1.55 : kid ? 1.22 : 1) * (o.head ?? 1),
    skin: col(o.skin ?? pick(SKINS, 1)),
    hair: col(o.hair ?? pick(HAIRS, 5)),
    hairStyle: o.style ?? pick(STYLES, 9),
    shirt: col(o.top ?? pick(TOPS, 13)),
    pants: col(o.bottom ?? pick(BOTTOMS, 17)),
    shoes: col(o.shoes ?? (h % 3 ? '#3b2a1e' : '#2a2726')),
    skirt: o.skirt ? col(o.skirt) : undefined,
    legs: o.legs ? col(o.legs) : o.skirt || o.shorts ? col(o.skin ?? pick(SKINS, 1)) : undefined,
    longSleeves: o.long,
    build: o.build,
    eyes: o.eyes ? col(o.eyes) : undefined,
    beard: o.beard ? col(o.beard) : undefined,
    glasses: o.glasses ? col(o.glasses) : undefined,
    blush: o.blush ? col(o.blush) : undefined,
    extras: o.acc?.length ? (p, d) => o.acc!.forEach((x) => x(p, d)) : undefined,
  };
  const fig = person(key, po);
  if (!o.pose) return fig;
  const a = ARM_POSES[o.pose];
  const mirror = (v: Vec3): Vec3 => [v[0], -v[1], -v[2]];
  const set: Record<string, Vec3> = { armR: a.armR, foreR: a.foreR, armL: a.armL ?? mirror(a.armR), foreL: a.foreL ?? mirror(a.foreR) };
  return measure({ ...fig, parts: fig.parts.map((p) => (set[p.name] ? { ...p, rot: set[p.name] } : p)) });
}

/* ----- animal extras ----- */

export type AniExtra = NonNullable<QuadOpts['extras']>;
type QD = { body: Vec3; head: Vec3 };
const aniAdd = (p: Parts, parent: string, shape: Parameters<Parts['add']>[0]['shape'], size: Vec3, at: Vec3, color: string, o: Partial<Parameters<Parts['add']>[0]> = {}) =>
  p.add({ name: nm(`ani_${parent}`), parent, at, shape, size, color: col(color), layer: 2, ...o });

export const ani = {
  horns: (color = 'cream', kind: 'bull' | 'goat' | 'ram' | 'unicorn' | 'rhino' = 'bull'): AniExtra => (p, d: QD) => {
    const [hl, hh, hw] = d.head;
    if (kind === 'unicorn') return void aniAdd(p, 'head', 'cyl', [hw * 0.18, hh * 1.1, hw * 0.18], [0, hh * 0.85, hl * 0.25], color === 'cream' ? col('gold') : color, { taper: 0, srot: [-35, 0, 0] });
    if (kind === 'rhino') return void aniAdd(p, 'head', 'cyl', [hw * 0.3, hh * 0.9, hw * 0.3], [0, hh * 0.3, hl * 0.75], color, { taper: 0, srot: [-30, 0, 0] });
    for (const s of [1, -1]) {
      if (kind === 'ram') aniAdd(p, 'head', 'torus', [hh * 0.8, hh * 0.8, hw * 0.25], [s * hw * 0.48, hh * 0.3, -hl * 0.05], color, { srot: [0, 90, 0], tube: 0.32 });
      else aniAdd(p, 'head', 'cyl', [hw * 0.16, hh * (kind === 'goat' ? 0.9 : 0.55), hw * 0.16], [s * hw * 0.3, hh * 0.55, -hl * 0.05], color, { taper: 0, srot: kind === 'goat' ? [-40, 0, 0] : [0, 0, -s * 55] });
    }
  },
  antlers: (color = '#8a6440'): AniExtra => (p, d: QD) => {
    const [hl, hh, hw] = d.head;
    for (const s of [1, -1]) {
      aniAdd(p, 'head', 'capsule', [hw * 0.08, hh * 1.4, hw * 0.08], [s * hw * 0.35, hh * 1.0, -hl * 0.05], color, { srot: [-15, 0, -s * 30] });
      for (const k of [0.4, 0.75]) aniAdd(p, 'head', 'capsule', [hw * 0.06, hh * 0.55, hw * 0.06], [s * hw * (0.45 + k * 0.25), hh * (0.7 + k * 0.6), hl * 0.05], color, { srot: [-40, 0, -s * 5] });
    }
  },
  trunk: (color = 'gray'): AniExtra => (p, d: QD) => {
    const [hl, hh, hw] = d.head;
    aniAdd(p, 'head', 'capsule', [hw * 0.3, hh * 1.6, hw * 0.3], [0, -hh * 0.55, hl * 0.55], color, { srot: [15, 0, 0] });
    for (const s of [1, -1]) aniAdd(p, 'head', 'cyl', [hw * 0.1, hh * 0.6, hw * 0.1], [s * hw * 0.25, -hh * 0.3, hl * 0.45], 'cream', { taper: 0, srot: [120, 0, 0] });
  },
  hump: (color: string, two = false): AniExtra => (p, d: QD) => {
    const [L, Hb, W] = d.body;
    for (const z of two ? [0.15, -0.15] : [0]) aniAdd(p, 'body', 'ball', [W * 0.7, Hb * 0.6, L * 0.3], [0, Hb * 0.5, L * z], color);
  },
  mane: (color: string, lion = false): AniExtra => (p, d: QD) => {
    const [hl, hh, hw] = d.head;
    if (lion) return void aniAdd(p, 'head', 'ball', [hw * 1.9, hh * 1.9, hl * 0.9], [0, hh * 0.1, -hl * 0.15], color, { layer: -1 });
    aniAdd(p, 'neck', 'capsule', [hw * 0.3, hh * 2.4, hw * 0.4], [0, hh * 0.9, -hw * 0.35], color, { layer: -1 });
  },
  spots: (color: string, n = 6, flat = true): AniExtra => (p, d: QD) => {
    const [L, Hb, W] = d.body;
    for (let i = 0; i < n; i++) {
      const s = i % 2 ? 1 : -1;
      const z = ((i * 0.37) % 1 - 0.5) * L * 0.7;
      const y = (((i * 0.61) % 1) - 0.4) * Hb * 0.6;
      aniAdd(p, 'body', 'ball', flat ? [W * 0.05, Hb * 0.25, L * 0.14] : [W * 0.2, Hb * 0.2, L * 0.12], [s * W * 0.45, y, z], color, { noInk: true, layer: 3 });
    }
  },
  stripes: (color: string, n = 5): AniExtra => (p, d: QD) => {
    const [L, Hb, W] = d.body;
    for (let i = 0; i < n; i++) aniAdd(p, 'body', 'torus', [W * 1.02, Hb * 1.02, L * 0.05], [0, 0, L * (0.3 - (i * 0.6) / Math.max(1, n - 1))], color, { tube: 0.12, noInk: true, layer: 3 });
  },
  shell: (color: string): AniExtra => (p, d: QD) => {
    const [L, Hb, W] = d.body;
    aniAdd(p, 'body', 'ball', [W * 1.25, Hb * 1.1, L * 1.1], [0, Hb * 0.25, 0], color, { layer: 3 });
  },
  quills: (color: string): AniExtra => (p, d: QD) => {
    const [L, Hb, W] = d.body;
    for (let i = 0; i < 9; i++) aniAdd(p, 'body', 'cyl', [W * 0.08, Hb * 0.6, W * 0.08], [((i % 3) - 1) * W * 0.25, Hb * 0.45, L * (0.3 - Math.floor(i / 3) * 0.25)], color, { taper: 0, srot: [-35, 0, ((i % 3) - 1) * 25] });
  },
  beard: (color: string): AniExtra => (p, d: QD) => {
    const [hl, hh, hw] = d.head;
    aniAdd(p, 'head', 'cyl', [hw * 0.3, hh * 0.6, hw * 0.3], [0, -hh * 0.55, hl * 0.3], color, { taper: 0, srot: [180, 0, 0] });
  },
  wings: (color: string): AniExtra => (p, d: QD) => {
    const [L, Hb, W] = d.body;
    for (const s of [1, -1]) aniAdd(p, 'body', 'ball', [W * 1.6, Hb * 0.12, L * 0.6], [s * W * 0.9, Hb * 0.45, 0], color, { srot: [0, 0, s * 25] });
  },
};

/** The quadruped kit with a list of animal extras. */
export function beast(key: string, o: Omit<QuadOpts, 'extras'> & { acc?: AniExtra[] }): Figure {
  const { acc, ...rest } = o;
  uid = 0;
  return quadruped(key, { ...rest, color: col(o.color), belly: o.belly ? col(o.belly) : undefined, extras: acc?.length ? (p, d) => acc.forEach((x) => x(p, d)) : undefined });
}

export const _r = R;
