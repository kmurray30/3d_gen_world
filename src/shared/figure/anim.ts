/**
 * Animation for figures, shared by the paper and 3D renderers. A clip is a function of time that returns joint
 * rotations (degrees, added to the rest pose), joint nudges, a root offset and an expression. The Animator blends
 * a locomotion loop (idle, walk, run, picked from speed) with one-shot reactions (a click makes a person wave,
 * shrug, point, cheer...), and adds blinking and talking on top.
 */
import type { Figure, Rig, Vec3 } from './types';

export type Expr = 'neutral' | 'happy' | 'laugh' | 'surprised' | 'angry' | 'sad' | 'scared' | 'sleepy' | 'wink' | 'thinking' | 'determined' | 'love' | 'blink' | 'talk';
export const EXPRESSIONS: Expr[] = ['neutral', 'happy', 'laugh', 'surprised', 'angry', 'sad', 'scared', 'sleepy', 'wink', 'thinking', 'determined', 'love'];

export interface Pose {
  /** Joint rotation deltas in degrees. */
  j: Record<string, Vec3>;
  /** Joint position deltas in metres. */
  t?: Record<string, Vec3>;
  /** Absolute size of a part's solid (not its children): grows a hidden flame. */
  sc?: Record<string, number>;
  root: Vec3;
  rootRot: Vec3;
  expr?: Expr;
}

interface Ctx {
  H: number;
  key: string;
}

export interface Clip {
  name: string;
  dur: number;
  loop?: boolean;
  /** Expressions that suit the clip; a reaction picks one of these most of the time. */
  expr?: Expr[];
  fn: (t: number, k: Ctx) => Partial<Pose>;
}

const S = Math.sin;
const PI2 = Math.PI * 2;
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const smooth = (a: number, b: number, v: number) => {
  const x = clamp01((v - a) / (b - a));
  return x * x * (3 - 2 * x);
};
/** 0 -> 1 -> 0 over a one-shot of length d with ease in/out of `e` seconds. */
const env = (t: number, d: number, e = 0.25) => smooth(0, e, t) * (1 - smooth(d - e, d, t));
const pos = (v: number) => Math.max(0, v);

/* ----- people ----- */

const breathe = (t: number): Record<string, Vec3> => ({
  torso: [1.2 * S(t * 2.1), 0, 0],
  head: [1.5 * S(t * 0.9 + 1), 7 * S(t * 0.45), 2 * S(t * 0.7)],
  armL: [2 * S(t * 2.1 + 0.5), 0, 3 + 1.5 * S(t * 2.1)],
  armR: [2 * S(t * 2.1 + 0.8), 0, -3 - 1.5 * S(t * 2.1)],
  foreL: [-6, 0, 0],
  foreR: [-6, 0, 0],
});

