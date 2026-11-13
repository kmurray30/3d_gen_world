/**
 * Acts: what a thing does when you click it, written as steps in the same language every scripted scene uses
 * (and that the model writes when the player asks for something), so nothing here is special to clicks.
 *
 *   act: {
 *     setup: [A.spawn('bread', 'slice of bread'), A.attach('bread', 'self', 'slot')],
 *     click: [
 *       [A.pose('lever', { move: [0, -0.05, 0], dur: 0.3 }), A.wait(3), A.morph('toast', 'self.slot'),
 *        A.pose('lever', { move: [0, 0, 0], dur: 0.15 }), A.say('Ding!')],
 *       [A.pose('lever', { move: [0, -0.05, 0] }), A.wait(3), A.effect('smoke', { id: 'self', dur: 2 }),
 *        A.morph('burnt toast', 'self.slot'), A.pose('lever', { move: [0, 0, 0] })],
 *     ],
 *   }
 *
 * Ids: 'self' is the thing, 'self.<socket>' whatever sits in that socket, a spawn's ref names what it made, and
 * 'player' is the player. Each click runs the next entry of `click`, round and round.
 */
import type { Step } from '../schema';
import type { FigAct, Figure, Vec3 } from './types';

type Pl = { rel?: string; of?: string; dist?: string; height?: string };
const SELF = 'self';

export const A = {
  /** Move a named part: turn (deg from rest), shift (m), resize (0 hides), spin (deg/s); values are targets. */
  pose: (part: string, o: { rot?: Vec3; move?: Vec3; scale?: number; spin?: Vec3; dur?: number; delay?: number; times?: number }, id = SELF): Step => ({ op: 'pose', id, part, ...o }) as Step,
  /** Work a mover: open/close, on/off, out/in, or toggle (no `to`). */
  operate: (part: string, to?: string, id = SELF): Step => ({ op: 'operate', id, part, ...(to ? { to } : {}) }) as Step,
  /** A speech bubble over it (or a narrator line with id ''). */
  say: (text: string, dur = 2, id = SELF): Step => (id ? { op: 'say', id, text, dur } : { op: 'say', text, dur }) as Step,
  /** A whole-body move (hop, wobble, shake, spin, bounce, fall_over, pulse) or a gesture (wave, point, clap,
   *  shrug, thumbs_up, arms_up, dance, bow, nod, shake_head, laugh, cry, gasp, look_around, wag, flap), or one of
   *  the figure's own clips by name (people: jump, cheer, tada, think, scared, stomp, love, yawn, facepalm;
   *  four-legged animals: rear, graze, look; birds: peck, crow, flutter; dragons: roar, breathe). */
  anim: (name: string, times = 1, id = SELF): Step => ({ op: 'anim', id, name, times }) as Step,
  wait: (dur: number): Step => ({ op: 'wait', dur }) as Step,
  /** Steps at the same time (up to 10). */
  par: (...steps: Step[]): Step => ({ op: 'par', do: steps.flatMap((s) => (s.op === 'par' ? s.do : [s])) }) as Step,
  /** Make something new (any catalog word); `ref` names it for later steps. */
  spawn: (ref: string, word: string, at: Pl = { rel: 'near', of: SELF, dist: 'close' }, o: { scale?: number } = {}): Step => ({ op: 'spawn', ref, word, at, ...o }) as Step,
  /** Put id on/in/with `to`: where is 'top', 'held', or a socket name of `to`. */
  attach: (id: string, to = SELF, where?: string): Step => ({ op: 'attach', id, to, ...(where ? { where } : {}) }) as Step,
  /** A piece comes off and becomes its own thing (and falls); `ref` names it. */
  detach: (part: string, ref?: string, id = SELF): Step => ({ op: 'detach', id, part, ...(ref ? { ref } : {}) }) as Step,
  /** The piece goes back on. */
  reattach: (part: string, id = SELF): Step => ({ op: 'reattach', id, part }) as Step,
  /** Change things about it: word (turn into another thing), scale, tilt, state, expression, face. */
  set: (o: { word?: string; scale?: number; tilt?: number; state?: Record<string, boolean | number | string>; expression?: string; face?: string; dur?: number; delay?: number }, id = SELF): Step => ({ op: 'set', id, ...o }) as Step,
  /** Turn into another thing (toast into burnt toast). */
  morph: (word: string, id = SELF): Step => ({ op: 'set', id, word }) as Step,
  /** Look at someone or something ('player', a ref, 'self.<socket>'). */
  face: (target = 'player', id = SELF): Step => ({ op: 'set', id, face: target }) as Step,
  /** A face: happy, sad, angry, surprised, scared, sleepy, laughing, confused, neutral. */
  expr: (expression: string, id = SELF): Step => ({ op: 'set', id, expression }) as Step,
  /** fire, smoke, steam, rain, water_spray, sparkle, explosion, snow, hearts, dust: on a thing or at a place. */
  effect: (name: string, o: { id?: string; dur?: number; loop?: boolean } = {}): Step => ({ op: 'effect', name, id: o.id ?? SELF, ...(o.dur !== undefined ? { dur: o.dur } : {}), ...(o.loop ? { loop: true } : {}) }) as Step,
  /** Go somewhere: to a place relative to something ({ rel: 'front', of: 'player' }). */
  move: (id: string, to: Pl, o: { speed?: 'slow' | 'walk' | 'run' | 'fly' | 'instant'; style?: 'walk' | 'hop' | 'slide' | 'fly' } = {}): Step => ({ op: 'move', id, to, ...o }) as Step,
  remove: (id: string, how?: 'pop' | 'fade' | 'sink' | 'fly_away' | 'explode'): Step => ({ op: 'remove', id, ...(how ? { how } : {}) }) as Step,
  /** Let go: it falls to whatever is under it. */
  drop: (id: string): Step => ({ op: 'drop', id }) as Step,
};

/** An act definition as authors write it: one click sequence, or several that alternate. */
export interface ActDef {
  setup?: Step[];
  click: Step[] | Step[][];
}

export function normalizeAct(def: ActDef): FigAct {
  const c = def.click;
  const click = c.length && Array.isArray(c[0]) ? (c as Step[][]) : [c as Step[]];
  return { ...(def.setup?.length ? { setup: def.setup } : {}), click: click.filter((s) => s.length) };
}

/** Give any figure (from who(), beast(), a kit) its act. */
export function withAct(fig: Figure, def: ActDef): Figure {
  return { ...fig, act: normalizeAct(def) };
}