const BIPED: Clip[] = [
  { name: 'idle', dur: 1, loop: true, fn: (t) => ({ j: breathe(t) }) },
  {
    name: 'walk', dur: 1 / 1.7, loop: true,
    fn: (t, k) => {
      const f = t * PI2 * 1.7;
      const s = S(f);
      return {
        j: { legL: [-26 * s, 0, 0], legR: [26 * s, 0, 0], shinL: [32 * pos(-s), 0, 0], shinR: [32 * pos(s), 0, 0], footL: [-10 * s, 0, 0], footR: [10 * s, 0, 0], armL: [22 * s, 0, 4], armR: [-22 * s, 0, -4], foreL: [-14, 0, 0], foreR: [-14, 0, 0], torso: [2, 4 * s, 0], head: [-2, -3 * s, 0] },
        root: [0, k.H * 0.018 * Math.abs(Math.cos(f)), 0],
      };
    },
  },
  {
    name: 'run', dur: 1 / 2.6, loop: true, expr: ['determined'],
    fn: (t, k) => {
      const f = t * PI2 * 2.6;
      const s = S(f);
      return {
        j: { legL: [-48 * s - 6, 0, 0], legR: [48 * s - 6, 0, 0], shinL: [20 + 70 * pos(-s), 0, 0], shinR: [20 + 70 * pos(s), 0, 0], armL: [45 * s, 0, 8], armR: [-45 * s, 0, -8], foreL: [-85, 0, 0], foreR: [-85, 0, 0], torso: [12, 8 * s, 0], head: [-8, -6 * s, 0] },
        root: [0, k.H * 0.045 * Math.abs(Math.cos(f)), 0],
        expr: 'determined',
      };
    },
  },
  {
    name: 'wave', dur: 2.2, expr: ['happy', 'laugh', 'wink'],
    fn: (t) => {
      const e = env(t, 2.2, 0.3);
      return { j: { ...breathe(t), armR: [-15 * e, 0, -3 - 147 * e], foreR: [-6, 0, e * (-15 + 28 * S(t * 11))], head: [0, 0, 9 * e] } };
    },
  },
  {
    name: 'cheer', dur: 2.0, expr: ['laugh', 'happy'],
    fn: (t, k) => {
      const e = env(t, 2.0, 0.25);
      const hop = pos(S(t * PI2 * 1.5)) * e;
      return { j: { armL: [0, 0, 160 * e + 8 * S(t * 12)], armR: [0, 0, -160 * e - 8 * S(t * 12)], foreL: [0, 0, 10 * e], foreR: [0, 0, -10 * e], head: [-12 * e, 0, 0], shinL: [25 * hop, 0, 0], shinR: [25 * hop, 0, 0] }, root: [0, k.H * 0.09 * hop, 0] };
    },
  },
  {
    name: 'tada', dur: 2.0, expr: ['happy', 'laugh', 'wink'],
    fn: (t) => {
      const e = env(t, 2.0, 0.3);
      return { j: { armL: [0, 0, 95 * e + 4 * S(t * 3)], armR: [0, 0, -95 * e - 4 * S(t * 3)], foreL: [0, 0, 22 * e], foreR: [0, 0, -22 * e], torso: [-6 * e, 0, 0], head: [-10 * e, 0, 6 * e], legL: [0, 0, 6 * e], legR: [0, 0, -6 * e] } };
    },
  },
  {
    name: 'point', dur: 2.0, expr: ['determined', 'surprised', 'happy'],
    fn: (t) => {
      const e = env(t, 2.0, 0.25);
      return { j: { ...breathe(t), armR: [-25 * e, 0, -3 - 84 * e], foreR: [0, 0, -4 * e + 3 * S(t * 7) * e], head: [-4 * e, -32 * e, 0], torso: [0, -12 * e, 0], armL: [0, 0, 3 + 22 * e], foreL: [-6 - 60 * e, 0, -50 * e] } };
    },
  },
  {
    name: 'shrug', dur: 1.8, expr: ['thinking', 'sad', 'neutral'],
    fn: (t, k) => {
      const e = env(t, 1.8, 0.3);
      return { j: { armL: [-10 * e, 0, 12 * e], armR: [-10 * e, 0, -12 * e], foreL: [-35 * e, 0, 78 * e], foreR: [-35 * e, 0, -78 * e], head: [0, 0, 16 * e * S(Math.min(t, 0.9) * 1.8)] }, root: [0, k.H * 0.01 * e, 0] };
    },
  },
  {
    name: 'jump', dur: 1.3, expr: ['surprised', 'laugh', 'happy'],
    fn: (t, k) => {
      const crouch = smooth(0, 0.22, t) * (1 - smooth(0.22, 0.32, t)) + smooth(0.95, 1.08, t) * (1 - smooth(1.12, 1.3, t));
      const air = t > 0.3 && t < 1.0 ? S(((t - 0.3) / 0.7) * Math.PI) : 0;
      return {
        j: { legL: [-40 * crouch - 20 * air, 0, 4 * air], legR: [-40 * crouch - 20 * air, 0, -4 * air], shinL: [75 * crouch + 50 * air, 0, 0], shinR: [75 * crouch + 50 * air, 0, 0], torso: [18 * crouch, 0, 0], armL: [30 * crouch, 0, 150 * air], armR: [30 * crouch, 0, -150 * air], head: [-10 * air, 0, 0] },
        root: [0, k.H * (0.32 * air - 0.08 * crouch), 0],
      };
    },
  },
  {
    name: 'dance', dur: 2.6, expr: ['laugh', 'happy', 'wink'],
    fn: (t, k) => {
      const e = env(t, 2.6, 0.3);
      const f = t * PI2 * 1.6;
      const s = S(f);
      return {
        j: { torso: [0, 10 * s * e, -8 * s * e], armL: [0, 0, (70 + 70 * pos(s)) * e], armR: [0, 0, -(70 + 70 * pos(-s)) * e], foreL: [0, 0, 40 * e], foreR: [0, 0, -40 * e], head: [0, 12 * s * e, 10 * s * e], shinL: [25 * Math.abs(s) * e, 0, 0], shinR: [25 * Math.abs(s) * e, 0, 0], legL: [-12 * pos(s) * e, 0, 0], legR: [-12 * pos(-s) * e, 0, 0] },
        root: [k.H * 0.03 * s * e, k.H * 0.02 * Math.abs(Math.cos(f)) * e, 0],
        rootRot: [0, 0, 5 * s * e],
      };
    },
  },
  {
    name: 'think', dur: 2.4, expr: ['thinking'],
    fn: (t) => {
      const e = env(t, 2.4, 0.35);
      return { j: { ...breathe(t), armR: [-48 * e, 0, -3 - 8 * e], foreR: [-125 * e, 0, 22 * e], armL: [-30 * e, 0, 3 - 12 * e], foreL: [-80 * e, 0, -55 * e], head: [-10 * e, 18 * e, 9 * e + 3 * S(t * 2) * e] } };
    },
  },
  {
    name: 'scared', dur: 2.0, expr: ['scared', 'surprised'],
    fn: (t, k) => {
      const e = env(t, 2.0, 0.15);
      const sh = S(t * 55) * e;
      return { j: { legL: [-22 * e, 0, 6 * e], legR: [-22 * e, 0, -6 * e], shinL: [40 * e, 0, 0], shinR: [40 * e, 0, 0], torso: [14 * e, 0, 0], armL: [-65 * e, 0, 25 * e], armR: [-65 * e, 0, -25 * e], foreL: [-115 * e, 0, -20 * e], foreR: [-115 * e, 0, 20 * e], head: [6 * e, 0, 0] }, root: [k.H * 0.006 * sh, -k.H * 0.05 * e, 0] };
    },
  },
  {
    name: 'clap', dur: 2.0, expr: ['laugh', 'happy'],
    fn: (t, k) => {
      const e = env(t, 2.0, 0.25);
      const c = 0.5 + 0.5 * S(t * 15);
      return { j: { armL: [-55 * e, 0, 14 * e], armR: [-55 * e, 0, -14 * e], foreL: [-30 * e, 0, (-45 - 30 * c) * e], foreR: [-30 * e, 0, (45 + 30 * c) * e], head: [-6 * e, 0, 0] }, root: [0, k.H * 0.012 * Math.abs(S(t * 7.5)) * e, 0] };
    },
  },
  {
    name: 'bow', dur: 2.0, expr: ['happy', 'sleepy'],
    fn: (t) => {
      const e = env(t, 2.0, 0.45);
      return { j: { torso: [42 * e, 0, 0], head: [14 * e, 0, 0], armL: [-18 * e, 0, 3], armR: [-40 * e, 0, -3 + 18 * e], foreR: [-80 * e, 0, -30 * e], legL: [-4 * e, 0, 0], legR: [-4 * e, 0, 0] } };
    },
  },
  {
    name: 'facepalm', dur: 2.2, expr: ['sad', 'sleepy'],
    fn: (t) => {
      const e = env(t, 2.2, 0.3);
      return { j: { ...breathe(t), armR: [-62 * e, 0, -3 + 14 * e], foreR: [-128 * e, 0, 20 * e], head: [16 * e, 6 * e * S(t * 3), 0], torso: [6 * e, 0, 0] } };
    },
  },
  {
    name: 'stomp', dur: 1.8, expr: ['angry'],
    fn: (t, k) => {
      const e = env(t, 1.8, 0.2);
      const st = pos(S(t * PI2 * 2.2));
      return { j: { armL: [10 * e, 0, 14 * e], armR: [10 * e, 0, -14 * e], foreL: [-60 * e, 0, -40 * e], foreR: [-60 * e, 0, 40 * e], legR: [-35 * st * e, 0, 0], shinR: [45 * st * e, 0, 0], torso: [8 * e, 0, 0], head: [8 * e, 0, 0] }, root: [0, k.H * 0.01 * st * e, 0], rootRot: [0, 0, 1.5 * S(t * 40) * e * (1 - st)] };
    },
  },
  {
    name: 'laugh', dur: 2.0, expr: ['laugh'],
    fn: (t, k) => {
      const e = env(t, 2.0, 0.25);
      return { j: { torso: [-10 * e + 3 * S(t * 18) * e, 0, 0], head: [-14 * e, 0, 4 * S(t * 9) * e], armL: [-25 * e, 0, 10 * e], armR: [-25 * e, 0, -10 * e], foreL: [-70 * e, 0, -55 * e], foreR: [-70 * e, 0, 55 * e] }, root: [0, k.H * 0.008 * Math.abs(S(t * 18)) * e, 0] };
    },
  },
  {
    name: 'love', dur: 2.2, expr: ['love'],
    fn: (t) => {
      const e = env(t, 2.2, 0.3);
      return { j: { ...breathe(t), armL: [-40 * e, 0, 3], armR: [-40 * e, 0, -3], foreL: [-80 * e, 0, -55 * e], foreR: [-80 * e, 0, 55 * e], head: [0, 0, 14 * e + 4 * S(t * 3) * e], torso: [0, 0, 5 * S(t * 2.5) * e] } };
    },
  },
  {
    name: 'yawn', dur: 2.4, expr: ['sleepy'],
    fn: (t) => {
      const e = env(t, 2.4, 0.5);
      return { j: { armL: [-10 * e, 0, 165 * e], armR: [-10 * e, 0, -165 * e], foreL: [0, 0, 20 * e], foreR: [0, 0, -20 * e], torso: [-10 * e, 0, 0], head: [-18 * e, 0, 0] } };
    },
  },
];

/* ----- four legs ----- */

const QUAD: Clip[] = [
  {
    name: 'idle', dur: 1, loop: true,
    fn: (t) => ({ j: { tail: [6 * S(t * 1.3), 18 * S(t * 2.2), 0], head: [3 * S(t * 0.6), 14 * S(t * 0.35), 0], earL: [0, 0, 4 * S(t * 1.7)], earR: [0, 0, -4 * S(t * 1.7)], body: [0.8 * S(t * 2), 0, 0] } }),
  },
  {
    name: 'walk', dur: 1 / 1.6, loop: true,
    fn: (t, k) => {
      const s = S(t * PI2 * 1.6);
      return { j: { legFL: [-24 * s, 0, 0], legBR: [-24 * s, 0, 0], legFR: [24 * s, 0, 0], legBL: [24 * s, 0, 0], head: [4 * S(t * PI2 * 3.2), 0, 0], tail: [8 * s, 10 * s, 0] }, root: [0, k.H * 0.012 * Math.abs(Math.cos(t * PI2 * 1.6)), 0] };
    },
  },
  {
    name: 'run', dur: 1 / 2.4, loop: true,
    fn: (t, k) => {
      const f = t * PI2 * 2.4;
      return { j: { legFL: [-42 * S(f), 0, 0], legFR: [-42 * S(f + 0.4), 0, 0], legBL: [-42 * S(f - 1.9), 0, 0], legBR: [-42 * S(f - 1.5), 0, 0], body: [7 * S(f), 0, 0], head: [-6 * S(f), 0, 0], tail: [-25, 0, 0], earL: [-20, 0, 0], earR: [-20, 0, 0] }, root: [0, k.H * 0.05 * Math.abs(S(f)), 0] };
    },
  },
  {
    name: 'hop', dur: 1.1,
    fn: (t, k) => {
      const air = t > 0.15 && t < 0.85 ? S(((t - 0.15) / 0.7) * Math.PI) : 0;
      const crouch = smooth(0, 0.12, t) * (1 - smooth(0.12, 0.2, t));
      return { j: { legFL: [-35 * air, 0, 0], legFR: [-35 * air, 0, 0], legBL: [35 * air, 0, 0], legBR: [35 * air, 0, 0], body: [-12 * air + 6 * crouch, 0, 0], tail: [-30 * air, 0, 0] }, root: [0, k.H * (0.35 * air - 0.05 * crouch), 0] };
    },
  },
  {
    name: 'wag', dur: 2.0, expr: ['happy'],
    fn: (t, k) => {
      const e = env(t, 2.0, 0.2);
      return { j: { tail: [-15 * e, 45 * S(t * 22) * e, 0], body: [0, 0, 4 * S(t * 11) * e], head: [-8 * e, 0, 12 * S(t * 5) * e], earL: [0, 0, 18 * S(t * 11) * e], earR: [0, 0, -18 * S(t * 11) * e] }, root: [0, k.H * 0.03 * pos(S(t * PI2 * 2)) * e, 0] };
    },
  },
  {
    name: 'look', dur: 2.2,
    fn: (t) => {
      const e = env(t, 2.2, 0.3);
      return { j: { head: [-6 * e, 55 * e, 8 * e], neck: [-6 * e, 15 * e, 0], earL: [-15 * e, 0, 0], earR: [-15 * e, 0, 0], tail: [0, 25 * S(t * 6) * e, 0] } };
    },
  },
  {
    name: 'shake', dur: 1.4,
    fn: (t) => {
      const e = env(t, 1.4, 0.15);
      return { j: { body: [0, 0, 10 * S(t * 30) * e], head: [0, 0, -16 * S(t * 30) * e], earL: [0, 0, 30 * S(t * 30) * e], earR: [0, 0, -30 * S(t * 30) * e], tail: [0, 30 * S(t * 30) * e, 0] } };
    },
  },
  {
    name: 'graze', dur: 2.6,
    fn: (t) => {
      const e = env(t, 2.6, 0.5);
      return { j: { neck: [55 * e, 0, 0], head: [25 * e + 6 * S(t * 12) * e, 0, 0], tail: [0, 25 * S(t * 3) * e, 0] } };
    },
  },
  {
    name: 'rear', dur: 1.8,
    fn: (t, k) => {
      const e = env(t, 1.8, 0.4);
      return { j: { body: [-32 * e, 0, 0], legFL: [-70 * e + 25 * S(t * 12) * e, 0, 0], legFR: [-60 * e - 25 * S(t * 12) * e, 0, 0], legBL: [30 * e, 0, 0], legBR: [30 * e, 0, 0], neck: [-20 * e, 0, 0], head: [-10 * e, 0, 0], tail: [-20 * e, 0, 0] }, root: [0, k.H * 0.12 * e, 0] };
    },
  },
];

/* ----- birds ----- */

const BIRD: Clip[] = [
  { name: 'idle', dur: 1, loop: true, fn: (t) => ({ j: { head: [0, 30 * Math.sign(S(t * 0.9)) * (Math.abs(S(t * 0.9)) > 0.5 ? 1 : 0), 0], tail: [4 * S(t * 2), 0, 0] } }) },
  {
    name: 'walk', dur: 1 / 2, loop: true,
    fn: (t, k) => {
      const s = S(t * PI2 * 2);
      return { j: { legL: [-28 * s, 0, 0], legR: [28 * s, 0, 0], head: [8 * S(t * PI2 * 4), 0, 0], body: [3 * s, 0, 3 * s] }, root: [0, k.H * 0.02 * Math.abs(Math.cos(t * PI2 * 2)), 0] };
    },
  },
  {
    name: 'run', dur: 1 / 3.2, loop: true,
    fn: (t, k) => {
      const s = S(t * PI2 * 3.2);
      return { j: { legL: [-40 * s, 0, 0], legR: [40 * s, 0, 0], body: [14, 0, 0], wingL: [0, 0, 30 + 15 * s], wingR: [0, 0, -30 - 15 * s], head: [-10, 0, 0] }, root: [0, k.H * 0.04 * Math.abs(Math.cos(t * PI2 * 3.2)), 0] };
    },
  },
  {
    name: 'peck', dur: 1.6,
    fn: (t) => {
      const e = env(t, 1.6, 0.2);
      const p = pos(S(t * PI2 * 2.5));
      return { j: { body: [32 * p * e, 0, 0], head: [30 * p * e, 0, 0], tail: [-15 * p * e, 0, 0] } };
    },
  },
  {
    name: 'flap', dur: 1.6,
    fn: (t, k) => {
      const e = env(t, 1.6, 0.15);
      const w = 50 + 40 * S(t * 30);
      return { j: { wingL: [0, 0, w * e], wingR: [0, 0, -w * e], tail: [-20 * e, 0, 0], head: [-15 * e, 0, 0] }, root: [0, k.H * 0.25 * S(clamp01(t / 1.6) * Math.PI) * e, 0] };
    },
  },
  {
    name: 'crow', dur: 2.0,
    fn: (t) => {
      const e = env(t, 2.0, 0.35);
      return { j: { body: [-22 * e, 0, 0], head: [-40 * e, 0, 0], wingL: [0, 0, 35 * e], wingR: [0, 0, -35 * e], tail: [-15 * e, 0, 0] } };
    },
  },
];

/* ----- dragons ----- */

/** Wings in flight: a flap at `hz` with amplitude `amp`; the outer panel lags so the tips fold on the upstroke. */
const flapWings = (t: number, hz: number, amp: number): Record<string, Vec3> => {
  const f = t * PI2 * hz;
  return { wingL: [0, 0, amp * S(f)], wingR: [0, 0, -amp * S(f)], wingTipL: [0, 0, amp * 0.7 * S(f - 0.9)], wingTipR: [0, 0, -amp * 0.7 * S(f - 0.9)] };
};
/** Tail and neck swaying in a travelling wave. */
const sinuous = (t: number, amp: number): Record<string, Vec3> => ({
  tail1: [amp * 0.4 * S(t * 1.6), amp * S(t * 1.2), 0],
  tail2: [amp * 0.4 * S(t * 1.6 - 0.7), amp * 1.2 * S(t * 1.2 - 0.7), 0],
  tail3: [amp * 0.4 * S(t * 1.6 - 1.4), amp * 1.4 * S(t * 1.2 - 1.4), 0],
  tail4: [amp * 0.4 * S(t * 1.6 - 2.1), amp * 1.6 * S(t * 1.2 - 2.1), 0],
  neck1: [amp * 0.25 * S(t * 0.8), amp * 0.3 * S(t * 0.6), 0],
  head: [-amp * 0.2 * S(t * 0.8), amp * 0.6 * S(t * 0.5 + 1), 0],
});
/** Wings folded along the back, for standing and walking. */
const folded: Record<string, Vec3> = { wingL: [0, 62, -46], wingR: [0, -62, 46], wingTipL: [0, 70, -10], wingTipR: [0, -70, 10] };
const tucked: Record<string, Vec3> = { legFL: [38, 0, 0], legFR: [38, 0, 0], legBL: [52, 0, 0], legBR: [52, 0, 0] };

const DRAGON: Clip[] = [
  { name: 'idle', dur: 1, loop: true, fn: (t) => ({ j: { ...sinuous(t, 6), ...folded, body: [1 * S(t * 1.8), 0, 0], jaw: [2 + 2 * S(t * 1.8), 0, 0] } }) },
  {
    name: 'walk', dur: 1 / 1.3, loop: true,
    fn: (t, k) => {
      const s = S(t * PI2 * 1.3);
      return { j: { ...sinuous(t, 8), ...folded, legFL: [-22 * s, 0, 0], legBR: [-22 * s, 0, 0], legFR: [22 * s, 0, 0], legBL: [22 * s, 0, 0], body: [0, 0, 2 * s] }, root: [0, k.H * 0.01 * Math.abs(Math.cos(t * PI2 * 1.3)), 0] };
    },
  },
  {
    name: 'run', dur: 1 / 2, loop: true,
    fn: (t, k) => {
      const f = t * PI2 * 2;
      return { j: { ...sinuous(t, 10), ...folded, legFL: [-38 * S(f), 0, 0], legFR: [-38 * S(f + 0.4), 0, 0], legBL: [-38 * S(f - 1.9), 0, 0], legBR: [-38 * S(f - 1.5), 0, 0], body: [5 * S(f), 0, 0] }, root: [0, k.H * 0.03 * Math.abs(S(f)), 0] };
    },
  },
  {
    // in the air and nearly still: slow deep flaps, the body rising on each downstroke
    name: 'hover', dur: 1, loop: true,
    fn: (t, k) => ({ j: { ...sinuous(t, 9), ...flapWings(t, 1.25, 40), ...tucked, body: [-4 + 3 * S(t * PI2 * 1.25 + 1.6), 0, 0] }, root: [0, -k.H * 0.05 * Math.cos(t * PI2 * 1.25), 0] }),
  },
  {
    // flying somewhere: quicker flaps, nose down a little, legs and tail streaming behind
    name: 'fly', dur: 1, loop: true,
    fn: (t, k) => ({ j: { ...sinuous(t, 6), ...flapWings(t, 1.7, 46), legFL: [55, 0, 0], legFR: [55, 0, 0], legBL: [70, 0, 0], legBR: [70, 0, 0], body: [7, 0, 2 * S(t * 1.7)], neck1: [12, 0, 0] }, root: [0, -k.H * 0.035 * Math.cos(t * PI2 * 1.7), 0] }),
  },
  {
    name: 'roar', dur: 2.0,
    fn: (t, k) => {
      const e = env(t, 2.0, 0.3);
      const shake = S(t * 34) * e;
      return { j: { neck1: [-26 * e, 0, 0], neck2: [-16 * e, 0, 0], head: [-18 * e + 4 * shake, 0, 0], jaw: [38 * e, 0, 0], wingL: [0, 0, 28 * e + 6 * shake], wingR: [0, 0, -28 * e - 6 * shake], tail1: [-18 * e, 0, 0], tail2: [-10 * e, 14 * shake, 0] }, root: [0, k.H * 0.02 * e, 0] };
    },
  },
  {
    name: 'breathe', dur: 2.6,
    fn: (t) => {
      const e = env(t, 2.6, 0.35);
      const fire = smooth(0.3, 0.6, t) * (1 - smooth(2.1, 2.5, t));
      return {
        j: { neck1: [14 * e, 0, 0], neck2: [-6 * e, 0, 0], head: [6 * e + 2 * S(t * 25) * fire, 0, 0], jaw: [32 * e, 0, 0], body: [-6 * e, 0, 0] },
        sc: { flame: fire * (0.85 + 0.15 * S(t * 41)), flameCore: fire * (0.8 + 0.2 * S(t * 33 + 1)) },
      };
    },
  },
  {
    name: 'flap', dur: 1.8,
    fn: (t, k) => {
      const e = env(t, 1.8, 0.2);
      return { j: { ...flapWings(t, 2.8, 58 * e), tail1: [-15 * e, 0, 0], head: [-12 * e, 0, 0], jaw: [12 * e, 0, 0] }, root: [0, k.H * 0.22 * S(clamp01(t / 1.8) * Math.PI), 0] };
    },
  },
  {
    name: 'roll', dur: 1.6,
    fn: (t) => {
      const e = env(t, 1.6, 0.25);
      return { j: { wingL: [0, 0, 30 * e], wingR: [0, 0, -30 * e], tail1: [-10 * e, 0, 0] }, rootRot: [0, 0, 360 * smooth(0.2, 1.35, t)] };
    },
  },
];

/* ----- fish, bugs, snakes ----- */

const FISH: Clip[] = [
  { name: 'idle', dur: 1, loop: true, fn: (t, k) => ({ j: { tail: [0, 22 * S(t * 3.2), 0], finL: [0, 0, 18 * S(t * 5)], finR: [0, 0, -18 * S(t * 5)], body: [0, 5 * S(t * 3.2 + 1.5), 0] }, root: [0, k.H * 0.06 * S(t * 1.3), 0] }) },
  { name: 'walk', dur: 1, loop: true, fn: (t) => ({ j: { tail: [0, 32 * S(t * 6), 0], body: [0, 8 * S(t * 6 + 1.5), 0], finL: [0, 0, 25 * S(t * 8)], finR: [0, 0, -25 * S(t * 8)] } }) },
  { name: 'run', dur: 1, loop: true, fn: (t) => ({ j: { tail: [0, 40 * S(t * 10), 0], body: [0, 10 * S(t * 10 + 1.5), 0] } }) },
  { name: 'flip', dur: 1.2, fn: (t, k) => ({ j: { tail: [0, 40 * S(t * 12), 0] }, root: [0, k.H * 1.2 * S(clamp01(t / 1.2) * Math.PI), 0], rootRot: [-360 * smooth(0.1, 1.0, t), 0, 0] }) },
  { name: 'dart', dur: 1.2, fn: (t, k) => ({ j: { tail: [0, 45 * S(t * 16), 0] }, root: [0, 0, k.H * 2 * S(clamp01(t / 1.2) * Math.PI)] }) },
  { name: 'spin', dur: 1.2, fn: (t) => ({ j: { tail: [0, 30 * S(t * 10), 0] }, rootRot: [0, 360 * smooth(0.1, 1.1, t), 0] }) },
];

const wingBeat = (t: number, hz: number, amp: number): Record<string, Vec3> => ({ wingL: [0, 0, amp * S(t * PI2 * hz)], wingR: [0, 0, -amp * S(t * PI2 * hz)] });
const legsScurry = (t: number, hz: number, amp: number): Record<string, Vec3> => {
  const j: Record<string, Vec3> = {};
  for (let i = 0; i < 4; i++) {
    const ph = (i % 2) * Math.PI;
    j[`leg${i}L`] = [0, amp * S(t * PI2 * hz + ph), 0];
    j[`leg${i}R`] = [0, -amp * S(t * PI2 * hz + ph + Math.PI), 0];
  }
  return j;
};
const BUG: Clip[] = [
  { name: 'idle', dur: 1, loop: true, fn: (t) => ({ j: { ...wingBeat(t, 0.7, 8), antennaL: [6 * S(t * 2), 0, 0], antennaR: [6 * S(t * 2 + 1), 0, 0], abdomen: [3 * S(t * 1.5), 0, 0] } }) },
  { name: 'walk', dur: 1, loop: true, fn: (t) => ({ j: { ...legsScurry(t, 3, 20), ...wingBeat(t, 0.7, 6) } }) },
  { name: 'run', dur: 1, loop: true, fn: (t) => ({ j: { ...legsScurry(t, 6, 25) } }) },
  { name: 'hop', dur: 0.9, fn: (t, k) => ({ j: { ...wingBeat(t, 12, 35) }, root: [0, k.H * 1.2 * S(clamp01(t / 0.9) * Math.PI), 0] }) },
  { name: 'flutter', dur: 1.6, fn: (t, k) => ({ j: { ...wingBeat(t, 14, 45 * env(t, 1.6, 0.2)) }, root: [0, k.H * 1.6 * S(clamp01(t / 1.6) * Math.PI), 0] }) },
  { name: 'spin', dur: 1.2, fn: (t) => ({ j: { ...legsScurry(t, 8, 25) }, rootRot: [0, 360 * smooth(0.1, 1.1, t), 0] }) },
];

const slither = (t: number, amp: number, hz: number): Record<string, Vec3> => {
  const j: Record<string, Vec3> = {};
  for (let i = 0; i < 8; i++) j[`seg${i}`] = [0, 0, amp * S(t * PI2 * hz - i * 0.8)];
  return j;
};
const SNAKE: Clip[] = [
  { name: 'idle', dur: 1, loop: true, fn: (t) => ({ j: { ...slither(t, 6, 0.4), head: [4 * S(t * 1.1), 12 * S(t * 0.5), 0] }, sc: { tongue: S(t * 2.3) > 0.85 ? 1 : 0.25 } }) },
  { name: 'walk', dur: 1, loop: true, fn: (t) => ({ j: slither(t, 14, 1.2), sc: { tongue: 0.25 } }) },
  { name: 'run', dur: 1, loop: true, fn: (t) => ({ j: slither(t, 18, 2.2), sc: { tongue: 0.25 } }) },
  {
    name: 'strike', dur: 1.4,
    fn: (t) => {
      const e = smooth(0.15, 0.3, t) * (1 - smooth(0.5, 1.2, t));
      return { j: { seg6: [-20 * e, 0, 0], seg7: [-25 * e, 0, 0], head: [30 * e, 0, 0] }, sc: { tongue: 0.3 + 0.7 * e } };
    },
  },
  { name: 'hiss', dur: 1.8, fn: (t) => ({ j: { seg6: [-15 * env(t, 1.8), 0, 0], seg7: [-20 * env(t, 1.8), 0, 0], head: [-10 * env(t, 1.8), 0, 0] }, sc: { tongue: S(t * 30) > 0 ? 1 : 0.4 } }) },
];

/* ----- props ----- */

const sway = (t: number, amp: number): Record<string, Vec3> => ({ top: [0, 0, amp * S(t * 0.9)], head: [0, 0, amp * 1.5 * S(t * 1.3)], stem: [0, 0, amp * 0.8 * S(t * 1.1)] });

const PROP: Clip[] = [
  // plants sway; parts named rotor (spins flat: helicopter, ceiling fan) and fan (spins facing you: windmill,
  // propeller, pinwheel) always turn
  { name: 'idle', dur: 1, loop: true, fn: (t, k) => ({ j: { ...(k.key === 'tree' || k.key === 'pine tree' || k.key === 'bush' || k.key === 'flower' ? sway(t, 1.5) : { top: [0, 0, 1.2 * S(t * 0.9)] }), rotor: [0, t * 420, 0], fan: [0, 0, t * 300] } }) },
  { name: 'walk', dur: 1, loop: true, fn: (t) => ({ j: { wheel: [t * 360, 0, 0] } }) },
  { name: 'run', dur: 1, loop: true, fn: (t) => ({ j: { wheel: [t * 900, 0, 0] } }) },
  {
    name: 'jiggle', dur: 1.2,
    fn: (t) => {
      const d = Math.exp(-t * 3.2) * clamp01(t * 12);
      return { rootRot: [0, 0, 7 * S(t * 20) * d], j: { top: [0, 0, 6 * S(t * 16) * d], head: [0, 0, 14 * S(t * 16) * d], stem: [0, 0, 10 * S(t * 14) * d] } };
    },
  },
  {
    name: 'door', dur: 2.6,
    fn: (t) => {
      const e = env(t, 2.6, 0.5);
      return { j: { door: [0, -100 * e, 0] } };
    },
  },
  {
    name: 'lid', dur: 2.2,
    fn: (t) => ({ j: { lid: [-95 * env(t, 2.2, 0.4), 0, 0] } }),
  },
  {
    name: 'crank', dur: 2.8,
    fn: (t) => {
      const up = S(clamp01(t / 2.8) * Math.PI);
      return { j: { crank: [t < 1.4 ? -t * 400 : -(2.8 - t) * 400, 0, 0] }, t: { bucket: [0, -0.35 + 0.35 * (1 - up), 0] } };
    },
  },
  {
    name: 'roll', dur: 1.6,
    fn: (t) => {
      const e = env(t, 1.6, 0.3);
      return { j: { wheel: [t * 540 * e, 0, 0] }, rootRot: [-8 * e, 0, 0] };
    },
  },
  {
    name: 'spin', dur: 1.2,
    fn: (t) => ({ rootRot: [0, 360 * smooth(0, 1.2, t), 0] }),
  },
];

const CLIPS: Record<Rig, Clip[]> = { biped: BIPED, quad: QUAD, bird: BIRD, dragon: DRAGON, fish: FISH, bug: BUG, snake: SNAKE, prop: PROP };

/** Reactions a click can trigger, by rig (props pick per kind). */
export function reactionsFor(fig: Figure): string[] {
  switch (fig.rig) {
    case 'biped':
      return ['wave', 'cheer', 'tada', 'point', 'shrug', 'jump', 'dance', 'think', 'scared', 'clap', 'bow', 'facepalm', 'stomp', 'laugh', 'love', 'yawn'];
    case 'quad':
      return fig.key === 'horse' ? ['rear', 'hop', 'look', 'shake', 'graze'] : fig.key === 'dog' ? ['wag', 'hop', 'look', 'shake'] : ['hop', 'look', 'shake', 'graze', 'wag'];
    case 'bird':
      return ['flap', 'peck', 'crow', 'peck'];
    case 'dragon':
      return ['roar', 'breathe', 'breathe', 'flap', 'roll'];
    case 'fish':
      return ['flip', 'dart', 'spin'];
    case 'bug':
      return fig.parts.some((p) => p.name === 'wingL') ? ['flutter', 'hop', 'spin'] : ['hop', 'spin'];
    case 'snake':
      return ['strike', 'hiss'];
    case 'prop':
      if (fig.parts.some((p) => p.name === 'door')) return ['door'];
      if (fig.parts.some((p) => p.name === 'crank')) return ['crank'];
      if (fig.parts.some((p) => p.name === 'lid')) return ['lid', 'jiggle'];
      if (fig.parts.some((p) => p.name === 'wheel')) return ['roll', 'jiggle'];
      if (fig.heightM < 1.2) return ['spin', 'jiggle', 'jiggle'];
      return ['jiggle'];
  }
}

export function clipNames(rig: Rig): string[] {
  return CLIPS[rig].map((c) => c.name);
}

function findClip(rig: Rig, name: string): Clip | undefined {
  return CLIPS[rig].find((c) => c.name === name);
}

export function samplePose(fig: Figure, name: string, t: number): Pose {
  const clip = findClip(fig.rig, name) ?? CLIPS[fig.rig][0];
  // loops run on continuous time (wrapping would jump any sine that is not a whole number of cycles per loop)
  const time = clip.loop ? t : Math.min(t, clip.dur);
  const p = clip.fn(time, { H: fig.heightM, key: fig.key });
  return { j: p.j ?? {}, t: p.t, sc: p.sc, root: p.root ?? [0, 0, 0], rootRot: p.rootRot ?? [0, 0, 0], expr: p.expr };
}

function blend(a: Pose, b: Pose, w: number): Pose {
  if (w <= 0) return a;
  if (w >= 1) return b;
  const lerp3 = (x: Vec3 | undefined, y: Vec3 | undefined): Vec3 => {
    const p = x ?? [0, 0, 0];
    const q = y ?? [0, 0, 0];
    return [p[0] + (q[0] - p[0]) * w, p[1] + (q[1] - p[1]) * w, p[2] + (q[2] - p[2]) * w];
  };
  const j: Record<string, Vec3> = {};
  for (const k of new Set([...Object.keys(a.j), ...Object.keys(b.j)])) j[k] = lerp3(a.j[k], b.j[k]);
  let t: Record<string, Vec3> | undefined;
  if (a.t || b.t) {
    t = {};
    for (const k of new Set([...Object.keys(a.t ?? {}), ...Object.keys(b.t ?? {})])) t[k] = lerp3(a.t?.[k], b.t?.[k]);
  }
  let sc: Record<string, number> | undefined;
  if (a.sc || b.sc) {
    sc = {};
    for (const k of new Set([...Object.keys(a.sc ?? {}), ...Object.keys(b.sc ?? {})])) {
      const x = a.sc?.[k] ?? b.sc?.[k] ?? 1;
      const y = b.sc?.[k] ?? a.sc?.[k] ?? 1;
      sc[k] = x + (y - x) * w;
    }
  }
  return { j, t, sc, root: lerp3(a.root, b.root), rootRot: lerp3(a.rootRot, b.rootRot), expr: w > 0.5 ? b.expr : a.expr };
}

export type Locomotion = 'idle' | 'walk' | 'run' | 'hover' | 'fly';

/** Drives one figure: a looping locomotion clip, cross-faded when it changes, plus one-shot reactions. */
export class Animator {
  private base: Locomotion = 'idle';
  private baseT: number;
  private prev: Locomotion | null = null;
  private prevT = 0;
  private fade = 1;
  private react: { name: string; t: number; dur: number; expr: Expr } | null = null;
  private blinkIn: number;
  private blinkLeft = 0;
  private talkLeft = 0;
  private clock = 0;
  private air = false;
  private speedNow = 0;
  /** Resting expression when nothing else is going on. */
  mood: Expr = 'neutral';

  constructor(
    readonly fig: Figure,
    private readonly rng: () => number = Math.random,
  ) {
    this.baseT = rng() * 10;
    this.blinkIn = 1 + rng() * 3;
  }

  get reacting(): string | null {
    return this.react?.name ?? null;
  }

  /** Off the ground: figures that can fly (a 'hover' clip) hover and fly instead of standing and walking. */
  setAirborne(air: boolean): void {
    if (air === this.air) return;
    this.air = air;
    this.setSpeed(this.speedNow);
  }

  /** Pick idle / walk / run (or hover / fly in the air) from speed in m/s (scaled for small things). */
  setSpeed(speed: number): void {
    this.speedNow = speed;
    const rel = speed / Math.max(0.35, Math.min(1.8, this.fig.heightM));
    const flies = this.air && !!findClip(this.fig.rig, 'hover');
    const next: Locomotion = flies ? (speed < 0.6 ? 'hover' : 'fly') : speed < 0.12 ? 'idle' : rel > 1.7 || speed > 3.2 ? 'run' : 'walk';
    if (next === this.base) return;
    this.prev = this.base;
    this.prevT = this.baseT;
    this.base = next;
    this.baseT = 0;
    this.fade = 0;
  }

  /** Play a reaction: a named clip, or a random one that suits this figure. */
  play(name?: string, expr?: Expr): string {
    const options = reactionsFor(this.fig);
    const pick = name && findClip(this.fig.rig, name) ? name : options[Math.floor(this.rng() * options.length)];
    const clip = findClip(this.fig.rig, pick)!;
    const suits = clip.expr ?? ['happy'];
    const e = expr ?? (this.rng() < 0.8 ? suits[Math.floor(this.rng() * suits.length)] : EXPRESSIONS[Math.floor(this.rng() * EXPRESSIONS.length)]);
    this.react = { name: pick, t: 0, dur: clip.dur, expr: e };
    return pick;
  }

  talk(seconds: number): void {
    this.talkLeft = Math.max(this.talkLeft, seconds);
  }

  update(dt: number): void {
    this.clock += dt;
    this.baseT += dt;
    if (this.prev) this.prevT += dt;
    this.fade = Math.min(1, this.fade + dt / 0.25);
    if (this.fade >= 1) this.prev = null;
    if (this.react) {
      this.react.t += dt;
      if (this.react.t >= this.react.dur) this.react = null;
    }
    this.talkLeft = Math.max(0, this.talkLeft - dt);
    if (this.blinkLeft > 0) this.blinkLeft -= dt;
    else if ((this.blinkIn -= dt) <= 0) {
      this.blinkLeft = 0.13;
      this.blinkIn = 2 + this.rng() * 3.5;
    }
  }

  pose(): Pose {
    let p = samplePose(this.fig, this.base, this.baseT);
    if (this.prev) p = blend(samplePose(this.fig, this.prev, this.prevT), p, this.fade);
    if (this.react) {
      const r = samplePose(this.fig, this.react.name, this.react.t);
      const w = smooth(0, 0.15, this.react.t) * (1 - smooth(this.react.dur - 0.2, this.react.dur, this.react.t));
      p = blend(p, r, this.fig.rig === 'prop' ? 1 : w);
    }
    return p;
  }

  /** The face to show now: talking and blinking win over the reaction's expression, which wins over the mood. */
  expression(): Expr {
    if (this.talkLeft > 0) return Math.floor(this.clock * 9) % 2 ? 'talk' : this.react?.expr ?? this.mood;
    const e = this.react && this.react.t < this.react.dur - 0.1 ? this.react.expr : this.base === 'run' ? 'determined' : this.mood;
    if (this.blinkLeft > 0 && e !== 'sleepy' && e !== 'laugh' && e !== 'wink' && e !== 'love') return 'blink';
    return e;
  }
}
