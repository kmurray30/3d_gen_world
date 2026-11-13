/**
 * Catalog chunk people-b: the words in assign/people-b.tsv (people, folk from stories and myths, and three things:
 * humpty dumpty on his wall, a shop mannequin, a mohawk on a display head).
 *
 * People stand at their real height in a rest pose that fits the role, carry their tools at real size, and when
 * clicked turn to the player and make a gesture with a line that matches it (`talk`). A rest pose is undone for
 * the length of an arm gesture and put back afterwards, so a saluting general can still point. Things people
 * really take off or put down are pieces (a hat, a ball, a bag) and things that switch or swing are movers (a
 * lantern, a laptop lid, a bin lid, a telescope).
 */
import { e, type CatalogEntry } from './types';
import { A, m, withAct, withSockets } from '../dsl';
import { body, face, hat, held, wear, who, type Extra, type WhoOpts } from '../accessories';
import { quadruped, type PersonDims } from '../kit';
import { col } from '../colors';
import { apply, euler, measure, mul, transpose } from '../math';
import { toEuler } from '../pose';
import type { FigPart, Figure, Shape, Vec3 } from '../types';
import type { Step } from '../../schema';

/* ----- local helpers: custom parts on a person, placed from its dimensions ----- */

type Spec = [parent: string, shape: Shape, size: Vec3, at: Vec3, color: string, o?: Partial<FigPart>];
/** Extra parts in a joint's frame (hips, torso, head, armL/R, foreL/R, handL/R, legL/R, shinL/R, footL/R; '' = figure
 *  space). o.name names a part (for acts), o.parent hangs it off another extra part (then `at` is in that part's
 *  joint frame). */
const x = (f: (d: PersonDims) => Spec[]): Extra => (p, d) => {
  for (const [parent, shape, size, at, c, o] of f(d)) p.add({ name: `x${p.list.length}`, parent: parent || undefined, shape, size, at, color: col(c, c), layer: 3, ...o });
};
/** Same as x, mirrored: f gets s = 1 (left, +x) and -1. Use side(s) for a sided joint name. */
const x2 = (f: (d: PersonDims, s: 1 | -1, side: 'L' | 'R') => Spec[]): Extra => (p, d) => {
  x((dd) => f(dd, 1, 'L'))(p, d);
  x((dd) => f(dd, -1, 'R'))(p, d);
};
/** Hide parts of the base person (legs under a tail, a missing head). */
const hide = (...names: string[]): Extra => (p) => {
  for (const q of p.list) if (names.includes(q.name)) q.scale = 0;
};
const LEGS = ['legL', 'legR', 'shinL', 'shinR', 'footL', 'footR'];
/** Stand the person on a round base `t` metres thick. */
const onBase = (c: string, t: number, wide = 2.4, o: Partial<FigPart> = {}): Extra => (p, d) => {
  const hips = p.list.find((q) => q.name === 'hips')!;
  hips.at = [hips.at[0], hips.at[1] + t, hips.at[2]];
  x(() => [['', 'cyl', [d.tw * wide, t, d.tw * wide * 0.8], [0, t / 2, 0], c, o]])(p, d);
};
/** Raise the whole person by t metres (floating, or standing on something drawn under them). */
const lift = (t: number): Extra => (p) => {
  const hips = p.list.find((q) => q.name === 'hips')!;
  hips.at = [hips.at[0], hips.at[1] + t, hips.at[2]];
};
/** A rod between two points in one joint's frame (as a Spec). */
const rod = (parent: string, a: Vec3, b: Vec3, t: number, c: string, o: Partial<FigPart> = {}): Spec => {
  const v: Vec3 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const L = Math.hypot(...v) || 1e-3;
  const rx = (Math.atan2(v[2] / L, v[1] / L) * 180) / Math.PI;
  const rz = (-Math.asin(Math.max(-1, Math.min(1, v[0] / L))) * 180) / Math.PI;
  return [parent, 'capsule', [t, L + t, t], [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2], c, { srot: [rx, 0, rz], ...o }];
};
const top = (d: PersonDims) => d.headY + d.headH * 0.42;
/** A fedora (brim, crown, band); name it to make it a hat that comes off. */
const fedora = (c: string, band = 'black', name?: string): Extra =>
  x((d) => {
    const W = d.headW, H = d.headH, D = d.headD, t = top(d);
    if (name)
      return [['head', 'cyl', [W * 1.5, H * 0.05, D * 1.45], [0, t - H * 0.06, 0], c, { name, piece: true }], [name, 'cyl', [W * 0.88, H * 0.4, D * 0.82], [0, H * 0.18, 0], c, { taper: 0.85 }], [name, 'cyl', [W * 0.9, H * 0.1, D * 0.84], [0, H * 0.06, 0], band]];
    return [['head', 'cyl', [W * 1.5, H * 0.05, D * 1.45], [0, t - H * 0.06, 0], c], ['head', 'cyl', [W * 0.88, H * 0.4, D * 0.82], [0, t + H * 0.12, 0], c, { taper: 0.85 }], ['head', 'cyl', [W * 0.9, H * 0.1, D * 0.84], [0, t + H * 0.0, 0], band]];
  });
/** A pointed cone hat (gnomes, wizards without a brim). */
const cone = (c: string, k = 1.1): Extra => x((d) => [['head', 'cyl', [d.headW * 1.12, d.headH * k, d.headD * 1.08], [0, top(d) + d.headH * (k / 2 - 0.12), 0], c, { taper: 0 }]]);
/** A card with text on the chest (jersey numbers, logos). */
const chest = (text: string, c = 'white', w = 0.5): Extra => x((d) => [['torso', 'box', [d.tw * w, d.torsoH * 0.32, d.td * 0.08], [0, d.torsoH * 0.58, d.td * 0.52], c, { role: 'label', text, layer: 6, round: 0.2 }]]);
/** A white shirt front under a jacket. */
const shirtFront = (c = 'white'): Extra => x((d) => [['torso', 'box', [d.tw * 0.3, d.torsoH * 0.5, d.td * 0.1], [0, d.torsoH * 0.7, d.td * 0.52], c, { layer: 4 }]]);
/** Jacket lapels: two dark strips framing the shirt front. */
const lapels = (c: string): Extra => x2((d, s) => [['torso', 'box', [d.tw * 0.14, d.torsoH * 0.5, d.td * 0.08], [s * d.tw * 0.21, d.torsoH * 0.72, d.td * 0.53], c, { srot: [0, 0, s * 12], layer: 5 }]]);
/** A flower on the lapel. */
const flower = (c = 'white'): Extra => x((d) => [['torso', 'ball', [d.tw * 0.14, d.tw * 0.14, d.td * 0.14], [d.tw * 0.3, d.torsoH * 0.78, d.td * 0.56], c, { layer: 6 }]]);
/** Gloves or big hands. */
const gloves = (c: string, k = 1.15): Extra => x2((d, _s, side) => [[`hand${side}`, 'ball', [d.aw * 1.25 * k, d.aw * 1.3 * k, d.aw * 1.0 * k], [0, -d.aw * 0.25, 0], c, { layer: 2 }]]);
/** Boots over the shins. */
const boots = (c: string): Extra => x2((d, _s, side) => [[`shin${side}`, 'capsule', [d.lw * 1.05, d.legLen * 0.32, d.lw * 1.05], [0, -d.legLen * 0.3, 0], c, { layer: 2 }]]);
/** Bands around the torso (stripes, reflective tape). */
const bands = (c: string, ys: number[], k = 0.07): Extra => x((d) => ys.map((y): Spec => ['torso', 'box', [d.tw * 1.08, d.torsoH * k, d.td * 1.12], [0, d.torsoH * y, 0], c, { noInk: true, layer: 4, round: 0.5 }]));
/** Bands around both shins and thighs (reflective tape on trousers). */
const legBands = (c: string): Extra => x2((d, _s, side) => [[`shin${side}`, 'cyl', [d.lw * 1.0, d.legLen * 0.06, d.lw * 1.0], [0, -d.legLen * 0.2, 0], c, { noInk: true }]]);
/** Shoulder pads or epaulettes. */
const shoulders = (c: string, k = 1): Extra => x2((d, s) => [['torso', 'ball', [d.tw * 0.42 * k, d.tw * 0.2 * k, d.td * 0.9 * k], [s * d.tw * 0.45, d.torsoH * 0.96, 0], c]]);
/** Earrings. */
const earrings = (c = 'gold'): Extra => x2((d, s) => [['head', 'torus', [d.headW * 0.2, d.headW * 0.2, d.headW * 0.05], [s * d.headW * 0.5, d.headY - d.headH * 0.24, 0], c, { tube: 0.25 }]]);
/** Bracelets around both forearms. */
const cuffs = (c: string): Extra => x2((d, _s, side) => [[`fore${side}`, 'cyl', [d.aw * 1.15, d.aw * 0.7, d.aw * 1.15], [0, -d.lower * 0.75, 0], c]]);
/** Pointy elf/goblin ears. */
const pointyEars = (c: string, k = 1): Extra => x2((d, s) => [['head', 'cyl', [d.headW * 0.18 * k, d.headH * 0.5 * k, d.headW * 0.09], [s * d.headW * 0.62, d.headY + d.headH * 0.08, -d.headD * 0.05], c, { taper: 0, srot: [0, 0, -s * 65] }]]);
/** A solid relative to the grip: shape, size, centre, colour, options. */
type Hold = [shape: Shape, size: Vec3, at: Vec3, color: string, o?: Partial<FigPart>];
/** A small object held in a hand hanging at the side, given as specs relative to the grip. */
const inHand = (side: 'L' | 'R', f: (a: number, d: PersonDims) => Hold[]): Extra =>
  x((d) => f(d.aw, d).map(([shape, size, at, c, o]): Spec => [`hand${side}`, shape, size, at, c, o]));

/** A rod between two points as a held solid (relative to the grip). */
const seg = (a: Vec3, b: Vec3, t: number, c: string, o: Partial<FigPart> = {}): Hold => {
  const r = rod('', a, b, t, c, o);
  return [r[1], r[2], r[3], r[4], r[5]];
};
/** A heart standing up facing forward, as held solids: two lobes and a point. */
const heartH = (at: Vec3, w: number, c: string): Hold[] => [
  ['ball', [w * 0.56, w * 0.56, w * 0.32], [at[0] + w * 0.22, at[1] + w * 0.12, at[2]], c],
  ['ball', [w * 0.56, w * 0.56, w * 0.32], [at[0] - w * 0.22, at[1] + w * 0.12, at[2]], c],
  ['cyl', [w * 0.8, w * 0.62, w * 0.32], [at[0], at[1] - w * 0.2, at[2]], c, { taper: 0, segs: 4, srot: [180, 45, 0] }],
];

/** Lean the upper body forward (degrees) and tip the head back up to look ahead. */
const lean = (deg: number, headDeg = -deg * 0.7): Extra => (p) => {
  for (const q of p.list) if (q.name === 'torso') q.rot = [deg, 0, 0];
  else if (q.name === 'head') q.rot = [headDeg, 0, 0];
};
/** Turn joints at rest (legs bent to sit or crouch, a tilted head). */
const joints = (r: Record<string, Vec3>): Extra => (p) => {
  for (const q of p.list) if (r[q.name]) q.rot = r[q.name];
};

/** A rifle or musket held upright: wooden stock below the fist, barrel above. */
const rifle = (side: 'L' | 'R' = 'R', stock = 'wood', barrel = 'iron'): Extra =>
  inHand(side, (a, d) => [['box', [a * 0.7, a * 3.4, a * 1.1], [0, -a * 1.4, a * 0.6], stock, { round: 0.4 }], ['capsule', [a * 0.35, d.H * 0.26, a * 0.35], [0, a * 0.3 + d.H * 0.13, a * 0.6], barrel]]);
/** Diamond patches on the chest (harlequins, jockey silks). */
const diamonds = (cs: string[]): Extra =>
  x((d) => {
    const out: Spec[] = [];
    [[-0.25, 0.3], [0.25, 0.3], [0, 0.55], [-0.25, 0.8], [0.25, 0.8]].forEach(([u, v], i) => out.push(['torso', 'box', [d.tw * 0.24, d.tw * 0.24, d.td * 0.06], [d.tw * u, d.torsoH * v, d.td * 0.52], cs[i % cs.length], { srot: [0, 0, 45], noInk: true, layer: 4, round: 0.1 }]));
    return out;
  });
/** A bicorne worn sideways (Napoleon, harlequins). */
const bicorne = (c: string, cockade?: string): Extra =>
  x((d) => {
    const out: Spec[] = [['head', 'wedge', [d.headW * 2.0, d.headH * 0.6, d.headD * 0.75], [0, top(d) + d.headH * 0.14, -d.headD * 0.05], c]];
    if (cockade) out.push(['head', 'ball', [d.headW * 0.2, d.headW * 0.2, d.headW * 0.08], [d.headW * 0.45, top(d) + d.headH * 0.12, d.headD * 0.33], cockade, { layer: 6 }]);
    return out;
  });

/* ----- rest poses, gestures and lines ----- */

type PoseName = NonNullable<WhoOpts['pose']>;
type ArmJoint = 'armL' | 'armR' | 'foreL' | 'foreR';
type Arms = Partial<Record<ArmJoint, Vec3>>;
type Rest = PoseName | Arms;
/** who()'s rest arm turns, copied so an act can free the arms for a gesture and put them back after. */
const POSES: Record<PoseName, Arms> = {
  wave: { armR: [-15, 0, -150], foreR: [-6, 0, 18], armL: [0, 0, 6], foreL: [0, 0, 0] },
  arms_up: { armR: [0, 0, -160], foreR: [0, 0, -10] },
  point: { armR: [-25, 0, -87], foreR: [0, 0, -4], armL: [0, 0, 6], foreL: [0, 0, 0] },
  hold: { armR: [-18, 0, -8], foreR: [-78, 0, 4] },
  hips: { armR: [-6, 0, -38], foreR: [-10, 0, 110] },
  reach: { armR: [-82, 0, -6], foreR: [-8, 0, 0] },
  cross: { armR: [-28, 0, -14], foreR: [-82, 0, 92] },
  salute: { armR: [-12, 0, -78], foreR: [-30, 0, -118], armL: [0, 0, 6], foreL: [0, 0, 0] },
};
/** The arms hanging naturally (the person kit's rest). */
const NATURAL: Required<Arms> = { armL: [0, 0, 6], armR: [0, 0, -6], foreL: [0, 0, 0], foreR: [0, 0, 0] };
const mir = (v: Vec3): Vec3 => [v[0], -v[1], -v[2]];
const ARM_JOINTS: ArmJoint[] = ['armR', 'foreR', 'armL', 'foreL'];
/** Every arm joint's rest turn for a rest pose (a who() pose name, custom turns, or none). */
function armsOf(r?: Rest): Required<Arms> {
  if (!r) return NATURAL;
  if (typeof r === 'string') {
    const a = POSES[r];
    return { armR: a.armR!, foreR: a.foreR!, armL: a.armL ?? mir(a.armR!), foreL: a.foreL ?? mir(a.foreR!) };
  }
  return { ...NATURAL, ...r };
}
/** Custom rest turns for the arms (use instead of who's pose; acts get the same object as their `rest`). */
const arms = (r: Arms): Extra => (p) => {
  for (const q of p.list) {
    const v = r[q.name as ArmJoint];
    if (v) q.rot = v;
  }
};
const posed = (r: Rest) => ARM_JOINTS.filter((j) => armsOf(r)[j].some((v, i) => v !== NATURAL[j][i]));
/** Steps that let the arms hang naturally (undoing the rest pose), and that put the rest pose back. */
const free = (r: Rest, dur = 0.35): Step[] => posed(r).map((j) => A.pose(j, { rot: [NATURAL[j][0] - armsOf(r)[j][0], NATURAL[j][1] - armsOf(r)[j][1], NATURAL[j][2] - armsOf(r)[j][2]], dur }));
const back = (r: Rest, dur = 0.45): Step[] => posed(r).map((j) => A.pose(j, { rot: [0, 0, 0], dur }));
/** Gestures that move the arms (they are played from the arms hanging naturally). */
const ARMY = new Set(['wave', 'point', 'clap', 'shrug', 'thumbs_up', 'cover_eyes', 'hands_on_hips', 'arms_up', 'dance', 'bow', 'look_around', 'laugh', 'cry', 'gasp', 'wink', 'hop']);
/** Turn to the player, make a gesture and say a line that goes with it; from a rest pose the arms are freed for
 *  an arm gesture and go back after. */
function talk(gesture: string, line: string, rest?: Rest, dur = 2.2): Step[] {
  const go = A.par(A.face('player'), A.anim(gesture), A.say(line, dur));
  const f = rest && ARMY.has(gesture) ? free(rest) : [];
  return f.length ? [A.par(...f), go, A.wait(0.35), A.par(...back(rest!))] : [go];
}
/** Give a figure its clicks (each a list of steps; they alternate) and an optional setup. */
const act = (fig: Figure, click: Step[][], setup?: Step[]): Figure => withAct(fig, setup ? { setup, click } : { click });
const near = { rel: 'front', of: 'self', dist: 'close' };

/**
 * Things held in a hand posed by `rest`, given the right way up: x to the person's left, y up, z forward, relative
 * to the grip. They are turned into the hand's frame, so a laptop stays level and a staff stays upright whatever
 * the arm does at rest. o.parent hangs one off another (its `at` and `off` then from that part's joint).
 */
const grip = (side: 'L' | 'R', rest: Rest | undefined, f: (a: number, d: PersonDims) => Hold[]): Extra =>
  x((d) => {
    const r = armsOf(rest);
    const Rt = transpose(mul(euler(r[`arm${side}`]), euler(r[`fore${side}`])));
    return f(d.aw, d).map(([shape, size, at, c, o = {}]): Spec => [`hand${side}`, shape, size, apply(Rt, at), c, { ...o, srot: toEuler(mul(Rt, euler(o.srot))), ...(o.off ? { off: apply(Rt, o.off) } : {}) }]);
  });
/** Upright pieces held in a posed hand: a straight pole from `down` below the grip to `up` above it. */
const pole = (side: 'L' | 'R', rest: Rest | undefined, up: number, down: number, thick: number, c: string, extra: (a: number, d: PersonDims, tip: number) => Hold[] = () => []): Extra =>
  grip(side, rest, (a, d) => [['capsule', [thick, up + down, thick], [0, (up - down) / 2, a * 0.3], c], ...extra(a, d, up)]);

/** Several people (or figures) side by side as one figure. */
const crowd = (key: string, members: Array<[Figure, number, number?]>): Figure => {
  const parts: FigPart[] = [];
  members.forEach(([f, dx, dz = 0], i) => {
    for (const q of f.parts) parts.push({ ...q, name: `m${i}_${q.name}`, parent: q.parent ? `m${i}_${q.parent}` : undefined, at: q.parent ? q.at : [q.at[0] + dx, q.at[1], q.at[2] + dz] });
  });
  return measure({ key, group: 'people', rig: 'prop', view: 'front', parts, face: members[0][0].face });
};

/** A horse at real size (1.55 m at the withers) with a mane, a saddle and a bridle; parts named h<kit name>. */
function horse(key: string, coat: string, mane: string, cloth?: string): FigPart[] {
  const f = quadruped(key, {
    color: col(coat), body: [1.55, 0.7, 0.5], legL: 0.92, legW: 0.13, hoof: '#2a2420', hoofH: 0.11, neckL: 0.68, neckLean: 34, neckW: 0.32, head: [0.6, 0.3, 0.27],
    snout: { len: 0.28, h: 0.22, w: 0.22 }, ears: 'pointy', earSize: 0.15, tail: 'long', tailColor: col(mane), tailAngle: 145,
    extras: (p) => {
      p.add({ name: 'mane', parent: 'neck', at: [0, 0.05, -0.15], rot: [-6, 0, 0], shape: 'capsule', size: [0.08, 0.85, 0.16], off: [0, 0.36, 0], color: col(mane), layer: -1 });
      p.add({ name: 'forelock', parent: 'head', at: [0, 0.2, 0.02], shape: 'ball', size: [0.12, 0.14, 0.16], color: col(mane), layer: 3 });
      p.add({ name: 'saddle', parent: 'body', at: [0, 0.34, 0.1], shape: 'box', size: [0.56, 0.12, 0.6], round: 0.5, color: col('#5a3a22'), layer: 2 });
      p.add({ name: 'pommel', parent: 'body', at: [0, 0.42, 0.36], shape: 'ball', size: [0.12, 0.14, 0.1], color: col('#5a3a22'), layer: 2 });
      p.add({ name: 'bridle', parent: 'head', at: [0, 0.02, 0.2], shape: 'torus', tube: 0.12, size: [0.3, 0.3, 0.04], srot: [0, 90, 0], color: col('#2a2726'), layer: 4 });
      for (const s of [1, -1]) p.add({ name: `stirrup${s > 0 ? 'L' : 'R'}`, parent: 'body', at: [s * 0.3, -0.25, 0.12], shape: 'torus', tube: 0.2, size: [0.12, 0.1, 0.03], srot: [0, 90, 0], color: col('silver'), layer: 3 });
      if (cloth) p.add({ name: 'caparison', parent: 'body', at: [0, -0.05, 0], shape: 'box', size: [0.6, 0.62, 1.5], round: 0.4, color: col(cloth), layer: 1 });
    },
  });
  return f.parts.map((q) => ({ ...q, name: `h${q.name}`, parent: q.parent ? `h${q.parent}` : undefined }));
}
/** A rider on a horse as one figure (profile view): the rider's hips hang off the horse's body, so the rider
 *  goes wherever the horse does; their legs part over its back. */
function mount(key: string, rider: Figure, steed: FigPart[], legs: { thigh?: number; spread?: number } = {}): Figure {
  const th = legs.thigh ?? -62, sp = legs.spread ?? 34;
  const parts: FigPart[] = [
    ...steed,
    ...rider.parts.map((q): FigPart => {
      if (q.name === 'hips') return { ...q, parent: 'hbody', at: [0, 0.47, 0.05] };
      if (q.name === 'legL' || q.name === 'legR') return { ...q, rot: [th, 0, q.name === 'legL' ? sp : -sp] };
      if (q.name === 'shinL' || q.name === 'shinR') return { ...q, rot: [-th + 8, 0, q.name === 'shinL' ? -sp * 0.65 : sp * 0.65] };
      return q;
    }),
  ];
  return measure({ key, group: 'people', rig: 'prop', view: 'side', parts, face: rider.face });
}

/* ----- clothes and kit the people below share ----- */

/** A cap with its peak at the back. */
const backCap = (c: string): Extra =>
  x((d) => [['head', 'ball', [d.headW * 1.08, d.headH * 0.5, d.headD * 1.04], [0, top(d) - d.headH * 0.08, 0], c], ['head', 'cyl', [d.headW * 0.8, d.headH * 0.04, d.headD * 0.55], [0, top(d) - d.headH * 0.2, -d.headD * 0.42], c, { layer: 4 }]]);
/** A peaked cap that comes off (name it 'cap'). */
const capPiece = (c: string, name = 'cap', peak = c): Extra =>
  x((d) => [['head', 'ball', [d.headW * 1.08, d.headH * 0.5, d.headD * 1.04], [0, top(d) - d.headH * 0.08, 0], c, { name, piece: true }], [name, 'cyl', [d.headW * 0.8, d.headH * 0.04, d.headD * 0.55], [0, -d.headH * 0.12, d.headD * 0.42], peak]]);
/** A wide-brimmed hat with a pinched crown (rangers, mounties). */
const campaignHat = (c: string, band = 'darkbrown'): Extra =>
  x((d) => {
    const W = d.headW, H = d.headH, D = d.headD, t = top(d);
    return [['head', 'cyl', [W * 1.8, H * 0.035, D * 1.75], [0, t - H * 0.07, 0], c, { edge: 'sharp' }], ['head', 'cyl', [W * 0.86, H * 0.42, D * 0.84], [0, t + H * 0.12, 0], c, { taper: 0.45, segs: 4, srot: [0, 45, 0] }], ['head', 'cyl', [W * 0.9, H * 0.08, D * 0.88], [0, t - H * 0.02, 0], band]];
  });
/** A three-cornered hat. */
const tricorn = (c: string, trim = 'gold'): Extra =>
  x((d) => {
    const W = d.headW, H = d.headH, D = d.headD, t = top(d);
    return [['head', 'cyl', [W * 1.75, H * 0.28, D * 1.75], [0, t + H * 0.06, -D * 0.02], c, { segs: 3, srot: [0, 180, 0], taper: 0.85 }], ['head', 'ball', [W * 0.85, H * 0.36, D * 0.8], [0, t + H * 0.1, 0], c], ['head', 'cyl', [W * 1.78, H * 0.04, D * 1.78], [0, t + H * 0.2, -D * 0.02], trim, { segs: 3, srot: [0, 180, 0], noInk: true }]];
  });
/** A statue's stone block under the person (it stands h metres up). */
const plinth = (c: string, w: number, h: number): Extra => (p, d) => {
  lift(h)(p, d);
  x(() => [['', 'box', [w, h, w * 0.85], [0, h / 2, 0], c, { edge: 'sharp', round: 0.12 }], ['', 'box', [w * 1.1, h * 0.12, w * 0.95], [0, h * 0.06, 0], c, { edge: 'sharp', round: 0.2 }], ['', 'box', [w * 1.06, h * 0.1, w * 0.92], [0, h * 0.95, 0], c, { edge: 'sharp', round: 0.2 }]])(p, d);
};
/** Bend both legs into a crouch (thighs forward, shins down), lowering the body to stay on the ground. */
const crouch = (k = 1): Extra => (p, d) => {
  const thigh = (d.legLen - d.H * 0.045) / 2;
  joints({ legL: [-80 * k, 0, 10], legR: [-80 * k, 0, -10], shinL: [80 * k, 0, 0], shinR: [80 * k, 0, 0] })(p, d);
  lift(-thigh * (1 - Math.cos((80 * k * Math.PI) / 180)))(p, d);
};

export const ENTRIES: CatalogEntry[] = [
  // Gridiron: navy helmet with a white stripe and a face cage, pads under the jersey, the ball in his right hand.
  // The ball is a piece: he winds up and throws it, and catches it back on the next click.
  e('football player', 'town', 'sports', () =>
    act(
      who('football player', {
        h: 1.85, build: 1.3, top: 'red', bottom: 'white', shoes: 'black', legs: 'red', style: 'short', hair: 'darkbrown',
        acc: [
          hat('helmet', 'navy'),
          x((d) => {
            const W = d.headW, H = d.headH, D = d.headD, y = d.headY;
            return [
              ['head', 'ball', [W * 0.16, H * 0.715, D * 1.13], [0, top(d) - H * 0.05, -D * 0.025], 'white', { noInk: true }],
              ['head', 'capsule', [W * 0.05, W * 0.8, W * 0.05], [0, y - H * 0.13, D * 0.56], 'lightgray', { srot: [0, 0, 90] }],
              ['head', 'capsule', [W * 0.05, W * 0.6, W * 0.05], [0, y - H * 0.28, D * 0.5], 'lightgray', { srot: [0, 0, 90] }],
              ['head', 'capsule', [W * 0.05, H * 0.28, W * 0.05], [0, y - H * 0.2, D * 0.55], 'lightgray'],
              rod('head', [W * 0.4, y - H * 0.13, D * 0.5], [W * 0.52, y + H * 0.02, D * 0.12], W * 0.05, 'lightgray'),
              rod('head', [-W * 0.4, y - H * 0.13, D * 0.5], [-W * 0.52, y + H * 0.02, D * 0.12], W * 0.05, 'lightgray'),
            ];
          }),
          shoulders('red', 1.3),
          chest('22', 'white', 0.45),
          x((d) => [['torso', 'box', [d.tw * 0.45, d.torsoH * 0.3, d.td * 0.08], [0, d.torsoH * 0.58, -d.td * 0.52], 'white', { role: 'label', text: '22', layer: -2 }]]),
          x2((d, _s, side) => [[`leg${side}`, 'box', [d.lw * 0.2, d.legLen * 0.4, d.lw * 1.04], [0, -d.legLen * 0.22, 0], 'red', { noInk: true }]]),
          grip('R', undefined, (a) => [
            ['ball', [a * 1.6, a * 1.6, a * 2.8], [0, -a * 0.2, a * 0.9], '#8a4a2a', { name: 'ball', piece: true }],
            ['box', [a * 0.14, a * 0.08, a * 1.1], [0, a * 0.78, 0], 'white', { parent: 'ball' }],
            ['box', [a * 1.62, a * 0.12, a * 0.12], [0, 0, a * 1.0], 'white', { parent: 'ball', noInk: true }],
          ]),
        ],
      }),
      [
        [A.par(A.face('player'), A.say('Hut, hut... hike!', 1.6), A.pose('armR', { rot: [-160, 0, 12], dur: 0.6 })), A.par(A.pose('armR', { rot: [-75, 0, 0], dur: 0.15 }), A.detach('ball', 'pass'), A.say('Go long!', 1.5)), A.move('pass', { rel: 'front', of: 'self', dist: 'far' }, { speed: 'fly', style: 'fly' }), A.pose('armR', { rot: [0, 0, 0], dur: 0.4 })],
        [A.reattach('ball'), ...talk('arms_up', 'Touchdown!')],
      ],
    ),
  ),
  // A park ranger in the flat-brimmed campaign hat, badge and binoculars, hands on hips; points out the trail,
  // reads the ground, and plants a sapling.
  e('forest ranger', 'town', 'outdoors', () =>
    act(
      who('forest ranger', {
        top: '#c9b07a', long: true, bottom: '#4a5a32', shoes: 'darkbrown', hair: 'brown', style: 'short', pose: 'hips',
        acc: [
          campaignHat('#b0905a'),
          wear('badge', 'gold'),
          wear('belt', 'darkbrown'),
          boots('darkbrown'),
          x2((d, s) => [['torso', 'box', [d.tw * 0.26, d.torsoH * 0.18, d.td * 0.06], [s * d.tw * 0.24, d.torsoH * 0.66, d.td * 0.53], '#b89c66', { layer: 4 }]]),
          x((d) => [
            ['armL', 'cyl', [d.aw * 0.8, d.aw * 0.15, d.aw * 0.8], [d.aw * 0.5, -d.upper * 0.25, 0], '#3f6a3a', { srot: [0, 0, 90], layer: 4 }],
            ['torso', 'cyl', [d.tw * 0.15, d.torsoH * 0.16, d.tw * 0.15], [d.tw * 0.09, d.torsoH * 0.36, d.td * 0.62], '#2a2726', { edge: 'sharp' }],
            ['torso', 'cyl', [d.tw * 0.15, d.torsoH * 0.16, d.tw * 0.15], [-d.tw * 0.09, d.torsoH * 0.36, d.td * 0.62], '#2a2726', { edge: 'sharp' }],
            ['torso', 'torus', [d.tw * 0.7, d.tw * 0.9, d.td * 0.04], [0, d.torsoH * 0.7, d.td * 0.42], '#2a2726', { srot: [70, 0, 0], tube: 0.05 }],
          ]),
        ],
      }),
      [
        talk('point', 'The trail is that way!', 'hips'),
        talk('look_around', 'Hmm... bear tracks.', 'hips'),
        [A.spawn('tree', 'sapling', near), ...talk('nod', 'Every tree counts!'), A.wait(1.5), A.remove('tree', 'sink')],
      ],
    ),
  ),
  // Behind a draped round table, hands hovering over her crystal ball: the ball is a light that glows when she
  // reads your future.
  e('fortune teller', 'town', 'entertainment', () => {
    const rest: Arms = { armR: [-55, 0, -12], foreR: [-30, 0, 6], armL: [-55, 0, 12], foreL: [-30, 0, -6] };
    return act(
      who('fortune teller', {
        top: 'magenta', long: true, skirt: 'purple', hair: 'black', style: 'long', shoes: 'darkbrown',
        acc: [
          hat('bandana', '#7a2a7a'),
          earrings(),
          wear('necklace', 'gold'),
          cuffs('gold'),
          arms(rest),
          x(() => [
            ['', 'cyl', [0.8, 0.46, 0.8], [0, 0.53, 0.55], '#4a2a6a', { taper: 0.93 }],
            ['', 'cyl', [0.74, 0.04, 0.74], [0, 0.765, 0.55], '#5a3a7a'],
            ['', 'torus', [0.81, 0.81, 0.03], [0, 0.32, 0.55], 'gold', { srot: [90, 0, 0], tube: 0.3, noInk: true }],
            ['', 'cyl', [0.15, 0.05, 0.15], [0, 0.81, 0.5], 'brass', { taper: 0.7 }],
            ['', 'ball', [0.22, 0.22, 0.22], [0, 0.93, 0.5], '#bfa8ff', { name: 'orb', role: 'glow', mover: { kind: 'light' } }],
            ['', 'box', [0.07, 0.004, 0.11], [0.2, 0.79, 0.68], 'cream', { srot: [0, 20, 0], edge: 'sharp' }],
            ['', 'box', [0.07, 0.004, 0.11], [-0.2, 0.79, 0.7], '#7a2a3a', { srot: [0, -15, 0], edge: 'sharp' }],
          ]),
        ],
      }),
      [
        [A.par(A.face('player'), A.operate('orb', 'on'), A.effect('sparkle', { dur: 2.5 }), A.say('I see... a long journey ahead.', 2.8)), A.wait(2.6), A.operate('orb', 'off')],
        talk('point', 'You will meet a tall stranger!', rest),
      ],
    );
  }),
  // Cap on backwards, Greek letters on his shirt, a red party cup held up.
  e('fraternity brother', 'town', 'school', () => {
    const rest: Arms = { armR: [-30, 0, -12], foreR: [-80, 0, 6] };
    return act(
      who('fraternity brother', {
        top: 'navy', bottom: '#c9b28a', shorts: true, shoes: 'white', style: 'short', hair: '#a0522d',
        acc: [
          backCap('red'),
          chest('ΣΑΕ', 'navy', 0.6),
          arms(rest),
          grip('R', rest, (a) => [
            ['cyl', [a * 0.95, a * 1.25, a * 0.95], [0, a * 0.35, a * 0.55], '#d23a2a', { taper: 1.3 }],
            ['cyl', [a * 1.2, a * 0.08, a * 1.2], [0, a * 0.98, a * 0.55], 'white', { noInk: true }],
          ]),
        ],
      }),
      [talk('arms_up', 'Party at our house!', rest), talk('tada', 'Welcome to the house, bro!', rest)],
    );
  }),
  // Galileo in his scholar's gown and ruff beside his telescope on its tripod (a leather tube about a metre long
  // that tips up to the sky).
  e('galileo', 'town', 'history', () =>
    act(
      who('galileo', {
        h: 1.65, top: 'black', long: true, bottom: 'black', shoes: 'black', hair: 'lightgray', style: 'short', beard: 'lightgray',
        acc: [
          face('beard', 'lightgray'),
          face('mustache', 'lightgray'),
          wear('robe', '#2a2420'),
          x((d) => [['torso', 'torus', [d.tw * 0.7, d.tw * 0.7, d.td * 0.28], [0, d.torsoH * 0.99, 0], 'white', { srot: [90, 0, 0], tube: 0.45 }]]),
          x(() => {
            const hx = 0.62, hy = 1.3, hz = 0.2;
            return [
              ...[0, 120, 240].map((deg): Spec => {
                const r = (deg * Math.PI) / 180;
                return rod('', [hx, hy, hz], [hx + Math.sin(r) * 0.42, 0.02, hz + Math.cos(r) * 0.42], 0.03, 'darkwood');
              }),
              ['', 'ball', [0.09, 0.09, 0.09], [hx, hy, hz], 'brass', { name: 'mount' }],
              ['mount', 'cyl', [0.075, 1.05, 0.075], [0, 0.06, 0], '#7a4a2a', { name: 'scope', srot: [60, 0, 0], off: [0, 0.06, 0.1], taper: 1.25, mover: { kind: 'swing', axis: 'x', amount: -22 } }],
              ['scope', 'cyl', [0.1, 0.05, 0.1], [0, 0.32, 0.55], 'brass', { srot: [60, 0, 0] }],
              ['scope', 'cyl', [0.06, 0.05, 0.06], [0, -0.2, -0.36], 'brass', { srot: [60, 0, 0] }],
            ];
          }),
        ],
      }),
      [
        [A.operate('scope', 'open'), ...talk('look_around', 'Jupiter has four moons!'), A.operate('scope', 'close')],
        talk('shrug', 'And yet it moves.'),
      ],
    ),
  ),
  // Green visor, red waistcoat, sleeve garters and a fan of cards: he rolls dice for a seven.
  e('gambler', 'town', 'entertainment', () => {
    const rest: Arms = { armL: [-22, 0, 10], foreL: [-72, 0, -10] };
    return act(
      who('gambler', {
        top: 'white', long: true, bottom: 'black', shoes: 'black', style: 'short', hair: 'black',
        acc: [
          wear('vest', 'darkred'),
          wear('bowtie', 'black'),
          face('mustache', 'black'),
          x((d) => [['head', 'cyl', [d.headW * 1.08, d.headH * 0.1, d.headD * 1.04], [0, top(d) - d.headH * 0.17, 0], 'green'], ['head', 'box', [d.headW * 0.95, d.headH * 0.03, d.headD * 0.55], [0, top(d) - d.headH * 0.17, d.headD * 0.62], '#4fbf6a', { srot: [-15, 0, 0], noInk: true }]]),
          x2((d, _s, side) => [[`arm${side}`, 'cyl', [d.aw * 1.15, d.aw * 0.4, d.aw * 1.15], [0, -d.upper * 0.45, 0], '#d23a2a', { noInk: true }]]),
          arms(rest),
          grip('L', rest, (a) => [-30, -10, 10, 30].map((r, i): Hold => ['box', [a * 0.9, a * 1.3, a * 0.03], [r * a * 0.012, a * 0.75, a * (0.4 + i * 0.03)], i === 3 ? '#d23a2a' : 'white', { srot: [-55, 0, -r], edge: 'sharp', round: 0.2 }])),
        ],
      }),
      [
        [...talk('clap', 'Come on, lucky seven!', rest), A.spawn('dice', 'dice', near), A.anim('spin', 2, 'dice'), A.say('Seven! Ha!', 1.5), A.wait(1.2), A.remove('dice', 'pop')],
        talk('laugh', "Read 'em and weep!", rest),
      ],
    );
  }),
  // In a hoodie with headphones round his neck, showing you his game on an open laptop: the lid swings and the
  // screen lights up.
  e('game developer', 'town', 'office', () => {
    const rest: Arms = { armL: [-14, 0, 8], foreL: [-74, 0, -6] };
    return act(
      who('game developer', {
        top: '#3a3f4a', long: true, bottom: 'denim', shoes: 'white', style: 'short', hair: '#3b2a1e', beard: '#3b2a1e',
        acc: [
          face('glasses', 'black'),
          x((d) => [['torso', 'torus', [d.tw * 0.75, d.tw * 0.7, d.td * 0.25], [0, d.torsoH * 0.98, 0], 'black', { srot: [90, 0, 0], tube: 0.18 }], ...[1, -1].map((s): Spec => ['torso', 'cyl', [d.tw * 0.2, d.tw * 0.1, d.tw * 0.2], [s * d.tw * 0.28, d.torsoH * 0.92, d.td * 0.35], 'black', { srot: [90, 0, s * 20] }])]),
          x((d) => [['torso', 'box', [d.tw * 0.5, d.torsoH * 0.2, d.td * 0.08], [0, d.torsoH * 0.25, d.td * 0.52], '#4a505c', { round: 0.4 }]]),
          arms(rest),
          grip('L', rest, (a) => [
            ['box', [0.32, 0.018, 0.22], [-a * 0.9, a * 0.35, a * 0.9], 'silver', { edge: 'sharp', round: 0.2 }],
            ['box', [0.32, 0.012, 0.21], [-a * 0.9, a * 0.35 + 0.012, a * 0.9 - 0.11], 'silver', { name: 'lid', edge: 'sharp', round: 0.2, off: [0, 0.004, 0.105], mover: { kind: 'swing', axis: 'x', amount: -100, on: true } }],
            ['box', [0.29, 0.004, 0.18], [0, -0.003, 0.105], '#6fd3e8', { parent: 'lid', name: 'screen', role: 'glow', noInk: true, mover: { kind: 'light', on: true } }],
          ]),
        ],
      }),
      [
        talk('nod', 'Wanna play my game? Level one is done!'),
        [A.operate('screen', 'off'), ...talk('cover_eyes', 'Ugh... it crashed again.', rest), A.operate('screen', 'on')],
        [A.operate('lid', 'close'), ...talk('thumbs_up', 'Saved! Time for pizza!', rest), A.operate('lid', 'open')],
      ],
    );
  }),
  // A glittering suit, a microphone up by his chin and a stack of cue cards.
  e('game show host', 'town', 'entertainment', () => {
    const rest: Arms = { armR: [-28, 0, -14], foreR: [-108, 0, 8] };
    return act(
      who('game show host', {
        h: 1.78, top: 'white', long: true, bottom: '#5a2a8a', shoes: 'black', hair: 'darkbrown', style: 'short',
        acc: [
          wear('suit', '#6a35a8'),
          lapels('#3a1a5a'),
          wear('bowtie', 'gold'),
          x((d) => [[0.3, 0.2], [-0.3, 0.3], [0.32, 0.55], [-0.25, 0.62], [0.05, 0.12], [-0.05, 0.42]].map(([u, v]): Spec => ['torso', 'ball', [d.tw * 0.06, d.tw * 0.06, d.td * 0.05], [d.tw * u, d.torsoH * v, d.td * 0.55], 'gold', { noInk: true, layer: 6, role: 'glow' }])),
          arms(rest),
          grip('R', rest, (a) => [['capsule', [a * 0.35, a * 1.7, a * 0.35], [0, a * 0.5, a * 0.3], 'black'], ['ball', [a * 0.7, a * 0.75, a * 0.7], [0, a * 1.45, a * 0.3], '#5c6166']]),
          grip('L', undefined, (a) => [['box', [a * 1.6, a * 2.2, a * 0.2], [0, -a * 0.2, a * 0.9], '#f2c14e', { srot: [-15, 0, 0], edge: 'sharp', round: 0.15 }]]),
        ],
      }),
      [
        talk('tada', 'Come on down!', rest),
        talk('point', "Let's spin the wheel!", rest),
        [A.spawn('c', 'confetti', near), ...talk('clap', 'And the winner is... YOU!', rest), A.remove('c', 'fade')],
      ],
    );
  }),
  // Headset with a boom mic, a controller in both hands (held level in front of him).
  e('gamer', 'town', 'hobbies', () =>
    act(
      who('gamer', {
        top: '#3fa75a', long: true, bottom: 'darkgray', shoes: 'white', hair: '#5a3a22', style: 'short', pose: 'hold',
        acc: [
          hat('headphones', '#2a2726'),
          x((d) => [rod('head', [d.headW * 0.55, d.headY - d.headH * 0.05, 0], [d.headW * 0.3, d.headY - d.headH * 0.3, d.headD * 0.5], d.headW * 0.05, '#2a2726'), ['head', 'ball', [d.headW * 0.1, d.headW * 0.1, d.headW * 0.1], [d.headW * 0.28, d.headY - d.headH * 0.31, d.headD * 0.53], 'lime', { role: 'glow' }]]),
          x((d) => [['torso', 'box', [d.tw * 0.4, d.torsoH * 0.18, d.td * 0.08], [0, d.torsoH * 0.6, d.td * 0.52], '#2a2726', { role: 'label', text: 'GG', layer: 6 }]]),
          grip('R', 'hold', (a) => [
            ['box', [a * 2.6, a * 0.6, a * 1.3], [-a * 0.9, a * 0.4, a * 0.4], '#2a2726', { round: 0.6 }],
            ['ball', [a * 0.9, a * 0.7, a * 1.3], [a * 0.2, a * 0.3, a * 0.2], '#2a2726'],
            ['ball', [a * 0.9, a * 0.7, a * 1.3], [-a * 2.0, a * 0.3, a * 0.2], '#2a2726'],
            ['ball', [a * 0.3, a * 0.2, a * 0.3], [-a * 0.4, a * 0.72, a * 0.5], 'red', { noInk: true }],
            ['ball', [a * 0.3, a * 0.2, a * 0.3], [-a * 1.4, a * 0.72, a * 0.5], 'lime', { noInk: true }],
          ]),
        ],
      }),
      [talk('arms_up', 'GG! We won!', 'hold'), talk('cover_eyes', 'Noooo... lag!', 'hold')],
    ),
  ),
  // Pinstripes, a fedora and a violin case that is surely full of violin.
  e('gangster', 'town', 'crime', () =>
    act(
      who('gangster', {
        top: '#2a2a30', long: true, bottom: '#3a3a44', shoes: 'black', style: 'short', hair: 'black',
        acc: [
          wear('suit', '#3a3a44'),
          x((d) => [-0.36, -0.2, 0.2, 0.36].map((u): Spec => ['torso', 'box', [d.tw * 0.02, d.torsoH * 0.95, d.td * 0.04], [d.tw * u, d.torsoH * 0.5, d.td * 0.56], '#8a8a96', { noInk: true, layer: 4 }])),
          x((d) => [['torso', 'box', [d.tw * 0.09, d.torsoH * 0.42, d.td * 0.08], [0, d.torsoH * 0.66, d.td * 0.6], 'white', { layer: 5 }]]),
          fedora('#2a2a30', 'white', 'hat'),
          x((d) => [['torso', 'ball', [d.tw * 0.14, d.tw * 0.1, d.td * 0.1], [d.tw * 0.3, d.torsoH * 0.78, d.td * 0.56], 'red', { layer: 6 }]]),
          grip('R', undefined, (a) => [
            ['box', [a * 0.3, a * 0.5, a * 1.0], [0, -a * 0.3, a * 0.2], '#2a2726', { edge: 'sharp', round: 0.3 }],
            ['box', [a * 1.0, a * 2.0, a * 7.0], [0, -a * 1.5, a * 0.6], '#2a2726', { round: 0.45 }],
            ['ball', [a * 1.05, a * 2.5, a * 2.8], [0, -a * 1.5, -a * 2.2], '#2a2726'],
            ['box', [a * 0.3, a * 0.3, a * 0.12], [0, -a * 1.2, a * 4.1], 'silver', { edge: 'sharp' }],
          ]),
        ],
      }),
      [
        talk('shake_head', 'Fuggedaboutit.'),
        [A.pose('hat', { move: [0, 0.03, 0], rot: [-15, 0, 0], dur: 0.3 }), ...talk('nod', "Nice town. Shame if somethin' happened to it."), A.pose('hat', { move: [0, 0, 0], rot: [0, 0, 0], dur: 0.3 })],
        talk('hands_on_hips', "Whaddaya lookin' at?"),
      ],
    ),
  ),
  // Hi-vis orange with reflective tape, gloves, and a full bin bag (a piece: he slings it into the truck).
  e('garbage man', 'town', 'city workers', () =>
    act(
      who('garbage man', {
        h: 1.8, top: 'orange', long: true, bottom: '#1f3a5f', shoes: 'black', style: 'short', hair: '#2a1d16',
        acc: [
          hat('cap', 'orange'),
          bands('#e8eef0', [0.3, 0.5], 0.06),
          x2((d, _s, side) => [[`arm${side}`, 'cyl', [d.aw * 1.14, d.upper * 0.12, d.aw * 1.14], [0, -d.upper * 0.5, 0], '#e8eef0', { noInk: true }]]),
          legBands('#e8eef0'),
          gloves('#e8c43a'),
          boots('black'),
          grip('R', undefined, (a) => [
            ['ball', [a * 3.4, a * 4.4, a * 3.0], [0, -a * 2.9, a * 0.6], '#2a2726', { name: 'bag', piece: true }],
            ['cyl', [a * 0.9, a * 1.0, a * 0.9], [0, a * 2.4, 0], '#2a2726', { parent: 'bag', taper: 0.4 }],
          ]),
        ],
      }),
      [
        [A.reattach('bag'), ...talk('wave', "Morning! It's trash day!")],
        [A.par(A.face('player'), A.say('Heave-ho!', 1.5), A.pose('armR', { rot: [-140, 0, 0], dur: 0.4 })), A.par(A.detach('bag', 'trash'), A.pose('armR', { rot: [0, 0, 0], dur: 0.4 })), A.move('trash', { rel: 'behind', of: 'self', dist: 'near' }, { speed: 'fly', style: 'fly' })],
      ],
    ),
  ),
  // With a real wheelie bin (1.07 m tall, lid on a hinge, wheels at the back): the bag goes in, the lid shuts.
  e('garbage woman', 'town', 'city workers', () =>
    act(
      withSockets(
        who('garbage woman', {
          h: 1.66, top: 'orange', long: true, bottom: '#1f3a5f', shoes: 'black', style: 'ponytail', hair: '#7a3b1e',
          acc: [
            hat('cap', 'orange'),
            bands('#e8eef0', [0.3, 0.5], 0.06),
            legBands('#e8eef0'),
            gloves('#e8c43a'),
            boots('black'),
            x(() => {
              const bx = -0.7, bz = 0.05;
              return [
                ['', 'box', [0.58, 0.95, 0.7], [bx, 0.555, bz], '#2f7a3a', { name: 'bin', edge: 'sharp', round: 0.1 }],
                ['', 'box', [0.6, 0.06, 0.06], [bx, 0.97, bz + 0.33], '#24602d', { edge: 'sharp' }],
                ['', 'box', [0.64, 0.05, 0.78], [bx, 1.05, bz - 0.38], '#24602d', { name: 'lid', edge: 'sharp', round: 0.3, off: [0, 0, 0.38], mover: { kind: 'swing', axis: 'x', amount: -110 } }],
                ['', 'capsule', [0.04, 0.5, 0.04], [bx, 0.99, bz - 0.4], '#24602d', { srot: [0, 0, 90] }],
                ...[1, -1].map((s): Spec => ['', 'cyl', [0.2, 0.05, 0.2], [bx + s * 0.31, 0.1, bz - 0.3], 'rubber', { srot: [0, 0, 90], name: s > 0 ? 'wheelL' : 'wheelR' }]),
                ['', 'box', [0.3, 0.12, 0.02], [bx, 0.75, bz + 0.36], 'white', { role: 'label', text: '♻', edge: 'sharp' }],
              ];
            }),
          ],
        }),
        [{ name: 'bin', at: [-0.7, 0.6, 0.05], kind: 'inside', size: 0.6 }],
      ),
      [
        [A.operate('lid', 'open'), A.spawn('bag', 'garbage bag', near), A.attach('bag', 'self', 'bin'), ...talk('nod', 'In you go!'), A.operate('lid', 'close'), A.remove('bag')],
        talk('thumbs_up', 'Keep our streets clean!'),
      ],
    ),
  ),
  // A glazed garden gnome 40 cm tall on his little base: red hat, white beard, a fishing rod and a toadstool.
  e('garden gnome', 'garden', 'garden decor', () =>
    act(
      who('garden gnome', {
        h: 0.37, build: 1.45, head: 1.15, skin: '#f6cfae', top: '#3f6fc4', long: true, bottom: '#7a4a2a', shoes: '#2a2726', hair: 'white', style: 'short', blush: '#ff7a7a',
        acc: [
          cone('#d23a2a', 1.3),
          face('longbeard', 'white'),
          wear('belt', '#2a2726'),
          x((d) => [['hips', 'box', [d.tw * 0.24, d.lw * 0.4, d.td * 0.1], [0, d.lw * 0.3, d.td * 0.55], 'gold', { edge: 'sharp' }]]),
          grip('R', undefined, (a, d) => [seg([0, -a * 0.6, a * 0.3], [0, d.H * 0.75, d.H * 0.35], a * 0.25, 'darkwood'), ['capsule', [a * 0.08, d.H * 0.6, a * 0.08], [0, d.H * 0.43, d.H * 0.37], 'white', { noInk: true }]]),
          onBase('#8a8f7a', 0.025, 2.6),
          x((d) => [['', 'cyl', [d.tw * 0.18, d.H * 0.12, d.tw * 0.18], [d.tw * 0.95, 0.025 + d.H * 0.06, d.tw * 0.3], 'cream'], ['', 'dome', [d.tw * 0.55, d.H * 0.1, d.tw * 0.55], [d.tw * 0.95, 0.025 + d.H * 0.12, d.tw * 0.3], '#d23a2a']]),
        ],
      }),
      [
        [A.anim('wobble'), A.effect('sparkle', { dur: 1 })],
        [A.par(A.face('player'), A.anim('hop'), A.say('Psst... I moved!', 2))],
      ],
    ),
  ),
  // Straw hat, apron and gloves, a galvanised watering can that tips to water, and a trowel.
  e('gardener', 'town', 'trades', () =>
    act(
      who('gardener', {
        top: '#5a9a4a', long: true, bottom: '#c9b28a', shoes: 'darkbrown', hair: '#7a3b1e', style: 'ponytail',
        acc: [
          hat('straw'),
          wear('apron', '#3f6a3a'),
          x((d) => [['torso', 'box', [d.tw * 0.4, d.torsoH * 0.18, d.td * 0.06], [0, d.torsoH * 0.2, d.td * 0.62], '#355a32', { layer: 5 }]]),
          gloves('#e8c43a'),
          boots('#3f6a3a'),
          grip('L', undefined, (a) => [
            ['cyl', [a * 2.4, a * 2.3, a * 1.9], [0, -a * 1.9, a * 0.4], '#7fb0a8', { name: 'can', off: [0, -a * 1.9, a * 0.4], edge: 'sharp', mover: { kind: 'swing', axis: 'x', amount: 40 } }],
            ['arc', [a * 2.2, a * 1.3, a * 0.3], [0, 0, 0], '#6a9a92', { parent: 'can', off: [0, -a * 0.95, a * 0.1], srot: [0, 90, 0], tube: 0.2 }],
            ['capsule', [a * 0.35, a * 2.6, a * 0.35], [0, 0, 0], '#7fb0a8', { parent: 'can', off: [0, -a * 1.9, a * 2.3], srot: [55, 0, 0] }],
            ['cyl', [a * 0.8, a * 0.3, a * 0.8], [0, 0, 0], '#6a9a92', { parent: 'can', off: [0, -a * 1.15, a * 3.4], srot: [55, 0, 0] }],
          ]),
          grip('R', undefined, (a) => [['capsule', [a * 0.35, a * 1.2, a * 0.35], [0, 0, a * 0.3], 'wood'], ['box', [a * 0.7, a * 1.4, a * 0.12], [0, -a * 1.2, a * 0.4], 'silver', { edge: 'sharp', round: 0.6 }]]),
        ],
      }),
      [
        [A.par(A.face('player'), A.operate('can', 'open'), A.say('A drink for my roses!', 2)), A.effect('water_spray', { dur: 2 }), A.wait(1.8), A.operate('can', 'close')],
        [A.spawn('f', 'flower', near), A.anim('pulse', 1, 'f'), ...talk('thumbs_up', 'Look, it bloomed!'), A.wait(1), A.remove('f', 'sink')],
      ],
    ),
  ),
  // A stone gargoyle crouched on its plinth, hands on its knees, horns and bat wings: its eyes light up red and
  // its wings spread when it wakes.
  e('gargoyle', 'fantasy', 'monsters', () => {
    const rest: Arms = { armR: [-58, 0, -12], foreR: [-25, 0, 6], armL: [-58, 0, 12], foreL: [-25, 0, -6] };
    return act(
      who('gargoyle', {
        h: 1.3, build: 1.3, skin: '#8c8c86', top: '#8c8c86', bottom: '#8c8c86', shoes: '#7d7d78', style: 'bald', eyes: '#4a4a46', blush: '#8c8c86',
        acc: [
          hat('horns', '#6e6e69'),
          pointyEars('#8c8c86', 1.2),
          x((d) => [['head', 'ball', [d.headW * 0.5, d.headH * 0.3, d.headD * 0.35], [0, d.headY - d.headH * 0.12, d.headD * 0.4], '#7d7d78'], ['head', 'box', [d.headW * 0.8, d.headH * 0.12, d.headD * 0.2], [0, d.headY + d.headH * 0.16, d.headD * 0.42], '#7d7d78', { round: 0.6 }]]),
          x2((d, s, side) => [
            ['head', 'ball', [d.headW * 0.12, d.headW * 0.1, d.headW * 0.06], [s * d.headW * 0.2, d.headY + d.headH * 0.04, d.headD * 0.5], '#ff3a2a', { name: `eye${side}`, role: 'glow', noInk: true, mover: { kind: 'light' } }],
            ['torso', 'wedge', [d.tw * 1.6, d.torsoH * 1.3, d.td * 0.08], [s * d.tw * 0.2, d.torsoH * 0.82, -d.td * 0.55], '#7d7d78', { name: `wing${side}`, apex: s * 0.5, off: [s * d.tw * 0.8, d.torsoH * 0.1, 0], rot: [0, s * 45, 0] }],
            [`hand${side}`, 'cyl', [d.aw * 0.25, d.aw * 0.6, d.aw * 0.25], [0, -d.aw * 0.8, d.aw * 0.3], '#6e6e69', { taper: 0, srot: [150, 0, 0] }],
          ]),
          body('tail', '#8c8c86'),
          arms(rest),
          lean(22, -18),
          crouch(),
          plinth('#9a968c', 0.9, 0.5),
        ],
      }),
      [
        [A.par(A.anim('shake'), A.effect('dust', { dur: 1.5 }), A.say('Grrr...', 1.5))],
        [A.par(A.face('player'), A.operate('eyes', 'on'), A.pose('wingL', { rot: [0, -45, 10], dur: 0.6 }), A.pose('wingR', { rot: [0, 45, -10], dur: 0.6 }), A.say('Who disturbs my rest?', 2.5)), A.wait(2.2), A.par(A.operate('eyes', 'off'), A.pose('wingL', { rot: [0, 0, 0], dur: 0.8 }), A.pose('wingR', { rot: [0, 0, 0], dur: 0.8 }))],
      ],
    );
  }),
  // Short sleeves, pocket protector full of pens, braces and a bow tie; one finger raised.
  e('geek', 'town', 'everyday people', () => {
    const rest: Arms = { armR: [-30, 0, -22], foreR: [-115, 0, 6] };
    return act(
      who('geek', {
        top: 'white', bottom: '#c9b28a', shoes: 'brown', style: 'short', hair: '#3b2a1e', glasses: 'black',
        acc: [
          face('glasses', 'black'),
          wear('bowtie', 'red'),
          x((d) => [
            ['torso', 'box', [d.tw * 0.2, d.torsoH * 0.18, d.td * 0.06], [d.tw * 0.25, d.torsoH * 0.68, d.td * 0.53], '#4f8fd6', { layer: 5, edge: 'sharp' }],
            ...[-1, 0, 1].map((i): Spec => ['torso', 'capsule', [d.tw * 0.03, d.torsoH * 0.12, d.tw * 0.03], [d.tw * (0.25 + i * 0.05), d.torsoH * 0.77, d.td * 0.56], ['red', 'black', 'blue'][i + 1], { layer: 6 }]),
            ...[1, -1].map((s): Spec => ['torso', 'box', [d.tw * 0.07, d.torsoH * 1.0, d.td * 1.12], [s * d.tw * 0.22, d.torsoH * 0.5, 0], '#c43a3a', { layer: 4 }]),
            ['hips', 'box', [d.tw * 1.02, d.lw * 0.9, d.td * 1.05], [0, d.lw * 0.45, 0], '#c9b28a', { layer: 2 }],
          ]),
          arms(rest),
          grip('L', undefined, (a) => [['box', [a * 0.5, a * 2.6, a * 2.0], [-a * 0.2, -a * 0.6, a * 0.4], '#2f5aa8', { edge: 'sharp', round: 0.15 }], ['box', [a * 0.46, a * 2.5, a * 1.9], [-a * 0.06, -a * 0.6, a * 0.4], 'cream', { edge: 'sharp' }]]),
        ],
      }),
      [
        talk('shake_head', "Um, actually... that's not quite right."),
        talk('nod', "Did you know owls can't move their eyes?"),
        talk('laugh', 'Ha! I made a science joke!', rest),
      ],
    );
  }),
  // A kimono with a wide golden obi tied in a bow at the back, white make-up, pinned hair, an open fan.
  e('geisha', 'town', 'arts', () =>
    act(
      who('geisha', {
        h: 1.6, skin: '#f8f1ea', hair: 'black', style: 'bun', top: '#c8323c', long: true, bottom: '#c8323c', shoes: 'white', blush: '#e86a7a', pose: 'hold',
        acc: [
          wear('robe', '#c8323c'),
          x((d) => [
            ['torso', 'box', [d.tw * 1.12, d.torsoH * 0.3, d.td * 1.16], [0, d.torsoH * 0.24, 0], '#e2b84a', { layer: 2, round: 0.3 }],
            ['torso', 'ball', [d.tw * 0.9, d.torsoH * 0.32, d.td * 0.5], [0, d.torsoH * 0.28, -d.td * 0.68], '#e2b84a', { layer: 2 }],
            ['torso', 'box', [d.tw * 1.14, d.torsoH * 0.05, d.td * 1.18], [0, d.torsoH * 0.24, 0], '#c8323c', { layer: 3, noInk: true }],
            ...[1, -1].map((s): Spec => ['torso', 'box', [d.tw * 0.1, d.torsoH * 0.5, d.td * 0.06], [s * d.tw * 0.1, d.torsoH * 0.72, d.td * 0.54], 'white', { srot: [0, 0, s * 25], layer: 4 }]),
            ...[1, -1].map((s): Spec => ['head', 'capsule', [d.headW * 0.04, d.headH * 0.45, d.headW * 0.04], [s * d.headW * 0.2, top(d) + d.headH * 0.12, -d.headD * 0.2], 'gold', { srot: [0, 0, -s * 50] }]),
          ]),
          hat('flower', 'pink'),
          grip('R', 'hold', (a) => [['cyl', [a * 4.2, a * 0.12, a * 2.4], [-a * 0.6, a * 1.2, a * 0.5], '#f4a1c0', { segs: 3, srot: [-90, 0, 0], taper: 1 }], ['capsule', [a * 0.2, a * 1.4, a * 0.2], [0, a * 0.2, a * 0.5], 'darkwood']]),
        ],
      }),
      [talk('bow', 'Konnichiwa.', 'hold'), [A.spawn('tea', 'tea', near), ...talk('nod', 'Please, have some tea.'), A.wait(1.5), A.remove('tea', 'fade')]],
    ),
  ),
  // Peaked cap with a gold band, epaulettes, rows of ribbons and a Sam Browne belt; at the salute.
  e('general', 'town', 'military', () =>
    act(
      who('general', {
        h: 1.76, top: '#5a6b3a', long: true, bottom: '#5a6b3a', shoes: 'black', hair: 'gray', style: 'short', pose: 'salute',
        acc: [
          hat('police', '#4a5a30'),
          x((d) => [['head', 'cyl', [d.headW * 1.02, d.headH * 0.07, d.headD * 1.02], [0, top(d) - d.headH * 0.0, -d.headD * 0.04], 'gold'], ['head', 'cyl', [d.headW * 0.18, d.headW * 0.04, d.headW * 0.18], [0, top(d) + d.headH * 0.14, d.headD * 0.5], 'gold', { segs: 5, srot: [80, 0, 0] }]]),
          shoulders('gold', 0.8),
          x((d) => ['red', 'blue', 'gold', 'green', 'white', 'red'].map((c, i): Spec => ['torso', 'box', [d.tw * 0.11, d.torsoH * 0.05, d.td * 0.06], [-d.tw * (0.12 + (i % 3) * 0.11), d.torsoH * (0.8 - Math.floor(i / 3) * 0.06), d.td * 0.53], c, { layer: 5, edge: 'sharp' }])),
          wear('belt', 'darkbrown'),
          wear('sash', 'darkbrown'),
          x2((d, _s, side) => [[`leg${side}`, 'box', [d.lw * 0.15, d.legLen * 0.45, d.lw * 1.04], [0, -d.legLen * 0.22, 0], 'darkred', { noInk: true }]]),
          boots('black'),
        ],
      }),
      [talk('point', 'Forward, march!', 'salute'), talk('nod', 'At ease, soldier.', 'salute')],
    ),
  ),
  // In a fur-trimmed hat and a long red deel with a gold sash, a horn bow in one hand, a quiver on his back.
  e('genghis khan', 'town', 'history', () => {
    const rest: Arms = { armR: POSES.hips.armR, foreR: POSES.hips.foreR };
    return act(
      who('genghis khan', {
        h: 1.72, skin: 'skin3', top: '#8a2a2a', long: true, bottom: '#4a3020', shoes: 'darkbrown', hair: 'black', style: 'short', beard: 'black',
        acc: [
          x((d) => [['head', 'cyl', [d.headW * 1.2, d.headH * 0.22, d.headD * 1.15], [0, top(d) - d.headH * 0.08, 0], '#6b4a2a'], ['head', 'cyl', [d.headW * 0.86, d.headH * 0.5, d.headD * 0.82], [0, top(d) + d.headH * 0.22, 0], '#c8323c', { taper: 0.25 }], ['head', 'ball', [d.headW * 0.12, d.headW * 0.12, d.headW * 0.12], [0, top(d) + d.headH * 0.5, 0], 'gold']]),
          face('mustache', 'black'),
          x((d) => [['head', 'capsule', [d.headW * 0.12, d.headH * 0.5, d.headW * 0.1], [0, d.headY - d.headH * 0.55, d.headD * 0.35], 'black']]),
          wear('coat', '#8a2a2a'),
          x((d) => [['torso', 'box', [d.tw * 0.12, d.torsoH * 0.9, d.td * 0.08], [d.tw * 0.2, d.torsoH * 0.5, d.td * 0.56], 'gold', { srot: [0, 0, 12], layer: 4 }]]),
          wear('belt', 'gold'),
          boots('darkbrown'),
          x((d) => [['torso', 'cyl', [d.tw * 0.28, d.torsoH * 0.9, d.tw * 0.28], [-d.tw * 0.2, d.torsoH * 0.6, -d.td * 0.7], '#6b4a2a', { srot: [0, 0, -25] }], ...[0, 1, 2].map((i): Spec => ['torso', 'capsule', [d.tw * 0.03, d.torsoH * 0.35, d.tw * 0.03], [-d.tw * (0.36 + i * 0.04), d.torsoH * (1.05 + i * 0.02), -d.td * 0.7], 'white', { srot: [0, 0, -25] }])]),
          arms(rest),
          grip('L', undefined, (a, d) => [['arc', [a * 2.0, d.H * 0.6, a * 0.3], [a * 0.3, 0, a * 0.5], '#5a3a22', { arc: 200, srot: [0, 90, -90], tube: 0.08 }], ['capsule', [a * 0.05, d.H * 0.55, a * 0.05], [a * 0.3, 0, a * 0.5 - a * 0.95], '#e8dcc0', { noInk: true }]]),
        ],
      }),
      [
        talk('point', 'Ride! To the edge of the world!', rest),
        [A.spawn('horse', 'horse', { rel: 'right', of: 'self', dist: 'close' }), ...talk('arms_up', 'Saddle up!', rest), A.wait(1.5), A.remove('horse', 'fade')],
      ],
    );
  }),
  // A blue genie rising out of a golden oil lamp in a curl of smoke, arms folded, topknot and gold cuffs.
  e('genie', 'fantasy', 'spirits', () =>
    act(
      who('genie', {
        h: 1.7, skin: '#4e8fd6', top: '#4e8fd6', bottom: '#4e8fd6', style: 'bald', hair: 'black', build: 1.3, pose: 'cross',
        acc: [
          hide(...LEGS),
          lift(0.25),
          x((d) => [
            ['hips', 'cyl', [d.tw * 1.15, d.legLen * 0.5, d.td * 1.3], [0, -d.legLen * 0.2, 0], '#5f9ee0', { taper: 0.55, srot: [180, 0, 0] }],
            ['hips', 'cyl', [d.tw * 0.65, d.legLen * 0.45, d.td * 0.7], [d.tw * 0.15, -d.legLen * 0.6, 0.02], '#7ab4ec', { taper: 0.45, srot: [180, 0, -18] }],
            ['hips', 'cyl', [d.tw * 0.35, d.legLen * 0.4, d.td * 0.4], [d.tw * 0.42, -d.legLen * 0.92, 0.03], '#9ac8f2', { taper: 0.4, srot: [180, 0, 25] }],
            ['head', 'ball', [d.headW * 0.3, d.headW * 0.3, d.headW * 0.3], [0, top(d) + d.headH * 0.02, 0], 'black'],
            ['head', 'capsule', [d.headW * 0.16, d.headH * 0.55, d.headW * 0.16], [0, top(d) - d.headH * 0.15, -d.headD * 0.5], 'black', { srot: [-30, 0, 0] }],
            ['torso', 'box', [d.tw * 1.1, d.torsoH * 0.75, d.td * 1.12], [0, d.torsoH * 0.6, 0], '#7a3aa8', { layer: 1, round: 0.5 }],
            ['torso', 'box', [d.tw * 0.36, d.torsoH * 0.76, d.td * 0.1], [0, d.torsoH * 0.6, d.td * 0.56], '#4e8fd6', { layer: 2 }],
          ]),
          face('beard', 'black'),
          wear('belt', '#c8323c'),
          cuffs('gold'),
          earrings(),
          x(() => [
            ['', 'ball', [0.16, 0.12, 0.3], [0.35, 0.07, 0.12], 'gold', { srot: [0, -30, 0] }],
            ['', 'cyl', [0.12, 0.02, 0.12], [0.35, 0.005, 0.12], 'gold'],
            ['', 'cyl', [0.07, 0.06, 0.07], [0.35, 0.15, 0.12], 'gold', { taper: 0.6 }],
            ['', 'ball', [0.05, 0.05, 0.05], [0.35, 0.19, 0.12], 'gold'],
            rod('', [0.4, 0.09, 0.23], [0.48, 0.15, 0.34], 0.035, 'gold'),
            ['', 'arc', [0.12, 0.1, 0.02], [0.3, 0.1, 0.02], 'gold', { srot: [0, 60, -90] }],
          ]),
        ],
      }),
      [
        [A.effect('sparkle', { dur: 2 }), ...talk('bow', 'Your wish is my command!', 'cross')],
        [A.spawn('wish', 'diamond', near), A.effect('sparkle', { id: 'wish', dur: 1.5 }), ...talk('thumbs_up', 'Wish granted!', 'cross'), A.wait(1.2), A.remove('wish', 'fade')],
      ],
    ),
  ),
  // Field vest full of pockets, boonie hat and pack; a rock hammer in one hand and a sample in the other.
  e('geologist', 'town', 'science', () => {
    const rest: Arms = { armL: [-20, 0, 10], foreL: [-75, 0, -12] };
    return act(
      who('geologist', {
        top: '#c9b07a', long: true, bottom: '#6a6a3a', shoes: 'darkbrown', hair: 'darkbrown', style: 'short', beard: 'darkbrown',
        acc: [
          hat('cowboy', '#b8a070'),
          face('beard', 'darkbrown'),
          wear('vest', '#7a7a4a'),
          x2((d, s) => [['torso', 'box', [d.tw * 0.24, d.torsoH * 0.16, d.td * 0.08], [s * d.tw * 0.24, d.torsoH * 0.35, d.td * 0.6], '#6a6a3a', { layer: 3 }], ['torso', 'box', [d.tw * 0.2, d.torsoH * 0.14, d.td * 0.08], [s * d.tw * 0.24, d.torsoH * 0.68, d.td * 0.6], '#6a6a3a', { layer: 3 }]]),
          wear('backpack', '#355a32'),
          boots('darkbrown'),
          arms(rest),
          grip('R', undefined, (a) => [['capsule', [a * 0.32, a * 3.4, a * 0.32], [0, -a * 0.9, a * 0.4], 'wood'], ['box', [a * 0.5, a * 0.5, a * 1.8], [0, -a * 2.5, a * 0.6], 'steel', { edge: 'sharp', round: 0.2 }]]),
          grip('L', rest, (a) => [['ball', [a * 1.7, a * 1.3, a * 1.5], [-a * 0.3, a * 0.6, a * 0.4], '#9a7a6a'], ['ball', [a * 0.7, a * 0.5, a * 0.6], [-a * 0.1, a * 1.1, a * 0.7], '#c8b0ff']]),
        ],
      }),
      [
        talk('look_around', 'Hmm... this rock is 300 million years old!', rest),
        [A.par(A.face('player'), A.say('Tink! Tink!', 1.5), A.pose('foreR', { rot: [-95, 0, 0], dur: 0.25 })), A.par(A.pose('foreR', { rot: [-15, 0, 0], dur: 0.15 }), A.effect('dust', { dur: 1 })), A.pose('foreR', { rot: [-95, 0, 0], dur: 0.25 }), A.pose('foreR', { rot: [0, 0, 0], dur: 0.3 }), A.say('Granite!', 1.5)],
      ],
    );
  }),
  // In his blue coat with buff facings, a white cravat, a tricorn on his powdered hair, a sword at his hip.
  e('george washington', 'town', 'history', () =>
    act(
      who('george washington', {
        h: 1.88, skin: 'skin1', top: '#1f3a6f', long: true, bottom: '#e8dcc0', shoes: 'black', legs: 'white', hair: '#eeeeea', style: 'ponytail', pose: 'hips',
        acc: [
          wear('coat', '#1f3a6f'),
          x((d) => [
            ['torso', 'box', [d.tw * 0.42, d.torsoH * 0.62, d.td * 0.1], [0, d.torsoH * 0.6, d.td * 0.56], '#d9c08a', { layer: 4 }],
            ['torso', 'ball', [d.tw * 0.26, d.tw * 0.24, d.td * 0.3], [0, d.torsoH * 0.9, d.td * 0.52], 'white', { layer: 5 }],
            ...[0.42, 0.55, 0.68].map((v): Spec => ['torso', 'ball', [d.tw * 0.05, d.tw * 0.05, d.td * 0.05], [d.tw * 0.25, d.torsoH * v, d.td * 0.58], 'gold', { layer: 6 }]),
            ['hips', 'capsule', [d.lw * 0.3, d.legLen * 0.75, d.lw * 0.3], [d.tw * 0.62, -d.legLen * 0.25, -d.td * 0.2], '#2a2726', { srot: [25, 0, 0] }],
            ['hips', 'box', [d.lw * 0.6, d.lw * 0.15, d.lw * 0.6], [d.tw * 0.62, d.lw * 0.05, d.td * 0.1], 'gold'],
            ...[1, -1].map((s): Spec => ['', 'box', [0.06, 0.03, 0.02], [s * d.tw * 0.24, d.H * 0.035, d.H * 0.06], 'silver', { edge: 'sharp' }]),
          ]),
          // the tricorn: a crown inside three upturned brim walls (a point to the front), buff edging, a cockade
          x((d) => {
            const W = d.headW, H = d.headH, t = top(d), R = W * 0.85, side = R * Math.sqrt(3), y = t + H * 0.03;
            const out: Spec[] = [['head', 'ball', [W * 0.92, H * 0.5, d.headD * 0.9], [0, t + H * 0.02, 0], '#1d1d22']];
            for (const phi of [60, 180, 300]) {
              const r = (phi * Math.PI) / 180, m = R / 2;
              out.push(['head', 'box', [side, H * 0.34, W * 0.08], [Math.sin(r) * m, y, Math.cos(r) * m], '#1d1d22', { srot: [0, phi, 0], round: 0.4 }]);
              out.push(['head', 'box', [side * 0.98, H * 0.025, W * 0.09], [Math.sin(r) * m, y + H * 0.17, Math.cos(r) * m], '#c8a85a', { srot: [0, phi, 0], noInk: true }]);
            }
            out.push(['head', 'ball', [W * 0.16, W * 0.16, W * 0.06], [Math.sin(Math.PI / 3) * R * 0.55, y + H * 0.02, Math.cos(Math.PI / 3) * R * 0.55], '#1d1d22', { srot: [0, 60, 0], layer: 6 }]);
            return out;
          }),
          shoulders('gold', 0.65),
        ],
      }),
      [talk('nod', 'I cannot tell a lie.'), talk('point', 'Across the Delaware, men!', 'hips')],
    ),
  ),
  // Grey-green and hunched, in rags, arms out in front.
  e('ghoul (monster)', 'fantasy', 'undead', () =>
    act(
      who('ghoul (monster)', {
        h: 1.78, build: 0.9, skin: '#9fb48a', top: '#5f6155', long: true, bottom: '#4a4a3e', shoes: '#9fb48a', hair: '#3a3a36', style: 'spiky', eyes: '#d23a2a', blush: '#7a9a6a', pose: 'reach',
        acc: [
          lean(12),
          x((d) => [
            ['torso', 'wedge', [d.tw * 0.4, d.torsoH * 0.3, d.td * 1.1], [d.tw * 0.25, -d.torsoH * 0.05, 0], '#5f6155', { srot: [0, 0, 180] }],
            ['torso', 'wedge', [d.tw * 0.3, d.torsoH * 0.22, d.td * 1.1], [-d.tw * 0.2, -d.torsoH * 0.02, 0], '#5f6155', { srot: [0, 0, 180] }],
            ['torso', 'ball', [d.tw * 0.2, d.tw * 0.16, d.td * 0.06], [d.tw * 0.15, d.torsoH * 0.55, d.td * 0.52], '#9fb48a', { noInk: true, layer: 5 }],
            ['hips', 'wedge', [d.lw * 1.2, d.lw * 1.2, d.td], [-d.tw * 0.2, -d.legLen * 0.62, 0], '#4a4a3e', { srot: [0, 0, 180] }],
          ]),
          x2((d, _s, side) => [[`fore${side}`, 'cyl', [d.aw * 1.05, d.lower * 0.25, d.aw * 1.05], [0, -d.lower * 0.15, 0], '#5f6155', { taper: 1.25 }]]),
        ],
      }),
      [
        [A.par(A.face('player'), A.anim('shake'), A.say('Braaains...', 2.2))],
        talk('stomp', 'GRRRAAARGH!', 'reach'),
      ],
    ),
  ),
  // Six metres tall: a rough tunic, a belt with a pouch, bare feet and a tree trunk for a club.
  e('giant', 'fantasy', 'monsters', () =>
    act(
      who('giant', {
        h: 6, build: 1.3, skin: 'skin3', top: '#a8905a', bottom: '#6a4a2a', shoes: 'skin3', hair: '#5a3a22', style: 'long', beard: '#5a3a22',
        acc: [
          face('beard', '#5a3a22'),
          wear('belt', '#3a2a1a'),
          x((d) => [['hips', 'box', [d.tw * 0.3, d.lw * 1.0, d.td * 0.3], [d.tw * 0.35, -d.lw * 0.2, d.td * 0.45], '#6a4a2a', { round: 0.5 }], ['torso', 'box', [d.tw * 0.25, d.torsoH * 0.2, d.td * 0.06], [-d.tw * 0.2, d.torsoH * 0.4, d.td * 0.52], '#7a6a3a', { layer: 4 }]]),
          grip('R', undefined, (a, d) => [['cyl', [a * 0.9, d.H * 0.42, a * 0.9], [0, -d.H * 0.17, a * 0.9], '#6a4a2a', { taper: 1.6, srot: [20, 0, 0] }], ['ball', [a * 0.5, a * 0.5, a * 0.5], [a * 0.6, -d.H * 0.28, a * 1.5], '#5a3a22']]),
        ],
      }),
      [
        [A.par(A.face('player'), A.anim('hop'), A.say('FEE-FI-FO-FUM!', 2.5)), A.effect('dust', { dur: 2 })],
        talk('laugh', 'HO HO HO! A tiny human!'),
      ],
    ),
  ),
  // Pink top, red skirt, a bow in her hair and a heart balloon on a string.
  e('girlfriend', 'town', 'family', () =>
    act(
      who('girlfriend', {
        h: 1.65, top: 'pink', bottom: 'denim', skirt: '#d23a4a', hair: '#7a3b1e', style: 'long', shoes: 'red',
        acc: [
          hat('bow', 'red'),
          earrings('gold'),
          grip('L', undefined, (a, d) => [['capsule', [a * 0.04, d.H * 0.5, a * 0.04], [0, d.H * 0.24, a * 0.4], 'white', { noInk: true }], ...heartH([0, d.H * 0.56, a * 0.4], d.H * 0.2, 'red')]),
          grip('R', undefined, (a) => [['box', [a * 0.8, a * 1.6, a * 0.12], [0, -a * 0.2, a * 0.8], '#2a2726', { edge: 'sharp', round: 0.3, srot: [-20, 0, 0] }]]),
        ],
      }),
      [
        [A.effect('hearts', { dur: 2 }), ...talk('love', 'Aww, love you!')],
        talk('wave', 'Call me later!'),
      ],
    ),
  ),
  // A barrel of a belly under a napkin bib, a drumstick in one hand.
  e('glutton (person)', 'town', 'everyday people', () =>
    act(
      who('glutton (person)', {
        build: 1.45, top: '#f2c14e', bottom: 'brown', shoes: 'darkbrown', style: 'short', hair: '#5a3a22', pose: 'hold',
        acc: [
          x((d) => [
            ['torso', 'ball', [d.tw * 1.08, d.torsoH * 0.85, d.td * 1.7], [0, d.torsoH * 0.36, d.td * 0.3], '#f2c14e'],
            ['torso', 'wedge', [d.tw * 0.62, d.torsoH * 0.42, d.td * 0.08], [0, d.torsoH * 0.72, d.td * 0.95], 'white', { srot: [-15, 0, 180] }],
            ['torso', 'ball', [d.tw * 0.07, d.tw * 0.07, d.td * 0.05], [0, d.torsoH * 0.4, d.td * 1.15], '#c9a03a', { noInk: true }],
          ]),
          grip('R', 'hold', (a) => [['capsule', [a * 0.35, a * 1.6, a * 0.35], [0, a * 0.5, a * 0.3], 'cream', { srot: [-20, 0, 0] }], ['ball', [a * 1.3, a * 1.8, a * 1.3], [0, a * 1.6, a * 0.65], '#b0602a', { srot: [-20, 0, 0] }]]),
        ],
      }),
      [
        [A.spawn('cake', 'cake', near), ...talk('thumbs_up', 'Is that cake? For me?', 'hold'), A.remove('cake', 'pop'), A.say('Gulp!', 1.2)],
        talk('laugh', 'Ho ho! I could eat a horse!', 'hold'),
      ],
    ),
  ),
  // A living gnome about knee high: a big head under a tall red hat, white beard, a walking stick and a lantern
  // that he can blow out.
  e('gnome', 'fantasy', 'little folk', () =>
    act(
      who('gnome', {
        h: 0.38, build: 1.35, head: 1.25, top: '#3f7a4a', long: true, bottom: '#7a4a2a', shoes: '#4a3020', hair: 'white', style: 'short', blush: '#ff8a8a',
        acc: [
          x((d) => [['head', 'cyl', [d.headW * 1.12, d.headH * 1.2, d.headD * 1.08], [0, top(d) + d.headH * 0.45, -d.headD * 0.08], '#d23a2a', { taper: 0, srot: [-12, 0, 0] }]]),
          face('longbeard', 'white'),
          wear('belt', '#3a2a1a'),
          pole('R', undefined, 0.08, 0.17, 0.018, 'darkwood', (a) => [['ball', [a * 0.5, a * 0.5, a * 0.5], [0, 0.085, a * 0.3], '#5a3a22']]),
          grip('L', undefined, (a) => [
            ['box', [a * 0.9, a * 0.12, a * 0.9], [0, -a * 0.6, a * 0.4], 'darkgray', { edge: 'sharp' }],
            ['ball', [a * 0.75, a * 0.95, a * 0.75], [0, -a * 1.15, a * 0.4], '#ffd36a', { name: 'lamp', role: 'glow', noInk: true, mover: { kind: 'light', on: true } }],
            ['box', [a * 1.0, a * 0.15, a * 1.0], [0, -a * 1.7, a * 0.4], 'darkgray', { edge: 'sharp' }],
            ['arc', [a * 0.7, a * 0.5, a * 0.1], [0, -a * 0.35, a * 0.4], 'darkgray'],
          ]),
        ],
      }),
      [
        talk('wave', 'Hello there, big folk!'),
        [A.operate('lamp', 'off'), ...talk('gasp', 'Who blew out my lantern?'), A.operate('lamp', 'on')],
      ],
    ),
  ),
  // A goalkeeper in the ready crouch: bright long-sleeved jersey with a 1, big gloves, long socks.
  e('goalie', 'town', 'sports', () => {
    const rest: Arms = { armR: [-45, 0, -38], foreR: [-35, 0, 12], armL: [-45, 0, 38], foreL: [-35, 0, -12] };
    return act(
      who('goalie', {
        h: 1.85, top: '#b6e03a', long: true, bottom: '#2a2726', legs: '#b6e03a', shorts: true, shoes: 'black', hair: '#2a1d16', style: 'short',
        acc: [
          chest('1', '#2a2726', 0.3),
          x((d) => [['torso', 'box', [d.tw * 0.4, d.torsoH * 0.3, d.td * 0.08], [0, d.torsoH * 0.58, -d.td * 0.52], '#2a2726', { role: 'label', text: '1', layer: -2 }]]),
          x2((d, _s, side) => [[`shin${side}`, 'capsule', [d.lw * 0.95, d.legLen * 0.38, d.lw * 0.95], [0, -d.legLen * 0.28, 0], '#b6e03a']]),
          gloves('#f0923b', 1.7),
          arms(rest),
          lean(12, -8),
          joints({ legL: [-22, 0, 10], legR: [-22, 0, -10], shinL: [35, 0, 0], shinR: [35, 0, 0], footL: [-13, 0, 0], footR: [-13, 0, 0] }),
          lift(-0.04),
        ],
      }),
      [
        [A.spawn('ball', 'soccer ball', { rel: 'front', of: 'self', dist: 'near' }), A.move('ball', { rel: 'at', of: 'self', dist: 'touch' }, { speed: 'run', style: 'hop' }), A.par(A.face('player'), A.anim('hop'), A.say('Saved it!', 1.8)), A.remove('ball', 'pop')],
        talk('clap', 'Come on, defence!', rest),
      ],
    );
  }),
  // A goblin a little over a metre tall: green, long-nosed and big-eared, in rags, with a dagger and a sack of loot.
  e('goblin', 'fantasy', 'monsters', () =>
    act(
      who('goblin', {
        h: 1.1, build: 0.95, head: 1.15, skin: '#6fa83a', top: '#6a4a2a', bottom: '#4a3020', shoes: '#6fa83a', style: 'bald', eyes: '#f6d24a', blush: '#5a9030',
        acc: [
          lean(14),
          pointyEars('#6fa83a', 1.5),
          x((d) => [
            ['head', 'cyl', [d.headW * 0.2, d.headH * 0.4, d.headW * 0.2], [0, d.headY - d.headH * 0.02, d.headD * 0.62], '#5a9030', { taper: 0.3, srot: [70, 0, 0] }],
            ...[1, -1].map((s): Spec => ['head', 'cyl', [d.headW * 0.07, d.headH * 0.1, d.headW * 0.07], [s * d.headW * 0.12, d.headY - d.headH * 0.27, d.headD * 0.46], 'cream', { taper: 0, srot: [180, 0, 0] }]),
            ['torso', 'wedge', [d.tw * 0.5, d.torsoH * 0.3, d.td * 1.1], [d.tw * 0.25, -d.torsoH * 0.04, 0], '#6a4a2a', { srot: [0, 0, 180] }],
            ['torso', 'ball', [d.tw * 0.9, d.torsoH * 0.6, d.td * 0.9], [-d.tw * 0.4, d.torsoH * 0.9, -d.td * 0.7], '#a8905a'],
            rod('torso', [-d.tw * 0.4, d.torsoH * 1.15, -d.td * 0.5], [-d.tw * 0.45, d.torsoH * 0.95, d.td * 0.35], d.tw * 0.06, '#7a6a3a'),
          ]),
          wear('belt', '#2a2726'),
          grip('R', undefined, (a) => [['capsule', [a * 0.35, a * 1.0, a * 0.35], [0, 0, a * 0.3], '#3a2a1a'], ['cyl', [a * 0.5, a * 1.8, a * 0.12], [0, -a * 1.3, a * 0.5], 'silver', { taper: 0, segs: 4, srot: [180, 0, 0], edge: 'sharp' }]]),
        ],
      }),
      [
        talk('laugh', 'Hehehe! Shiny things!'),
        [A.spawn('gold', 'gold', near), ...talk('point', 'Mine! All mine!'), A.remove('gold', 'fly_away')],
      ],
    ),
  ),
  // A sky god in a white toga and gold sash, long white beard, halo, a lightning bolt held up in his fist.
  e('god', 'fantasy', 'gods', () => {
    const rest: Arms = { armR: [-8, 0, -150], foreR: [0, 0, -18] };
    return act(
      who('god', {
        h: 1.95, build: 1.25, top: 'white', bottom: 'white', shoes: '#c9a06a', hair: 'white', style: 'long', beard: 'white',
        acc: [
          face('longbeard', 'white'),
          wear('toga', 'white'),
          wear('sash', 'gold'),
          hat('halo'),
          cuffs('gold'),
          arms(rest),
          grip('R', rest, (a) => [
            ['box', [a * 0.5, a * 1.8, a * 0.3], [a * 0.3, a * 1.0, a * 0.3], '#ffd84a', { srot: [0, 0, 25], role: 'glow', edge: 'sharp' }],
            ['box', [a * 0.5, a * 1.8, a * 0.3], [a * 0.2, a * 2.4, a * 0.3], '#ffd84a', { srot: [0, 0, -25], role: 'glow', edge: 'sharp' }],
            ['cyl', [a * 0.8, a * 1.5, a * 0.3], [a * 0.5, a * 3.8, a * 0.3], '#ffd84a', { taper: 0, segs: 4, srot: [0, 0, 20], role: 'glow' }],
            ['cyl', [a * 0.6, a * 1.2, a * 0.3], [0, -a * 0.6, a * 0.3], '#ffd84a', { taper: 0, segs: 4, srot: [180, 0, 15], role: 'glow' }],
          ]),
        ],
      }),
      [
        talk('nod', 'You may approach, mortal.'),
        [A.spawn('bolt', 'lightning bolt', near), A.par(A.effect('sparkle', { id: 'bolt', dur: 1.2 }), A.anim('shake'), A.say('Thunder and lightning!', 2.2)), A.wait(1), A.remove('bolt', 'fade')],
      ],
    );
  }),
  // A goddess in a long white gown with a golden girdle and diadem, holding a staff topped with light.
  e('goddess', 'fantasy', 'gods', () =>
    act(
      who('goddess', {
        h: 1.78, top: 'white', long: true, skirt: 'white', bottom: 'white', shoes: 'gold', hair: '#e8c56a', style: 'long',
        acc: [
          wear('robe', 'white'),
          x((d) => [['torso', 'box', [d.tw * 1.1, d.torsoH * 0.08, d.td * 1.14], [0, d.torsoH * 0.35, 0], 'gold', { layer: 3, round: 0.5 }], ['torso', 'box', [d.tw * 0.12, d.torsoH * 0.55, d.td * 0.06], [0, d.torsoH * 0.05, d.td * 0.56], 'gold', { layer: 3 }]]),
          hat('tiara', 'gold'),
          wear('necklace', 'gold'),
          cuffs('gold'),
          pole('R', undefined, 1.0, 0.55, 0.035, 'gold', (a, _d, tip) => [['ball', [0.13, 0.13, 0.13], [0, tip + 0.07, a * 0.3], '#fff3b0', { role: 'glow' }], ['torus', [0.18, 0.18, 0.02], [0, tip + 0.07, a * 0.3], 'gold', { tube: 0.15 }]]),
        ],
      }),
      [
        talk('wave', 'Peace be with you.'),
        [A.spawn('dove', 'dove', near), ...talk('arms_up', 'Fly free, little dove!'), A.remove('dove', 'fly_away')],
      ],
    ),
  ),
  // Polo shirt, cap and one white glove, a driver in his hand: he tees off.
  e('golfer', 'town', 'sports', () =>
    act(
      who('golfer', {
        top: '#e86f7d', bottom: '#c9b28a', shoes: 'white', hair: '#a0522d', style: 'short',
        acc: [
          hat('cap', 'navy'),
          x((d) => [['torso', 'box', [d.tw * 0.36, d.torsoH * 0.12, d.td * 0.1], [0, d.torsoH * 0.94, d.td * 0.45], '#e86f7d', { layer: 4 }], ...[0.85, 0.75].map((v): Spec => ['torso', 'ball', [d.tw * 0.04, d.tw * 0.04, d.td * 0.04], [0, d.torsoH * v, d.td * 0.54], 'white', { layer: 5 }])]),
          wear('belt', 'white'),
          x((d) => [['handL', 'ball', [d.aw * 1.3, d.aw * 1.35, d.aw * 1.05], [0, -d.aw * 0.25, 0], 'white', { layer: 2 }]]),
          grip('R', undefined, (a, d) => [seg([0, a * 0.4, a * 0.3], [0, -d.H * 0.46, d.H * 0.1], a * 0.18, 'silver'), ['box', [a * 1.0, a * 0.55, a * 0.7], [0, -d.H * 0.47, d.H * 0.13], '#2a2726', { round: 0.5, edge: 'sharp' }], ['capsule', [a * 0.4, a * 1.2, a * 0.4], [0, a * 0.1, a * 0.3], '#2a2726']]),
        ],
      }),
      [
        [A.spawn('ball', 'golf ball', near), A.par(A.face('player'), A.pose('armR', { rot: [-150, 0, 40], dur: 0.7 }), A.pose('torso', { rot: [0, -35, 0], dur: 0.7 })), A.par(A.pose('armR', { rot: [-70, 0, -30], dur: 0.2 }), A.pose('torso', { rot: [0, 25, 0], dur: 0.2 })), A.par(A.move('ball', { rel: 'front', of: 'self', dist: 'far' }, { speed: 'fly', style: 'fly' }), A.say('Fore!', 1.5)), A.par(A.pose('armR', { rot: [0, 0, 0], dur: 0.5 }), A.pose('torso', { rot: [0, 0, 0], dur: 0.5 })), A.remove('ball', 'pop')],
        talk('arms_up', 'Hole in one!'),
      ],
    ),
  ),
  // Black lace dress, purple tights, platform boots, a spiked choker, white face and black lips; arms folded.
  e('goth', 'town', 'subcultures', () =>
    act(
      who('goth', {
        skin: '#f3ece6', top: 'black', long: true, skirt: '#1d1a1f', bottom: 'black', legs: '#5a2a6a', shoes: 'black', hair: '#1d1d1d', style: 'long', blush: '#b0a0b8', pose: 'cross',
        acc: [
          x((d) => [
            ['torso', 'torus', [d.tw * 0.6, d.tw * 0.6, d.td * 0.1], [0, d.torsoH * 0.99, 0], 'black', { srot: [90, 0, 0], tube: 0.18 }],
            ...[-0.2, 0, 0.2].map((u): Spec => ['torso', 'cyl', [d.tw * 0.04, d.tw * 0.08, d.tw * 0.04], [d.tw * u, d.torsoH * 0.96, d.td * 0.36], 'silver', { taper: 0, srot: [90, 0, 0] }]),
            ['torso', 'box', [d.tw * 0.15, d.tw * 0.22, d.td * 0.05], [0, d.torsoH * 0.7, d.td * 0.53], 'silver', { layer: 6 }],
            ['torso', 'box', [d.tw * 0.24, d.tw * 0.06, d.td * 0.05], [0, d.torsoH * 0.73, d.td * 0.53], 'silver', { layer: 6 }],
            ['head', 'box', [d.headW * 0.16, d.headH * 0.03, d.headD * 0.04], [0, d.headY - d.headH * 0.2, d.headD * 0.47], '#2a1a2a', { noInk: true, layer: 6 }],
          ]),
          x2((d, _s, side) => [[`foot${side}`, 'box', [d.lw * 1.2, d.H * 0.04, d.lw * 1.8], [0, -d.H * 0.04, d.lw * 0.3], 'black', { round: 0.3 }], [`shin${side}`, 'capsule', [d.lw * 1.05, d.legLen * 0.35, d.lw * 1.05], [0, -d.legLen * 0.28, 0], 'black']]),
          lift(0.03),
          wear('belt', 'silver'),
        ],
      }),
      [talk('shrug', 'Whatever.', 'cross'), talk('shake_head', "It's not a phase.")],
    ),
  ),
  // Navy suit, red tie and a flag pin, grey hair, waving to the crowd.
  e('governor', 'town', 'politics', () =>
    act(
      who('governor', {
        h: 1.78, top: 'white', long: true, bottom: 'navy', shoes: 'black', hair: 'gray', style: 'short', pose: 'wave',
        acc: [
          wear('suit', 'navy'),
          lapels('#14244a'),
          x((d) => [['torso', 'box', [d.tw * 0.12, d.tw * 0.08, d.td * 0.05], [d.tw * 0.3, d.torsoH * 0.8, d.td * 0.56], '#d23a2a', { layer: 6 }], ['torso', 'box', [d.tw * 0.06, d.tw * 0.04, d.td * 0.05], [d.tw * 0.28, d.torsoH * 0.81, d.td * 0.58], 'navy', { layer: 7 }]]),
          grip('L', undefined, (a) => [['box', [a * 0.8, a * 2.6, a * 3.4], [0, -a * 1.8, a * 0.4], '#3a2a1a', { edge: 'sharp', round: 0.15 }], ['arc', [a * 1.2, a * 0.7, a * 0.2], [0, -a * 0.3, a * 0.4], '#2a2726', { srot: [0, 90, 0] }]]),
        ],
      }),
      [talk('wave', 'Vote for me!', 'wave'), talk('point', 'Together, we will fix the roads!', 'wave')],
    ),
  ),
  // Black gown with gold stole, a mortarboard with a tassel (a piece: she throws it in the air) and a diploma.
  e('graduate', 'town', 'school', () =>
    act(
      who('graduate', {
        top: 'black', long: true, bottom: 'black', shoes: 'black', hair: '#7a3b1e', style: 'long',
        acc: [
          x((d) => {
            const t = top(d), W = d.headW, H = d.headH, D = d.headD;
            return [
              ['head', 'cyl', [W * 0.95, H * 0.2, D * 0.9], [0, t, 0], '#1d1d1d', { name: 'cap', piece: true }],
              ['cap', 'box', [W * 1.5, H * 0.04, W * 1.5], [0, H * 0.11, 0], '#1d1d1d', { srot: [0, 45, 0], edge: 'sharp' }],
              ['cap', 'ball', [W * 0.1, W * 0.06, W * 0.1], [0, H * 0.14, 0], 'gold'],
              ['cap', 'capsule', [W * 0.05, H * 0.45, W * 0.05], [W * 0.62, -H * 0.1, W * 0.2], 'gold'],
            ];
          }),
          wear('robe', '#1d1d1d'),
          x((d) => [1, -1].map((s): Spec => ['torso', 'box', [d.tw * 0.16, d.torsoH * 0.95, d.td * 0.1], [s * d.tw * 0.2, d.torsoH * 0.52, d.td * 0.56], 'gold', { layer: 4 }])),
          grip('L', undefined, (a) => [['cyl', [a * 0.7, a * 3.2, a * 0.7], [0, -a * 0.3, a * 0.6], 'cream', { srot: [0, 0, 90] }], ['cyl', [a * 0.75, a * 0.3, a * 0.75], [0, -a * 0.3, a * 0.6], '#c8323c', { srot: [0, 0, 90] }]]),
        ],
      }),
      [
        [A.par(A.face('player'), A.anim('arms_up'), A.say('I graduated!', 2)), A.detach('cap', 'cap'), A.move('cap', { rel: 'above', of: 'self', dist: 'close' }, { speed: 'fly', style: 'fly' }), A.drop('cap')],
        [A.reattach('cap'), ...talk('bow', 'Thank you, thank you!')],
      ],
    ),
  ),
  // A cardigan over a checked shirt, flat cap, glasses and a moustache; both hands on the crook of his cane.
  e('grandfather', 'town', 'family', () => {
    const rest: Arms = { armR: [-22, 0, 4], foreR: [-38, 0, 32], armL: [-22, 0, -4], foreL: [-38, 0, -32] };
    return act(
      who('grandfather', {
        h: 1.7, top: '#c9a06a', long: true, bottom: 'gray', shoes: 'darkbrown', hair: 'lightgray', style: 'short', skin: 'skin2',
        acc: [
          face('glasses', 'darkbrown'),
          face('mustache', 'lightgray'),
          x((d) => [['head', 'ball', [d.headW * 1.12, d.headH * 0.28, d.headD * 1.08], [0, top(d) - d.headH * 0.05, 0], '#7a6a5a'], ['head', 'cyl', [d.headW * 0.85, d.headH * 0.04, d.headD * 0.5], [0, top(d) - d.headH * 0.13, d.headD * 0.42], '#7a6a5a']]),
          wear('vest', '#8a6a4a'),
          x((d) => [0.35, 0.5, 0.65].map((v): Spec => ['torso', 'ball', [d.tw * 0.05, d.tw * 0.05, d.td * 0.05], [0, d.torsoH * v, d.td * 0.58], '#3a2a1a', { layer: 5 }])),
          lean(8),
          arms(rest),
          pole('R', rest, 0.02, 0.86, 0.025, 'darkwood', (a) => [['arc', [a * 1.4, a * 1.3, a * 0.3], [-a * 0.55, a * 0.1, a * 0.3], 'darkwood', { tube: 0.25 }]]),
        ],
      }),
      [talk('nod', 'Back in my day, we walked to school uphill both ways!'), talk('laugh', 'Ho ho! Come sit with grandpa.', rest)],
    );
  }),
  // A lilac cardigan and pearls, silver bun and glasses, knitting a pink scarf.
  e('grandmother', 'town', 'family', () =>
    act(
      who('grandmother', {
        h: 1.58, top: '#9a7ac4', long: true, skirt: '#b9a3d6', shoes: 'black', legs: 'skin2', skin: 'skin2', hair: 'lightgray', style: 'bun', pose: 'hold',
        acc: [
          face('glasses', '#7a5aa8'),
          wear('necklace', 'white'),
          x((d) => [0.35, 0.5, 0.65].map((v): Spec => ['torso', 'ball', [d.tw * 0.05, d.tw * 0.05, d.td * 0.05], [0, d.torsoH * v, d.td * 0.58], 'white', { layer: 5 }])),
          grip('R', 'hold', (a) => [seg([0, -a * 0.2, a * 0.3], [-a * 1.6, a * 1.8, a * 0.8], a * 0.12, 'silver'), ['box', [a * 2.2, a * 1.4, a * 0.25], [-a * 1.0, -a * 0.4, a * 0.6], '#f4a1c0', { round: 0.5 }]]),
          grip('L', 'hold', (a) => [seg([0, -a * 0.2, a * 0.3], [a * 1.6, a * 1.8, a * 0.8], a * 0.12, 'silver'), ['ball', [a * 1.8, a * 1.8, a * 1.8], [a * 0.4, -a * 1.4, a * 0.4], '#f4a1c0']]),
        ],
      }),
      [talk('wave', 'Hello, dear!', 'hold'), [A.spawn('cookie', 'cookie', near), ...talk('nod', 'Have a cookie, sweetie.'), A.wait(1.5), A.remove('cookie', 'pop')]],
    ),
  ),
  // In a long dark coat and bowler, leaning on his spade, a lantern burning in his other hand.
  e('gravedigger', 'town', 'trades', () => {
    const rest: Arms = { armR: [-20, 0, -4], foreR: [-30, 0, 20] };
    return act(
      who('gravedigger', {
        h: 1.82, build: 0.9, top: '#3a3a3a', long: true, bottom: '#2a2726', shoes: 'black', hair: 'gray', style: 'short', beard: 'gray', skin: 'skin1',
        acc: [
          hat('bowler', '#2a2a2a'),
          face('beard', 'gray'),
          wear('coat', '#3a3530'),
          lean(6),
          arms(rest),
          pole('R', rest, 0.08, 0.8, 0.03, 'darkwood', (a) => [['box', [a * 1.6, a * 0.25, a * 0.25], [0, 0.08, a * 0.3], 'darkwood', { edge: 'sharp' }], ['box', [a * 2.0, a * 2.6, a * 0.15], [0, -0.92, a * 0.3], 'iron', { round: 0.5, edge: 'sharp' }]]),
          grip('L', undefined, (a) => [
            ['box', [a * 1.1, a * 0.12, a * 1.1], [0, -a * 0.6, a * 0.4], '#2a2726', { edge: 'sharp' }],
            ['box', [a * 0.95, a * 1.3, a * 0.95], [0, -a * 1.35, a * 0.4], '#ffb84a', { name: 'lamp', role: 'glow', noInk: true, mover: { kind: 'light', on: true } }],
            ['box', [a * 1.2, a * 0.15, a * 1.2], [0, -a * 2.1, a * 0.4], '#2a2726', { edge: 'sharp' }],
            ['arc', [a * 0.9, a * 0.6, a * 0.1], [0, -a * 0.3, a * 0.4], '#2a2726'],
          ]),
        ],
      }),
      [
        [A.par(A.face('player'), A.say('A lovely night for digging...', 2.5), A.pose('armR', { rot: [-30, 0, 0], dur: 0.4 })), A.par(A.pose('armR', { rot: [10, 0, 0], dur: 0.3 }), A.effect('dust', { dur: 1 })), A.pose('armR', { rot: [-30, 0, 0], dur: 0.4 }), A.par(A.pose('armR', { rot: [0, 0, 0], dur: 0.3 }), A.effect('dust', { dur: 1 }))],
        [A.operate('lamp', 'off'), ...talk('gasp', 'Did you hear that?', rest), A.operate('lamp', 'on')],
      ],
    );
  }),
  // In a black tuxedo with satin lapels, a bow tie and a white rose in his buttonhole.
  e('groom', 'town', 'wedding', () =>
    act(
      who('groom', {
        h: 1.8, top: 'black', long: true, bottom: 'black', shoes: 'black', style: 'short', hair: '#3b2a1e',
        acc: [shirtFront(), lapels('#2a2a32'), wear('bowtie', 'black'), flower('white'), x((d) => [0.35, 0.5].map((v): Spec => ['torso', 'ball', [d.tw * 0.04, d.tw * 0.04, d.td * 0.04], [0, d.torsoH * v, d.td * 0.56], 'white', { layer: 6 }]))],
      }),
      [talk('nod', 'I do.'), [A.effect('hearts', { dur: 2 }), ...talk('love', 'She said yes!')]],
    ),
  ),
  // Grey morning suit, pink tie and a pink buttonhole.
  e('groomsman', 'town', 'wedding', () =>
    act(
      who('groomsman', {
        h: 1.76, top: 'white', long: true, bottom: '#6a6e74', shoes: 'black', style: 'short', hair: '#a0522d',
        acc: [wear('suit', '#7a7f85'), lapels('#5a5e64'), wear('tie', '#e86f9a'), flower('pink')],
      }),
      [talk('thumbs_up', 'Best wedding ever!'), talk('shrug', 'Wait... who has the rings?')],
    ),
  ),
  // In a band T-shirt and fishnets, holding up a hand-painted sign for her favourite band.
  e('groupie', 'town', 'entertainment', () =>
    act(
      who('groupie', {
        top: 'black', skirt: 'denim', legs: '#2a2726', shoes: 'black', style: 'long', hair: '#f2d36a', pose: 'arms_up',
        acc: [
          chest('ROCK', 'black', 0.6),
          hat('bandana', '#d23a2a'),
          earrings('silver'),
          x((d) => [['torso', 'torus', [d.tw * 0.7, d.tw * 1.1, d.td * 0.06], [0, d.torsoH * 0.78, d.td * 0.2], 'red', { srot: [60, 0, 0], tube: 0.06 }]]),
          pole('R', 'arms_up', 0.15, 0.25, 0.025, 'wood', (a, _d, tip) => [['box', [0.6, 0.4, 0.015], [-0.12, tip + 0.18, a * 0.3], 'white', { role: 'label', text: 'I ♥ U', edge: 'sharp' }]]),
        ],
      }),
      [talk('dance', 'Woooo! Encore!', 'arms_up'), [A.effect('hearts', { dur: 2 }), ...talk('love', 'I love you guys!', 'arms_up')]],
    ),
  ),
  // Olive fatigues with camouflage patches, a beret and beard, a bandolier and boots, rifle upright.
  e('guerilla', 'town', 'military', () =>
    act(
      who('guerilla', {
        top: '#5a6a3a', long: true, bottom: '#5a6a3a', shoes: 'black', hair: 'black', style: 'short', beard: 'black', skin: 'skin3',
        acc: [
          hat('beret', '#2a2726'),
          face('beard', 'black'),
          x((d) => [[0.2, 0.3, '#3f4a2a'], [-0.25, 0.7, '#7a6a4a'], [0.1, 0.8, '#3f4a2a'], [-0.15, 0.25, '#7a6a4a']].map(([u, v, c]): Spec => ['torso', 'ball', [d.tw * 0.25, d.torsoH * 0.18, d.td * 0.08], [d.tw * (u as number), d.torsoH * (v as number), d.td * 0.53], c as string, { noInk: true, layer: 4 }])),
          wear('sash', '#5a3a22'),
          x((d) => [0.3, 0.42, 0.54, 0.66, 0.78].map((v, i): Spec => ['torso', 'capsule', [d.tw * 0.04, d.tw * 0.12, d.tw * 0.04], [d.tw * (-0.3 + i * 0.13), d.torsoH * (v - 0.04), d.td * 0.6], 'brass', { srot: [0, 0, 55] }])),
          wear('belt', '#3a2a1a'),
          boots('black'),
          rifle('R', '#3a2a1a', '#2a2726'),
        ],
      }),
      [talk('point', 'Move out!'), talk('look_around', 'Hmm... the enemy camp is near.')],
    ),
  ),
  // Cardigan and lanyard, glasses and a bun, a clipboard and a college brochure.
  e('guidance counselor', 'town', 'school', () =>
    act(
      who('guidance counselor', {
        top: '#3fa7a0', long: true, bottom: '#c9b28a', shoes: 'brown', style: 'bun', hair: '#5a3a22', pose: 'hold',
        acc: [
          face('glasses', 'darkbrown'),
          x((d) => [['torso', 'torus', [d.tw * 0.62, d.tw * 0.8, d.td * 0.04], [0, d.torsoH * 0.82, d.td * 0.3], '#4f8fd6', { srot: [70, 0, 0], tube: 0.06 }], ['torso', 'box', [d.tw * 0.18, d.tw * 0.24, d.td * 0.05], [0, d.torsoH * 0.5, d.td * 0.56], 'white', { layer: 6, edge: 'sharp' }]]),
          grip('R', 'hold', (a) => [['box', [a * 2.4, a * 0.25, a * 3.0], [-a * 0.8, a * 0.6, a * 0.2], 'wood', { srot: [-55, 0, 0], edge: 'sharp' }], ['box', [a * 2.1, a * 0.1, a * 2.6], [-a * 0.8, a * 0.75, a * 0.25], 'white', { srot: [-55, 0, 0], edge: 'sharp' }]]),
          grip('L', 'hold', (a) => [['box', [a * 2.0, a * 0.1, a * 2.8], [a * 0.6, a * 0.6, a * 0.2], '#f2c14e', { srot: [-55, 0, 0], role: 'label', text: 'COLLEGE', edge: 'sharp' }]]),
        ],
      }),
      [talk('nod', 'Have you thought about college?'), talk('thumbs_up', 'You can be anything you want!', 'hold')],
    ),
  ),
  // Leather jacket, shades and long hair, a red electric guitar across his body: he strums.
  e('guitarist', 'town', 'music', () => {
    const rest: Arms = { armR: [-30, 0, -10], foreR: [-62, 0, 40], armL: [-40, 0, 25], foreL: [-60, 0, -55] };
    return act(
      who('guitarist', {
        h: 1.78, top: '#2a2726', long: true, bottom: 'denim', shoes: 'black', style: 'long', hair: '#3b2a1e',
        acc: [
          face('sunglasses'),
          x((d) => [['torso', 'box', [d.tw * 0.3, d.torsoH * 0.6, d.td * 0.1], [0, d.torsoH * 0.62, d.td * 0.5], '#d23a2a', { layer: 2 }]]),
          arms(rest),
          x((d) => {
            const z = d.td * 0.95, T = d.torsoH;
            return [
              ['torso', 'ball', [d.tw * 0.95, T * 0.45, d.td * 0.3], [d.tw * 0.05, T * 0.25, z], '#d23a2a', { srot: [0, 0, -20], layer: 6 }],
              ['torso', 'ball', [d.tw * 0.6, T * 0.32, d.td * 0.31], [-d.tw * 0.15, T * 0.45, z], '#d23a2a', { srot: [0, 0, -20], layer: 6 }],
              ['torso', 'box', [d.tw * 0.5, T * 0.12, d.td * 0.05], [d.tw * 0.0, T * 0.25, z + d.td * 0.15], 'white', { srot: [0, 0, -20], layer: 7 }],
              rod('torso', [-d.tw * 0.2, T * 0.42, z + d.td * 0.05], [d.tw * 1.05, T * 0.95, z + d.td * 0.05], d.tw * 0.08, '#5a3a22', { layer: 7 }),
              ['torso', 'box', [d.tw * 0.14, d.tw * 0.28, d.td * 0.12], [d.tw * 1.12, T * 1.0, z + d.td * 0.05], '#2a2726', { srot: [0, 0, -68], layer: 7, edge: 'sharp' }],
              rod('torso', [-d.tw * 0.45, T * 0.95, 0], [d.tw * 0.45, T * 0.25, d.td * 0.5], d.tw * 0.05, '#2a2726'),
            ];
          }),
        ],
      }),
      [
        [A.par(A.face('player'), A.say('♪ Wanna rock? ♪', 2)), A.pose('foreR', { rot: [-20, 0, 0], dur: 0.15 }), A.pose('foreR', { rot: [10, 0, 0], dur: 0.15 }), A.pose('foreR', { rot: [-20, 0, 0], dur: 0.15 }), A.pose('foreR', { rot: [10, 0, 0], dur: 0.15 }), A.par(A.pose('foreR', { rot: [0, 0, 0], dur: 0.2 }), A.effect('sparkle', { dur: 1 }))],
        [A.par(A.face('player'), A.anim('hop'), A.say('Rock and roll!', 1.8))],
      ],
    );
  }),
  // Just a guy: T-shirt, jeans, trainers, a coffee in his hand.
  e('guy', 'town', 'everyday people', () =>
    act(
      who('guy', {
        h: 1.76, top: '#4f8fd6', bottom: 'denim', shoes: 'white', style: 'short', hair: '#5a3a22', beard: '#5a3a22',
        acc: [grip('L', undefined, (a) => [['cyl', [a * 0.9, a * 1.4, a * 0.9], [0, a * 0.2, a * 0.6], 'white', { taper: 1.15 }], ['cyl', [a * 0.95, a * 0.5, a * 0.95], [0, a * 0.2, a * 0.6], '#8a5a35', { taper: 1.05 }], ['cyl', [a * 1.0, a * 0.15, a * 1.0], [0, a * 0.95, a * 0.6], '#2a2726']])],
      }),
      [talk('wave', "Hey, what's up?"), talk('shrug', 'Just hanging out.')],
    ),
  ),
  // Lord of the dead: grey skin, a dark robe, hair of blue fire and a two-pronged bident.
  e('hades', 'fantasy', 'gods', () =>
    act(
      who('hades', {
        h: 1.95, build: 1.1, skin: '#9aa3b0', top: '#2a2a3a', long: true, bottom: '#2a2a3a', shoes: 'black', style: 'bald', eyes: '#f6d24a', blush: '#8a93a0',
        acc: [
          wear('toga', '#2a2a3a'),
          wear('sash', '#4a5a7a'),
          x((d) => [-0.32, -0.12, 0.08, 0.28].map((u, i): Spec => ['head', 'cyl', [d.headW * 0.45, d.headH * (0.7 + (i % 2) * 0.35), d.headW * 0.45], [d.headW * u, top(d) + d.headH * (0.22 + (i % 2) * 0.12), -d.headD * 0.12], '#4fb0ff', { taper: 0, srot: [0, 0, -u * 60], role: 'glow' }])),
          x((d) => [['head', 'ball', [d.headW * 0.25, d.headH * 0.25, d.headD * 0.2], [0, d.headY - d.headH * 0.38, d.headD * 0.32], '#4fb0ff', { role: 'glow' }]]),
          pole('R', undefined, 0.95, 0.75, 0.035, '#2a2726', (a, _d, tip) => [['box', [0.2, 0.03, 0.03], [0, tip, a * 0.3], '#5a5f6a', { edge: 'sharp' }], ...[1, -1].map((s): Hold => ['cyl', [0.03, 0.22, 0.03], [s * 0.09, tip + 0.11, a * 0.3], '#5a5f6a', { taper: 0, segs: 4 }])]),
        ],
      }),
      [[A.effect('fire', { dur: 1.5 }), ...talk('laugh', 'Welcome to the underworld!')], talk('point', 'Nobody leaves my realm!')],
    ),
  ),
  // All in black under a pink apron with combs in its pocket, scissors in one hand and a hair dryer in the other.
  e('hairdresser', 'town', 'beauty', () => {
    const rest: Arms = { armR: [-25, 0, -10], foreR: [-80, 0, 10], armL: [-25, 0, 10], foreL: [-70, 0, -15] };
    return act(
      who('hairdresser', {
        top: 'black', long: true, bottom: 'black', shoes: 'black', hair: '#d0408a', style: 'bun',
        acc: [
          wear('apron', '#f4a1c0'),
          x((d) => [['torso', 'box', [d.tw * 0.4, d.torsoH * 0.16, d.td * 0.06], [0, d.torsoH * 0.32, d.td * 0.64], '#e88ab0', { layer: 5 }], ...[-1, 0, 1].map((i): Spec => ['torso', 'box', [d.tw * 0.06, d.torsoH * 0.12, d.td * 0.03], [d.tw * i * 0.1, d.torsoH * 0.42, d.td * 0.64], ['black', 'white', 'black'][i + 1], { layer: 6, edge: 'sharp' }])]),
          arms(rest),
          grip('R', rest, (a) => [...[1, -1].map((s): Hold => ['box', [a * 0.15, a * 1.6, a * 0.08], [s * a * 0.12, a * 1.0, a * 0.4], 'silver', { srot: [0, 0, s * 10], edge: 'sharp' }]), ...[1, -1].map((s): Hold => ['torus', [a * 0.55, a * 0.55, a * 0.12], [s * a * 0.25, a * 0.0, a * 0.4], '#2a2726', { tube: 0.25 }])]),
          grip('L', rest, (a) => [['capsule', [a * 0.55, a * 1.5, a * 0.55], [0, -a * 0.1, a * 0.4], '#f4a1c0'], ['cyl', [a * 1.1, a * 2.0, a * 1.1], [0, a * 0.9, a * 1.3], '#f4a1c0', { srot: [90, 0, 0] }], ['cyl', [a * 0.7, a * 0.3, a * 0.7], [0, a * 0.9, a * 2.4], '#2a2726', { srot: [90, 0, 0] }]]),
        ],
      }),
      [
        [A.par(A.face('player'), A.say('Snip, snip!', 1.6)), A.pose('foreR', { rot: [0, 0, 20], dur: 0.15 }), A.pose('foreR', { rot: [0, 0, 0], dur: 0.15 }), A.pose('foreR', { rot: [0, 0, 20], dur: 0.15 }), A.pose('foreR', { rot: [0, 0, 0], dur: 0.15 })],
        [A.par(A.effect('steam', { dur: 1.5 }), A.say('Whoosh! A little volume...', 2)), A.wait(1.2), ...talk('thumbs_up', 'Gorgeous! Next!', rest)],
      ],
    );
  }),
  // Red, green and gold diamonds, a black half-mask and a white ruff, a bicorne and a slapstick.
  e('harlequin', 'town', 'entertainment', () =>
    act(
      who('harlequin', {
        top: '#d23a3a', long: true, bottom: '#d23a3a', shoes: 'black', style: 'short', hair: 'black', pose: 'hips',
        acc: [
          diamonds(['#f2c14e', '#3f9a4a', '#2f5aa8', '#f2c14e', '#3f9a4a']),
          x2((d, _s, side) => [[`leg${side}`, 'box', [d.lw * 0.7, d.lw * 0.7, d.lw * 0.1], [0, -d.legLen * 0.25, d.lw * 0.5], side === 'L' ? '#f2c14e' : '#3f9a4a', { srot: [0, 0, 45], noInk: true, layer: 4 }], [`shin${side}`, 'box', [d.lw * 0.7, d.lw * 0.7, d.lw * 0.1], [0, -d.legLen * 0.2, d.lw * 0.47], side === 'L' ? '#2f5aa8' : '#f2c14e', { srot: [0, 0, 45], noInk: true, layer: 4 }], [`arm${side}`, 'box', [d.aw * 0.6, d.aw * 0.6, d.aw * 0.1], [0, -d.upper * 0.45, d.aw * 0.5], side === 'L' ? '#3f9a4a' : '#f2c14e', { srot: [0, 0, 45], noInk: true, layer: 4 }]]),
          x((d) => [['head', 'box', [d.headW * 0.85, d.headH * 0.2, d.headD * 0.12], [0, d.headY + d.headH * 0.05, d.headD * 0.46], 'black', { round: 0.6 }], ['torso', 'torus', [d.tw * 0.9, d.tw * 0.9, d.td * 0.3], [0, d.torsoH * 0.98, 0], 'white', { srot: [90, 0, 0], tube: 0.45 }]]),
          bicorne('black'),
        ],
      }),
      [talk('bow', 'Ladies and gentlemen!', 'hips'), [A.par(A.face('player'), A.anim('spin'), A.say('Hop-la!', 1.5))], talk('laugh', 'Ha! Got you!', 'hips')],
    ),
  ),
  // Pigtails dipped pink and blue, white face paint, half-red half-black, a baseball bat over her shoulder.
  e('harley quinn', 'town', 'comics', () => {
    const rest: Arms = { armR: [-20, 0, -40], foreR: [-120, 0, 20] };
    return act(
      who('harley quinn', {
        h: 1.68, skin: '#f8f1ea', top: 'black', long: true, bottom: 'black', shoes: 'black', hair: '#f2e2b0', style: 'pigtails', blush: '#f0a0b0',
        acc: [
          x((d) => [
            ['torso', 'box', [d.tw * 0.52, d.torsoH * 1.0, d.td * 1.1], [d.tw * 0.26, d.torsoH * 0.5, 0], '#d23a3a', { layer: 2, round: 0.5 }],
            ['legL', 'capsule', [d.lw * 1.08, d.legLen * 0.5, d.lw * 1.08], [0, -d.legLen * 0.23, 0], '#d23a3a', { layer: 2 }],
            ...[1, -1].map((s): Spec => ['head', 'ball', [d.headW * 0.3, d.headH * 0.32, d.headW * 0.3], [s * (d.headW * 0.52 + d.headH * 0.24), d.headY - d.headH * 0.42, -d.headD * 0.1], s === 1 ? '#f4a1c0' : '#4f8fd6', { layer: 1 }]),
            ['head', 'box', [d.headW * 0.85, d.headH * 0.18, d.headD * 0.12], [0, d.headY + d.headH * 0.05, d.headD * 0.46], 'black', { round: 0.6 }],
            ['torso', 'box', [d.tw * 0.15, d.tw * 0.15, d.td * 0.05], [-d.tw * 0.25, d.torsoH * 0.7, d.td * 0.56], '#d23a3a', { srot: [0, 0, 45], layer: 5 }],
          ]),
          arms(rest),
          grip('R', rest, (a) => [seg([0, -a * 0.4, a * 0.3], [-a * 1.0, a * 6.0, -a * 3.5], a * 0.45, '#c9a06a')]),
        ],
      }),
      [talk('laugh', "Hiya, puddin'!", rest), talk('wink', 'Aww, I just love a little chaos!', rest)],
    );
  }),
  // A sealed yellow suit with a gas mask and visor, a Geiger counter that ticks, a hazard drum at his feet.
  e('hazmat worker', 'town', 'emergency', () => {
    const rest: Arms = { armL: [-25, 0, 10], foreL: [-65, 0, -15] };
    return act(
      who('hazmat worker', {
        h: 1.78, build: 1.2, top: '#f2d23a', long: true, bottom: '#f2d23a', shoes: 'black', style: 'none',
        acc: [
          hat('hood', '#f2d23a'),
          x((d) => [
            ['head', 'ball', [d.headW * 0.9, d.headH * 0.62, d.headD * 0.3], [0, d.headY + d.headH * 0.05, d.headD * 0.42], 'glass', { edge: 'sharp' }],
            ['head', 'ball', [d.headW * 0.42, d.headH * 0.3, d.headD * 0.3], [0, d.headY - d.headH * 0.3, d.headD * 0.48], '#2a2726'],
            ...[1, -1].map((s): Spec => ['head', 'cyl', [d.headW * 0.26, d.headW * 0.2, d.headW * 0.26], [s * d.headW * 0.26, d.headY - d.headH * 0.36, d.headD * 0.55], '#5c6166', { srot: [70, 0, s * 30] }]),
          ]),
          gloves('#2a2726'),
          boots('#2a2726'),
          arms(rest),
          grip('L', rest, (a) => [
            ['box', [a * 1.4, a * 0.9, a * 2.2], [-a * 0.2, a * 0.6, a * 0.5], '#f2c14e', { edge: 'sharp', round: 0.2 }],
            ['box', [a * 0.9, a * 0.05, a * 0.8], [-a * 0.2, a * 1.06, a * 0.8], '#9ae86a', { name: 'dial', role: 'glow', noInk: true, mover: { kind: 'light' } }],
            seg([-a * 0.2, a * 0.6, -a * 0.6], [-a * 0.2, a * 0.6, -a * 1.6], a * 0.4, '#2a2726'),
          ]),
          x((d) => [
            ['', 'cyl', [0.42, 0.6, 0.42], [-d.tw * 1.6, 0.3, 0.1], '#f2c14e', { edge: 'sharp' }],
            ['', 'torus', [0.43, 0.43, 0.025], [-d.tw * 1.6, 0.2, 0.1], '#d0a020', { srot: [90, 0, 0], tube: 0.2 }],
            ['', 'torus', [0.43, 0.43, 0.025], [-d.tw * 1.6, 0.42, 0.1], '#d0a020', { srot: [90, 0, 0], tube: 0.2 }],
            ['', 'box', [0.16, 0.16, 0.01], [-d.tw * 1.6, 0.31, 0.31], 'black', { role: 'label', text: '☢', edge: 'sharp' }],
          ]),
        ],
      }),
      [
        [A.operate('dial', 'on'), A.par(A.face('player'), A.anim('shake'), A.say('Tick... tick... TICK-TICK-TICK!', 2.5)), A.operate('dial', 'off')],
        talk('point', 'Stay back! This area is contaminated!', rest),
      ],
    );
  }),
  // Team windbreaker and cap, a whistle on a cord and a clipboard of plays; hands on hips.
  e('head coach', 'town', 'sports', () =>
    act(
      who('head coach', {
        h: 1.78, build: 1.15, top: '#1f3a6f', long: true, bottom: '#7a7f85', shoes: 'white', style: 'short', hair: '#5a3a22', pose: 'hips',
        acc: [
          hat('cap', '#1f3a6f'),
          wear('whistle'),
          x((d) => [['torso', 'box', [d.tw * 0.25, d.tw * 0.12, d.td * 0.05], [d.tw * 0.24, d.torsoH * 0.75, d.td * 0.54], 'white', { layer: 5, role: 'label', text: 'COACH' }], ['torso', 'box', [d.tw * 0.04, d.torsoH * 0.8, d.td * 0.06], [0, d.torsoH * 0.5, d.td * 0.54], '#c9c9c9', { layer: 5 }]]),
          x((d) => [['torso', 'box', [d.tw * 0.6, d.torsoH * 0.5, d.td * 0.08], [-d.tw * 0.62, d.torsoH * 0.2, d.td * 0.3], 'wood', { srot: [0, 0, -20], edge: 'sharp' }], ['torso', 'box', [d.tw * 0.52, d.torsoH * 0.42, d.td * 0.04], [-d.tw * 0.62, d.torsoH * 0.2, d.td * 0.36], 'white', { srot: [0, 0, -20], edge: 'sharp', role: 'label', text: 'X O X' }]]),
        ],
      }),
      [[A.say('Tweeeet!', 1.2), ...talk('point', 'Give me ten laps!', 'hips')], talk('clap', "That's how we play!", 'hips')],
    ),
  ),
  // The Headless Horseman on his black horse, cape flying, sword up, a burning jack-o'-lantern in his other hand
  // (a piece: he hurls it).
  e('headless horseman', 'fantasy', 'undead', () => {
    const rest: Arms = { armR: [-20, 0, -30], foreR: [-60, 0, 0], armL: [-40, 0, 20], foreL: [-40, 0, -10] };
    const rider = who('headless horseman', {
      h: 1.8, top: '#2a2a30', long: true, bottom: '#2a2726', shoes: 'black', style: 'none',
      acc: [
        hide('head', 'face', 'earL', 'earR'),
        wear('coat', '#2a2a30'),
        x((d) => [['torso', 'cyl', [d.tw * 0.7, d.torsoH * 0.16, d.td * 1.0], [0, d.torsoH * 1.0, 0], '#4a2a3a', { taper: 1.3 }], ['torso', 'cyl', [d.tw * 0.32, d.torsoH * 0.04, d.td * 0.45], [0, d.torsoH * 1.08, 0], '#5a1a1a']]),
        x((d) => [['torso', 'box', [d.tw * 1.3, d.torsoH * 1.1, d.td * 0.1], [0, d.torsoH * 0.98, -d.td * 0.6], '#3a1a2a', { name: 'cape', off: [0, -d.torsoH * 0.55, -d.td * 0.1], rot: [25, 0, 0], layer: -3, round: 0.3 }]]),
        boots('black'),
        arms(rest),
        grip('R', rest, (a) => [['box', [a * 2, a * 0.3, a * 0.4], [0, a * 0.2, a * 0.3], 'gold', { edge: 'sharp' }], ['box', [a * 0.5, a * 7, a * 0.15], [0, a * 3.8, a * 0.3], 'silver', { edge: 'sharp' }]]),
        grip('L', rest, (a) => [
          ['ball', [a * 3.2, a * 2.7, a * 3.0], [0, a * 1.9, a * 0.5], '#f0923b', { name: 'pumpkin', piece: true }],
          ['capsule', [a * 0.4, a * 0.8, a * 0.4], [0, a * 1.45, 0], '#3f6a3a', { parent: 'pumpkin' }],
          ...[1, -1].map((s): Hold => ['cyl', [a * 0.7, a * 0.6, a * 0.2], [s * a * 0.6, a * 0.35, a * 1.42], '#ffd84a', { parent: 'pumpkin', taper: 0, segs: 3, role: 'glow', noInk: true }]),
          ['box', [a * 1.6, a * 0.4, a * 0.2], [0, -a * 0.45, a * 1.4], '#ffd84a', { parent: 'pumpkin', role: 'glow', noInk: true }],
        ]),
      ],
    });
    return act(mount('headless horseman', rider, horse('nightmare', '#1d1a1f', '#0e0c10', undefined)), [
      [A.par(A.say('Hahahaha!', 2), A.pose('cape', { rot: [30, 0, 0], dur: 0.4 })), A.detach('pumpkin', 'head'), A.par(A.move('head', { rel: 'front', of: 'self', dist: 'near' }, { speed: 'fly', style: 'fly' }), A.effect('fire', { id: 'head', dur: 2 })), A.pose('cape', { rot: [0, 0, 0], dur: 0.6 })],
      [A.reattach('pumpkin'), A.par(A.pose('hneck', { rot: [-20, 0, 0], dur: 0.3 }), A.say('Neiiigh!', 1.5)), A.pose('hneck', { rot: [0, 0, 0], dur: 0.4 })],
    ]);
  }),
  // Prince of Troy: bronze cuirass and greaves, a helmet with a red crest, a round bronze shield and a spear.
  e('hector', 'town', 'legends', () => {
    const rest: Arms = { armL: [-30, 0, 18], foreL: [-60, 0, -20] };
    return act(
      who('hector', {
        h: 1.8, build: 1.2, skin: 'skin3', top: '#8a2a2a', bottom: '#8a2a2a', skirt: '#b0803a', shoes: '#7a4a2a', hair: 'black', style: 'short', beard: 'black',
        acc: [
          face('beard', 'black'),
          hat('helmet', '#b0803a'),
          x((d) => [['head', 'box', [d.headW * 0.16, d.headH * 0.5, d.headD * 1.3], [0, top(d) + d.headH * 0.3, -d.headD * 0.08], '#c8323c', { round: 0.7 }], ...[1, -1].map((s): Spec => ['head', 'box', [d.headW * 0.1, d.headH * 0.45, d.headD * 0.35], [s * d.headW * 0.5, d.headY - d.headH * 0.12, d.headD * 0.1], '#b0803a', { round: 0.5 }])]),
          wear('armor', '#b0803a'),
          x((d) => [...[-0.3, -0.1, 0.1, 0.3].map((u): Spec => ['hips', 'box', [d.tw * 0.18, d.legLen * 0.32, d.td * 0.1], [d.tw * u, -d.legLen * 0.12, d.td * 0.55], '#7a4a2a', { layer: 3 }])]),
          x((d) => [['torso', 'box', [d.tw * 1.2, d.torsoH * 1.4, d.td * 0.1], [0, d.torsoH * 0.95, -d.td * 0.6], '#c8323c', { off: [0, -d.torsoH * 0.6, 0], layer: -3, round: 0.3 }]]),
          boots('#b0803a'),
          pole('R', undefined, 1.25, 0.5, 0.035, 'wood', (a, _d, tip) => [['cyl', [0.07, 0.24, 0.02], [0, tip + 0.12, a * 0.3], 'bronze', { taper: 0, segs: 4, edge: 'sharp' }]]),
          arms(rest),
          grip('L', rest, (a) => [['cyl', [0.75, 0.06, 0.75], [a * 0.2, 0, a * 1.0], '#b0803a', { srot: [90, 0, 0], edge: 'sharp' }], ['cyl', [0.25, 0.08, 0.25], [a * 0.2, 0, a * 1.4], '#8a5a2a', { srot: [90, 0, 0] }]]),
        ],
      }),
      [talk('point', 'For Troy!'), [A.par(A.face('player'), A.pose('armL', { rot: [-50, 0, -10], dur: 0.3 }), A.say('Achilles! Face me!', 2.2)), A.wait(1.5), A.pose('armL', { rot: [0, 0, 0], dur: 0.4 })]],
    );
  }),
  // Two metres of muscle under a lion's skin (its head worn as a hood), with a great club; he lifts a boulder.
  e('hercules', 'town', 'legends', () =>
    act(
      withSockets(
        who('hercules', {
          h: 2.0, build: 1.5, skin: 'skin3', top: 'skin3', skirt: '#c9a06a', bottom: '#c9a06a', shoes: '#7a4a2a', hair: '#3b2a1e', style: 'short', beard: '#3b2a1e',
          acc: [
            face('beard', '#3b2a1e'),
            x((d) => [
              ['head', 'ball', [d.headW * 1.2, d.headH * 1.0, d.headD * 1.05], [0, d.headY + d.headH * 0.18, -d.headD * 0.2], '#c98a3a', { layer: -2 }],
              ['head', 'ball', [d.headW * 0.8, d.headH * 0.35, d.headD * 0.5], [0, top(d) + d.headH * 0.02, d.headD * 0.25], '#c98a3a'],
              ...[1, -1].map((s): Spec => ['head', 'ball', [d.headW * 0.22, d.headW * 0.22, d.headW * 0.16], [s * d.headW * 0.38, top(d) + d.headH * 0.12, d.headD * 0.1], '#b07a2a']),
              ['head', 'ball', [d.headW * 1.3, d.headH * 0.6, d.headD * 0.8], [0, d.headY - d.headH * 0.1, -d.headD * 0.35], '#a8702a', { layer: -3 }],
              ['torso', 'box', [d.tw * 1.1, d.torsoH * 1.5, d.td * 0.15], [0, d.torsoH * 0.4, -d.td * 0.58], '#c98a3a', { layer: -3, round: 0.4 }],
              ...[1, -1].map((s): Spec => ['torso', 'ball', [d.tw * 0.36, d.torsoH * 0.2, d.td * 0.3], [s * d.tw * 0.2, d.torsoH * 0.72, d.td * 0.38], 'skin3']),
              ['torso', 'box', [d.tw * 0.45, d.torsoH * 1.1, d.td * 1.12], [-d.tw * 0.25, d.torsoH * 0.5, 0], '#c98a3a', { srot: [0, 0, 28], layer: 2 }],
            ]),
            wear('belt', '#7a4a2a'),
            grip('R', undefined, (a, d) => [['cyl', [a * 0.7, d.H * 0.42, a * 0.7], [0, -d.H * 0.18, a * 0.9], '#7a4a2a', { taper: 1.7, srot: [20, 0, 0] }]]),
          ],
        }),
        [{ name: 'lift', at: [0, 2.2, 0.1], kind: 'top', size: 1.2 }],
      ),
      [
        [A.spawn('rock', 'boulder', near), A.par(A.face('player'), A.pose('armR', { rot: [0, 0, -150], dur: 0.5 }), A.pose('armL', { rot: [0, 0, 150], dur: 0.5 })), A.attach('rock', 'self', 'lift'), A.say('Light as a feather!', 2), A.wait(1.8), A.remove('rock', 'pop'), A.par(A.pose('armR', { rot: [0, 0, 0], dur: 0.5 }), A.pose('armL', { rot: [0, 0, 0], dur: 0.5 }))],
        talk('arms_up', 'Behold, the strength of Hercules!'),
      ],
    ),
  ),
  // A caped superhero in blue with a red cape (it billows), boots and an emblem, hands on hips.
  e('hero (person)', 'town', 'comics', () =>
    act(
      who('hero (person)', {
        h: 1.85, build: 1.3, top: '#2f5aa8', long: true, bottom: '#2f5aa8', shoes: '#c8323c', style: 'short', hair: 'black', pose: 'hips',
        acc: [
          x((d) => [['torso', 'box', [d.tw * 1.25, d.torsoH + d.legLen * 0.75, d.td * 0.1], [0, d.torsoH * 0.98, -d.td * 0.6], '#c8323c', { name: 'cape', off: [0, -(d.torsoH + d.legLen * 0.75) / 2, 0], layer: -3, round: 0.3 }]]),
          boots('#c8323c'),
          wear('belt', '#f2c14e'),
          x((d) => [['torso', 'box', [d.tw * 0.35, d.tw * 0.35, d.td * 0.08], [0, d.torsoH * 0.68, d.td * 0.52], '#f2c14e', { srot: [0, 0, 45], layer: 4 }], ['torso', 'box', [d.tw * 0.18, d.tw * 0.18, d.td * 0.08], [0, d.torsoH * 0.68, d.td * 0.56], '#c8323c', { srot: [0, 0, 45], layer: 5 }], ['head', 'box', [d.headW * 0.85, d.headH * 0.16, d.headD * 0.12], [0, d.headY + d.headH * 0.05, d.headD * 0.46], 'navy', { round: 0.6 }]]),
        ],
      }),
      [talk('point', 'Never fear, I am here!', 'hips'), [A.pose('cape', { rot: [35, 0, 0], dur: 0.4 }), ...talk('arms_up', 'Up, up and away!', 'hips'), A.pose('cape', { rot: [0, 0, 0], dur: 0.6 })]],
    ),
  ),
  // A heroine in purple and gold: tiara, mask, a pink cape that billows, gold boots.
  e('heroine', 'town', 'comics', () =>
    act(
      who('heroine', {
        h: 1.7, top: '#7a3aa8', long: true, bottom: '#7a3aa8', shoes: 'gold', hair: '#c8323c', style: 'ponytail', pose: 'hips',
        acc: [
          x((d) => [['torso', 'box', [d.tw * 1.2, d.torsoH + d.legLen * 0.7, d.td * 0.1], [0, d.torsoH * 0.98, -d.td * 0.6], '#e86f9a', { name: 'cape', off: [0, -(d.torsoH + d.legLen * 0.7) / 2, 0], layer: -3, round: 0.3 }]]),
          boots('gold'),
          wear('belt', 'gold'),
          hat('tiara', 'gold'),
          cuffs('gold'),
          x((d) => [['torso', 'box', [d.tw * 0.3, d.tw * 0.3, d.td * 0.08], [0, d.torsoH * 0.68, d.td * 0.52], 'gold', { srot: [0, 0, 45], layer: 4 }], ['head', 'box', [d.headW * 0.85, d.headH * 0.16, d.headD * 0.12], [0, d.headY + d.headH * 0.05, d.headD * 0.46], '#c8327a', { round: 0.6 }]]),
        ],
      }),
      [talk('thumbs_up', 'Justice is served!', 'hips'), [A.pose('cape', { rot: [35, 0, 0], dur: 0.4 }), ...talk('point', 'To the rescue!', 'hips'), A.pose('cape', { rot: [0, 0, 0], dur: 0.6 })]],
    ),
  ),
  // Overalls over a plaid shirt, straw hat, a long beard, bare feet and a banjo.
  e('hillbilly', 'town', 'subcultures', () => {
    const rest: Arms = { armR: [-25, 0, -10], foreR: [-60, 0, 45], armL: [-40, 0, 25], foreL: [-55, 0, -55] };
    return act(
      who('hillbilly', {
        top: '#c8323c', long: true, bottom: 'denim', shoes: 'skin2', skin: 'skin2', hair: '#7a4a2a', style: 'long', beard: '#7a4a2a',
        acc: [
          hat('straw'),
          face('longbeard', '#7a4a2a'),
          x((d) => [rod('head', [d.headW * 0.1, d.headY - d.headH * 0.22, d.headD * 0.48], [d.headW * 0.4, d.headY - d.headH * 0.12, d.headD * 0.75], d.headW * 0.03, '#e8cf7a')]),
          bands('#7a1a1a', [0.2, 0.45, 0.7], 0.04),
          wear('overalls', 'denim'),
          x2((d, s) => [['torso', 'box', [d.tw * 0.12, d.torsoH * 0.6, d.td * 0.08], [s * d.tw * 0.25, d.torsoH * 0.72, d.td * 0.53], 'denim', { layer: 4 }], ['torso', 'ball', [d.tw * 0.07, d.tw * 0.07, d.td * 0.05], [s * d.tw * 0.25, d.torsoH * 0.48, d.td * 0.57], 'silver', { layer: 5 }]]),
          arms(rest),
          x((d) => {
            const z = d.td * 0.85, T = d.torsoH;
            return [
              ['torso', 'cyl', [d.tw * 0.75, d.td * 0.25, d.tw * 0.75], [d.tw * 0.0, T * 0.3, z], '#e8dcc0', { srot: [90, 0, 0] }],
              ['torso', 'torus', [d.tw * 0.8, d.tw * 0.8, d.td * 0.28], [d.tw * 0.0, T * 0.3, z], '#8a5a35', { tube: 0.12 }],
              rod('torso', [d.tw * 0.25, T * 0.4, z + d.td * 0.1], [d.tw * 1.1, T * 1.0, z + d.td * 0.1], d.tw * 0.07, '#5a3a22'),
            ];
          }),
        ],
      }),
      [
        [A.par(A.face('player'), A.say('♪ Plink-a-plunk! Yee-haw! ♪', 2.2)), A.pose('foreR', { rot: [-20, 0, 0], dur: 0.15 }), A.pose('foreR', { rot: [10, 0, 0], dur: 0.15 }), A.pose('foreR', { rot: [-20, 0, 0], dur: 0.15 }), A.pose('foreR', { rot: [0, 0, 0], dur: 0.15 })],
        talk('laugh', "Well, I'll be! Ain't that somethin'!", rest),
      ],
    );
  }),
  // Tie-dye, bell-bottoms and a flower crown, round orange shades and a peace sign; flashing a peace sign.
  e('hippie', 'town', 'subcultures', () =>
    act(
      who('hippie', {
        top: '#d0408a', long: true, bottom: 'denim', shoes: 'brown', hair: '#7a3b1e', style: 'long', beard: '#7a3b1e', pose: 'wave',
        acc: [
          hat('headband', '#f0923b'),
          x((d) => [0, 1, 2, 3, 4].map((i): Spec => ['head', 'ball', [d.headW * 0.16, d.headW * 0.16, d.headW * 0.1], [Math.cos(i * 0.75 - 1.5) * d.headW * 0.5, top(d) - d.headH * 0.12, Math.sin(i * 0.75 - 1.5) * d.headD * 0.5 + d.headD * 0.05], ['#f2c14e', 'white', '#e86f7d', '#f2c14e', 'white'][i]])),
          face('glasses', '#f0923b'),
          x((d) => [[0.25, 0.3, '#f2c14e'], [-0.2, 0.55, '#3fc7e0'], [0.15, 0.8, '#7ad04a'], [-0.25, 0.15, '#f0923b']].map(([u, v, c]): Spec => ['torso', 'ball', [d.tw * 0.32, d.torsoH * 0.24, d.td * 0.08], [d.tw * (u as number), d.torsoH * (v as number), d.td * 0.52], c as string, { noInk: true, layer: 4 }])),
          x2((d, _s, side) => [[`shin${side}`, 'cyl', [d.lw * 1.0, d.legLen * 0.25, d.lw * 1.0], [0, -d.legLen * 0.33, 0], 'denim', { taper: 1.8 }]]),
          x((d) => [['torso', 'torus', [d.tw * 0.62, d.tw * 0.62, d.td * 0.06], [0, d.torsoH * 0.88, d.td * 0.12], 'silver', { srot: [70, 0, 0], tube: 0.08 }], ['torso', 'torus', [d.tw * 0.2, d.tw * 0.2, d.td * 0.05], [0, d.torsoH * 0.62, d.td * 0.55], 'silver', { tube: 0.15 }]]),
        ],
      }),
      [[A.effect('hearts', { dur: 2 }), ...talk('wave', 'Peace and love, man!', 'wave')], talk('dance', 'Groovy!', 'wave')],
    ),
  ),
  // Beanie, big beard, thick-rimmed glasses, flannel and skinny jeans, a takeaway latte.
  e('hipster', 'town', 'subcultures', () =>
    act(
      who('hipster', {
        top: '#8a2a2a', long: true, bottom: '#3a3f4a', shoes: '#8a5a35', hair: '#3b2a1e', style: 'short', beard: '#3b2a1e',
        acc: [
          hat('beanie', '#3f7a6a'),
          face('glasses', 'black'),
          face('beard', '#3b2a1e'),
          bands('#2a2726', [0.25, 0.5, 0.75], 0.05),
          x2((d, s) => [['torso', 'box', [d.tw * 0.06, d.torsoH * 1.0, d.td * 1.12], [s * d.tw * 0.25, d.torsoH * 0.5, 0], '#2a2726', { layer: 4, noInk: true }]]),
          x2((d, _s, side) => [[`shin${side}`, 'cyl', [d.lw * 0.9, d.legLen * 0.06, d.lw * 0.9], [0, -d.legLen * 0.38, 0], '#d9c08a', { noInk: true }]]),
          grip('L', undefined, (a) => [['cyl', [a * 0.9, a * 1.5, a * 0.9], [0, a * 0.3, a * 0.6], 'white', { taper: 1.2 }], ['cyl', [a * 1.0, a * 0.5, a * 1.0], [0, a * 0.25, a * 0.6], '#a0703a', { taper: 1.1 }], ['cyl', [a * 1.1, a * 0.2, a * 1.1], [0, a * 1.1, a * 0.6], 'white']]),
        ],
      }),
      [talk('shrug', "You probably haven't heard of it."), [A.spawn('vinyl', 'record', near), ...talk('nod', 'It sounds better on vinyl.'), A.wait(1.2), A.remove('vinyl', 'pop')]],
    ),
  ),
  // A tweed jacket with elbow patches, bow tie and spectacles, an old leather-bound book open in his hands.
  e('historian', 'town', 'academia', () =>
    act(
      who('historian', {
        h: 1.74, top: 'white', long: true, bottom: '#5a4a3a', shoes: 'darkbrown', hair: 'gray', style: 'short', beard: 'gray', pose: 'hold',
        acc: [
          wear('coat', '#8a6a4a'),
          shirtFront(),
          wear('bowtie', '#3f6a3a'),
          face('glasses', 'darkbrown'),
          face('mustache', 'gray'),
          x2((d, _s, side) => [[`arm${side}`, 'ball', [d.aw * 0.8, d.aw * 0.9, d.aw * 0.4], [0, -d.upper * 0.75, -d.aw * 0.45], '#6a4a2a', { layer: 3 }]]),
          grip('R', 'hold', (a) => [['box', [a * 2.4, a * 0.3, a * 3.2], [-a * 1.2, a * 0.7, a * 0.4], '#6a2a1a', { srot: [-50, 0, 0], edge: 'sharp', round: 0.2 }], ['box', [a * 2.2, a * 0.3, a * 3.0], [-a * 1.2, a * 0.92, a * 0.45], 'cream', { srot: [-50, 0, 0], edge: 'sharp' }]]),
        ],
      }),
      [talk('look_around', 'Hmm... fascinating.', 'hold'), talk('point', 'In 1066, the Normans landed right over there!', 'hold')],
    ),
  ),
  // Patched coat and trousers, a battered beanie and a bindle over his shoulder.
  e('hobo', 'town', 'everyday people', () => {
    const rest: Arms = { armR: [-30, 0, -20], foreR: [-120, 0, 10] };
    return act(
      who('hobo', {
        top: '#7a6a5a', long: true, bottom: '#5a5040', shoes: 'darkbrown', hair: 'darkbrown', style: 'short', beard: '#5a4a3a',
        acc: [
          hat('beanie', '#5c6166'),
          face('beard', '#5a4a3a'),
          wear('coat', '#6a5a4a'),
          x((d) => [['torso', 'box', [d.tw * 0.22, d.torsoH * 0.2, d.td * 0.06], [d.tw * 0.22, d.torsoH * 0.35, d.td * 0.56], '#a0522d', { layer: 4 }], ['legL', 'box', [d.lw * 0.7, d.lw * 0.7, d.lw * 0.1], [0, -d.legLen * 0.25, d.lw * 0.5], '#8a8f3a', { layer: 4 }]]),
          arms(rest),
          grip('R', rest, (a, d) => [seg([0, 0, a * 0.3], [0, a * 2.5, -d.H * 0.3], a * 0.3, 'wood'), ['ball', [a * 3.0, a * 2.6, a * 3.0], [0, a * 1.6, -d.H * 0.32], '#c8323c'], ['ball', [a * 0.5, a * 0.5, a * 0.5], [0, a * 3.0, -d.H * 0.32], '#c8323c']]),
        ],
      }),
      [talk('wave', 'Spare a coin, friend?', rest), talk('nod', 'Off to see the world, one town at a time.')],
    );
  }),
  // Helmet and visor, padded jersey with a number, skates, gloves and a stick; he shoots a puck.
  e('hockey player', 'town', 'sports', () => {
    const rest: Arms = { armR: [-30, 0, -15], foreR: [-40, 0, 25], armL: [-25, 0, 20], foreL: [-55, 0, -30] };
    return act(
      who('hockey player', {
        h: 1.85, build: 1.3, top: '#c8323c', long: true, bottom: '#2a2726', legs: '#c8323c', shoes: 'black', style: 'short', hair: '#a0522d',
        acc: [
          hat('helmet', 'white'),
          x((d) => [['head', 'box', [d.headW * 0.9, d.headH * 0.2, d.headD * 0.05], [0, d.headY + d.headH * 0.03, d.headD * 0.56], 'glass', { edge: 'sharp' }]]),
          chest('9', 'white', 0.4),
          bands('white', [0.15], 0.1),
          gloves('#2a2726', 1.4),
          x2((d, _s, side) => [[`foot${side}`, 'box', [d.lw * 0.15, d.H * 0.04, d.lw * 2.2], [0, -d.H * 0.05, d.lw * 0.3], 'silver', { edge: 'sharp' }]]),
          lift(0.04),
          arms(rest),
          grip('R', rest, (a, d) => [seg([0, a * 0.6, a * 0.3], [-a * 0.5, -d.H * 0.52, d.H * 0.22], a * 0.3, '#2a2726'), ['box', [a * 0.4, a * 0.7, a * 2.8], [-a * 0.6, -d.H * 0.53, d.H * 0.3], '#2a2726', { round: 0.3, edge: 'sharp' }]]),
        ],
      }),
      [
        [A.spawn('puck', 'hockey puck', near), A.par(A.face('player'), A.pose('armR', { rot: [40, 0, -30], dur: 0.4 })), A.par(A.pose('armR', { rot: [-50, 0, 10], dur: 0.15 }), A.move('puck', { rel: 'front', of: 'self', dist: 'far' }, { speed: 'fly', style: 'slide' })), A.par(A.say('He shoots... he scores!', 2), A.pose('armR', { rot: [0, 0, 0], dur: 0.5 })), A.remove('puck', 'pop')],
        talk('arms_up', 'GOAL!', rest),
      ],
    );
  }),
  // Tied up with rope and gagged: the rope and gag are pieces, so a click sets them free.
  e('hostage', 'town', 'crime', () =>
    act(
      who('hostage', {
        top: 'white', long: true, bottom: 'gray', shoes: 'brown', hair: '#5a3a22', style: 'short',
        acc: [
          x((d) => [
            ['torso', 'torus', [d.tw * 1.7, d.td * 1.9, d.torsoH * 0.08], [0, d.torsoH * 0.45, 0], '#c9a06a', { name: 'rope', piece: true, srot: [90, 0, 0], tube: 0.12 }],
            ['rope', 'torus', [d.tw * 1.7, d.td * 1.9, d.torsoH * 0.08], [0, d.torsoH * 0.25, 0], '#c9a06a', { srot: [90, 0, 0], tube: 0.12 }],
            ['rope', 'torus', [d.tw * 1.6, d.td * 1.8, d.torsoH * 0.08], [0, -d.torsoH * 0.15, 0], '#c9a06a', { srot: [90, 0, 0], tube: 0.12 }],
            ['head', 'torus', [d.headW * 1.04, d.headD * 1.0, d.headH * 0.14], [0, d.headY - d.headH * 0.16, 0], 'white', { name: 'gag', piece: true, srot: [90, 0, 0], tube: 0.25 }],
          ]),
        ],
      }),
      [
        [A.par(A.face('player'), A.anim('shake'), A.say('Mmmph! Mmmph!', 2))],
        [A.par(A.detach('rope', 'rope'), A.detach('gag', 'gag')), ...talk('arms_up', "I'm free! Thank you!")],
        [A.par(A.reattach('rope'), A.reattach('gag')), A.say('Mmmph?!', 1.5)],
      ],
    ),
  ),
  // A grass skirt, a lei and a flower behind her ear, hands out in the hula.
  e('hula dancer', 'town', 'arts', () => {
    const rest: Arms = { armR: [-10, 0, -75], foreR: [-20, 0, -30], armL: [-10, 0, 75], foreL: [-20, 0, 30] };
    return act(
      who('hula dancer', {
        h: 1.66, top: 'skin3', skin: 'skin3', skirt: '#b8c45a', legs: 'skin3', bottom: 'skin3', shoes: 'skin3', hair: '#1d1d1d', style: 'long',
        acc: [
          x((d) => [
            ...[1, -1].map((s): Spec => ['torso', 'ball', [d.tw * 0.32, d.tw * 0.28, d.td * 0.5], [s * d.tw * 0.18, d.torsoH * 0.72, d.td * 0.35], '#7a4a2a']),
            ...[0, 1, 2, 3, 4, 5, 6, 7].map((i): Spec => ['torso', 'ball', [d.tw * 0.18, d.tw * 0.18, d.tw * 0.18], [Math.cos((i / 8) * Math.PI * 2) * d.tw * 0.42, d.torsoH * 0.9, Math.sin((i / 8) * Math.PI * 2) * d.td * 0.6], ['#e86f9a', '#f2c14e', 'white', '#e86f9a'][i % 4]]),
            ...[-0.5, -0.25, 0, 0.25, 0.5].map((u): Spec => ['hips', 'box', [d.tw * 0.05, d.legLen * 0.5, d.td * 0.04], [d.tw * u * 1.1, -d.legLen * 0.22, d.td * 0.78], '#8a9a3a', { noInk: true, layer: 3 }]),
          ]),
          hat('flower', '#e8323c'),
          cuffs('#e86f9a'),
          arms(rest),
        ],
      }),
      [
        talk('dance', 'Aloha!', rest),
        [A.par(A.face('player'), A.say('♪ Mahalo! ♪', 2)), A.pose('torso', { rot: [0, 0, 8], dur: 0.4 }), A.pose('torso', { rot: [0, 0, -8], dur: 0.4 }), A.pose('torso', { rot: [0, 0, 8], dur: 0.4 }), A.pose('torso', { rot: [0, 0, 0], dur: 0.4 })],
      ],
    );
  }),
  // Just a person, waving hello.
  e('human', 'town', 'everyday people', () =>
    act(
      who('human', { h: 1.72, top: '#fdf6e8', bottom: '#4a6fa5', shoes: 'gray', hair: '#5a3a22', style: 'short', pose: 'wave' }),
      [talk('wave', 'Hello, fellow human!', 'wave'), talk('shrug', 'Just being human.')],
    ),
  ),
  // Humpty Dumpty on his brick wall: a big egg with a face, a bow tie, arms and legs over the edge. The egg is a
  // piece: it wobbles, has a great fall, and all the king's horses put him together again.
  e('humpty dumpty', 'town', 'storybook', () => {
    const b = m('humpty dumpty')
      .box([1.2, 0.72, 0.5], [0, 0.36, 0], { color: '#b5543c', round: 0.04, name: 'wall', edge: 'sharp' })
      .box([1.26, 0.07, 0.56], [0, 0.755, 0], { color: '#a8a49a', round: 0.25, edge: 'sharp' });
    [0.18, 0.36, 0.54].forEach((y) => b.box([1.21, 0.012, 0.51], [0, y, 0], { color: '#d8c8b0', noInk: true, edge: 'sharp', parent: 'wall' }));
    [0, 1, 2, 3].forEach((r) => (r % 2 ? [-0.3, 0, 0.3] : [-0.45, -0.15, 0.15, 0.45]).forEach((x) => b.box([0.012, 0.17, 0.51], [x, 0.09 + r * 0.18, 0], { color: '#d8c8b0', noInk: true, edge: 'sharp', parent: 'wall' })));
    return b
      .ball([0.82, 1.02, 0.74], [0, 1.27, 0.03], { color: '#f6ecd0', name: 'egg', parent: 'wall', piece: true })
      .torus([0.82, 0.75, 0.1], [0, 1.1, 0.03], { color: '#2f5aa8', rot: [90, 0, 0], tube: 0.18, parent: 'egg' })
      .ball([0.16, 0.1, 0.06], [0.08, 1.02, 0.4], { color: '#c8323c', parent: 'egg' })
      .ball([0.16, 0.1, 0.06], [-0.08, 1.02, 0.4], { color: '#c8323c', parent: 'egg' })
      .ball([0.06, 0.06, 0.06], [0, 1.02, 0.42], { color: '#a02020', parent: 'egg' })
      .ball([0.1, 0.13, 0.05], [0.13, 1.45, 0.36], { color: '#2a2726', eye: true, parent: 'egg' })
      .ball([0.1, 0.13, 0.05], [-0.13, 1.45, 0.36], { color: '#2a2726', eye: true, parent: 'egg' })
      .ball([0.03, 0.03, 0.02], [0.14, 1.48, 0.385], { color: 'white', parent: 'egg', noInk: true })
      .ball([0.03, 0.03, 0.02], [-0.12, 1.48, 0.385], { color: 'white', parent: 'egg', noInk: true })
      .arc([0.26, 0.12, 0.03], [0, 1.27, 0.37], { color: '#8a2a2a', rot: [0, 0, 180], parent: 'egg', tube: 0.3 })
      .ball([0.09, 0.06, 0.06], [0, 1.36, 0.4], { color: '#efd8b0', parent: 'egg' })
      .rod([0.36, 1.17, 0.05], [0.5, 0.93, 0.2], 0.08, '#c8323c', { parent: 'egg' })
      .rod([-0.36, 1.17, 0.05], [-0.5, 0.93, 0.2], 0.08, '#c8323c', { parent: 'egg' })
      .ball(0.1, [0.52, 0.88, 0.22], { color: 'white', parent: 'egg' })
      .ball(0.1, [-0.52, 0.88, 0.22], { color: 'white', parent: 'egg' })
      .rod([0.15, 0.8, 0.22], [0.16, 0.47, 0.3], 0.09, '#2f3d6a', { parent: 'egg' })
      .rod([-0.15, 0.8, 0.22], [-0.16, 0.47, 0.3], 0.09, '#2f3d6a', { parent: 'egg' })
      .box([0.12, 0.08, 0.2], [0.16, 0.43, 0.36], { color: '#3a2a1a', round: 0.6, parent: 'egg' })
      .box([0.12, 0.08, 0.2], [-0.16, 0.43, 0.36], { color: '#3a2a1a', round: 0.6, parent: 'egg' })
      .act({
        click: [
          [A.anim('wobble', 2), A.say('Whoa... whoa!', 1.5)],
          [A.say('Uh oh!', 1), A.detach('egg', 'humpty'), A.wait(1.2), A.say('Ouch!', 1.5)],
          [A.reattach('egg'), A.say("All the king's horses... did it!", 2.5)],
        ],
      })
      .done();
  }),
  // Bent under his hump in rough brown clothes, he rings the great bells.
  e('hunchback', 'town', 'storybook', () =>
    act(
      who('hunchback', {
        h: 1.6, build: 1.2, top: '#8a6a3a', long: true, bottom: '#5a4a30', shoes: 'darkbrown', hair: '#a0522d', style: 'spiky', skin: 'skin2',
        acc: [
          lean(28),
          x((d) => [['torso', 'ball', [d.tw * 0.85, d.torsoH * 0.6, d.td * 0.9], [d.tw * 0.15, d.torsoH * 0.78, -d.td * 0.45], '#8a6a3a'], ['head', 'ball', [d.headW * 0.25, d.headW * 0.2, d.headW * 0.1], [-d.headW * 0.2, d.headY + d.headH * 0.12, d.headD * 0.46], 'skin2']]),
          wear('belt', '#3a2a1a'),
          x((d) => [rod('handR', [0, 0, 0], [0, d.H * 0.9, d.H * 0.05], d.aw * 0.25, '#c9a06a')]),
        ],
      }),
      [
        [A.par(A.face('player'), A.pose('armR', { rot: [0, 0, -150], dur: 0.4 }), A.say('The bells! The bells!', 2.2)), A.pose('armR', { rot: [0, 0, -40], dur: 0.4 }), A.pose('armR', { rot: [0, 0, -150], dur: 0.4 }), A.pose('armR', { rot: [0, 0, 0], dur: 0.5 })],
        talk('wave', 'Hello... friend.'),
      ],
    ),
  ),
  // Broad shoulders in a tight white T-shirt, jeans and shades, arms folded; he flexes.
  e('hunk', 'town', 'everyday people', () =>
    act(
      who('hunk', {
        h: 1.88, build: 1.5, top: 'white', bottom: 'denim', shoes: 'black', hair: 'black', style: 'short', pose: 'cross',
        acc: [x((d) => [1, -1].map((s): Spec => ['torso', 'ball', [d.tw * 0.36, d.torsoH * 0.22, d.td * 0.3], [s * d.tw * 0.2, d.torsoH * 0.72, d.td * 0.38], 'white'])), face('sunglasses'), wear('belt', 'darkbrown')],
      }),
      [
        [A.par(...free('cross')), A.par(A.face('player'), A.pose('armR', { rot: [-6, 0, -84], dur: 0.4 }), A.pose('foreR', { rot: [82, 0, -192], dur: 0.4 }), A.pose('armL', { rot: [-6, 0, 84], dur: 0.4 }), A.pose('foreL', { rot: [82, 0, 192], dur: 0.4 }), A.say('Welcome to the gun show!', 2.2)), A.wait(1.6), A.par(...back('cross'))],
        talk('nod', 'Hey there.'),
      ],
    ),
  ),
  // Blaze-orange cap and vest over camouflage, boots, binoculars; very, very quiet.
  e('hunter', 'town', 'outdoors', () =>
    act(
      who('hunter', {
        top: '#5a6a3a', long: true, bottom: '#5a6a3a', shoes: 'darkbrown', beard: '#7a4a2a', hair: '#7a4a2a', style: 'short',
        acc: [
          hat('cap', '#f0703a'),
          wear('vest', '#f0703a'),
          x((d) => [[0.2, 0.3, '#3f4a2a'], [-0.25, 0.7, '#7a6a4a'], [0.3, 0.8, '#3f4a2a']].map(([u, v, c]): Spec => ['torso', 'ball', [d.tw * 0.22, d.torsoH * 0.15, d.td * 0.08], [d.tw * (u as number), d.torsoH * (v as number), d.td * 0.56], c as string, { noInk: true, layer: 4 }])),
          boots('darkbrown'),
          x((d) => [['torso', 'cyl', [d.tw * 0.15, d.torsoH * 0.16, d.tw * 0.15], [d.tw * 0.09, d.torsoH * 0.62, d.td * 0.62], '#2a2726', { edge: 'sharp' }], ['torso', 'cyl', [d.tw * 0.15, d.torsoH * 0.16, d.tw * 0.15], [-d.tw * 0.09, d.torsoH * 0.62, d.td * 0.62], '#2a2726', { edge: 'sharp' }]]),
          rifle('R', '#5a3a22', '#2a2726'),
        ],
      }),
      [[A.par(A.face('player'), A.pose('armL', { rot: [-50, 0, -18], dur: 0.35 }), A.pose('foreL', { rot: [-45, 0, 0], dur: 0.35 }), A.say('Shh... be vewy, vewy quiet.', 2.2)), A.wait(1.2), A.par(A.pose('armL', { rot: [0, 0, 0], dur: 0.4 }), A.pose('foreL', { rot: [0, 0, 0], dur: 0.4 }))], [A.spawn('duck', 'duck', near), A.remove('duck', 'fly_away'), ...talk('shrug', 'Missed it again!')]],
    ),
  ),
  // Icarus in a short white tunic with great wings of wax and feathers (they flap, then melt in the sun).
  e('icarus', 'town', 'legends', () =>
    act(
      who('icarus', {
        h: 1.7, skin: 'skin2', top: 'white', skirt: 'white', bottom: 'white', legs: 'skin2', shoes: '#8a5a35', hair: '#d9a441', style: 'short',
        acc: [
          wear('belt', '#8a5a35'),
          x2((d, s, side) => {
            const L = d.tw * 2.2, dir: Vec3 = [s * 0.96, 0.28, 0];
            return [
              ['torso', 'capsule', [d.tw * 0.12, L, d.tw * 0.12], [s * d.tw * 0.22, d.torsoH * 0.88, -d.td * 0.6], '#e8d49a', { name: `wing${side}`, srot: [0, 0, -s * 74], off: [dir[0] * L * 0.5, dir[1] * L * 0.5, 0], rot: [0, s * 18, 0] }],
              ...[0, 1, 2, 3, 4, 5].map((i): Spec => {
                const k = 0.12 + i * 0.16, len = d.torsoH * (0.55 + i * 0.12);
                return [`wing${side}`, 'capsule', [d.tw * 0.24, len, d.td * 0.08], [dir[0] * L * k, dir[1] * L * k, -d.td * 0.02], i % 2 ? '#efe4cc' : 'white', { off: [s * len * 0.12, -len * 0.48, 0], srot: [0, 0, s * 14] }];
              }),
            ];
          }),
          x2((d, _s, side) => [[`shin${side}`, 'cyl', [d.lw * 0.95, d.legLen * 0.25, d.lw * 0.95], [0, -d.legLen * 0.25, 0], '#8a5a35', { noInk: true, tube: 0.2 }]]),
        ],
      }),
      [
        [A.par(A.face('player'), A.say('Look, father! I can fly!', 2)), A.par(A.pose('wingL', { rot: [0, 0, 35], dur: 0.25 }), A.pose('wingR', { rot: [0, 0, -35], dur: 0.25 })), A.par(A.pose('wingL', { rot: [0, 0, -15], dur: 0.25 }), A.pose('wingR', { rot: [0, 0, 15], dur: 0.25 }), A.anim('hop')), A.par(A.pose('wingL', { rot: [0, 0, 35], dur: 0.25 }), A.pose('wingR', { rot: [0, 0, -35], dur: 0.25 })), A.par(A.pose('wingL', { rot: [0, 0, 0], dur: 0.3 }), A.pose('wingR', { rot: [0, 0, 0], dur: 0.3 }))],
        [A.par(A.effect('smoke', { dur: 2 }), A.pose('wingL', { rot: [0, 0, -45], dur: 1 }), A.pose('wingR', { rot: [0, 0, 45], dur: 1 }), A.spawn('f', 'feather', near)), ...talk('cover_eyes', 'Oh no... too close to the sun!'), A.remove('f', 'fade'), A.par(A.pose('wingL', { rot: [0, 0, 0], dur: 0.6 }), A.pose('wingR', { rot: [0, 0, 0], dur: 0.6 }))],
      ],
    ),
  ),
  // In white with a paper hat and bow tie, behind his ice-cream cart (a real one: a freezer box on wheels with a
  // lid that lifts and a striped umbrella), a cone in his hand.
  e('ice cream man', 'town', 'food service', () =>
    act(
      withSockets(
        who('ice cream man', {
          h: 1.78, top: 'white', long: true, bottom: 'white', shoes: 'black', style: 'short', hair: '#5a3a22',
          acc: [
            x((d) => [['head', 'box', [d.headW * 0.95, d.headH * 0.3, d.headD * 0.5], [0, top(d) - d.headH * 0.02, 0], 'white', { round: 0.4, edge: 'sharp' }], ['head', 'box', [d.headW * 0.97, d.headH * 0.06, d.headD * 0.52], [0, top(d) - d.headH * 0.1, 0], '#e86f9a', { noInk: true }]]),
            wear('bowtie', '#c8323c'),
            wear('apron', 'white'),
            grip('L', undefined, (a) => [['cyl', [a * 0.9, a * 1.6, a * 0.9], [0, a * 0.4, a * 0.6], '#d9a65a', { taper: 0, srot: [180, 0, 0] }], ['ball', [a * 1.0, a * 0.95, a * 1.0], [0, a * 1.4, a * 0.6], '#f4a1c0'], ['ball', [a * 0.9, a * 0.85, a * 0.9], [0, a * 2.1, a * 0.6], '#fdf6e8']]),
            x((d) => {
              const cx = -d.tw * 1.6 - 0.45, cz = 0.15;
              return [
                ['', 'box', [0.62, 0.72, 1.05], [cx, 0.62, cz], 'white', { edge: 'sharp', round: 0.12 }],
                ['', 'box', [0.64, 0.1, 1.07], [cx, 0.36, cz], '#e86f9a', { edge: 'sharp', noInk: true }],
                ['', 'box', [0.02, 0.24, 0.5], [cx + 0.32, 0.72, cz], '#e86f9a', { role: 'label', text: 'ICE CREAM', edge: 'sharp' }],
                ['', 'box', [0.6, 0.05, 0.98], [cx, 1.005, cz - 0.49], '#d0d4d8', { name: 'hatch', edge: 'sharp', round: 0.3, off: [0, 0, 0.49], mover: { kind: 'swing', axis: 'x', amount: -100 } }],
                ...[1, -1].map((s): Spec => ['', 'cyl', [0.5, 0.06, 0.5], [cx + s * 0.34, 0.25, cz + 0.2], '#2a2726', { srot: [0, 0, 90], name: `wheel${s > 0 ? 'L' : 'R'}` }]),
                rod('', [cx - 0.2, 0.95, cz - 0.55], [cx + 0.2, 0.95, cz - 0.55], 0.04, 'silver'),
                rod('', [cx, 1.03, cz + 0.3], [cx, 2.2, cz + 0.3], 0.04, 'silver'),
                ['', 'cyl', [1.7, 0.4, 1.7], [cx, 2.25, cz + 0.3], '#e86f9a', { taper: 0, segs: 8 }],
                ['', 'cyl', [1.72, 0.06, 1.72], [cx, 2.06, cz + 0.3], 'white', { segs: 8, noInk: true }],
              ];
            }),
          ],
        }),
        [{ name: 'freezer', at: [-0.95, 0.85, 0.15], kind: 'inside', size: 0.5 }],
      ),
      [
        [A.operate('hatch', 'open'), A.spawn('ice', 'ice cream', near), ...talk('nod', 'One scoop or two?'), A.wait(1.5), A.operate('hatch', 'close'), A.remove('ice', 'pop')],
        talk('wave', 'Ice cream! Get your ice cream!'),
      ],
    ),
  ),
  // A beret and a paint-splashed smock, a palette and brush, and an easel with a picture in progress.
  e('illustrator', 'town', 'arts', () => {
    const rest: Arms = { armR: [-40, 0, -20], foreR: [-70, 0, 10], armL: [-20, 0, 10], foreL: [-70, 0, -10] };
    return act(
      who('illustrator', {
        top: '#3fa7a0', long: true, bottom: 'black', shoes: 'black', style: 'short', hair: '#2a1d16',
        acc: [
          hat('beret', 'black'),
          wear('apron', '#f2ecd8'),
          x((d) => [[0.2, 0.3, '#e0473b'], [-0.15, 0.1, '#2f5aa8'], [0.05, -0.2, '#f2c14e'], [-0.2, 0.45, '#3f9a4a']].map(([u, v, c]): Spec => ['torso', 'ball', [d.tw * 0.12, d.tw * 0.1, d.td * 0.05], [d.tw * (u as number), d.torsoH * (v as number), d.td * 0.62], c as string, { noInk: true, layer: 5 }])),
          arms(rest),
          grip('R', rest, (a) => [seg([0, -a * 0.2, a * 0.3], [0.05, a * 1.0, 0.18], a * 0.12, 'wood'), ['ball', [a * 0.25, a * 0.4, a * 0.25], [0.05, a * 1.1, 0.19], '#2f5aa8']]),
          grip('L', rest, (a) => [['cyl', [a * 3.4, a * 0.2, a * 2.6], [a * 0.4, a * 0.3, a * 0.8], 'lightwood', { edge: 'sharp' }], ...(['#e0473b', '#2f5aa8', '#f2c14e', '#3f9a4a'] as const).map((c, i): Hold => ['ball', [a * 0.55, a * 0.25, a * 0.55], [(i - 1.5) * a * 0.7 + a * 0.4, a * 0.45, a * 1.2], c, { noInk: true }])]),
          x((d) => {
            const ex = -d.tw * 0.6, ez = 0.75;
            return [
              rod('', [ex, 1.75, ez], [ex - 0.35, 0, ez + 0.25], 0.035, 'wood'),
              rod('', [ex, 1.75, ez], [ex + 0.35, 0, ez + 0.25], 0.035, 'wood'),
              rod('', [ex, 1.75, ez], [ex, 0, ez - 0.45], 0.035, 'wood'),
              ['', 'box', [0.75, 0.03, 0.06], [ex, 0.75, ez + 0.12], 'wood', { edge: 'sharp' }],
              ['', 'box', [0.7, 0.55, 0.03], [ex, 1.08, ez + 0.14], 'white', { srot: [-12, 0, 0], edge: 'sharp' }],
              ['', 'ball', [0.18, 0.18, 0.02], [ex + 0.15, 1.18, ez + 0.13], '#f2c14e', { noInk: true }],
              ['', 'box', [0.66, 0.16, 0.02], [ex, 0.88, ez + 0.18], '#7ad04a', { srot: [-12, 0, 0], noInk: true }],
              ['', 'cyl', [0.18, 0.2, 0.02], [ex - 0.18, 1.02, ez + 0.17], '#3f9a4a', { taper: 0, srot: [-12, 0, 0], noInk: true }],
            ];
          }),
        ],
      }),
      [
        [A.par(A.face('player'), A.say('A happy little tree goes here...', 2.2)), A.pose('foreR', { rot: [0, 0, 25], dur: 0.25 }), A.pose('foreR', { rot: [0, 0, -15], dur: 0.25 }), A.pose('foreR', { rot: [0, 0, 25], dur: 0.25 }), A.pose('foreR', { rot: [0, 0, 0], dur: 0.25 })],
        talk('tada', 'Ta-da! My masterpiece!', rest),
      ],
    );
  }),
  // Bandaged face, dark glasses, fedora, trench coat, scarf and gloves: he unwinds and his head and hands vanish.
  e('invisible man', 'town', 'storybook', () =>
    act(
      who('invisible man', {
        h: 1.78, skin: '#f2efe6', top: '#7a5a3a', long: true, bottom: '#5a3a22', shoes: 'black', style: 'none', blush: '#f2efe6',
        acc: [
          fedora('#5a3a22'),
          face('sunglasses'),
          wear('coat', '#8a6a4a'),
          x((d) => [0.42, 0.62, 0.82].map((v): Spec => ['torso', 'ball', [d.tw * 0.05, d.tw * 0.05, d.td * 0.04], [d.tw * 0.18, d.torsoH * v, d.td * 0.56], '#3a2a1a', { layer: 5 }])),
          wear('scarf', '#8a2a2a'),
          gloves('#2a2726'),
          x((d) => [0.18, 0.0, -0.2, -0.38].map((v): Spec => ['head', 'torus', [d.headW * 1.01, d.headD * 0.97, d.headH * 0.05], [0, d.headY + d.headH * v, 0], '#d4cfc0', { srot: [90, 0, 0], tube: 0.06, noInk: true }])),
        ],
      }),
      [
        [A.par(A.face('player'), A.say('Now you see me...', 1.8)), A.par(A.pose('head', { scale: 0, dur: 0.7 }), A.pose('handL', { scale: 0, dur: 0.7 }), A.pose('handR', { scale: 0, dur: 0.7 })), A.say("...now you don't!", 2), A.wait(1.5), A.par(A.pose('head', { scale: 1, dur: 0.7 }), A.pose('handL', { scale: 1, dur: 0.7 }), A.pose('handR', { scale: 1, dur: 0.7 }))],
        talk('shrug', 'Has anyone seen my face?'),
      ],
    ),
  ),
  // In the blue team suit with the 4 on her chest: a force field bubble, then she fades from sight.
  e('invisible woman', 'town', 'comics', () =>
    act(
      who('invisible woman', {
        h: 1.68, top: '#2f5ad0', long: true, bottom: '#2f5ad0', shoes: 'black', hair: '#f2d36a', style: 'long', pose: 'reach',
        acc: [
          wear('belt', 'black'),
          boots('black'),
          gloves('black'),
          x((d) => [['torso', 'cyl', [d.tw * 0.4, d.td * 0.06, d.tw * 0.4], [0, d.torsoH * 0.68, d.td * 0.52], 'white', { srot: [90, 0, 0], layer: 4 }], ['torso', 'box', [d.tw * 0.24, d.tw * 0.24, d.td * 0.05], [0, d.torsoH * 0.68, d.td * 0.56], '#2f5ad0', { role: 'label', text: '4', layer: 5 }]]),
        ],
      }),
      [
        [A.spawn('field', 'bubble', { rel: 'at', of: 'self' }), A.par(A.face('player'), A.effect('sparkle', { dur: 2 }), A.say('Force field up!', 2)), A.wait(1.5), A.remove('field', 'pop')],
        [A.par(A.face('player'), A.say('Now you see me...', 1.6)), A.pose('hips', { scale: 0, dur: 0.8 }), A.wait(1.2), A.pose('hips', { scale: 1, dur: 0.8 }), A.say('Boo!', 1.2)],
      ],
    ),
  ),
  // The little brother: cap, backpack, orange T-shirt and red trainers.
  e('jack (brother)', 'town', 'family', () =>
    act(
      who('jack (brother)', {
        h: 'kid', top: '#f0923b', bottom: 'denim', shoes: '#c8323c', hair: '#5a3a22', style: 'short',
        acc: [capPiece('#2f5aa8'), wear('backpack', '#3f9a4a'), x((d) => [['torso', 'box', [d.tw * 0.3, d.torsoH * 0.25, d.td * 0.06], [0, d.torsoH * 0.55, d.td * 0.52], '#2f5aa8', { role: 'label', text: '★', layer: 5 }]])],
      }),
      [talk('wave', "Hi! I'm Jack!"), talk('laugh', 'Hehe, made you look!')],
    ),
  ),
  // Jack Frost: spiky white hair, frosted skin, an icy-blue hoodie trimmed with frost, bare feet and a crooked
  // staff that makes it snow.
  e('jack frost', 'fantasy', 'spirits', () =>
    act(
      who('jack frost', {
        h: 1.72, skin: '#eef4f8', top: '#4e7fb8', long: true, bottom: '#a8905a', shoes: '#eef4f8', hair: 'white', style: 'spiky', eyes: '#3fa7e0', blush: '#bfe0f0',
        acc: [
          x((d) => [['torso', 'box', [d.tw * 1.08, d.torsoH * 0.12, d.td * 1.12], [0, d.torsoH * 0.95, 0], '#cfeefc', { layer: 2, round: 0.5 }], ['torso', 'ball', [d.tw * 0.9, d.torsoH * 0.35, d.td * 0.5], [0, d.torsoH * 0.9, -d.td * 0.55], '#4e7fb8']]),
          x2((d, s) => [['torso', 'cyl', [d.tw * 0.14, d.torsoH * 0.25, d.tw * 0.14], [s * d.tw * 0.42, d.torsoH * 1.05, 0], '#cfeefc', { taper: 0, srot: [0, 0, -s * 20] }]]),
          pole('R', undefined, 0.85, 0.55, 0.03, '#7a5a3a', (a, _d, tip) => [['arc', [0.26, 0.26, 0.03], [0.1, tip, a * 0.3], '#7a5a3a', { arc: 200, srot: [0, 0, -30] }], ['ball', [0.05, 0.05, 0.05], [0.0, tip - 0.35, a * 0.3], '#cfeefc', { role: 'glow' }]]),
        ],
      }),
      [
        [A.effect('snow', { dur: 2.5 }), ...talk('wave', 'Snow day!')],
        [A.spawn('flake', 'snowflake', near), A.effect('sparkle', { id: 'flake', dur: 1.2 }), ...talk('laugh', 'Nip, nip! Frosty noses!'), A.remove('flake', 'fade')],
      ],
    ),
  ),
  // Grey-blue coveralls and a ring of keys, mopping beside his wheeled mop bucket and a yellow wet-floor sign.
  e('janitor', 'town', 'city workers', () => {
    const rest: Arms = { armR: [-30, 0, -4], foreR: [-35, 0, 25], armL: [-35, 0, 4], foreL: [-30, 0, -35] };
    return act(
      who('janitor', {
        h: 1.74, top: '#5a7a9a', long: true, bottom: '#5a7a9a', shoes: 'black', hair: 'gray', style: 'short', beard: 'gray',
        acc: [
          hat('cap', '#1f3a6f'),
          wear('belt', 'black'),
          x((d) => [['hips', 'torus', [d.tw * 0.25, d.tw * 0.25, d.tw * 0.05], [d.tw * 0.4, -d.lw * 0.4, d.td * 0.4], 'silver', { tube: 0.2 }], ...[-1, 0, 1].map((i): Spec => ['hips', 'box', [d.tw * 0.03, d.tw * 0.12, d.tw * 0.02], [d.tw * (0.4 + i * 0.05), -d.lw * 0.75, d.td * 0.42], 'gold', { srot: [0, 0, i * 15] }]), ['torso', 'box', [d.tw * 0.25, d.tw * 0.12, d.td * 0.05], [d.tw * 0.24, d.torsoH * 0.72, d.td * 0.54], 'white', { layer: 5, role: 'label', text: 'BOB' }]]),
          arms(rest),
          pole('R', rest, 0.55, 0.85, 0.03, 'wood', (a) => [['ball', [0.28, 0.12, 0.22], [0, -0.9, a * 0.3], '#e8e4d8']]),
          x(() => {
            const bx = -0.55, bz = 0.45;
            return [
              ['', 'box', [0.4, 0.34, 0.5], [bx, 0.25, bz], '#f2c14e', { edge: 'sharp', round: 0.25 }],
              ['', 'box', [0.36, 0.02, 0.46], [bx, 0.4, bz], '#7aa8c8', { noInk: true }],
              ['', 'box', [0.3, 0.2, 0.16], [bx, 0.5, bz - 0.15], '#5c6166', { edge: 'sharp' }],
              ...[[1, 1], [1, -1], [-1, 1], [-1, -1]].map(([u, v], i): Spec => ['', 'ball', [0.06, 0.06, 0.06], [bx + u * 0.17, 0.04, bz + v * 0.21], '#2a2726', { name: `wheel${i}` }]),
              ['', 'box', [0.36, 0.62, 0.02], [0.55, 0.3, 0.32], '#f2c14e', { srot: [-12, 0, 0], edge: 'sharp', role: 'label', text: 'WET FLOOR' }],
              ['', 'box', [0.36, 0.62, 0.02], [0.55, 0.3, 0.18], '#f2c14e', { srot: [12, 0, 0], edge: 'sharp' }],
            ];
          }),
        ],
      }),
      [
        [A.par(A.face('player'), A.say('Mop, mop, mop...', 2)), A.pose('torso', { rot: [0, 20, 0], dur: 0.4 }), A.par(A.pose('torso', { rot: [0, -20, 0], dur: 0.5 }), A.effect('water_spray', { dur: 1 })), A.pose('torso', { rot: [0, 20, 0], dur: 0.5 }), A.pose('torso', { rot: [0, 0, 0], dur: 0.4 })],
        talk('point', 'Careful, the floor is wet!', rest),
      ],
    );
  }),
  // In bright racing silks, a helmet with a silk cover and pompom, white breeches and tall boots, a crop in hand
  // and a racing saddle over his arm.
  e('jockey', 'town', 'sports', () => {
    const rest: Arms = { armL: [-25, 0, 14], foreL: [-75, 0, -18] };
    return act(
      who('jockey', {
        h: 1.58, build: 0.85, top: '#f2c14e', long: true, bottom: 'white', shoes: 'black', hair: '#5a3a22', style: 'short',
        acc: [
          hat('helmet', '#c8323c'),
          x((d) => [['head', 'ball', [d.headW * 0.25, d.headW * 0.25, d.headW * 0.25], [0, top(d) + d.headH * 0.3, 0], '#f2c14e'], ['head', 'cyl', [d.headW * 0.8, d.headH * 0.04, d.headD * 0.5], [0, top(d) - d.headH * 0.2, d.headD * 0.45], '#c8323c']]),
          diamonds(['#c8323c']),
          x2((d, _s, side) => [[`arm${side}`, 'cyl', [d.aw * 1.15, d.aw * 0.5, d.aw * 1.15], [0, -d.upper * 0.4, 0], '#c8323c', { noInk: true }]]),
          x2((d, _s, side) => [[`shin${side}`, 'capsule', [d.lw * 1.08, d.legLen * 0.45, d.lw * 1.08], [0, -d.legLen * 0.24, 0], 'black'], [`shin${side}`, 'cyl', [d.lw * 1.12, d.legLen * 0.05, d.lw * 1.12], [0, -d.legLen * 0.02, 0], '#8a5a35']]),
          arms(rest),
          grip('R', undefined, (a, d) => [seg([0, a * 0.4, a * 0.3], [0, -d.H * 0.32, d.H * 0.1], a * 0.15, '#2a2726'), ['box', [a * 0.3, a * 0.6, a * 0.15], [0, -d.H * 0.33, d.H * 0.11], '#2a2726']]),
          grip('L', rest, (a) => [['box', [a * 3.0, a * 0.5, a * 3.6], [-a * 0.8, a * 0.2, a * 0.2], '#7a4a2a', { round: 0.6 }], ['box', [a * 0.4, a * 2.2, a * 0.2], [a * 0.6, -a * 1.0, a * 0.2], '#5a3a22']]),
        ],
      }),
      [
        talk('arms_up', "And they're off!", rest),
        [A.spawn('horse', 'horse', { rel: 'right', of: 'self', dist: 'close' }), ...talk('point', "That's my horse, Lightning!", rest), A.wait(1.5), A.remove('horse', 'fade')],
      ],
    );
  }),
  // Purple suit and gloves, green waistcoat and hair, a white face with a wide red grin, a joker card and a flower
  // in his lapel that squirts.
  e('joker (dc)', 'town', 'comics', () => {
    const rest: Arms = { armL: [-30, 0, 30], foreL: [-90, 0, -40] };
    return act(
      who('joker (dc)', {
        h: 1.8, build: 0.9, skin: '#f6f4ec', top: '#6a2a9a', long: true, bottom: '#6a2a9a', shoes: 'black', hair: '#4fa83a', style: 'short', blush: '#f6f4ec',
        acc: [
          wear('coat', '#6a2a9a'),
          x((d) => [
            ['torso', 'box', [d.tw * 0.42, d.torsoH * 0.62, d.td * 0.1], [0, d.torsoH * 0.6, d.td * 0.52], '#4fa83a', { layer: 4 }],
            ['torso', 'box', [d.tw * 0.1, d.torsoH * 0.4, d.td * 0.06], [0, d.torsoH * 0.66, d.td * 0.58], '#f0923b', { layer: 5 }],
            ['head', 'arc', [d.headW * 0.6, d.headH * 0.22, d.headD * 0.05], [0, d.headY - d.headH * 0.16, d.headD * 0.47], '#c8323c', { srot: [0, 0, 180], tube: 0.35, layer: 6 }],
            ['head', 'ball', [d.headW * 1.08, d.headH * 0.5, d.headD * 1.0], [0, d.headY + d.headH * 0.3, -d.headD * 0.05], '#4fa83a', { layer: 1 }],
            ['torso', 'ball', [d.tw * 0.2, d.tw * 0.2, d.td * 0.12], [d.tw * 0.3, d.torsoH * 0.82, d.td * 0.58], '#e86f9a', { layer: 6 }],
            ['torso', 'ball', [d.tw * 0.08, d.tw * 0.08, d.td * 0.08], [d.tw * 0.3, d.torsoH * 0.82, d.td * 0.66], '#f2c14e', { layer: 7 }],
          ]),
          gloves('#6a2a9a'),
          arms(rest),
          grip('L', rest, (a) => [['box', [a * 1.4, a * 2.0, a * 0.04], [0, a * 1.2, a * 0.5], 'white', { role: 'label', text: 'JOKER', edge: 'sharp' }]]),
        ],
      }),
      [
        talk('laugh', 'HA HA HA HA HA!', rest),
        [A.par(A.face('player'), A.say('Psst! Smell my flower!', 2)), A.effect('water_spray', { dur: 1.2 }), ...talk('laugh', 'Gotcha!', rest)],
      ],
    );
  }),
  // Trench coat and a fedora with a PRESS card in the band, notebook and pencil ready.
  e('journalist', 'town', 'media', () => {
    const rest: Arms = { armR: [-25, 0, -12], foreR: [-85, 0, 20], armL: [-25, 0, 12], foreL: [-80, 0, -20] };
    return act(
      who('journalist', {
        h: 1.74, top: 'white', long: true, bottom: '#5a4a3a', shoes: 'brown', style: 'short', hair: '#3b2a1e',
        acc: [
          fedora('#8a6a4a', 'black', 'hat'),
          x((d) => [['hat', 'box', [d.headW * 0.36, d.headH * 0.14, d.headD * 0.03], [d.headW * 0.1, d.headH * 0.08, d.headD * 0.44], 'white', { role: 'label', text: 'PRESS', layer: 6, edge: 'sharp' }]]),
          wear('coat', '#c9b07a'),
          wear('belt', '#8a6a4a'),
          wear('tie', '#8a2a2a'),
          arms(rest),
          grip('L', rest, (a) => [['box', [a * 1.6, a * 0.15, a * 2.2], [-a * 0.6, a * 0.2, a * 0.3], 'white', { srot: [-40, 0, 0], edge: 'sharp' }], ['box', [a * 1.6, a * 0.1, a * 0.25], [-a * 0.6, a * 0.65, a * 0.0], '#5c6166', { srot: [-40, 0, 0] }]]),
          grip('R', rest, (a) => [seg([0, 0, a * 0.3], [-a * 0.8, a * 1.2, a * 0.6], a * 0.12, '#f2c14e')]),
        ],
      }),
      [
        talk('nod', 'Any comment for the paper?'),
        [A.spawn('paper', 'newspaper', near), ...talk('thumbs_up', 'Extra! Extra! Read all about it!', rest), A.wait(1), A.remove('paper', 'pop')],
      ],
    );
  }),
  // A knight in full plate on a horse in a blue and white caparison, lance couched and shield up: he charges.
  e('jouster', 'town', 'history', () => {
    const rest: Arms = { armR: [-30, 0, -10], foreR: [-60, 0, 10], armL: [-30, 0, 10], foreL: [-60, 0, -15] };
    const rider = who('jouster', {
      h: 1.78, build: 1.2, top: '#b8c0c8', long: true, bottom: '#b8c0c8', shoes: '#9aa3ad', style: 'none',
      acc: [
        hat('helmet', '#b8c0c8'),
        x((d) => [['head', 'ball', [d.headW * 1.02, d.headH * 0.85, d.headD * 0.5], [0, d.headY - d.headH * 0.02, d.headD * 0.3], '#b8c0c8'], ['head', 'box', [d.headW * 0.7, d.headH * 0.06, d.headD * 0.1], [0, d.headY + d.headH * 0.08, d.headD * 0.55], '#2a2726'], ['head', 'ball', [d.headW * 0.3, d.headH * 0.6, d.headD * 0.6], [0, top(d) + d.headH * 0.3, -d.headD * 0.1], '#2f5aa8']]),
        wear('armor', '#c8d0d8'),
        x((d) => [['torso', 'box', [d.tw * 0.9, d.torsoH * 0.8, d.td * 1.15], [0, d.torsoH * 0.35, 0], '#2f5aa8', { layer: 2, round: 0.3 }]]),
        arms(rest),
        grip('R', rest, (a) => [['cyl', [0.12, 3.2, 0.12], [0, 0.15, 1.2], '#e8e4d8', { taper: 0.2, srot: [82, 0, 0] }], ['cyl', [0.26, 0.26, 0.26], [0, 0.05, 0.25], '#c8d0d8', { taper: 0.3, srot: [82, 0, 0] }], ...[0.6, 1.2, 1.8].map((z): Hold => ['cyl', [0.11, 0.08, 0.11], [0, 0.05 + z * 0.13, 0.4 + z], '#2f5aa8', { srot: [82, 0, 0], noInk: true }])]),
        grip('L', rest, (a) => [['cyl', [0.5, 0.05, 0.62], [0.05, 0.05, a * 0.8], '#2f5aa8', { segs: 3, srot: [90, 0, 180], edge: 'sharp' }], ['box', [0.06, 0.4, 0.02], [0.05, 0.08, a * 0.8 + 0.03], 'white', { edge: 'sharp' }]]),
      ],
    });
    return act(mount('jouster', rider, horse('destrier', '#e8e2d8', '#8a8a86', '#2f5aa8')), [
      [A.par(A.say('Have at thee!', 2), A.pose('hbody', { move: [0, 0, 1.5], dur: 0.9 }), A.pose('hneck', { rot: [12, 0, 0], dur: 0.4 })), A.par(A.effect('dust', { dur: 1 }), A.pose('hneck', { rot: [0, 0, 0], dur: 0.3 })), A.pose('hbody', { move: [0, 0, 0], dur: 1.0 })],
      [A.par(A.pose('armR', { rot: [-60, 0, 0], dur: 0.5 }), A.say('For my lady!', 2)), A.wait(1.2), A.pose('armR', { rot: [0, 0, 0], dur: 0.5 })],
    ]);
  }),
  // Black robe, a white wig in rows of curls, a lace jabot and gold spectacles; she bangs her gavel.
  e('judge', 'town', 'law and order', () => {
    const rest: Arms = { armR: [-30, 0, -10], foreR: [-60, 0, 10] };
    return act(
      who('judge', {
        h: 1.72, top: 'black', long: true, bottom: 'black', shoes: 'black', hair: 'white', style: 'none', skin: 'skin2',
        acc: [
          wear('robe', '#1d1d1f'),
          x((d) => [
            ['head', 'ball', [d.headW * 1.1, d.headH * 0.65, d.headD * 1.05], [0, d.headY + d.headH * 0.2, -d.headD * 0.05], '#f2f0ea', { layer: -1 }],
            ...[1, -1].flatMap((s): Spec[] => [0, 1, 2].map((i): Spec => ['head', 'torus', [d.headW * 0.26, d.headW * 0.26, d.headW * 0.18], [s * d.headW * 0.5, d.headY - d.headH * (0.0 + i * 0.18), -d.headD * 0.05], '#f2f0ea', { srot: [0, 90, 0], tube: 0.45 }])),
            ['torso', 'box', [d.tw * 0.24, d.torsoH * 0.22, d.td * 0.08], [0, d.torsoH * 0.85, d.td * 0.54], 'white', { layer: 5 }],
            ['torso', 'box', [d.tw * 0.08, d.torsoH * 0.2, d.td * 0.08], [0, d.torsoH * 0.7, d.td * 0.56], 'white', { layer: 5 }],
          ]),
          face('glasses', 'gold'),
          arms(rest),
          grip('R', rest, (a) => [['capsule', [a * 0.3, a * 2.2, a * 0.3], [0, 0, a * 0.3], 'darkwood', { srot: [90, 0, 0] }], ['cyl', [a * 0.8, a * 1.6, a * 0.8], [0, 0, a * 1.4], 'darkwood', { srot: [0, 0, 90] }], ['cyl', [a * 0.9, a * 0.2, a * 0.9], [a * 0.6, 0, a * 1.4], 'gold', { srot: [0, 0, 90] }]]),
        ],
      }),
      [
        [A.par(A.face('player'), A.pose('foreR', { rot: [-50, 0, 0], dur: 0.3 }), A.say('Order! Order in the court!', 2.2)), A.par(A.pose('foreR', { rot: [30, 0, 0], dur: 0.12 }), A.effect('dust', { dur: 0.6 })), A.pose('foreR', { rot: [-50, 0, 0], dur: 0.25 }), A.par(A.pose('foreR', { rot: [30, 0, 0], dur: 0.12 }), A.effect('dust', { dur: 0.6 })), A.pose('foreR', { rot: [0, 0, 0], dur: 0.3 })],
        talk('shake_head', 'Objection overruled.'),
      ],
    );
  }),
  // Julie: a yellow top and a teal skirt, a ponytail with a bow, a little pink handbag.
  e('julie', 'town', 'everyday people', () =>
    act(
      who('julie', {
        h: 1.65, top: '#f2c14e', skirt: '#3fa7a0', shoes: 'white', hair: '#7a3b1e', style: 'ponytail',
        acc: [hat('bow', '#3fa7a0'), earrings('silver'), grip('L', undefined, (a) => [['box', [a * 2.0, a * 1.5, a * 0.8], [0, -a * 1.6, a * 0.4], '#f4a1c0', { round: 0.4 }], ['arc', [a * 1.4, a * 1.2, a * 0.15], [0, -a * 0.7, a * 0.4], '#e86f9a']])],
      }),
      [talk('wave', "Hi! I'm Julie!"), talk('laugh', 'Ha! That is so funny!')],
    ),
  ),
  // Caesar in a toga with a purple border, a laurel wreath and a red cloak, a scroll of decrees; arm out in a
  // Roman salute.
  e('julius caesar', 'town', 'history', () => {
    const rest: Arms = { armR: [-100, 0, -12], foreR: [-5, 0, 0] };
    return act(
      who('julius caesar', {
        h: 1.7, skin: 'skin2', top: 'white', long: true, bottom: 'white', shoes: '#8a5a35', legs: 'skin2', hair: 'gray', style: 'short',
        acc: [
          x((d) => [...[0, 1, 2, 3, 4, 5, 6, 7].map((i): Spec => ['head', 'ball', [d.headW * 0.18, d.headH * 0.1, d.headW * 0.1], [Math.cos((i / 8) * Math.PI * 2) * d.headW * 0.5, top(d) - d.headH * 0.14, Math.sin((i / 8) * Math.PI * 2) * d.headD * 0.5], '#5a8a3a', { srot: [0, (-i / 8) * 360, 30] }])]),
          wear('toga', 'white'),
          x((d) => [['torso', 'box', [d.tw * 0.22, d.torsoH * 1.3, d.td * 1.15], [0, d.torsoH * 0.5, 0], 'white', { srot: [0, 0, 35], layer: 3 }], ['torso', 'box', [d.tw * 0.06, d.torsoH * 1.3, d.td * 1.17], [d.tw * 0.1, d.torsoH * 0.55, 0], '#6a2a8a', { srot: [0, 0, 35], layer: 4 }], ['hips', 'cyl', [d.tw * 1.47, d.legLen * 0.05, d.td * 1.62], [0, -d.legLen * 0.88, 0], '#6a2a8a', { layer: 2 }]]),
          x((d) => [['torso', 'box', [d.tw * 1.2, d.torsoH + d.legLen * 0.8, d.td * 0.1], [0, d.torsoH * 0.98, -d.td * 0.6], '#9a2a2a', { off: [0, -(d.torsoH + d.legLen * 0.8) / 2, 0], layer: -3, round: 0.3 }]]),
          arms(rest),
          grip('L', undefined, (a) => [['cyl', [a * 0.7, a * 3.0, a * 0.7], [0, -a * 0.3, a * 0.6], 'cream', { srot: [0, 0, 90] }], ['cyl', [a * 0.8, a * 0.3, a * 0.8], [a * 1.5, -a * 0.3, a * 0.6], 'darkwood', { srot: [0, 0, 90] }], ['cyl', [a * 0.8, a * 0.3, a * 0.8], [-a * 1.5, -a * 0.3, a * 0.6], 'darkwood', { srot: [0, 0, 90] }]]),
        ],
      }),
      [talk('nod', 'Veni, vidi, vici.'), talk('point', 'Et tu, Brute?', rest)],
    );
  }),
  // Three heroes side by side: the caped flier with his hands on his hips, the dark knight with folded arms and
  // the amazon princess with her golden lasso.
  e('justice league', 'town', 'comics', () =>
    act(
      crowd('justice league', [
        [who('superman', { h: 1.9, build: 1.3, top: '#2f5aa8', long: true, bottom: '#2f5aa8', shoes: '#c8323c', hair: 'black', style: 'short', skin: 'skin1', pose: 'hips', acc: [x((d) => [['torso', 'box', [d.tw * 1.25, d.torsoH + d.legLen * 0.8, d.td * 0.1], [0, d.torsoH * 0.98, -d.td * 0.6], '#c8323c', { name: 'cape', off: [0, -(d.torsoH + d.legLen * 0.8) / 2, 0], layer: -3, round: 0.3 }]]), boots('#c8323c'), wear('belt', '#f2c14e'), x((d) => [['torso', 'cyl', [d.tw * 0.42, d.td * 0.08, d.tw * 0.36], [0, d.torsoH * 0.7, d.td * 0.52], '#f2c14e', { segs: 5, srot: [90, 0, 0], layer: 4 }], ['torso', 'box', [d.tw * 0.22, d.tw * 0.22, d.td * 0.06], [0, d.torsoH * 0.7, d.td * 0.56], '#c8323c', { role: 'label', text: 'S', layer: 5 }]])] }), 0],
        [who('batman', { h: 1.88, build: 1.3, top: '#5c6166', long: true, bottom: '#5c6166', shoes: 'black', style: 'none', skin: 'skin2', pose: 'cross', acc: [hat('hood', '#2a2a30'), hat('catears', '#2a2a30'), x((d) => [['torso', 'box', [d.tw * 1.4, d.torsoH + d.legLen * 0.85, d.td * 0.1], [0, d.torsoH * 0.98, -d.td * 0.6], '#2a2a30', { name: 'cape', off: [0, -(d.torsoH + d.legLen * 0.85) / 2, 0], layer: -3, round: 0.3 }]]), boots('#2a2a30'), gloves('#2a2a30'), wear('belt', '#f2c14e'), x((d) => [['torso', 'ball', [d.tw * 0.4, d.tw * 0.16, d.td * 0.06], [0, d.torsoH * 0.72, d.td * 0.52], 'black', { layer: 4 }]])] }), -0.8, -0.1],
        [who('wonder woman', { h: 1.8, top: '#c8323c', skirt: '#1f3a8a', bottom: '#1f3a8a', shoes: '#c8323c', hair: 'black', style: 'long', skin: 'skin2', acc: [hat('tiara', 'gold'), boots('#c8323c'), cuffs('silver'), wear('belt', 'gold'), grip('L', undefined, (a, d) => [['torus', [d.H * 0.16, d.H * 0.16, a * 0.15], [0, -a * 0.8, a * 0.6], '#f2c14e', { name: 'lasso', tube: 0.08, srot: [0, 90, 0] }]])] }), 0.78, -0.1],
      ]),
      [
        [A.par(A.pose('m0_armR', { rot: [10, 0, -120], dur: 0.4 }), A.pose('m0_foreR', { rot: [0, 0, -110], dur: 0.4 }), A.pose('m0_cape', { rot: [30, 0, 0], dur: 0.4 }), A.say('Justice League, assemble!', 2.5)), A.wait(1.5), A.par(A.pose('m0_armR', { rot: [0, 0, 0], dur: 0.5 }), A.pose('m0_foreR', { rot: [0, 0, 0], dur: 0.5 }), A.pose('m0_cape', { rot: [0, 0, 0], dur: 0.5 }))],
        [A.par(A.pose('m1_head', { rot: [10, 0, 0], dur: 0.4 }), A.pose('m1_cape', { rot: [20, 0, 0], dur: 0.4 }), A.say("I'm Batman.", 2)), A.wait(1), A.par(A.pose('m1_head', { rot: [0, 0, 0], dur: 0.4 }), A.pose('m1_cape', { rot: [0, 0, 0], dur: 0.4 }))],
        [A.par(A.pose('m2_armL', { rot: [0, 0, 150], dur: 0.4 }), A.say('By the lasso of truth!', 2.2)), A.pose('m2_lasso', { spin: [0, 0, 540], dur: 0 }), A.wait(1.5), A.par(A.pose('m2_lasso', { spin: [0, 0, 0], rot: [0, 0, 0], dur: 0 }), A.pose('m2_armL', { rot: [0, 0, 0], dur: 0.5 }))],
      ],
    ),
  ),
  // A king in a red robe trimmed with ermine, a jewelled crown, a sceptre and an orb.
  e('king', 'town', 'royalty', () =>
    act(
      who('king', {
        h: 1.78, build: 1.2, top: '#9a1a2a', long: true, bottom: '#9a1a2a', shoes: 'black', hair: '#7a4a2a', style: 'short', beard: '#7a4a2a', pose: 'hold',
        acc: [
          hat('crown'),
          face('beard', '#7a4a2a'),
          wear('robe', '#9a1a2a'),
          x((d) => [
            ['torso', 'box', [d.tw * 1.4, d.torsoH + d.legLen * 0.9, d.td * 0.12], [0, d.torsoH * 0.98, -d.td * 0.62], '#b0202a', { off: [0, -(d.torsoH + d.legLen * 0.9) / 2, 0], layer: -3, round: 0.3 }],
            ['torso', 'torus', [d.tw * 1.1, d.tw * 0.95, d.td * 0.6], [0, d.torsoH * 0.95, -d.td * 0.05], 'white', { srot: [80, 0, 0], tube: 0.45 }],
            ...[[-0.3, 0.95], [0, 1.02], [0.3, 0.95], [-0.15, 0.9], [0.15, 0.9]].map(([u, v]): Spec => ['torso', 'ball', [d.tw * 0.04, d.tw * 0.07, d.tw * 0.04], [d.tw * u, d.torsoH * v, d.td * 0.3], 'black', { noInk: true, layer: 6 }]),
            ['hips', 'box', [d.tw * 0.25, d.legLen * 0.85, d.td * 0.1], [0, -d.legLen * 0.38, d.td * 0.75], 'white', { layer: 3 }],
          ]),
          grip('R', 'hold', (a, d) => [['capsule', [a * 0.32, d.H * 0.32, a * 0.32], [0, d.H * 0.08, a * 0.3], 'gold'], ['ball', [a * 0.9, a * 0.9, a * 0.9], [0, d.H * 0.25, a * 0.3], 'gold'], ['ball', [a * 0.4, a * 0.4, a * 0.4], [0, d.H * 0.25 + a * 0.6, a * 0.3], '#c8323c']]),
          grip('L', 'hold', (a) => [['ball', [a * 1.8, a * 1.8, a * 1.8], [0, a * 0.9, a * 0.5], 'gold'], ['box', [a * 0.3, a * 1.0, a * 0.3], [0, a * 2.1, a * 0.5], 'gold'], ['box', [a * 0.7, a * 0.3, a * 0.3], [0, a * 2.2, a * 0.5], 'gold']]),
        ],
      }),
      [talk('nod', 'Welcome to my kingdom.'), talk('point', 'Bring me a feast!', 'hold')],
    ),
  ),
  // King Arthur: plate armour under a red surcoat with a golden lion, a crown, a blue cloak and Excalibur.
  e('king arthur', 'town', 'royalty', () => {
    const rest: Arms = { armL: [-20, 0, 15], foreL: [-60, 0, -20] };
    return act(
      who('king arthur', {
        h: 1.8, build: 1.2, top: '#b8c0c8', long: true, bottom: '#b8c0c8', shoes: '#9aa3ad', hair: '#7a4a2a', style: 'short', beard: '#7a4a2a',
        acc: [
          hat('crown', 'gold'),
          face('beard', '#7a4a2a'),
          wear('armor', '#c8d0d8'),
          x((d) => [['torso', 'box', [d.tw * 0.85, d.torsoH * 0.85, d.td * 1.16], [0, d.torsoH * 0.38, 0], '#c8323c', { layer: 2, round: 0.3 }], ['torso', 'ball', [d.tw * 0.3, d.tw * 0.32, d.td * 0.06], [0, d.torsoH * 0.45, d.td * 0.6], 'gold', { layer: 4 }]]),
          x((d) => [['torso', 'box', [d.tw * 1.3, d.torsoH + d.legLen * 0.8, d.td * 0.1], [0, d.torsoH * 0.98, -d.td * 0.62], '#2f5aa8', { off: [0, -(d.torsoH + d.legLen * 0.8) / 2, 0], layer: -3, round: 0.3 }]]),
          grip('R', undefined, (a, d) => [['box', [a * 2.2, a * 0.35, a * 0.5], [0, -a * 0.45, a * 0.3], 'gold', { edge: 'sharp' }], ['ball', [a * 0.5, a * 0.5, a * 0.5], [0, a * 0.7, a * 0.3], 'gold'], ['box', [a * 0.6, d.H * 0.42, a * 0.12], [0, -a * 0.6 - d.H * 0.21, a * 0.3], 'silver', { edge: 'sharp', name: 'excalibur' }]]),
          arms(rest),
          grip('L', rest, (a, d) => [['cyl', [d.H * 0.3, a * 0.3, d.H * 0.36], [a * 0.3, -a * 0.2, a * 0.9], '#c8323c', { srot: [90, 0, 0], segs: 3, edge: 'sharp' }], ['box', [d.H * 0.04, d.H * 0.22, a * 0.1], [a * 0.3, -a * 0.1, a * 1.1], 'gold', { edge: 'sharp' }], ['box', [d.H * 0.16, d.H * 0.04, a * 0.1], [a * 0.3, a * 0.2, a * 1.1], 'gold', { edge: 'sharp' }]]),
        ],
      }),
      [
        [A.par(A.face('player'), A.pose('armR', { rot: [0, 0, -165], dur: 0.5 }), A.effect('sparkle', { dur: 2 }), A.say('Behold, Excalibur!', 2.2)), A.wait(1.5), A.pose('armR', { rot: [0, 0, 0], dur: 0.5 })],
        talk('bow', 'Welcome to Camelot.', rest),
      ],
    );
  }),
  // Henry VIII: broad in a red doublet with puffed sleeves and gold slashes, a fur-collared coat, a flat cap with
  // a white plume, a heavy chain, and a turkey leg.
  e('king henry', 'town', 'royalty', () =>
    act(
      who('king henry', {
        h: 1.85, build: 1.5, top: '#9a1a2a', long: true, bottom: 'cream', legs: 'cream', shoes: 'black', hair: '#a0522d', style: 'short', beard: '#a0522d', pose: 'hips',
        acc: [
          face('beard', '#a0522d'),
          hat('beret', '#1d1d1d'),
          x((d) => [['head', 'capsule', [d.headW * 0.12, d.headH * 0.5, d.headW * 0.08], [d.headW * 0.35, top(d) + d.headH * 0.12, 0], 'white', { srot: [0, 0, -50] }]]),
          bands('gold', [0.3, 0.55, 0.8], 0.04),
          shoulders('#5a3a22', 1.6),
          wear('necklace', 'gold'),
          x((d) => [['hips', 'box', [d.tw * 1.25, d.legLen * 0.35, d.td * 1.35], [0, -d.legLen * 0.1, 0], '#9a1a2a', { round: 0.6 }], ['torso', 'box', [d.tw * 1.5, d.torsoH * 0.95, d.td * 0.2], [0, d.torsoH * 0.52, -d.td * 0.55], '#5a3a22', { layer: -2, round: 0.4 }]]),
          x2((d, _s, side) => [[`arm${side}`, 'ball', [d.aw * 1.7, d.upper * 0.75, d.aw * 1.7], [0, -d.upper * 0.4, 0], '#9a1a2a']]),
        ],
      }),
      [talk('laugh', 'Ha! Bring more meat!', 'hips'), talk('shrug', 'Wives? I have lost count.', 'hips')],
    ),
  ),
  // A landlord in a waistcoat and tie, a clipboard of leases and a jangling ring of keys.
  e('landlord', 'town', 'office', () => {
    const rest: Arms = { armL: [-20, 0, 12], foreL: [-70, 0, -15] };
    return act(
      who('landlord', {
        h: 1.74, build: 1.15, top: 'white', long: true, bottom: 'gray', shoes: 'brown', hair: 'gray', style: 'short',
        acc: [
          wear('vest', '#6a6e74'),
          wear('tie', 'navy'),
          face('mustache', 'gray'),
          arms(rest),
          grip('L', rest, (a) => [['box', [a * 2.2, a * 0.2, a * 2.8], [-a * 0.7, a * 0.4, a * 0.2], 'wood', { srot: [-50, 0, 0], edge: 'sharp' }], ['box', [a * 2.0, a * 0.1, a * 2.4], [-a * 0.7, a * 0.55, a * 0.25], 'white', { srot: [-50, 0, 0], role: 'label', text: 'RENT DUE', edge: 'sharp' }]]),
          grip('R', undefined, (a) => [['torus', [a * 1.6, a * 1.6, a * 0.2], [0, -a * 0.8, a * 0.8], 'silver', { tube: 0.12, name: 'keys' }], ...[-1, 0, 1].map((i): Hold => ['box', [a * 0.3, a * 1.4, a * 0.1], [i * a * 0.4, -a * 2.0, a * 0.9], 'gold', { srot: [0, 0, i * 20], parent: 'keys' }])]),
        ],
      }),
      [
        talk('point', 'Rent is due on the first!', rest),
        [A.par(A.face('player'), A.say('Jingle, jingle!', 1.6)), A.pose('foreR', { rot: [-40, 0, 10], dur: 0.15 }), A.pose('foreR', { rot: [-40, 0, -10], dur: 0.15 }), A.pose('foreR', { rot: [-40, 0, 10], dur: 0.15 }), A.pose('foreR', { rot: [0, 0, 0], dur: 0.3 })],
      ],
    );
  }),
  // In a green work shirt, cap and gloves, raking leaves into a red wheelbarrow beside him.
  e('landscaper', 'town', 'trades', () => {
    const rest: Arms = { armR: [-30, 0, -4], foreR: [-35, 0, 25], armL: [-35, 0, 4], foreL: [-30, 0, -35] };
    return act(
      withSockets(
        who('landscaper', {
          top: '#3f9a4a', bottom: '#c9b28a', legs: 'skin3', shorts: true, skin: 'skin3', shoes: 'darkbrown', hair: '#2a1d16', style: 'short',
          acc: [
            hat('cap', '#2f6a3a'),
            gloves('#e8c43a'),
            boots('darkbrown'),
            arms(rest),
            pole('R', rest, 0.5, 0.95, 0.028, 'wood', (a) => [['box', [0.42, 0.04, 0.05], [0, -0.95, a * 0.3 + 0.04], 'iron', { edge: 'sharp' }], ...[-0.18, -0.09, 0, 0.09, 0.18].map((u): Hold => ['box', [0.012, 0.09, 0.012], [u, -1.0, a * 0.3 + 0.06], 'iron'])]),
            x(() => {
              const wx = -0.95, wz = 0.1;
              return [
                ['', 'loft', [0.62, 0.32, 0.85], [wx, 0.6, wz - 0.05], '#c8323c', { profile: [[0, 0.75, 1, 0.1], [0.5, 1, 1, 0], [1, 0.8, 0.7, 0.05]], cut: 'bottom', boxy: 0.7, edge: 'sharp' } as Partial<FigPart>],
                ['', 'ball', [0.5, 0.18, 0.7], [wx, 0.64, wz - 0.05], '#7a9a3a'],
                ['', 'ball', [0.18, 0.1, 0.2], [wx + 0.1, 0.72, wz + 0.1], '#c8823a'],
                ['', 'cyl', [0.38, 0.08, 0.38], [wx, 0.19, wz + 0.55], 'rubber', { srot: [0, 0, 90], name: 'wheel' }],
                rod('', [wx + 0.22, 0.55, wz + 0.3], [wx + 0.28, 0.75, wz - 0.75], 0.035, 'darkwood'),
                rod('', [wx - 0.22, 0.55, wz + 0.3], [wx - 0.28, 0.75, wz - 0.75], 0.035, 'darkwood'),
                rod('', [wx + 0.2, 0.42, wz - 0.25], [wx + 0.2, 0.02, wz - 0.3], 0.03, 'darkwood'),
                rod('', [wx - 0.2, 0.42, wz - 0.25], [wx - 0.2, 0.02, wz - 0.3], 0.03, 'darkwood'),
              ];
            }),
          ],
        }),
        [{ name: 'barrow', at: [-0.95, 0.68, 0.05], kind: 'top', size: 0.5 }],
      ),
      [
        [A.par(A.face('player'), A.say('Rake, rake, rake...', 2)), A.par(A.pose('armR', { rot: [-25, 0, 0], dur: 0.35 }), A.pose('armL', { rot: [-25, 0, 0], dur: 0.35 })), A.par(A.pose('armR', { rot: [10, 0, 0], dur: 0.35 }), A.pose('armL', { rot: [10, 0, 0], dur: 0.35 }), A.effect('dust', { dur: 0.8 })), A.par(A.pose('armR', { rot: [0, 0, 0], dur: 0.3 }), A.pose('armL', { rot: [0, 0, 0], dur: 0.3 }))],
        [A.spawn('leaf', 'leaf', near), A.attach('leaf', 'self', 'barrow'), ...talk('thumbs_up', 'That lawn looks great!', rest), A.remove('leaf', 'pop')],
      ],
    );
  }),
  // A sharp navy suit, a leather briefcase and a law book.
  e('lawyer', 'town', 'law and order', () =>
    act(
      who('lawyer', {
        h: 1.76, top: 'white', long: true, bottom: 'navy', shoes: 'black', style: 'short', hair: '#3b2a1e',
        acc: [
          wear('suit', 'navy'),
          lapels('#14244a'),
          x((d) => [['torso', 'box', [d.tw * 0.14, d.tw * 0.06, d.td * 0.05], [d.tw * 0.3, d.torsoH * 0.82, d.td * 0.56], 'white', { layer: 6 }]]),
          grip('R', undefined, (a) => [['box', [a * 0.9, a * 2.8, a * 3.6], [0, -a * 1.9, a * 0.4], '#5a3a22', { edge: 'sharp', round: 0.15 }], ['arc', [a * 1.2, a * 0.7, a * 0.2], [0, -a * 0.35, a * 0.4], '#3a2a1a', { srot: [0, 90, 0] }], ['box', [a * 0.95, a * 0.2, a * 0.4], [0, -a * 0.8, a * 1.0], 'gold', { edge: 'sharp' }]]),
          grip('L', undefined, (a) => [['box', [a * 0.6, a * 2.6, a * 2.0], [-a * 0.1, -a * 0.6, a * 0.4], '#8a2a2a', { edge: 'sharp', round: 0.15 }], ['box', [a * 0.55, a * 0.5, a * 2.02], [-a * 0.1, -a * 0.2, a * 0.4], 'gold', { edge: 'sharp', noInk: true }]]),
        ],
      }),
      [talk('point', 'Objection, Your Honour!'), talk('nod', 'I rest my case.')],
    ),
  ),
  // Leon: a black beanie and little round shades, a long coat, his beloved potted plant held in his arm.
  e('leon', 'town', 'everyday people', () =>
    act(
      who('leon', {
        h: 1.76, build: 0.9, top: 'white', long: true, bottom: '#3a3f4a', shoes: 'black', style: 'short', hair: '#2a1d16', beard: '#2a1d16', pose: 'hold',
        acc: [
          hat('beanie', 'black'),
          x((d) => [1, -1].map((s): Spec => ['head', 'cyl', [d.headW * 0.24, d.headW * 0.05, d.headW * 0.24], [s * d.headW * 0.2, d.headY + d.headH * 0.04, d.headD * 0.5], 'black', { srot: [90, 0, 0] }])),
          wear('coat', '#6a6e74'),
          grip('L', 'hold', (a) => [['cyl', [a * 1.9, a * 1.8, a * 1.9], [a * 0.5, -a * 0.2, a * 0.3], '#c86a3a', { taper: 1.2 }], ['cyl', [a * 2.1, a * 0.25, a * 2.1], [a * 0.5, a * 0.75, a * 0.3], '#b05a2a'], ...[[0, 2.0, 0], [-0.8, 1.7, 25], [0.8, 1.8, -25], [-0.4, 2.2, 10], [0.5, 2.2, -12]].map(([u, v, r]): Hold => ['ball', [a * 0.7, a * 1.9, a * 0.3], [a * 0.5 + u * a, v * a, a * 0.3], '#4a8a3a', { srot: [0, 0, r] }])]),
        ],
      }),
      [talk('wave', 'Hello. I am Leon.', 'hold'), [A.spawn('milk', 'milk', near), ...talk('nod', 'Milk. It is good for you.'), A.wait(1.2), A.remove('milk', 'pop')]],
    ),
  ),
  // Leonardo in a long dark-red robe and beret, a white beard to his chest, a brush and his little portrait.
  e('leonardo da vinci', 'town', 'history', () => {
    const rest: Arms = { armL: [-22, 0, 10], foreL: [-75, 0, -12], armR: [-30, 0, -10], foreR: [-70, 0, 10] };
    return act(
      who('leonardo da vinci', {
        h: 1.69, top: '#7a2b2a', long: true, bottom: '#7a2b2a', shoes: 'darkbrown', hair: 'lightgray', style: 'long', beard: 'lightgray',
        acc: [
          face('longbeard', 'lightgray'),
          hat('beret', '#3a2a24'),
          wear('robe', '#7a2b2a'),
          arms(rest),
          grip('R', rest, (a) => [seg([0, -a * 0.2, a * 0.3], [0.04, a * 1.2, 0.16], a * 0.12, 'wood'), ['ball', [a * 0.2, a * 0.35, a * 0.2], [0.045, a * 1.3, 0.17], '#5a3a22']]),
          grip('L', rest, (a) => [['box', [a * 2.6, a * 3.4, a * 0.25], [-a * 0.6, a * 1.2, a * 0.6], 'darkwood', { srot: [-15, 0, 0], edge: 'sharp' }], ['box', [a * 2.2, a * 3.0, a * 0.05], [-a * 0.6, a * 1.2, a * 0.75], '#6a6a3a', { srot: [-15, 0, 0], noInk: true }], ['ball', [a * 0.8, a * 1.0, a * 0.05], [-a * 0.6, a * 1.6, a * 0.73], '#d9b090', { srot: [-15, 0, 0], noInk: true }], ['ball', [a * 1.4, a * 1.2, a * 0.05], [-a * 0.6, a * 0.6, a * 0.88], '#3a2a1a', { srot: [-15, 0, 0], noInk: true }]]),
        ],
      }),
      [talk('look_around', 'Hmm... a machine that flies!', rest), talk('thumbs_up', 'Behold! I call her Mona Lisa.', rest)],
    );
  }),
  // A leprechaun under a metre tall: green coat and buckled hat, an orange beard, a shillelagh, and his pot of gold.
  e('leprechaun', 'fantasy', 'little folk', () =>
    act(
      withSockets(
        who('leprechaun', {
          h: 0.9, build: 1.25, head: 1.1, top: '#2f8a3a', long: true, bottom: '#2f8a3a', shoes: 'black', hair: '#e0703a', style: 'short', beard: '#e0703a',
          acc: [
            hat('top', '#2f8a3a'),
            x((d) => [['head', 'cyl', [d.headW * 0.89, d.headH * 0.12, d.headD * 0.84], [0, top(d) + d.headH * 0.08, 0], 'black'], ['head', 'box', [d.headW * 0.25, d.headH * 0.14, d.headD * 0.05], [0, top(d) + d.headH * 0.08, d.headD * 0.42], 'gold', { edge: 'sharp' }], ['head', 'ball', [d.headW * 0.2, d.headW * 0.18, d.headW * 0.05], [d.headW * 0.3, top(d) + d.headH * 0.25, d.headD * 0.38], '#5ab04a']]),
            face('beard', '#e0703a'),
            wear('vest', '#1f6a2a'),
            wear('belt', 'black'),
            x((d) => [['hips', 'box', [d.tw * 0.24, d.lw * 0.4, d.td * 0.1], [0, d.lw * 0.3, d.td * 0.55], 'gold', { edge: 'sharp' }], ...[1, -1].map((s): Spec => ['', 'box', [d.lw * 0.5, d.H * 0.02, d.lw * 0.2], [s * d.tw * 0.24, d.H * 0.035, d.lw * 0.75], 'gold', { edge: 'sharp' }])]),
            pole('R', undefined, 0.05, 0.36, 0.025, '#3a2a1a', (a) => [['ball', [0.06, 0.06, 0.06], [0, 0.06, a * 0.3], '#3a2a1a']]),
            x((d) => [['', 'ball', [0.34, 0.28, 0.34], [d.tw * 1.7, 0.14, d.td * 0.8], '#1d1d1d'], ['', 'torus', [0.3, 0.3, 0.04], [d.tw * 1.7, 0.27, d.td * 0.8], '#1d1d1d', { srot: [90, 0, 0], tube: 0.2 }], ['', 'ball', [0.26, 0.12, 0.26], [d.tw * 1.7, 0.28, d.td * 0.8], 'gold'], ...[[0.05, 0.05], [-0.06, 0.02], [0.02, -0.06]].map(([u, v]): Spec => ['', 'cyl', [0.05, 0.012, 0.05], [d.tw * 1.7 + u, 0.34, d.td * 0.8 + v], 'gold', { srot: [20, 0, 15] }])]),
          ],
        }),
        [{ name: 'pot', at: [0.28, 0.25, 0.15], kind: 'inside', size: 0.25 }],
      ),
      [
        talk('dance', "Top o' the mornin' to ye!"),
        [A.spawn('rainbow', 'rainbow', { rel: 'behind', of: 'self', dist: 'close' }), ...talk('point', "Ye'll never find me gold!"), A.wait(1), A.remove('rainbow', 'fade')],
      ],
    ),
  ),
  // Bald, in a charcoal suit with a purple tie, a glowing green shard of kryptonite in his hand.
  e('lex luthor', 'town', 'comics', () => {
    const rest: Arms = { armL: [-35, 0, 20], foreL: [-80, 0, -25] };
    return act(
      who('lex luthor', {
        h: 1.88, skin: 'skin1', top: '#3a3a44', long: true, bottom: '#3a3a44', shoes: 'black', style: 'bald',
        acc: [
          shirtFront(),
          lapels('#24242c'),
          wear('tie', '#6a2a9a'),
          arms(rest),
          grip('L', rest, (a) => [['cyl', [a * 0.9, a * 2.2, a * 0.9], [-a * 0.2, a * 1.0, a * 0.4], '#5ae04a', { taper: 0, segs: 5, role: 'glow', name: 'kryptonite', mover: { kind: 'light', on: true } }], ['cyl', [a * 0.6, a * 1.4, a * 0.6], [a * 0.4, a * 0.8, a * 0.4], '#3fc03a', { taper: 0, segs: 5, srot: [0, 0, -25], role: 'glow' }]]),
        ],
      }),
      [talk('laugh', 'Mwahaha! Superman will be mine!', rest), [A.effect('sparkle', { dur: 1.5 }), ...talk('point', 'Kryptonite! Your only weakness!', rest)]],
    );
  }),
  // A protester with a blue cap and a placard on a stick: VOTE.
  e('liberal', 'town', 'politics', () => {
    const rest: Arms = { armR: [-20, 0, -40], foreR: [-50, 0, -60] };
    return act(
      who('liberal', {
        top: '#4f8fd6', bottom: 'denim', shoes: 'white', style: 'ponytail', hair: '#a0522d',
        acc: [
          hat('cap', '#2f5aa8'),
          x((d) => [['torso', 'box', [d.tw * 0.3, d.tw * 0.26, d.td * 0.05], [0, d.torsoH * 0.62, d.td * 0.53], '#e86f7d', { role: 'label', text: '♥', layer: 5 }]]),
          arms(rest),
          pole('R', rest, 0.7, 0.3, 0.03, 'wood', (a, _d, tip) => [['box', [0.6, 0.4, 0.015], [0, tip - 0.1, a * 0.3 + 0.02], '#2f5aa8', { role: 'label', text: 'VOTE!', edge: 'sharp' }]]),
        ],
      }),
      [talk('point', 'Every vote counts!', rest), talk('arms_up', 'Equality for all!', rest)],
    );
  }),
  // A cowboy hat and a beard, a yellow T-shirt and the yellow coiled-snake flag on a pole.
  e('libertarian', 'town', 'politics', () =>
    act(
      who('libertarian', {
        top: '#f2c14e', bottom: '#c9b28a', shoes: 'brown', style: 'short', beard: '#7a4a2a', hair: '#7a4a2a',
        acc: [
          face('beard', '#7a4a2a'),
          hat('cowboy', '#8a5a35'),
          pole('L', undefined, 1.45, 0.3, 0.03, 'wood', (a, _d, tip) => [['box', [0.55, 0.38, 0.015], [0.29, tip - 0.2, a * 0.3], '#f2c14e', { edge: 'sharp' }], ['torus', [0.18, 0.14, 0.02], [0.29, tip - 0.22, a * 0.3 + 0.012], '#3f8a3a', { tube: 0.25, noInk: true }], ['ball', [0.05, 0.04, 0.02], [0.37, tip - 0.16, a * 0.3 + 0.012], '#3f8a3a', { noInk: true }]]),
        ],
      }),
      [talk('hands_on_hips', 'Keep your hands off my wallet!'), talk('thumbs_up', 'Freedom!')],
    ),
  ),
  // A librarian in a green cardigan, glasses on a chain and a bun, hugging a stack of books; she shushes you.
  e('librarian', 'town', 'school', () =>
    act(
      who('librarian', {
        h: 1.66, top: '#3f6a3a', long: true, skirt: '#7a5a3a', shoes: 'black', legs: 'skin2', skin: 'skin2', hair: '#5a3a22', style: 'bun', pose: 'hold',
        acc: [
          face('glasses', '#8a2a2a'),
          x((d) => [['head', 'torus', [d.headW * 0.9, d.headH * 1.0, d.headW * 0.02], [0, d.headY - d.headH * 0.3, d.headD * 0.05], 'silver', { tube: 0.04, srot: [10, 90, 0] }]]),
          wear('necklace', 'white'),
          grip('L', 'hold', (a) => ['#c8323c', '#2f5aa8', '#f2c14e', '#3f8a3a'].map((c, i): Hold => ['box', [a * 2.4, a * 0.6, a * 1.8], [-a * 0.9, a * (0.5 + i * 0.6), a * 0.5], c, { srot: [0, (i - 1.5) * 8, 0], edge: 'sharp', round: 0.15 }])),
        ],
      }),
      [
        [A.par(A.face('player'), A.pose('armR', { rot: [-50, 0, 18], dur: 0.35 }), A.pose('foreR', { rot: [-45, 0, 0], dur: 0.35 }), A.say('Shhhh!', 2)), A.wait(1.2), A.par(A.pose('armR', { rot: [0, 0, 0], dur: 0.4 }), A.pose('foreR', { rot: [0, 0, 0], dur: 0.4 }))],
        [A.spawn('book', 'book', near), ...talk('nod', 'This one is due back on Tuesday.'), A.wait(1), A.remove('book', 'pop')],
      ],
    ),
  ),
  // A naval lieutenant in navy blues with gold rank stripes and a white-topped cap, at the salute.
  e('lieutenant', 'town', 'military', () =>
    act(
      who('lieutenant', {
        h: 1.75, top: '#1f2a4a', long: true, bottom: '#1f2a4a', shoes: 'black', style: 'short', hair: '#3b2a1e', pose: 'salute',
        acc: [
          hat('police', 'white'),
          x((d) => [['head', 'cyl', [d.headW * 1.02, d.headH * 0.12, d.headD * 1.02], [0, top(d) - d.headH * 0.0, -d.headD * 0.04], '#1f2a4a'], ['head', 'ball', [d.headW * 0.18, d.headW * 0.14, d.headW * 0.05], [0, top(d) + d.headH * 0.02, d.headD * 0.5], 'gold']]),
          x2((d, s) => [['torso', 'box', [d.tw * 0.32, d.tw * 0.05, d.td * 0.5], [s * d.tw * 0.36, d.torsoH * 1.01, 0], 'gold', { edge: 'sharp' }]]),
          x2((d, _s, side) => [[`fore${side}`, 'cyl', [d.aw * 1.02, d.aw * 0.18, d.aw * 1.02], [0, -d.lower * 0.75, 0], 'gold', { noInk: true }]]),
          shirtFront(),
          wear('tie', 'black'),
          x((d) => [0.35, 0.5, 0.65].flatMap((v): Spec[] => [1, -1].map((s): Spec => ['torso', 'ball', [d.tw * 0.05, d.tw * 0.05, d.td * 0.05], [s * d.tw * 0.18, d.torsoH * v, d.td * 0.56], 'gold', { layer: 5 }]))),
        ],
      }),
      [talk('nod', 'Aye aye, Captain!'), talk('point', 'All hands on deck!', 'salute')],
    ),
  ),
  // Red shorts and a whistle, zinc on the nose, sunglasses, a red rescue tube under the arm.
  e('lifeguard', 'town', 'emergency', () =>
    act(
      who('lifeguard', {
        h: 1.8, build: 1.2, skin: 'skin3', top: 'skin3', bottom: '#d23a3a', legs: 'skin3', shoes: 'skin3', hair: '#f2d36a', style: 'short', shorts: true,
        acc: [
          face('sunglasses'),
          wear('whistle'),
          x((d) => [['head', 'ball', [d.headW * 0.16, d.headW * 0.1, d.headW * 0.1], [0, d.headY - d.headH * 0.02, d.headD * 0.52], 'white', { layer: 6 }], ['torso', 'box', [d.tw * 0.9, d.torsoH * 0.06, d.td * 0.95], [0, d.torsoH * 0.04, 0], '#d23a3a']]),
          grip('R', undefined, (a, d) => [['capsule', [a * 1.4, d.H * 0.42, a * 1.0], [0, -a * 0.3, a * 1.1], '#d23a3a', { srot: [12, 0, 0] }], ['box', [a * 1.0, a * 0.8, a * 0.05], [0, -a * 0.5, a * 1.62], 'white', { srot: [12, 0, 0], role: 'label', text: '+' }]]),
        ],
      }),
      [[A.say('Tweeeet!', 1.2), ...talk('point', 'No running by the pool!')], talk('wave', 'Swim between the flags!')],
    ),
  ),
  // In a yellow oilskin and sou'wester, white beard and pipe, a storm lantern that he lights.
  e('lighthouse keeper', 'town', 'sailors', () =>
    act(
      who('lighthouse keeper', {
        h: 1.72, top: '#f2c14e', long: true, bottom: '#1f2a4a', shoes: 'black', hair: 'white', style: 'short', beard: 'white',
        acc: [
          x((d) => [['head', 'ball', [d.headW * 1.15, d.headH * 0.5, d.headD * 1.1], [0, top(d) - d.headH * 0.05, -d.headD * 0.03], '#e8b83a'], ['head', 'cyl', [d.headW * 1.6, d.headH * 0.04, d.headD * 1.8], [0, top(d) - d.headH * 0.18, -d.headD * 0.12], '#e8b83a', { srot: [-8, 0, 0] }]]),
          face('beard', 'white'),
          wear('coat', '#f2c14e'),
          x((d) => [0.35, 0.55, 0.75].map((v): Spec => ['torso', 'box', [d.tw * 0.1, d.tw * 0.04, d.td * 0.05], [d.tw * 0.15, d.torsoH * v, d.td * 0.58], 'black', { layer: 5 }])),
          x((d) => [rod('head', [d.headW * 0.12, d.headY - d.headH * 0.24, d.headD * 0.46], [d.headW * 0.3, d.headY - d.headH * 0.3, d.headD * 0.7], d.headW * 0.05, '#3a2a1a'), ['head', 'cyl', [d.headW * 0.12, d.headW * 0.14, d.headW * 0.12], [d.headW * 0.32, d.headY - d.headH * 0.24, d.headD * 0.72], '#3a2a1a']]),
          boots('black'),
          grip('L', undefined, (a) => [
            ['cyl', [a * 1.1, a * 0.2, a * 1.1], [0, -a * 0.65, a * 0.4], '#c8323c', { edge: 'sharp' }],
            ['cyl', [a * 0.9, a * 1.3, a * 0.9], [0, -a * 1.4, a * 0.4], '#ffd36a', { name: 'lamp', role: 'glow', noInk: true, mover: { kind: 'light' } }],
            ['cyl', [a * 1.2, a * 0.25, a * 1.2], [0, -a * 2.15, a * 0.4], '#c8323c', { edge: 'sharp' }],
            ['arc', [a * 1.0, a * 0.6, a * 0.1], [0, -a * 0.35, a * 0.4], '#2a2726'],
          ]),
        ],
      }),
      [
        [A.operate('lamp', 'on'), ...talk('point', 'Ships ahoy! Keep the light burning.'), A.wait(0.5), A.operate('lamp', 'off')],
        [A.effect('rain', { dur: 2.5 }), ...talk('nod', "Storm's coming in, mark my words.")],
      ],
    ),
  ),
  // A linguist in an orange jumper and teal scarf with a phrasebook and a card of greetings in three scripts.
  e('linguist', 'town', 'academia', () =>
    act(
      who('linguist', {
        top: '#f0923b', long: true, bottom: '#5a4a3a', shoes: 'brown', style: 'long', hair: '#3b2a1e', pose: 'hold',
        acc: [
          face('glasses', 'black'),
          wear('scarf', '#3fa7a0'),
          grip('R', 'hold', (a) => [['box', [a * 2.2, a * 0.3, a * 2.8], [-a * 0.8, a * 0.6, a * 0.3], '#2f5aa8', { srot: [-50, 0, 0], edge: 'sharp' }]]),
          grip('L', 'hold', (a) => [['box', [a * 2.8, a * 0.1, a * 1.8], [a * 0.4, a * 0.9, a * 0.4], 'white', { srot: [-60, 0, 0], role: 'label', text: 'Hi Hola 你好', edge: 'sharp' }]]),
        ],
      }),
      [talk('wave', 'Hello! Hola! Bonjour! Ciao!', 'hold'), talk('look_around', 'Hmm... that word comes from Latin.', 'hold')],
    ),
  ),
  // The hero of Hyrule: green tunic and a long floppy cap, pointed ears, the Master Sword and a Hylian shield.
  e('link (nintendo)', 'town', 'video games', () => {
    const rest: Arms = { armL: [-25, 0, 20], foreL: [-50, 0, -20] };
    return act(
      who('link (nintendo)', {
        h: 1.68, skin: 'skin1', top: '#3f9a3a', long: true, skirt: '#3f9a3a', bottom: 'white', legs: 'white', shoes: '#7a4a2a', hair: '#e8c56a', style: 'short',
        acc: [
          x((d) => [['head', 'cyl', [d.headW * 1.08, d.headH * 1.4, d.headD * 1.04], [0, top(d) - d.headH * 0.05, -d.headD * 0.55], '#3f9a3a', { taper: 0, srot: [-72, 0, 0] }]]),
          pointyEars('skin1', 0.9),
          wear('belt', '#7a4a2a'),
          x((d) => [['hips', 'box', [d.tw * 0.2, d.lw * 0.4, d.td * 0.1], [0, d.lw * 0.3, d.td * 0.55], 'gold', { edge: 'sharp' }], ['torso', 'box', [d.tw * 0.12, d.torsoH * 1.2, d.td * 1.12], [0, d.torsoH * 0.5, 0], '#7a4a2a', { srot: [0, 0, 35], layer: 3 }]]),
          boots('#7a4a2a'),
          grip('R', undefined, (a, d) => [['box', [a * 1.8, a * 0.3, a * 0.4], [0, -a * 0.45, a * 0.3], '#4a5ad0', { edge: 'sharp' }], ['box', [a * 0.5, d.H * 0.38, a * 0.12], [0, -a * 0.6 - d.H * 0.19, a * 0.3], 'silver', { edge: 'sharp' }], ['capsule', [a * 0.3, a * 1.0, a * 0.3], [0, a * 0.2, a * 0.3], '#4a5ad0']]),
          arms(rest),
          grip('L', rest, (a, d) => [['cyl', [d.H * 0.26, a * 0.3, d.H * 0.32], [a * 0.3, -a * 0.2, a * 0.9], '#2f4ab0', { srot: [90, 0, 0], segs: 3, edge: 'sharp' }], ['cyl', [d.H * 0.1, a * 0.1, d.H * 0.1], [a * 0.3, -a * 0.1, a * 1.1], '#c8323c', { srot: [90, 0, 0], segs: 3 }], ['cyl', [d.H * 0.07, a * 0.1, d.H * 0.06], [a * 0.3, a * 0.6, a * 1.1], '#f2c14e', { srot: [90, 0, 0], segs: 3 }]]),
        ],
      }),
      [
        [A.par(A.face('player'), A.pose('armR', { rot: [0, 0, -160], dur: 0.4 }), A.effect('sparkle', { dur: 1.5 }), A.say('Hyaaah!', 1.6)), A.wait(1), A.pose('armR', { rot: [0, 0, 0], dur: 0.4 })],
        [A.spawn('rupee', 'ruby', { rel: 'above', of: 'self', dist: 'touch' }), ...talk('arms_up', 'Da-da-da-daaa!', rest), A.remove('rupee', 'fade')],
      ],
    );
  }),
  // In a red tailcoat with gold frogging, white breeches and tall boots, a whip in one hand and a chair held out
  // legs first in the other.
  e('lion tamer', 'town', 'entertainment', () => {
    const rest: Arms = { armL: [-42, 0, 38], foreL: [-22, 0, 0], armR: [-20, 0, -10], foreR: [-40, 0, 10] };
    return act(
      who('lion tamer', {
        h: 1.78, top: '#c8323c', long: true, bottom: 'white', shoes: 'black', style: 'short', hair: 'black',
        acc: [
          face('mustache', 'black'),
          bands('gold', [0.35, 0.5, 0.65], 0.03),
          shoulders('gold', 0.6),
          boots('black'),
          arms(rest),
          grip('L', rest, () => [
            ['box', [0.42, 0.04, 0.05], [0, 0, 0.02], '#8a5a35', { edge: 'sharp' }],
            ['box', [0.4, 0.03, 0.4], [0, 0.01, 0.23], '#8a5a35', { edge: 'sharp' }],
            ['box', [0.42, 0.42, 0.04], [0, 0.2, 0.46], '#a0703a', { edge: 'sharp' }],
            ...[[1, 0.38], [-1, 0.38], [1, 0.02], [-1, 0.02]].map(([u, v]): Hold => ['box', [0.035, 0.035, 0.46], [u * 0.18, v, 0.69], '#8a5a35', { edge: 'sharp' }]),
          ]),
          grip('R', rest, (a, d) => [['capsule', [a * 0.35, a * 2.0, a * 0.35], [0, 0, a * 0.3], '#3a2a1a'], seg([0, -a * 1.0, a * 0.3], [a * 0.5, -d.H * 0.3, a * 2.5], a * 0.12, '#5a3a22'), seg([a * 0.5, -d.H * 0.3, a * 2.5], [-a * 1.5, -d.H * 0.42, a * 4.5], a * 0.1, '#5a3a22')]),
        ],
      }),
      [
        [A.par(A.face('player'), A.pose('foreR', { rot: [-90, 0, 0], dur: 0.3 }), A.say('Back! Back, I say!', 2)), A.par(A.pose('foreR', { rot: [25, 0, 0], dur: 0.12 }), A.effect('dust', { dur: 0.6 })), A.pose('foreR', { rot: [0, 0, 0], dur: 0.4 })],
        [A.spawn('lion', 'lion', { rel: 'front', of: 'self', dist: 'near' }), ...talk('thumbs_up', 'The king of the jungle!', rest), A.wait(1.5), A.remove('lion', 'fade')],
      ],
    );
  }),
  // A girl in a red hooded cape and a laced bodice, a basket for Grandma under a checked cloth.
  e('little red riding hood', 'town', 'storybook', () =>
    act(
      who('little red riding hood', {
        h: 'kid', top: 'white', skirt: '#3a3f6a', legs: 'white', shoes: 'black', hair: '#e8c56a', style: 'pigtails',
        acc: [
          hat('hood', '#c8323c'),
          x((d) => [['torso', 'box', [d.tw * 1.35, d.torsoH + d.legLen * 0.55, d.td * 0.12], [0, d.torsoH * 0.98, -d.td * 0.6], '#c8323c', { off: [0, -(d.torsoH + d.legLen * 0.55) / 2, 0], layer: -3, round: 0.3 }], ['torso', 'box', [d.tw * 0.75, d.torsoH * 0.5, d.td * 1.1], [0, d.torsoH * 0.25, 0], '#2a2a3a', { layer: 2, round: 0.4 }], ...[0.15, 0.3, 0.45].map((v): Spec => ['torso', 'box', [d.tw * 0.3, d.torsoH * 0.02, d.td * 0.05], [0, d.torsoH * v, d.td * 0.56], 'white', { layer: 4, noInk: true }])]),
          grip('R', undefined, (a) => [['cyl', [a * 2.6, a * 1.6, a * 1.9], [0, -a * 2.2, a * 0.4], '#c9a06a', { taper: 1.2 }], ['arc', [a * 2.0, a * 1.6, a * 0.2], [0, -a * 1.4, a * 0.4], '#a8803a', { srot: [0, 90, 0] }], ['box', [a * 2.6, a * 0.2, a * 1.8], [0, -a * 1.35, a * 0.4], '#e0473b', { round: 0.6 }], ['box', [a * 0.5, a * 0.21, a * 0.5], [a * 0.5, -a * 1.34, a * 0.6], 'white', { noInk: true }]]),
        ],
      }),
      [
        talk('wave', "I'm off to Grandma's house!"),
        [A.spawn('wolf', 'wolf', { rel: 'front', of: 'self', dist: 'near' }), ...talk('gasp', 'Grandma... what big teeth you have!'), A.wait(0.8), A.remove('wolf', 'fade')],
      ],
    ),
  ),
  // A lobbyist in a charcoal suit with a briefcase and a wad of banknotes.
  e('lobbyist', 'town', 'politics', () =>
    act(
      who('lobbyist', {
        h: 1.76, top: 'white', long: true, bottom: '#2a2a32', shoes: 'black', style: 'short', hair: 'black',
        acc: [
          wear('suit', '#3a3a44'),
          lapels('#24242c'),
          grip('R', undefined, (a) => [['box', [a * 0.9, a * 2.8, a * 3.6], [0, -a * 1.9, a * 0.4], '#1d1d1f', { edge: 'sharp', round: 0.15 }], ['box', [a * 0.95, a * 0.2, a * 0.4], [0, -a * 0.8, a * 1.0], 'silver', { edge: 'sharp' }]]),
          grip('L', undefined, (a) => [['box', [a * 2.4, a * 0.6, a * 1.2], [0, -a * 0.2, a * 0.8], '#7cc45a', { edge: 'sharp', round: 0.1 }], ['box', [a * 0.5, a * 0.62, a * 1.22], [0, -a * 0.2, a * 0.8], 'white', { noInk: true }]]),
        ],
      }),
      [talk('nod', "Let's make a deal."), talk('thumbs_up', 'You scratch my back, I scratch yours!')],
    ),
  ),
  // A locksmith in navy work clothes with a tool belt, a big ring of keys and a giant key.
  e('locksmith', 'town', 'trades', () => {
    const rest: Arms = { armL: [-25, 0, 12], foreL: [-70, 0, -12] };
    return act(
      who('locksmith', {
        h: 1.75, top: '#1f3a6f', long: true, bottom: 'gray', shoes: 'black', style: 'short', hair: '#5a3a22',
        acc: [
          hat('cap', '#1f3a6f'),
          wear('tool belt', '#7a4a2a'),
          arms(rest),
          grip('L', rest, (a) => [['torus', [a * 1.6, a * 1.6, a * 0.3], [0, a * 1.4, a * 0.4], 'gold', { tube: 0.3 }], ['box', [a * 0.4, a * 3.0, a * 0.2], [0, -a * 0.2, a * 0.4], 'gold', { edge: 'sharp' }], ['box', [a * 0.9, a * 0.35, a * 0.2], [a * 0.5, -a * 1.4, a * 0.4], 'gold', { edge: 'sharp' }], ['box', [a * 0.7, a * 0.35, a * 0.2], [a * 0.4, -a * 0.8, a * 0.4], 'gold', { edge: 'sharp' }]]),
          grip('R', undefined, (a) => [['torus', [a * 1.6, a * 1.6, a * 0.2], [0, -a * 0.8, a * 0.6], 'silver', { tube: 0.12 }], ...[-1, 0, 1].map((i): Hold => ['box', [a * 0.25, a * 1.2, a * 0.08], [i * a * 0.4, -a * 1.9, a * 0.7], 'silver', { srot: [0, 0, i * 20] }])]),
        ],
      }),
      [[A.spawn('lock', 'padlock', near), ...talk('nod', 'Click! Open in two seconds flat.'), A.remove('lock', 'pop')], talk('point', 'Need a spare key? Step right up!', rest)],
    );
  }),
  // Luigi: tall and lanky in a green cap with an L, green shirt, blue overalls, white gloves, a moustache.
  e('luigi', 'town', 'video games', () =>
    act(
      who('luigi', {
        h: 1.8, build: 0.88, head: 1.08, skin: 'skin1', top: '#3fa83a', long: true, bottom: '#2f4aa8', shoes: '#6a3a1a', hair: '#3b2a1e', style: 'short',
        acc: [
          hat('cap', '#3fa83a'),
          x((d) => [['head', 'cyl', [d.headW * 0.34, d.headD * 0.06, d.headW * 0.34], [0, top(d) + d.headH * 0.0, d.headD * 0.5], 'white', { srot: [80, 0, 0], layer: 6 }], ['head', 'box', [d.headW * 0.2, d.headW * 0.2, d.headD * 0.02], [0, top(d) + d.headH * 0.0, d.headD * 0.54], 'white', { role: 'label', text: 'L', layer: 7 }], ['head', 'ball', [d.headW * 0.24, d.headW * 0.2, d.headW * 0.22], [0, d.headY - d.headH * 0.02, d.headD * 0.52], 'skin1', { layer: 6 }]]),
          face('mustache', '#3b2a1e'),
          wear('overalls', '#2f4aa8'),
          x2((d, s) => [['torso', 'box', [d.tw * 0.14, d.torsoH * 0.55, d.td * 0.08], [s * d.tw * 0.24, d.torsoH * 0.7, d.td * 0.52], '#2f4aa8', { layer: 4 }], ['torso', 'ball', [d.tw * 0.1, d.tw * 0.1, d.td * 0.08], [s * d.tw * 0.24, d.torsoH * 0.5, d.td * 0.58], 'gold', { layer: 5 }]]),
          gloves('white'),
        ],
      }),
      [[A.par(A.face('player'), A.anim('hop'), A.say("Let's-a go! Luigi time!", 2))], talk('gasp', 'M-M-Mario? Is that a ghost?!')],
    ),
  ),
  // Red plaid flannel, braces, a beanie and a big beard, an axe over his shoulder: he chops.
  e('lumberjack', 'town', 'outdoors', () => {
    const rest: Arms = { armR: [-20, 0, -25], foreR: [-125, 0, 10] };
    return act(
      who('lumberjack', {
        h: 1.88, build: 1.35, top: '#c8323c', long: true, bottom: 'denim', shoes: 'darkbrown', hair: '#7a4a2a', style: 'short', beard: '#7a4a2a',
        acc: [
          hat('beanie', '#5a2a1a'),
          face('beard', '#7a4a2a'),
          bands('#2a2726', [0.2, 0.45, 0.7], 0.05),
          x2((d, s) => [['torso', 'box', [d.tw * 0.07, d.torsoH * 1.0, d.td * 1.12], [s * d.tw * 0.18, d.torsoH * 0.5, 0], '#2a2726', { layer: 4 }]]),
          x2((d, s) => [['torso', 'box', [d.tw * 0.08, d.torsoH * 1.0, d.td * 1.14], [s * d.tw * 0.28, d.torsoH * 0.5, 0], '#2a2726', { layer: 4, noInk: true }]]),
          boots('darkbrown'),
          arms(rest),
          grip('R', rest, (a) => [seg([0, -a * 0.6, a * 0.3], [0, a * 4.5, -a * 1.5], a * 0.35, '#a0703a'), ['wedge', [a * 2.0, a * 1.6, a * 0.25], [a * 0.8, a * 4.2, -a * 1.5], 'silver', { srot: [0, 0, -90], edge: 'sharp' }]]),
        ],
      }),
      [
        [A.par(...free(rest)), A.par(A.face('player'), A.pose('armR', { rot: [-150, 0, 0], dur: 0.4 }), A.say('Timberrr!', 1.8)), A.par(A.pose('armR', { rot: [-40, 0, 0], dur: 0.15 }), A.effect('dust', { dur: 1 })), A.pose('armR', { rot: [-150, 0, 0], dur: 0.35 }), A.par(A.pose('armR', { rot: [-40, 0, 0], dur: 0.15 }), A.effect('dust', { dur: 1 })), A.par(...back(rest))],
        [A.spawn('logs', 'wood', near), ...talk('thumbs_up', 'Plenty of firewood for winter!', rest), A.wait(1), A.remove('logs', 'sink')],
      ],
    );
  }),
  // A towering green top hat with a 10/6 price card, wild orange hair, a huge bow tie, teacup and saucer.
  e('mad hatter', 'town', 'storybook', () =>
    act(
      who('mad hatter', {
        skin: 'skin1', top: 'cream', long: true, bottom: '#b07a3a', shoes: 'brown', hair: '#e0703a', style: 'spiky', pose: 'hold',
        acc: [
          x((d) => {
            const t = top(d), W = d.headW, H = d.headH, D = d.headD;
            return [
              ['head', 'cyl', [W * 1.55, H * 0.05, D * 1.45], [0, t, 0], '#3f6a4a', { name: 'hat', piece: true }],
              ['hat', 'cyl', [W * 0.92, H * 1.1, D * 0.86], [0, H * 0.55, 0], '#3f6a4a', { taper: 1.2, srot: [0, 0, 8] }],
              ['hat', 'cyl', [W * 0.94, H * 0.16, D * 0.88], [0, H * 0.14, 0], '#c8a04a'],
              ['hat', 'box', [W * 0.3, H * 0.22, D * 0.04], [W * 0.2, H * 0.28, D * 0.46], 'white', { role: 'label', text: '10/6', layer: 6 }],
            ];
          }),
          wear('coat', '#3f6a4a'),
          x((d) => [['torso', 'ball', [d.tw * 0.55, d.tw * 0.3, d.td * 0.2], [0, d.torsoH * 0.9, d.td * 0.5], '#f2c14e', { layer: 5 }], ['torso', 'box', [d.tw * 0.5, d.torsoH * 0.6, d.td * 0.08], [0, d.torsoH * 0.55, d.td * 0.5], '#e86f9a', { layer: 3 }]]),
          grip('L', 'hold', (a) => [['cyl', [a * 1.9, a * 0.15, a * 1.9], [a * 0.3, a * 0.4, a * 0.5], 'white'], ['cyl', [a * 1.2, a * 0.8, a * 1.2], [a * 0.3, a * 0.85, a * 0.5], 'white', { taper: 1.35 }], ['torus', [a * 0.6, a * 0.6, a * 0.15], [a * 1.0, a * 0.85, a * 0.5], 'white', { srot: [0, 90, 0] }]]),
        ],
      }),
      [
        [A.spawn('tea', 'tea', near), ...talk('laugh', 'A very merry unbirthday to you!', 'hold'), A.remove('tea', 'pop')],
        [A.pose('hat', { move: [0, 0.06, 0], rot: [-20, 0, 0], dur: 0.3 }), ...talk('look_around', 'Why is a raven like a writing desk?', 'hold'), A.pose('hat', { move: [0, 0, 0], rot: [0, 0, 0], dur: 0.3 })],
      ],
    ),
  ),
  // Wild white hair, goggles, a stained lab coat and rubber gloves, a bubbling green flask that flares up.
  e('mad scientist', 'town', 'science', () => {
    const rest: Arms = { armL: [-40, 0, 18], foreL: [-80, 0, -20] };
    return act(
      who('mad scientist', {
        h: 1.72, skin: 'skin1', top: 'white', long: true, bottom: '#3a3f4a', shoes: 'black', hair: 'white', style: 'spiky',
        acc: [
          x((d) => [-0.5, 0.5].map((u): Spec => ['head', 'cyl', [d.headW * 0.42, d.headH * 0.5, d.headW * 0.42], [d.headW * u, d.headY + d.headH * 0.15, -d.headD * 0.05], 'white', { taper: 0, srot: [0, 0, -u * 150] }])),
          face('goggles', '#3f8a3a'),
          wear('labcoat'),
          x((d) => [['torso', 'ball', [d.tw * 0.18, d.tw * 0.14, d.td * 0.05], [-d.tw * 0.2, d.torsoH * 0.4, d.td * 0.57], '#9ae86a', { noInk: true, layer: 5 }], ['hips', 'ball', [d.tw * 0.2, d.tw * 0.16, d.td * 0.05], [d.tw * 0.3, -d.legLen * 0.3, d.td * 0.78], '#c8823a', { noInk: true, layer: 5 }]]),
          gloves('#2a2726'),
          arms(rest),
          grip('L', rest, (a) => [['ball', [a * 2.2, a * 2.0, a * 2.2], [0, a * 1.2, a * 0.5], '#9ae86a', { name: 'brew', role: 'glow', noInk: true, mover: { kind: 'light' } }], ['cyl', [a * 0.7, a * 1.4, a * 0.7], [0, a * 2.8, a * 0.5], 'glass'], ['ball', [a * 0.55, a * 0.55, a * 0.55], [a * 0.3, a * 3.8, a * 0.5], '#9ae86a', { noInk: true }], ['ball', [a * 0.35, a * 0.35, a * 0.35], [-a * 0.2, a * 4.4, a * 0.5], '#9ae86a', { noInk: true }]]),
        ],
      }),
      [
        [A.par(A.operate('brew', 'on'), A.effect('smoke', { dur: 2 })), ...talk('laugh', "It's alive! ALIVE!", rest), A.operate('brew', 'off')],
        [A.par(A.face('player'), A.operate('brew', 'on'), A.say('Now just a drop of this...', 2)), A.par(A.effect('explosion', { dur: 0.8 }), A.anim('shake')), A.operate('brew', 'off'), A.say('...oops.', 1.5)],
      ],
    );
  }),
  // A magician in tails and a cape, white gloves, a wand, and his top hat held upside down: out comes a rabbit.
  e('magician', 'town', 'entertainment', () => {
    const rest: Arms = { armL: [-30, 0, 15], foreL: [-75, 0, -20], armR: [-35, 0, -15], foreR: [-70, 0, 15] };
    return act(
      withSockets(
        who('magician', {
          h: 1.78, top: 'black', long: true, bottom: 'black', shoes: 'black', hair: 'black', style: 'short',
          acc: [
            face('mustache', 'black'),
            x((d) => [['torso', 'box', [d.tw * 1.3, d.torsoH + d.legLen * 0.8, d.td * 0.1], [0, d.torsoH * 0.98, -d.td * 0.6], '#1d1d1d', { off: [0, -(d.torsoH + d.legLen * 0.8) / 2, 0], layer: -3, round: 0.3 }], ['torso', 'box', [d.tw * 1.25, d.torsoH + d.legLen * 0.78, d.td * 0.05], [0, d.torsoH * 0.98, -d.td * 0.56], '#8a1a2a', { off: [0, -(d.torsoH + d.legLen * 0.78) / 2, 0], layer: -2, round: 0.3 }]]),
            shirtFront(),
            lapels('#2a2a32'),
            wear('bowtie', 'black'),
            gloves('white'),
            arms(rest),
            grip('R', rest, (a) => [['capsule', [a * 0.2, a * 3.2, a * 0.2], [0, a * 0.8, a * 0.6], '#1d1d1d', { srot: [55, 0, 0] }], ['capsule', [a * 0.22, a * 0.5, a * 0.22], [0, a * 1.7, a * 1.9], 'white', { srot: [55, 0, 0] }]]),
            grip('L', rest, (a) => [['cyl', [a * 2.4, a * 2.6, a * 2.3], [-a * 0.6, a * 1.0, a * 0.4], '#1d1d1d', { srot: [180, 0, 0] }], ['cyl', [a * 2.45, a * 0.4, a * 2.35], [-a * 0.6, a * 0.0, a * 0.4], '#c8323c'], ['cyl', [a * 3.6, a * 0.12, a * 3.4], [-a * 0.6, a * 2.3, a * 0.4], '#1d1d1d']]),
          ],
        }),
        [{ name: 'hat', at: [0.06, 1.12, 0.36], kind: 'slot', part: 'handL', size: 0.3 }],
      ),
      [
        [A.par(A.face('player'), A.say('Abracadabra...', 1.6), A.effect('sparkle', { dur: 1.5 })), A.spawn('rabbit', 'rabbit', near), A.attach('rabbit', 'self', 'hat'), A.say('Ta-da! A rabbit!', 2), A.wait(1.6), A.remove('rabbit', 'pop')],
        [A.spawn('dove', 'dove', near), ...talk('wave', 'And now... fly away, little dove!', rest), A.remove('dove', 'fly_away')],
      ],
    );
  }),
  // In a sequinned leotard with a feather in her headband and gold cuffs, presenting with both arms.
  e('magicians assistant', 'town', 'entertainment', () =>
    act(
      who('magicians assistant', {
        h: 1.68, top: '#d0408a', bottom: '#d0408a', legs: '#3a3633', shoes: 'black', hair: '#c8323c', style: 'long', shorts: true,
        acc: [
          x((d) => [[0.2, 0.3], [-0.2, 0.55], [0.1, 0.8], [-0.25, 0.15], [0.28, 0.65], [-0.05, 0.4]].map(([u, v]): Spec => ['torso', 'ball', [d.tw * 0.08, d.tw * 0.08, d.td * 0.06], [d.tw * u, d.torsoH * v, d.td * 0.52], 'gold', { noInk: true, layer: 4, role: 'glow' }])),
          hat('headband', 'gold'),
          x((d) => [['head', 'capsule', [d.headW * 0.18, d.headH * 0.8, d.headW * 0.1], [d.headW * 0.25, top(d) + d.headH * 0.25, -d.headD * 0.1], '#f4a1c0', { srot: [0, 0, -15] }]]),
          cuffs('gold'),
          earrings(),
        ],
      }),
      [
        talk('tada', 'Ta-daaa!'),
        [A.par(A.face('player'), A.say('Now watch me disappear!', 2)), A.effect('sparkle', { dur: 1.5 }), A.pose('hips', { scale: 0, dur: 0.4 }), A.wait(1.2), A.pose('hips', { scale: 1, dur: 0.4 }), A.say('Ta-da!', 1.5)],
      ],
    ),
  ),
  // A maid in a black dress with a frilled white apron and cap, a pink feather duster in her hand.
  e('maid', 'town', 'household staff', () => {
    const rest: Arms = { armR: [-30, 0, -12], foreR: [-70, 0, 10] };
    return act(
      who('maid', {
        h: 1.64, top: 'black', long: true, skirt: 'black', legs: 'white', shoes: 'black', hair: '#5a3a22', style: 'bun',
        acc: [
          wear('apron', 'white'),
          x((d) => [['torso', 'box', [d.tw * 0.85, d.torsoH * 0.06, d.td * 0.15], [0, d.torsoH * 0.95, d.td * 0.45], 'white', { round: 0.6 }], ['head', 'box', [d.headW * 0.9, d.headH * 0.12, d.headD * 0.25], [0, top(d) - d.headH * 0.02, d.headD * 0.05], 'white', { round: 0.6 }], ['torso', 'torus', [d.tw * 0.6, d.tw * 0.6, d.td * 0.2], [0, d.torsoH * 0.98, 0], 'white', { srot: [90, 0, 0], tube: 0.35 }]]),
          arms(rest),
          grip('R', rest, (a) => [seg([0, -a * 0.3, a * 0.3], [0, a * 2.4, a * 0.9], a * 0.25, 'darkwood'), ['ball', [a * 1.6, a * 2.4, a * 1.6], [0, a * 3.4, a * 1.3], '#f4a1c0']]),
        ],
      }),
      [
        [A.par(A.face('player'), A.say('A spot of dust here, a spot there...', 2.4)), A.par(A.pose('foreR', { rot: [0, 0, 25], dur: 0.2 }), A.effect('dust', { dur: 1.2 })), A.pose('foreR', { rot: [0, 0, -20], dur: 0.2 }), A.pose('foreR', { rot: [0, 0, 25], dur: 0.2 }), A.pose('foreR', { rot: [0, 0, 0], dur: 0.2 })],
        talk('bow', 'Will that be all?', rest),
      ],
    );
  }),
  // A British army major in khaki with a maroon beret, a clipped moustache, Sam Browne belt and swagger stick.
  e('major', 'town', 'military', () => {
    const rest: Arms = { armL: [-20, 0, 25], foreL: [-60, 0, -40] };
    return act(
      who('major', {
        h: 1.77, top: '#a8956a', long: true, bottom: '#a8956a', shoes: 'darkbrown', hair: '#5a3a22', style: 'short',
        acc: [
          hat('beret', '#7a1a2a'),
          x((d) => [['head', 'ball', [d.headW * 0.14, d.headW * 0.16, d.headW * 0.05], [-d.headW * 0.25, top(d) - d.headH * 0.02, d.headD * 0.42], 'gold']]),
          face('mustache', '#5a3a22'),
          x2((d, s) => [['torso', 'box', [d.tw * 0.32, d.tw * 0.05, d.td * 0.5], [s * d.tw * 0.36, d.torsoH * 1.01, 0], '#8a7a4a', { edge: 'sharp' }], ['torso', 'ball', [d.tw * 0.08, d.tw * 0.08, d.td * 0.08], [s * d.tw * 0.38, d.torsoH * 1.03, d.td * 0.1], 'gold']]),
          x((d) => ['#7a1a2a', '#2f5aa8', '#f2c14e'].map((c, i): Spec => ['torso', 'box', [d.tw * 0.11, d.torsoH * 0.05, d.td * 0.06], [-d.tw * (0.12 + i * 0.11), d.torsoH * 0.8, d.td * 0.53], c, { layer: 5, edge: 'sharp' }])),
          wear('sash', '#5a3a22'),
          wear('belt', '#5a3a22'),
          boots('darkbrown'),
          arms(rest),
          grip('L', rest, (a) => [['capsule', [a * 0.25, a * 5.0, a * 0.25], [0, 0, a * 0.3], '#5a3a22', { srot: [80, 0, -10] }], ['ball', [a * 0.4, a * 0.4, a * 0.4], [0, a * 0.4, a * 2.7], 'silver']]),
        ],
      }),
      [talk('nod', 'Jolly good, carry on.'), talk('point', 'Fall in, men! Smartly now!', rest)],
    );
  }),
  // A manicurist in a pink tunic with a bottle of red polish and a nail file.
  e('manicurist', 'town', 'beauty', () => {
    const rest: Arms = { armR: [-25, 0, -12], foreR: [-75, 0, 15], armL: [-25, 0, 12], foreL: [-75, 0, -15] };
    return act(
      who('manicurist', {
        h: 1.65, top: '#f4a1c0', long: true, bottom: 'white', shoes: 'white', hair: 'black', style: 'ponytail',
        acc: [
          wear('apron', 'white'),
          x((d) => [['torso', 'box', [d.tw * 0.25, d.tw * 0.1, d.td * 0.05], [d.tw * 0.24, d.torsoH * 0.75, d.td * 0.56], '#d0408a', { layer: 5 }]]),
          arms(rest),
          grip('R', rest, (a) => [['cyl', [a * 1.0, a * 1.1, a * 1.0], [0, a * 0.4, a * 0.5], '#c8323c', { edge: 'sharp' }], ['cyl', [a * 0.45, a * 0.9, a * 0.45], [0, a * 1.4, a * 0.5], '#1d1d1d', { edge: 'sharp' }]]),
          grip('L', rest, (a) => [['box', [a * 0.3, a * 2.4, a * 0.08], [0, a * 1.0, a * 0.5], '#f4a1c0', { srot: [-30, 0, 0], edge: 'sharp' }]]),
        ],
      }),
      [
        [A.spawn('polish', 'nail polish', near), ...talk('nod', 'Which colour, darling?'), A.wait(1), A.remove('polish', 'pop')],
        [A.par(A.face('player'), A.say('Buff, buff, buff... beautiful!', 2.2)), A.pose('foreL', { rot: [0, 0, 20], dur: 0.15 }), A.pose('foreL', { rot: [0, 0, -10], dur: 0.15 }), A.pose('foreL', { rot: [0, 0, 20], dur: 0.15 }), A.pose('foreL', { rot: [0, 0, 0], dur: 0.15 })],
      ],
    );
  }),
  // A shop-window mannequin on its stand: smooth and faceless with a jointed arm that lifts and a hat on display.
  e('mannequin', 'wardrobe', 'shop displays', () =>
    m('mannequin')
      .cyl([0.46, 0.03, 0.46], [0, 0.015, 0], { color: 'glass', edge: 'sharp' })
      .cyl([0.035, 0.82, 0.035], [0, 0.44, -0.12], { color: 'silver', edge: 'sharp' })
      .ball([0.33, 0.22, 0.22], [0, 0.94, 0], { color: '#efe6d8', name: 'pelvis' })
      .rod([0.09, 0.9, 0], [0.1, 0.5, 0.02], 0.12, '#efe6d8')
      .rod([0.1, 0.5, 0.02], [0.1, 0.1, 0.0], 0.09, '#efe6d8')
      .rod([-0.09, 0.9, 0], [-0.11, 0.5, 0.06], 0.12, '#efe6d8')
      .rod([-0.11, 0.5, 0.06], [-0.1, 0.1, 0.04], 0.09, '#efe6d8')
      .box([0.1, 0.06, 0.22], [0.1, 0.06, 0.05], { color: '#efe6d8', round: 0.8 })
      .box([0.1, 0.06, 0.22], [-0.1, 0.06, 0.09], { color: '#efe6d8', round: 0.8 })
      .cyl([0.27, 0.26, 0.18], [0, 1.12, 0], { color: '#efe6d8', taper: 1.35 })
      .ball([0.4, 0.34, 0.24], [0, 1.33, 0], { color: '#efe6d8' })
      .cyl([0.08, 0.1, 0.08], [0, 1.52, 0], { color: '#efe6d8' })
      .ball([0.19, 0.25, 0.21], [0, 1.68, 0.01], { color: '#efe6d8', name: 'head' })
      .rod([-0.22, 1.42, 0], [-0.26, 1.15, 0.0], 0.075, '#efe6d8')
      .rod([-0.26, 1.15, 0.0], [-0.27, 0.92, 0.06], 0.065, '#efe6d8')
      .ball([0.06, 0.1, 0.05], [-0.27, 0.86, 0.07], { color: '#efe6d8' })
      .ball([0.09, 0.09, 0.09], [0.22, 1.42, 0], { color: '#efe6d8', name: 'arm', mover: { kind: 'swing', axis: 'z', amount: 110 } })
      .rod([0.22, 1.42, 0], [0.26, 1.15, 0.0], 0.075, '#efe6d8', { parent: 'arm' })
      .rod([0.26, 1.15, 0.0], [0.27, 0.92, 0.06], 0.065, '#efe6d8', { parent: 'arm' })
      .ball([0.06, 0.1, 0.05], [0.27, 0.86, 0.07], { color: '#efe6d8', parent: 'arm' })
      .socket('hat', [0, 1.8, 0.01], 'top', { size: 0.35 })
      .act({
        setup: [A.spawn('hat', 'hat'), A.attach('hat', 'self', 'hat')],
        click: [[A.operate('arm', 'up'), A.wait(1.5), A.operate('arm', 'down')], [A.anim('spin')]],
      })
      .done(),
  ),
  // In a wetsuit with a dive mask pushed up and a snorkel, yellow fins, a waterproof clipboard and a starfish.
  e('marine biologist', 'town', 'science', () =>
    act(
      who('marine biologist', {
        top: '#1d1d1f', long: true, bottom: '#1d1d1f', shoes: '#f2c14e', style: 'ponytail', hair: '#7a3b1e', pose: 'hold',
        acc: [
          bands('#2f7ac8', [0.6], 0.12),
          x2((d, _s, side) => [[`arm${side}`, 'cyl', [d.aw * 1.12, d.upper * 0.3, d.aw * 1.12], [0, -d.upper * 0.3, 0], '#2f7ac8', { noInk: true }]]),
          x((d) => [['head', 'box', [d.headW * 0.8, d.headH * 0.25, d.headD * 0.2], [0, top(d) - d.headH * 0.1, d.headD * 0.42], 'glass', { edge: 'sharp', round: 0.5 }], ['head', 'torus', [d.headW * 1.05, d.headD * 1.0, d.headH * 0.06], [0, top(d) - d.headH * 0.12, 0], '#2a2726', { srot: [80, 0, 0], tube: 0.1 }]]),
          face('snorkel', '#f0923b'),
          x2((d, _s, side) => [[`foot${side}`, 'box', [d.lw * 1.4, d.H * 0.02, d.lw * 3.2], [0, -d.H * 0.04, d.lw * 1.4], '#f2c14e', { round: 0.6 }]]),
          grip('R', 'hold', (a) => [['box', [a * 2.2, a * 0.2, a * 2.8], [-a * 0.8, a * 0.6, a * 0.3], 'white', { srot: [-50, 0, 0], edge: 'sharp' }]]),
          grip('L', 'hold', (a) => [['cyl', [a * 2.6, a * 0.35, a * 2.6], [a * 0.3, a * 0.6, a * 0.5], '#f0923b', { segs: 5, srot: [-50, 0, 0] }]]),
        ],
      }),
      [
        [A.spawn('star', 'starfish', near), ...talk('thumbs_up', 'Look! A sea star!', 'hold'), A.wait(1), A.remove('star', 'sink')],
        talk('point', 'Save the coral reefs!', 'hold'),
      ],
    ),
  ),
  // Mario: short and stocky in a red cap with an M, red shirt, blue overalls with gold buttons, white gloves,
  // big nose and moustache.
  e('mario', 'town', 'video games', () =>
    act(
      who('mario', {
        h: 1.55, build: 1.2, head: 1.12, skin: 'skin1', top: '#d23a2a', long: true, bottom: '#2f4aa8', shoes: '#6a3a1a', hair: '#3b2a1e', style: 'short',
        acc: [
          hat('cap', '#d23a2a'),
          x((d) => [['head', 'cyl', [d.headW * 0.34, d.headD * 0.06, d.headW * 0.34], [0, top(d) + d.headH * 0.0, d.headD * 0.5], 'white', { srot: [80, 0, 0], layer: 6 }], ['head', 'box', [d.headW * 0.2, d.headW * 0.2, d.headD * 0.02], [0, top(d) + d.headH * 0.0, d.headD * 0.54], 'white', { role: 'label', text: 'M', layer: 7 }], ['head', 'ball', [d.headW * 0.28, d.headW * 0.24, d.headW * 0.24], [0, d.headY - d.headH * 0.02, d.headD * 0.52], 'skin1', { layer: 6 }]]),
          face('mustache', '#2a1d16'),
          wear('overalls', '#2f4aa8'),
          x2((d, s) => [['torso', 'box', [d.tw * 0.14, d.torsoH * 0.55, d.td * 0.08], [s * d.tw * 0.24, d.torsoH * 0.7, d.td * 0.52], '#2f4aa8', { layer: 4 }], ['torso', 'ball', [d.tw * 0.1, d.tw * 0.1, d.td * 0.08], [s * d.tw * 0.24, d.torsoH * 0.5, d.td * 0.58], 'gold', { layer: 5 }]]),
          gloves('white'),
        ],
      }),
      [
        [A.par(A.face('player'), A.anim('hop'), A.say('Wahoo!', 1.5)), A.spawn('coin', 'gold', { rel: 'above', of: 'self', dist: 'touch' }), A.remove('coin', 'fly_away')],
        [A.spawn('star', 'star', near), A.effect('sparkle', { dur: 1.5 }), ...talk('arms_up', "It's-a me, Mario!"), A.remove('star', 'pop')],
      ],
    ),
  ),
  // A massage therapist in teal scrubs with a towel over the shoulder, beside a real massage table (face cradle
  // and all).
  e('massage therapist', 'town', 'beauty', () => {
    const rest: Arms = { armR: [-40, 0, -8], foreR: [-30, 0, 15], armL: [-40, 0, 8], foreL: [-30, 0, -15] };
    return act(
      who('massage therapist', {
        h: 1.72, top: '#3fa7a0', bottom: '#3fa7a0', shoes: 'white', style: 'ponytail', hair: '#2a1d16',
        acc: [
          x((d) => [['torso', 'box', [d.tw * 0.3, d.torsoH * 0.9, d.td * 1.2], [d.tw * 0.38, d.torsoH * 0.62, 0], 'white', { round: 0.5, layer: 3 }]]),
          arms(rest),
          x(() => {
            const tx = -0.95, tz = 0.15;
            return [
              ['', 'box', [0.7, 0.1, 1.85], [tx, 0.7, tz], '#5a3a5a', { edge: 'sharp', round: 0.3 }],
              ['', 'box', [0.72, 0.03, 1.4], [tx, 0.765, tz - 0.15], 'white', { round: 0.5 }],
              ['', 'torus', [0.3, 0.24, 0.08], [tx, 0.7, tz + 1.05], '#5a3a5a', { srot: [90, 0, 0], tube: 0.3 }],
              ...[[1, 1], [1, -1], [-1, 1], [-1, -1]].map(([u, v]): Spec => ['', 'box', [0.05, 0.65, 0.05], [tx + u * 0.3, 0.33, tz + v * 0.8], '#c9a06a', { edge: 'sharp' }]),
              ['', 'cyl', [0.08, 0.2, 0.08], [tx + 0.2, 0.85, tz - 0.7], '#c8873a', { edge: 'sharp' }],
            ];
          }),
        ],
      }),
      [
        [A.par(A.face('player'), A.say('Relax... deep breaths...', 2.4)), A.par(A.pose('foreR', { rot: [-25, 0, 0], dur: 0.3 }), A.pose('foreL', { rot: [10, 0, 0], dur: 0.3 })), A.par(A.pose('foreR', { rot: [10, 0, 0], dur: 0.3 }), A.pose('foreL', { rot: [-25, 0, 0], dur: 0.3 })), A.par(A.pose('foreR', { rot: [0, 0, 0], dur: 0.3 }), A.pose('foreL', { rot: [0, 0, 0], dur: 0.3 }))],
        talk('point', 'Hop up on the table!', rest),
      ],
    );
  }),
  // A mathematician in a waistcoat and bow tie with chalk in one hand and a small blackboard of sums.
  e('mathematician', 'town', 'science', () => {
    const rest: Arms = { armL: [-22, 0, 10], foreL: [-75, 0, -12] };
    return act(
      who('mathematician', {
        h: 1.74, top: 'white', long: true, bottom: 'gray', shoes: 'brown', hair: 'gray', style: 'spiky', beard: 'gray',
        acc: [
          face('glasses', 'black'),
          wear('vest', '#8a6a4a'),
          wear('bowtie', 'navy'),
          arms(rest),
          grip('R', undefined, (a) => [['capsule', [a * 0.25, a * 0.8, a * 0.25], [0, 0, a * 0.6], 'white', { srot: [70, 0, 0] }]]),
          grip('L', rest, (a) => [['box', [a * 4.0, a * 3.0, a * 0.25], [-a * 1.2, a * 1.2, a * 0.4], '#2f4a3a', { role: 'label', text: 'π≈3.14', edge: 'sharp' }], ['box', [a * 4.3, a * 3.3, a * 0.2], [-a * 1.2, a * 1.2, a * 0.3], '#8a5a35', { edge: 'sharp' }]]),
        ],
      }),
      [talk('look_around', 'Hmm... so if x equals seven...', rest), talk('arms_up', 'Eureka! Q.E.D.!', rest)],
    );
  }),
  // Maxwell: a boy in a rooster hat with his magic notebook; whatever he writes appears.
  e('maxwell', 'town', 'video games', () =>
    act(
      who('maxwell', {
        h: 'kid', skin: 'skin1', top: '#2a2726', long: true, bottom: '#7a4a2a', shoes: '#c8323c', hair: '#5a3a22', style: 'short', pose: 'hold',
        acc: [
          x((d) => [['head', 'ball', [d.headW * 1.15, d.headH * 0.62, d.headD * 1.12], [0, top(d) - d.headH * 0.04, 0], '#f2d36a'], ...[-0.15, 0.05, 0.25].map((z, i): Spec => ['head', 'ball', [d.headW * 0.18, d.headH * (0.3 - i * 0.04), d.headD * 0.22], [0, top(d) + d.headH * (0.24 - i * 0.02), d.headD * z], '#d23a2a']), ['head', 'cyl', [d.headW * 0.3, d.headD * 0.4, d.headW * 0.2], [0, top(d) - d.headH * 0.04, d.headD * 0.65], '#f0923b', { taper: 0, srot: [90, 0, 0] }], ...[1, -1].map((s): Spec => ['head', 'ball', [d.headW * 0.12, d.headW * 0.12, d.headW * 0.06], [s * d.headW * 0.28, top(d) + d.headH * 0.06, d.headD * 0.5], 'black'])]),
          grip('L', 'hold', (a) => [['box', [a * 2.0, a * 0.3, a * 2.6], [-a * 0.6, a * 0.6, a * 0.3], '#7a4a2a', { srot: [-50, 0, 0], edge: 'sharp' }], ['box', [a * 1.8, a * 0.32, a * 2.4], [-a * 0.6, a * 0.75, a * 0.35], 'cream', { srot: [-50, 0, 0], edge: 'sharp' }]]),
          grip('R', 'hold', (a) => [seg([0, 0, a * 0.3], [-a * 0.3, a * 1.2, a * 0.6], a * 0.12, '#f2c14e')]),
        ],
      }),
      [
        [A.par(A.face('player'), A.say('I write... K-I-T-T-E-N!', 2)), A.spawn('kitty', 'kitten', near), A.effect('sparkle', { id: 'kitty', dur: 1.2 }), A.wait(1.5), A.remove('kitty', 'pop')],
        talk('arms_up', 'Starite collected!', 'hold'),
      ],
    ),
  ),
  // A mechanic in blue coveralls with a name tag, a red rag in his back pocket and a grease smear, wrench in hand,
  // a tyre leaning beside him.
  e('mechanic', 'town', 'trades', () =>
    act(
      who('mechanic', {
        top: '#3a5a8a', long: true, bottom: '#3a5a8a', shoes: 'black', style: 'short', hair: '#2a1d16',
        acc: [
          hat('cap', '#c8323c'),
          x((d) => [['torso', 'box', [d.tw * 0.3, d.torsoH * 0.14, d.td * 0.05], [d.tw * 0.24, d.torsoH * 0.75, d.td * 0.54], 'white', { role: 'label', text: 'JOE', layer: 5 }], ['hips', 'box', [d.tw * 0.2, d.lw * 1.2, d.td * 0.1], [-d.tw * 0.3, -d.lw * 0.6, -d.td * 0.5], '#c8323c'], ['torso', 'ball', [d.tw * 0.15, d.tw * 0.1, d.td * 0.05], [-d.tw * 0.15, d.torsoH * 0.35, d.td * 0.52], '#3a3633', { noInk: true, layer: 5 }], ['head', 'ball', [d.headW * 0.15, d.headW * 0.08, d.headW * 0.05], [d.headW * 0.2, d.headY - d.headH * 0.18, d.headD * 0.46], '#3a3633', { noInk: true, layer: 6 }]]),
          wear('belt', 'black'),
          gloves('#3a3633', 1.05),
          grip('R', undefined, (a) => [['box', [a * 0.35, a * 2.6, a * 0.15], [0, -a * 0.9, a * 0.4], 'steel', { edge: 'sharp' }], ['torus', [a * 0.8, a * 0.8, a * 0.2], [0, -a * 2.4, a * 0.4], 'steel', { tube: 0.3, edge: 'sharp' }], ['cyl', [a * 0.8, a * 0.2, a * 0.8], [0, a * 0.5, a * 0.4], 'steel', { segs: 6, srot: [90, 0, 0], edge: 'sharp' }]]),
          x(() => [['', 'torus', [0.64, 0.64, 0.2], [0.55, 0.33, 0.05], '#2a2726', { srot: [0, 70, 8], tube: 0.36 }], ['', 'cyl', [0.36, 0.18, 0.36], [0.55, 0.33, 0.05], 'silver', { srot: [90, 70, 8], edge: 'sharp' }]]),
        ],
      }),
      [
        [A.par(A.face('player'), A.say('Clank, clank... tighten that bolt.', 2.2)), A.pose('foreR', { rot: [0, 60, 0], dur: 0.3 }), A.pose('foreR', { rot: [0, -20, 0], dur: 0.3 }), A.par(A.pose('foreR', { rot: [0, 0, 0], dur: 0.3 }), A.effect('smoke', { dur: 1 }))],
        talk('thumbs_up', 'Good as new!'),
      ],
    ),
  ),
  // A mercenary in a tactical vest with magazine pouches, a black bandana, shades and a beard, rifle at the ready.
  e('mercenary', 'town', 'military', () =>
    act(
      who('mercenary', {
        h: 1.82, build: 1.3, top: '#5a6a3a', long: true, bottom: '#4a4a3a', shoes: 'black', hair: 'black', style: 'short', beard: 'black', pose: 'cross',
        acc: [
          hat('bandana', '#1d1d1d'),
          face('beard', 'black'),
          face('sunglasses'),
          wear('vest', '#3a3a2a'),
          x((d) => [-0.25, 0, 0.25].map((u): Spec => ['torso', 'box', [d.tw * 0.18, d.torsoH * 0.2, d.td * 0.14], [d.tw * u, d.torsoH * 0.42, d.td * 0.62], '#4a4a3a', { layer: 4, edge: 'sharp' }])),
          boots('black'),
          x((d) => [rod('torso', [d.tw * 0.45, d.torsoH * 1.05, -d.td * 0.65], [-d.tw * 0.45, d.torsoH * 0.05, -d.td * 0.65], d.tw * 0.12, '#2a2726')]),
        ],
      }),
      [talk('nod', 'For the right price.'), talk('shrug', 'Nothing personal. Just business.', 'cross')],
    ),
  ),
  // A merchant of the old silk road in a turban, green robe and gold sash, a brass balance and a purse of coins.
  e('merchant', 'town', 'history', () => {
    const rest: Arms = { armL: [-35, 0, 20], foreL: [-70, 0, -25] };
    return act(
      who('merchant', {
        h: 1.72, build: 1.15, skin: 'skin4', top: '#3f8a4a', long: true, bottom: '#2f6a3a', shoes: '#8a5a35', hair: 'black', style: 'short', beard: 'black',
        acc: [
          hat('turban', '#f0923b'),
          x((d) => [['head', 'ball', [d.headW * 0.15, d.headW * 0.15, d.headW * 0.08], [0, top(d) + d.headH * 0.05, d.headD * 0.55], '#c8323c', { role: 'glow' }]]),
          face('beard', 'black'),
          wear('robe', '#2f6a3a'),
          wear('sash', 'gold'),
          wear('necklace', 'gold'),
          grip('R', undefined, (a) => [['ball', [a * 2.4, a * 2.6, a * 2.2], [0, -a * 1.8, a * 0.5], '#c9a06a'], ['cyl', [a * 0.8, a * 0.5, a * 0.8], [0, -a * 0.5, a * 0.5], '#c9a06a']]),
          arms(rest),
          grip('L', rest, (a) => [['capsule', [a * 0.2, a * 1.6, a * 0.2], [0, a * 0.8, a * 0.4], 'brass'], ['capsule', [a * 0.15, a * 3.4, a * 0.15], [0, a * 1.6, a * 0.4], 'brass', { srot: [0, 0, 90], name: 'beam' }], ...[1, -1].map((s): Hold => ['cyl', [a * 1.2, a * 0.3, a * 1.2], [s * a * 1.6, a * 0.7, a * 0.4], 'brass', { taper: 1.5, parent: 'beam' }])]),
        ],
      }),
      [
        talk('thumbs_up', 'The finest silks in all the land!', rest),
        [A.par(A.face('player'), A.say('A fair price, my friend!', 2)), A.pose('beam', { rot: [0, 0, 12], dur: 0.4 }), A.pose('beam', { rot: [0, 0, -12], dur: 0.5 }), A.pose('beam', { rot: [0, 0, 0], dur: 0.4 })],
      ],
    );
  }),
  // A mermaid sitting on a sea rock, her long tail curling down over it to a fanned fin, a shell top and red hair.
  e('mermaid', 'fantasy', 'sea folk', () =>
    act(
      who('mermaid', {
        h: 1.7, skin: 'skin2', top: 'skin2', bottom: '#2f9a8a', hair: '#d23a2a', style: 'long',
        acc: [
          hide(...LEGS),
          lift(0.06),
          x((d) => {
            const hy = d.legLen + 0.06;
            return [
              ['', 'ball', [0.95, 0.66, 0.8], [0, 0.3, -0.05], '#8a8a86'],
              ['', 'ball', [0.5, 0.35, 0.5], [0.35, 0.15, 0.25], '#9a9a94'],
              ['hips', 'cyl', [d.tw * 1.15, hy * 0.55, d.td * 1.3], [0, -hy * 0.18, d.td * 0.2], '#2f9a8a', { taper: 0.75, srot: [200, 0, 0] }],
              rod('hips', [0, -hy * 0.42, d.td * 0.4], [0, -hy + 0.1, 0.42], d.tw * 0.62, '#2f9a8a'),
              rod('hips', [0, -hy + 0.1, 0.42], [0.15, -hy + 0.06, 0.75], d.tw * 0.42, '#2f9a8a'),
              ['hips', 'wedge', [0.42, 0.26, 0.04], [0.2, -hy + 0.1, 0.95], '#7fd8cf', { srot: [-90, 0, -30] }],
              ...[[0.25, -0.2], [-0.2, -0.4], [0.1, -0.6], [-0.05, -0.15]].map(([u, v]): Spec => ['hips', 'ball', [d.tw * 0.16, d.tw * 0.12, d.tw * 0.05], [d.tw * u, hy * v * 0.5, d.td * (0.75 + v * 0.1)], '#7fd8cf', { noInk: true, layer: 4 }]),
              ...[1, -1].map((s): Spec => ['torso', 'ball', [d.tw * 0.32, d.tw * 0.28, d.td * 0.45], [s * d.tw * 0.18, d.torsoH * 0.7, d.td * 0.35], '#9a5ac8']),
            ];
          }),
          hat('flower', 'pink'),
          wear('necklace', 'white'),
        ],
      }),
      [
        [A.effect('water_spray', { dur: 1.5 }), ...talk('wave', 'Hello from under the sea!')],
        [A.spawn('pearl', 'pearl', near), ...talk('thumbs_up', 'A pearl, just for you!'), A.wait(1), A.remove('pearl', 'sink')],
      ],
    ),
  ),
  // The TV weather presenter in a smart suit with a pointer and a card with a sun peeping from a cloud.
  e('meteorologist', 'town', 'media', () => {
    const rest: Arms = { armL: [-25, 0, 12], foreL: [-70, 0, -15] };
    return act(
      who('meteorologist', {
        h: 1.72, top: 'white', long: true, bottom: 'navy', shoes: 'black', style: 'short', hair: '#a0522d',
        acc: [
          wear('suit', 'navy'),
          lapels('#14244a'),
          grip('R', undefined, (a, d) => [seg([0, 0, a * 0.3], [0, -d.H * 0.2, d.H * 0.25], a * 0.1, 'silver')]),
          arms(rest),
          grip('L', rest, (a) => [['box', [a * 3.0, a * 2.4, a * 0.12], [-a * 0.6, a * 1.3, a * 0.4], 'skyblue', { edge: 'sharp' }], ['ball', [a * 1.2, a * 1.2, a * 0.1], [-a * 0.2, a * 1.7, a * 0.48], '#f2c14e', { noInk: true }], ['ball', [a * 1.6, a * 0.9, a * 0.12], [-a * 0.9, a * 1.15, a * 0.52], 'white', { noInk: true }]]),
        ],
      }),
      [[A.effect('rain', { dur: 2.2 }), ...talk('point', 'Expect showers this afternoon!', rest)], [A.effect('sparkle', { dur: 1.5 }), ...talk('thumbs_up', 'Sunny skies all weekend!', rest)]],
    );
  }),
  // A little person, 1.2 m: adult proportions, a teal shirt and jeans, a cap and a full beard.
  e('midget', 'town', 'everyday people', () =>
    act(
      who('midget', { h: 1.2, build: 1.15, top: '#3fa7a0', bottom: 'denim', shoes: 'brown', hair: '#5a3a22', style: 'short', beard: '#5a3a22', acc: [face('beard', '#5a3a22'), hat('cap', '#f0923b'), wear('belt', '#3a2a1a')] }),
      [talk('wave', 'Howdy, neighbour!'), talk('laugh', 'Ha! Good one!')],
    ),
  ),
  // The milkman in white with a peaked cap and bow tie, a wire crate of glass milk bottles in his hand.
  e('milk man', 'town', 'food service', () =>
    act(
      who('milk man', {
        h: 1.76, top: 'white', long: true, bottom: 'white', shoes: 'black', style: 'short', hair: '#5a3a22',
        acc: [
          hat('police', 'white'),
          x((d) => [['head', 'cyl', [d.headW * 1.02, d.headH * 0.07, d.headD * 1.02], [0, top(d) - d.headH * 0.0, -d.headD * 0.04], '#2f5aa8']]),
          wear('bowtie', '#2f5aa8'),
          wear('belt', 'black'),
          grip('L', undefined, (a) => [
            ['box', [a * 3.4, a * 1.4, a * 2.2], [0, -a * 2.5, a * 0.4], 'silver', { edge: 'sharp', round: 0.1 }],
            ['box', [a * 0.2, a * 2.0, a * 0.2], [0, -a * 1.0, a * 0.4], 'silver', { edge: 'sharp' }],
            ...[[-0.8, -0.5], [0.8, -0.5], [-0.8, 0.5], [0.8, 0.5]].flatMap(([u, v]): Hold[] => [['cyl', [a * 0.9, a * 2.0, a * 0.9], [u * a, -a * 1.7, a * (0.4 + v)], 'white', { taper: 0.75 }], ['cyl', [a * 0.55, a * 0.2, a * 0.55], [u * a, -a * 0.65, a * (0.4 + v)], '#c8c8c0']]),
          ]),
        ],
      }),
      [[A.spawn('milk', 'milk bottle', near), ...talk('nod', 'Fresh milk, right to your door!'), A.wait(1), A.remove('milk', 'pop')], talk('wave', 'Morning! Same time tomorrow!')],
    ),
  ),
  // A milkmaid with a wooden yoke across her shoulders and a pail of milk on each end, a bonnet and apron.
  e('milkmaid', 'town', 'farm work', () =>
    act(
      who('milkmaid', {
        h: 1.64, top: 'white', long: true, skirt: '#2f5aa8', legs: 'white', shoes: 'darkbrown', hair: '#e8c56a', style: 'pigtails',
        acc: [
          x((d) => [['head', 'ball', [d.headW * 1.15, d.headH * 0.7, d.headD * 1.1], [0, d.headY + d.headH * 0.22, -d.headD * 0.12], 'white', { layer: -1 }], ['head', 'cyl', [d.headW * 1.25, d.headH * 0.05, d.headD * 0.5], [0, top(d) - d.headH * 0.05, d.headD * 0.3], 'white', { srot: [-15, 0, 0] }]]),
          wear('apron', 'white'),
          x((d) => [['torso', 'box', [d.tw * 0.75, d.torsoH * 0.45, d.td * 1.1], [0, d.torsoH * 0.25, 0], '#2a2a3a', { layer: 2, round: 0.4 }]]),
          x((d) => [
            ['torso', 'capsule', [d.tw * 0.14, d.tw * 2.9, d.tw * 0.14], [0, d.torsoH * 1.0, -d.td * 0.1], 'wood', { srot: [0, 0, 90] }],
            ...[1, -1].flatMap((s): Spec[] => [
              rod('torso', [s * d.tw * 1.35, d.torsoH * 1.0, -d.td * 0.1], [s * d.tw * 1.35, d.torsoH * 0.4, -d.td * 0.1], d.tw * 0.03, '#c9a06a'),
              ['torso', 'cyl', [d.tw * 0.62, d.torsoH * 0.42, d.tw * 0.62], [s * d.tw * 1.35, d.torsoH * 0.2, -d.td * 0.1], 'wood', { taper: 1.2, edge: 'sharp' }],
              ['torso', 'cyl', [d.tw * 0.64, d.torsoH * 0.03, d.tw * 0.64], [s * d.tw * 1.35, d.torsoH * 0.12, -d.td * 0.1], '#5c6166', { noInk: true }],
              ['torso', 'cyl', [d.tw * 0.66, d.torsoH * 0.02, d.tw * 0.66], [s * d.tw * 1.35, d.torsoH * 0.39, -d.td * 0.1], 'milk', { noInk: true }],
            ]),
          ]),
        ],
      }),
      [
        [A.spawn('cow', 'cow', { rel: 'right', of: 'self', dist: 'close' }), ...talk('point', 'Milking time, Daisy!'), A.wait(1.5), A.remove('cow', 'fade')],
        talk('bow', 'Fresh milk, sir?'),
      ],
    ),
  ),
  // A tycoon in tails and a top hat, a monocle and a white moustache, a gold-topped cane and a bag of money.
  e('millionaire', 'town', 'office', () =>
    act(
      who('millionaire', {
        h: 1.76, build: 1.25, top: 'black', long: true, bottom: 'black', shoes: 'black', hair: 'white', style: 'short',
        acc: [
          x((d) => {
            const t = top(d), W = d.headW, H = d.headH, D = d.headD;
            return [['head', 'cyl', [W * 1.5, H * 0.05, D * 1.4], [0, t, 0], '#1d1d1d', { name: 'hat', piece: true }], ['hat', 'cyl', [W * 0.85, H * 0.75, D * 0.8], [0, H * 0.38, 0], '#1d1d1d'], ['hat', 'cyl', [W * 0.87, H * 0.1, D * 0.82], [0, H * 0.08, 0], '#3a3a3a']];
          }),
          face('monocle'),
          face('mustache', 'white'),
          shirtFront(),
          lapels('#2a2a32'),
          wear('bowtie', 'black'),
          x((d) => [rod('torso', [d.tw * 0.1, d.torsoH * 0.55, d.td * 0.56], [d.tw * 0.35, d.torsoH * 0.5, d.td * 0.52], d.tw * 0.025, 'gold')]),
          pole('R', undefined, 0.02, 0.76, 0.025, '#1d1d1d', (a) => [['ball', [0.055, 0.055, 0.055], [0, 0.03, a * 0.3], 'gold']]),
          grip('L', undefined, (a) => [['ball', [a * 3, a * 3.2, a * 2.6], [0, -a * 2.2, a * 0.8], '#c9a06a'], ['cyl', [a * 1.2, a * 0.6, a * 1.2], [0, -a * 0.5, a * 0.8], '#c9a06a'], ['box', [a * 1.4, a * 1.4, a * 0.05], [0, -a * 2.2, a * 2.1], '#c9a06a', { role: 'label', text: '$', layer: 6 }]]),
        ],
      }),
      [
        [A.pose('hat', { move: [0, 0.06, 0], rot: [-20, 0, 0], dur: 0.3 }), ...talk('laugh', 'Ho ho! Money, money, money!'), A.pose('hat', { move: [0, 0, 0], rot: [0, 0, 0], dur: 0.3 })],
        [A.spawn('gem', 'diamond', near), ...talk('thumbs_up', 'Keep the change!'), A.wait(1), A.remove('gem', 'fade')],
      ],
    ),
  ),
  // White face, black-and-white stripes, braces, a beret and white gloves: trapped in an invisible box.
  e('mime', 'town', 'arts', () =>
    act(
      who('mime', {
        h: 1.72, build: 0.9, skin: '#f8f6f0', top: 'white', long: true, bottom: 'black', shoes: 'black', hair: 'black', style: 'short', blush: '#e86a7a',
        acc: [
          hat('beret', 'black'),
          bands('#2a2726', [0.12, 0.3, 0.48, 0.66, 0.84], 0.07),
          x2((d, _s, side) => [0.3, 0.7].map((v): Spec => [`arm${side}`, 'cyl', [d.aw * 1.14, d.upper * 0.12, d.aw * 1.14], [0, -d.upper * v, 0], '#2a2726', { noInk: true }])),
          x2((d, s) => [['torso', 'box', [d.tw * 0.08, d.torsoH * 1.0, d.td * 1.12], [s * d.tw * 0.22, d.torsoH * 0.5, 0], 'black', { layer: 5 }]]),
          x((d) => [['torso', 'torus', [d.tw * 0.55, d.tw * 0.55, d.td * 0.15], [0, d.torsoH * 0.98, 0], '#c8323c', { srot: [90, 0, 0], tube: 0.35 }], ['head', 'box', [d.headW * 0.18, d.headH * 0.035, d.headD * 0.04], [0, d.headY - d.headH * 0.21, d.headD * 0.47], '#c8323c', { noInk: true, layer: 6 }]]),
          gloves('white'),
        ],
      }),
      [
        [A.par(A.face('player'), A.pose('armR', { rot: [-80, 0, 0], dur: 0.3 }), A.pose('armL', { rot: [-80, 0, 0], dur: 0.3 }), A.pose('foreR', { rot: [-20, 0, 0], dur: 0.3 }), A.pose('foreL', { rot: [-20, 0, 0], dur: 0.3 }), A.say('...!', 1.5)), A.par(A.pose('armR', { rot: [-150, 0, 0], dur: 0.5 }), A.pose('armL', { rot: [-150, 0, 0], dur: 0.5 })), A.par(A.pose('armR', { rot: [-80, 0, 30], dur: 0.5 }), A.pose('armL', { rot: [-80, 0, -30], dur: 0.5 })), A.par(A.pose('armR', { rot: [0, 0, 0], dur: 0.4 }), A.pose('armL', { rot: [0, 0, 0], dur: 0.4 }), A.pose('foreR', { rot: [0, 0, 0], dur: 0.4 }), A.pose('foreL', { rot: [0, 0, 0], dur: 0.4 }))],
        talk('shrug', '...?'),
      ],
    ),
  ),
  // A coal miner: hard hat with a headlamp that switches on, coveralls and a sooty face, pickaxe and lantern.
  e('miner', 'town', 'trades', () =>
    act(
      who('miner', {
        h: 1.74, top: '#7a7f85', long: true, bottom: '#3d4f7a', shoes: 'black', style: 'short', hair: '#2a1d16',
        acc: [
          hat('hard', '#f2c14e'),
          x((d) => [['head', 'cyl', [d.headW * 0.3, d.headW * 0.2, d.headW * 0.3], [0, top(d) - d.headH * 0.05, d.headD * 0.52], 'silver', { srot: [90, 0, 0] }], ['head', 'cyl', [d.headW * 0.22, d.headW * 0.05, d.headW * 0.22], [0, top(d) - d.headH * 0.05, d.headD * 0.64], '#fff6c8', { srot: [90, 0, 0], name: 'lamp', role: 'glow', mover: { kind: 'light', on: true } }], ['head', 'ball', [d.headW * 0.25, d.headH * 0.12, d.headD * 0.05], [-d.headW * 0.2, d.headY - d.headH * 0.2, d.headD * 0.47], '#3a3633', { noInk: true }]]),
          wear('overalls', '#3d4f7a'),
          boots('black'),
          held('pickaxe'),
          grip('L', undefined, (a) => [['box', [a * 1.0, a * 0.12, a * 1.0], [0, -a * 0.6, a * 0.4], '#3a3633', { edge: 'sharp' }], ['box', [a * 0.85, a * 1.2, a * 0.85], [0, -a * 1.3, a * 0.4], '#ffb84a', { role: 'glow', noInk: true }], ['box', [a * 1.1, a * 0.15, a * 1.1], [0, -a * 2.0, a * 0.4], '#3a3633', { edge: 'sharp' }]]),
        ],
      }),
      [
        [A.operate('lamp', 'off'), A.wait(0.4), A.operate('lamp', 'on'), ...talk('point', 'Down the shaft we go!')],
        [A.par(A.face('player'), A.say('Clink! Clink!', 1.5), A.pose('armR', { rot: [-130, 0, 0], dur: 0.35 })), A.par(A.pose('armR', { rot: [-20, 0, 0], dur: 0.15 }), A.effect('dust', { dur: 1 })), A.spawn('nugget', 'nugget', near), A.pose('armR', { rot: [0, 0, 0], dur: 0.3 }), ...talk('arms_up', 'Gold! I struck gold!'), A.remove('nugget', 'pop')],
      ],
    ),
  ),
  // The Minotaur, two and a half metres: a bull's head with great horns and a ring in its nose on a man's body,
  // a leather kilt and a double-headed axe.
  e('minotaur', 'fantasy', 'monsters', () =>
    act(
      who('minotaur', {
        h: 2.5, build: 1.5, skin: '#7a4a2a', top: '#7a4a2a', bottom: '#4a3020', skirt: '#5a3a22', shoes: '#3a2a20', hair: '#4a3020', style: 'short', eyes: '#d23a2a', blush: '#6a3a1a',
        acc: [
          x((d) => [
            ['head', 'ball', [d.headW * 0.75, d.headH * 0.5, d.headD * 0.6], [0, d.headY - d.headH * 0.2, d.headD * 0.42], '#c9a07a'],
            ...[1, -1].flatMap((s): Spec[] => [
              ['head', 'ball', [d.headW * 0.12, d.headW * 0.1, d.headW * 0.06], [s * d.headW * 0.15, d.headY - d.headH * 0.2, d.headD * 0.72], '#3a2a20', { noInk: true }],
              ['head', 'cyl', [d.headW * 0.26, d.headW * 0.55, d.headW * 0.26], [s * d.headW * 0.66, top(d) - d.headH * 0.12, 0], 'cream', { taper: 0.65, srot: [0, 0, -s * 80] }],
              ['head', 'cyl', [d.headW * 0.18, d.headH * 0.5, d.headW * 0.18], [s * d.headW * 0.98, top(d) + d.headH * 0.1, 0], 'cream', { taper: 0, srot: [0, 0, -s * 15] }],
              ['head', 'ball', [d.headW * 0.35, d.headH * 0.15, d.headW * 0.12], [s * d.headW * 0.6, d.headY + d.headH * 0.05, 0], '#7a4a2a', { srot: [0, 0, s * 20] }],
            ]),
            ['head', 'torus', [d.headW * 0.25, d.headW * 0.25, d.headW * 0.05], [0, d.headY - d.headH * 0.36, d.headD * 0.7], 'gold', { tube: 0.25 }],
            ...[1, -1].map((s): Spec => ['torso', 'ball', [d.tw * 0.4, d.torsoH * 0.22, d.td * 0.3], [s * d.tw * 0.2, d.torsoH * 0.72, d.td * 0.38], '#7a4a2a']),
          ]),
          wear('belt', '#3a2a1a'),
          pole('R', undefined, 0.6, 0.5, 0.05, '#5a3a22', (a, _d, tip) => [...[1, -1].map((s): Hold => ['cyl', [0.32, 0.36, 0.04], [s * 0.18, tip - 0.08, a * 0.3], 'silver', { segs: 3, srot: [0, 0, s * 90], edge: 'sharp' }])]),
        ],
      }),
      [
        [A.effect('dust', { dur: 1.2 }), ...talk('hands_on_hips', 'SNORT! Who dares enter my labyrinth?')],
        [A.par(A.face('player'), A.anim('shake'), A.effect('steam', { dur: 1.2 }), A.say('MOOOAAARGH!', 2))],
      ],
    ),
  ),
  // A thin, stooped miser in a black frock coat and a grey scarf, clutching his money bag, a candle in his other
  // hand.
  e('miser', 'town', 'storybook', () =>
    act(
      who('miser', {
        h: 1.68, build: 0.82, skin: 'skin1', top: 'black', long: true, bottom: 'black', shoes: 'black', hair: 'lightgray', style: 'short',
        acc: [
          lean(16),
          hat('top', '#2a2a30'),
          wear('coat', '#2a2a30'),
          wear('scarf', 'gray'),
          x((d) => [['head', 'cyl', [d.headW * 0.12, d.headH * 0.2, d.headW * 0.1], [0, d.headY - d.headH * 0.04, d.headD * 0.58], 'skin1', { taper: 0.5, srot: [70, 0, 0] }]]),
          grip('L', undefined, (a) => [['ball', [a * 2.6, a * 2.8, a * 2.4], [0, -a * 1.6, a * 0.8], '#c9a06a'], ['box', [a * 1.2, a * 1.2, a * 0.05], [0, -a * 1.6, a * 2.0], '#c9a06a', { role: 'label', text: '$', layer: 6 }]]),
          grip('R', undefined, (a) => [['cyl', [a * 2, a * 0.3, a * 2], [0, -a * 0.6, a * 1.2], 'brass'], ['cyl', [a * 0.7, a * 2, a * 0.7], [0, a * 0.5, a * 1.2], 'cream'], ['ball', [a * 0.5, a * 0.8, a * 0.5], [0, a * 1.8, a * 1.2], '#ffb84a', { name: 'flame', role: 'glow', noInk: true, mover: { kind: 'light', on: true } }]]),
        ],
      }),
      [
        talk('shake_head', 'Bah! Humbug!'),
        [A.operate('flame', 'off'), ...talk('hands_on_hips', 'Candles cost money, you know!'), A.operate('flame', 'on')],
      ],
    ),
  ),
  // Mr Hyde: hulking and hunched, wild black hair, red eyes, a torn shirt under a frock coat, huge hands.
  e('mister hyde', 'town', 'storybook', () =>
    act(
      who('mister hyde', {
        h: 1.82, build: 1.45, skin: '#c4ad98', top: 'white', long: true, bottom: 'black', shoes: 'black', hair: '#2a2726', style: 'spiky', eyes: '#d23a2a', blush: '#a08a78',
        acc: [
          lean(20),
          hat('top', '#2a2726'),
          wear('coat', '#2a2a30'),
          x((d) => [['torso', 'wedge', [d.tw * 0.35, d.torsoH * 0.25, d.td * 1.2], [-d.tw * 0.3, -d.torsoH * 0.02, 0], '#2a2a30', { srot: [0, 0, 180] }], ['head', 'box', [d.headW * 0.8, d.headH * 0.08, d.headD * 0.15], [0, d.headY + d.headH * 0.12, d.headD * 0.44], '#2a2726', { round: 0.6 }]]),
          gloves('#c4ad98', 1.6),
          held('cane', 'black'),
        ],
      }),
      [talk('laugh', 'Hahaha! Jekyll is gone!'), talk('stomp', 'GRRRAH! Out of my way!')],
    ),
  ),
  // A mohawk on a display head: a tall magenta crest of spikes on a shaved head, ear studs, on a black stand.
  e('mohawk', 'wardrobe', 'hairstyles', () => {
    const b = m('mohawk')
      .cyl([0.13, 0.02, 0.13], [0, 0.01, 0], { color: '#1d1d1d', edge: 'sharp' })
      .cyl([0.03, 0.06, 0.03], [0, 0.05, 0], { color: '#1d1d1d', edge: 'sharp' })
      .cyl([0.07, 0.05, 0.07], [0, 0.1, 0], { color: '#e8c0a0' })
      .ball([0.13, 0.155, 0.145], [0, 0.18, 0], { color: '#e8c0a0', name: 'head' })
      .ball([0.025, 0.04, 0.025], [0.065, 0.175, -0.005], { color: '#e8c0a0' })
      .ball([0.025, 0.04, 0.025], [-0.065, 0.175, -0.005], { color: '#e8c0a0' })
      .ball(0.008, [0.074, 0.16, -0.002], { color: 'silver' })
      .ball(0.008, [-0.074, 0.16, -0.002], { color: 'silver' })
      .ball([0.018, 0.012, 0.01], [0.027, 0.19, 0.068], { color: '#2a2726', eye: true })
      .ball([0.018, 0.012, 0.01], [-0.027, 0.19, 0.068], { color: '#2a2726', eye: true })
      .box([0.03, 0.025, 0.16], [0, 0.25, -0.005], { color: '#c02a8a', round: 0.5, name: 'crest' });
    for (let i = 0; i < 6; i++) b.cone([0.03, 0.08 - Math.abs(i - 2.5) * 0.008, 0.035], [0, 0.29 - Math.abs(i - 2.5) * 0.005, 0.065 - i * 0.027], { color: i % 2 ? '#e040a0' : '#c02a8a', rot: [-20 - i * 9, 0, 0], parent: 'crest' });
    return b.act({ click: [[A.pose('crest', { scale: 1.35, dur: 0.3 }), A.effect('sparkle', { dur: 1 }), A.wait(1), A.pose('crest', { scale: 1, dur: 0.4 })], [A.anim('spin')]] }).done();
  }),
  // Frankenstein's monster, 2.4 m: green skin, a flat-topped head with bolts in the neck, a short black jacket,
  // heavy boots, arms out in front.
  e('monster', 'fantasy', 'monsters', () =>
    act(
      who('monster', {
        h: 2.4, build: 1.35, skin: '#8fbf7a', top: '#2a2a2a', long: true, bottom: '#4a4e54', shoes: 'black', hair: 'black', style: 'none', eyes: '#f6d24a', blush: '#7aa86a', pose: 'reach',
        acc: [
          x((d) => [
            ['head', 'box', [d.headW * 1.04, d.headH * 0.3, d.headD * 1.0], [0, top(d) - d.headH * 0.06, -d.headD * 0.02], 'black', { round: 0.2 }],
            ...[1, -1].map((s): Spec => ['head', 'cyl', [d.headW * 0.12, d.headW * 0.3, d.headW * 0.12], [s * d.headW * 0.5, d.headY - d.headH * 0.4, 0], 'silver', { srot: [0, 0, 90], edge: 'sharp' }]),
            ['head', 'box', [d.headW * 0.3, d.headH * 0.03, d.headD * 0.04], [d.headW * 0.1, d.headY + d.headH * 0.3, d.headD * 0.45], '#3a3633', { noInk: true }],
            ...[-1, 0, 1].map((i): Spec => ['head', 'box', [d.headW * 0.02, d.headH * 0.06, d.headD * 0.04], [d.headW * (0.1 + i * 0.08), d.headY + d.headH * 0.3, d.headD * 0.46], '#3a3633', { noInk: true }]),
          ]),
          x2((d, _s, side) => [[`fore${side}`, 'cyl', [d.aw * 1.02, d.lower * 0.25, d.aw * 1.02], [0, -d.lower * 0.15, 0], '#2a2a2a']]),
          boots('black'),
          gloves('#8fbf7a', 1.35),
        ],
      }),
      [
        [A.par(A.face('player'), A.anim('shake'), A.say('Mmmm... FRIEND?', 2))],
        talk('hands_on_hips', 'RAAAWR! Fire BAD!', 'reach'),
      ],
    ),
  ),
  // A mother with a baby swaddled in a blue blanket in her arms and a bag over her shoulder.
  e('mother', 'town', 'family', () =>
    act(
      who('mother', {
        h: 1.66, top: '#e86f9a', long: true, bottom: 'denim', shoes: 'white', hair: '#7a3b1e', style: 'ponytail', pose: 'hold',
        acc: [
          x((d) => [['torso', 'box', [d.tw * 0.12, d.torsoH * 1.1, d.td * 1.12], [0, d.torsoH * 0.5, 0], '#c9a06a', { srot: [0, 0, -35], layer: 3 }], ['torso', 'box', [d.tw * 0.5, d.torsoH * 0.4, d.td * 0.4], [-d.tw * 0.65, d.torsoH * 0.05, 0], '#c9a06a', { round: 0.4 }]]),
          x((d) => [
            ['torso', 'capsule', [d.tw * 0.62, d.tw * 1.5, d.tw * 0.55], [-d.tw * 0.1, d.torsoH * 0.45, d.td * 1.25], '#9ac8f0', { srot: [0, 0, 78] }],
            ['torso', 'ball', [d.tw * 0.42, d.tw * 0.42, d.tw * 0.4], [d.tw * 0.62, d.torsoH * 0.58, d.td * 1.3], '#f6d2b4'],
            ['torso', 'ball', [d.tw * 0.5, d.tw * 0.32, d.tw * 0.46], [d.tw * 0.68, d.torsoH * 0.66, d.td * 1.22], '#9ac8f0'],
          ]),
        ],
      }),
      [
        talk('nod', "Shh... the baby's sleeping."),
        [A.par(A.face('player'), A.say('♪ Rock-a-bye baby... ♪', 2.5)), A.pose('torso', { rot: [0, 0, 6], dur: 0.6 }), A.pose('torso', { rot: [0, 0, -6], dur: 0.8 }), A.pose('torso', { rot: [0, 0, 0], dur: 0.6 })],
      ],
    ),
  ),
  // A mountaineer: red helmet, glacier goggles, a big pack with a coil of rope, an ice axe raised to the peak.
  e('mountain climber', 'town', 'outdoors', () => {
    const rest: Arms = { armR: [-20, 0, -120], foreR: [-10, 0, -30] };
    return act(
      who('mountain climber', {
        h: 1.76, top: '#f0703a', long: true, bottom: '#3a3f4a', shoes: '#7a4a2a', hair: '#5a3a22', style: 'short', beard: '#5a3a22',
        acc: [
          hat('helmet', '#c8323c'),
          face('goggles', '#3a3f4a'),
          face('beard', '#5a3a22'),
          x((d) => [['torso', 'box', [d.tw * 0.9, d.torsoH * 1.0, d.td * 0.8], [0, d.torsoH * 0.55, -d.td * 0.85], '#2f5aa8', { round: 0.4 }], ['torso', 'torus', [d.tw * 0.75, d.tw * 0.75, d.td * 0.3], [0, d.torsoH * 0.95, -d.td * 1.0], '#c9a06a', { srot: [90, 0, 0], tube: 0.3 }], ['torso', 'torus', [d.tw * 1.0, d.tw * 1.3, d.td * 0.15], [d.tw * 0.05, d.torsoH * 0.55, d.td * 0.3], '#c9a06a', { srot: [0, 20, 35], tube: 0.2 }]]),
          boots('#7a4a2a'),
          arms(rest),
          grip('R', rest, (a) => [['capsule', [a * 0.3, a * 5, a * 0.3], [0, a * 1.5, a * 0.3], '#2a2726'], ['box', [a * 2.6, a * 0.35, a * 0.3], [-a * 0.2, a * 3.9, a * 0.3], 'silver', { edge: 'sharp' }], ['cyl', [a * 0.3, a * 0.8, a * 0.3], [0, -a * 1.3, a * 0.3], 'silver', { taper: 0 }]]),
        ],
      }),
      [talk('point', 'To the summit!', rest), [A.spawn('flag', 'flag', near), ...talk('arms_up', 'I made it to the top!', rest), A.wait(1), A.remove('flag', 'sink')]],
    );
  }),
  // A film star in a golden gown with long platinum waves, sunglasses and pearls, posing for the cameras.
  e('movie star', 'town', 'entertainment', () =>
    act(
      who('movie star', {
        h: 1.72, top: '#e8c050', skirt: '#e8c050', bottom: '#e8c050', shoes: 'red', hair: '#f2e2b0', style: 'long', pose: 'hips',
        acc: [
          wear('robe', '#e8c050'),
          face('sunglasses'),
          wear('necklace', 'white'),
          earrings('white'),
          x((d) => [['torso', 'torus', [d.tw * 1.1, d.tw * 1.1, d.td * 0.5], [0, d.torsoH * 0.95, 0], 'white', { srot: [90, 0, 0], tube: 0.4 }]]),
        ],
      }),
      [
        [A.spawn('award', 'trophy', near), ...talk('cry', "I'd like to thank my mother..."), A.remove('award', 'pop')],
        talk('wave', 'No autographs, darling!', 'hips'),
      ],
    ),
  ),
  // Mozart in a red coat with gold braid, a white wig rolled at the sides, lace at his throat, conducting.
  e('mozart', 'town', 'history', () => {
    const rest: Arms = { armR: [-40, 0, -25], foreR: [-50, 0, 10] };
    return act(
      who('mozart', {
        h: 1.63, skin: 'skin1', top: '#c8323c', long: true, bottom: 'cream', legs: 'white', shoes: 'black', hair: 'white', style: 'ponytail',
        acc: [
          wear('coat', '#c8323c'),
          bands('gold', [0.15], 0.05),
          x((d) => [['torso', 'box', [d.tw * 0.06, d.torsoH * 0.9, d.td * 0.05], [d.tw * 0.18, d.torsoH * 0.5, d.td * 0.58], 'gold', { layer: 5 }], ['torso', 'box', [d.tw * 0.06, d.torsoH * 0.9, d.td * 0.05], [-d.tw * 0.18, d.torsoH * 0.5, d.td * 0.58], 'gold', { layer: 5 }], ['torso', 'ball', [d.tw * 0.3, d.tw * 0.24, d.td * 0.3], [0, d.torsoH * 0.88, d.td * 0.52], 'white', { layer: 5 }], ...[1, -1].flatMap((s): Spec[] => [0, 1].map((i): Spec => ['head', 'capsule', [d.headW * 0.16, d.headH * 0.3, d.headW * 0.16], [s * d.headW * 0.52, d.headY + d.headH * (0.1 - i * 0.16), -d.headD * 0.05], 'white', { srot: [0, 0, 90] }]))]),
          arms(rest),
          grip('R', rest, (a) => [seg([0, 0, a * 0.3], [0, a * 2.6, a * 1.6], a * 0.12, 'white')]),
        ],
      }),
      [
        [A.par(A.face('player'), A.say('♪ Eine kleine Nachtmusik! ♪', 2.4)), A.pose('foreR', { rot: [-40, 0, 0], dur: 0.3 }), A.pose('foreR', { rot: [20, 0, 0], dur: 0.3 }), A.pose('foreR', { rot: [-40, 0, 0], dur: 0.3 }), A.pose('foreR', { rot: [0, 0, 0], dur: 0.3 })],
        talk('bow', 'Thank you! Danke schön!', rest),
      ],
    );
  }),
  // A mummy wrapped in linen strips, arms out, one loose strip trailing from its arm (a piece: it unravels).
  e('mummy', 'fantasy', 'undead', () =>
    act(
      who('mummy', {
        h: 1.72, skin: '#e8dcc0', top: '#e8dcc0', long: true, bottom: '#e8dcc0', shoes: '#d9cba8', style: 'none', eyes: '#2a2726', blush: '#e8dcc0', pose: 'reach',
        acc: [
          lean(6),
          bands('#c9b892', [0.15, 0.35, 0.55, 0.75, 0.92], 0.04),
          x((d) => [...[0.25, 0.05, -0.2, -0.38].map((v): Spec => ['head', 'torus', [d.headW * 1.0, d.headD * 0.96, d.headH * 0.04], [0, d.headY + d.headH * v, 0], '#c9b892', { srot: [90, 0, 0], tube: 0.06, noInk: true }]), ['head', 'box', [d.headW * 0.5, d.headH * 0.1, d.headD * 0.04], [0, d.headY + d.headH * 0.05, d.headD * 0.47], '#3a3026', { noInk: true }]]),
          x((d) => [['foreR', 'box', [d.aw * 0.5, d.lower * 1.3, d.aw * 0.08], [0, -d.lower * 0.9, -d.aw * 0.3], '#d9cba8', { name: 'strip', piece: true, srot: [0, 0, 8] }]]),
          x2((d, _s, side) => [0.3, 0.7].map((v): Spec => [`leg${side}`, 'cyl', [d.lw * 1.1, d.legLen * 0.04, d.lw * 1.1], [0, -d.legLen * v * 0.5, 0], '#c9b892', { noInk: true }])),
          x2((d, _s, side) => [[`fore${side}`, 'cyl', [d.aw * 1.02, d.lower * 0.06, d.aw * 1.02], [0, -d.lower * 0.4, 0], '#c9b892', { noInk: true }]]),
        ],
      }),
      [
        [A.par(A.face('player'), A.anim('shake'), A.say('Mmmmrrrgh...', 2))],
        [A.detach('strip', 'strip'), ...talk('gasp', 'Oh no... I am unravelling!', 'reach'), A.wait(0.5), A.reattach('strip')],
      ],
    ),
  ),
  // A jazz musician in a bowler, waistcoat and bow tie, playing a brass trumpet.
  e('musician', 'town', 'music', () => {
    const rest: Arms = { armR: [-55, 0, -12], foreR: [-80, 0, 30], armL: [-55, 0, 12], foreL: [-80, 0, -30] };
    return act(
      who('musician', {
        h: 1.74, top: 'white', long: true, bottom: 'black', shoes: 'black', style: 'short', hair: '#2a1d16', skin: 'skin5',
        acc: [
          wear('vest', 'black'),
          wear('bowtie', '#c8323c'),
          hat('bowler', 'black'),
          arms(rest),
          x((d) => [
            ['head', 'cyl', [d.headW * 0.1, d.headW * 0.6, d.headW * 0.1], [0, d.headY - d.headH * 0.2, d.headD * 0.7], 'brass', { srot: [90, 0, 0] }],
            ['head', 'cyl', [d.headW * 0.16, d.headW * 0.9, d.headW * 0.16], [0, d.headY - d.headH * 0.28, d.headD * 1.15], 'brass', { srot: [90, 0, 0] }],
            ['head', 'cyl', [d.headW * 0.45, d.headW * 0.35, d.headW * 0.45], [0, d.headY - d.headH * 0.24, d.headD * 1.75], 'brass', { srot: [90, 0, 0], taper: 0.3 }],
            ...[-1, 0, 1].map((i): Spec => ['head', 'cyl', [d.headW * 0.06, d.headW * 0.18, d.headW * 0.06], [d.headW * i * 0.07, d.headY - d.headH * 0.12, d.headD * 1.05], 'silver']),
          ]),
        ],
      }),
      [
        [A.par(A.face('player'), A.say('♪ Toot-toot-ta-daaa! ♪', 2.2)), A.pose('head', { rot: [-15, 0, 0], dur: 0.4 }), A.pose('head', { rot: [5, 0, 0], dur: 0.4 }), A.pose('head', { rot: [0, 0, 0], dur: 0.3 })],
        talk('bow', "Thank you, you've been lovely!", rest),
      ],
    );
  }),
  // A musketeer in a blue tabard with a white cross, lace collar, plumed wide hat, boots and a rapier.
  e('musketeer (person)', 'town', 'history', () =>
    act(
      who('musketeer (person)', {
        h: 1.78, top: '#2f5aa8', long: true, bottom: '#5a3a22', shoes: '#5a3a22', hair: '#3b2a1e', style: 'long', beard: '#3b2a1e',
        acc: [
          x((d) => {
            const t = top(d), W = d.headW, H = d.headH, D = d.headD;
            return [['head', 'cyl', [W * 1.9, H * 0.05, D * 1.8], [0, t - H * 0.04, 0], '#3a2a40', { name: 'hat', piece: true, srot: [0, 0, -8] }], ['hat', 'ball', [W * 0.85, H * 0.45, D * 0.8], [0, H * 0.18, 0], '#3a2a40'], ['hat', 'capsule', [W * 0.22, H * 1.0, W * 0.1], [W * 0.35, H * 0.35, -D * 0.2], 'white', { srot: [-30, 0, -45] }]];
          }),
          x((d) => [['torso', 'box', [d.tw * 0.14, d.torsoH * 0.7, d.td * 0.06], [0, d.torsoH * 0.5, d.td * 0.53], 'white', { layer: 4 }], ['torso', 'box', [d.tw * 0.55, d.torsoH * 0.1, d.td * 0.06], [0, d.torsoH * 0.6, d.td * 0.53], 'white', { layer: 4 }], ['torso', 'torus', [d.tw * 0.8, d.tw * 0.8, d.td * 0.3], [0, d.torsoH * 0.98, 0], 'white', { srot: [90, 0, 0], tube: 0.4 }]]),
          face('mustache', '#3b2a1e'),
          wear('sash', '#5a3a22'),
          x2((d, _s, side) => [[`shin${side}`, 'cyl', [d.lw * 1.4, d.legLen * 0.12, d.lw * 1.4], [0, -d.legLen * 0.02, 0], '#5a3a22', { taper: 1.2 }]]),
          boots('#5a3a22'),
          grip('R', undefined, (a, d) => [['torus', [a * 1.1, a * 1.0, a * 0.15], [0, -a * 0.1, a * 0.5], 'silver', { tube: 0.12, srot: [0, 90, 0] }], ['box', [a * 0.2, d.H * 0.48, a * 0.08], [0, -a * 0.5 - d.H * 0.24, a * 0.6], 'silver', { edge: 'sharp', srot: [20, 0, 0] }]]),
        ],
      }),
      [
        [A.par(A.face('player'), A.pose('armR', { rot: [0, 0, -165], dur: 0.4 }), A.say('All for one, and one for all!', 2.4)), A.wait(1.2), A.pose('armR', { rot: [0, 0, 0], dur: 0.4 })],
        [A.pose('hat', { move: [0, 0.08, 0.05], rot: [-30, 0, 0], dur: 0.3 }), ...talk('bow', 'At your service, monsieur.'), A.pose('hat', { move: [0, 0, 0], rot: [0, 0, 0], dur: 0.3 })],
      ],
    ),
  ),
  // A mutant hero in yellow and blue with swept-up hair, mutton chops and three steel claws in each fist that
  // slide out.
  e('mutant', 'town', 'comics', () =>
    act(
      who('mutant', {
        h: 1.7, build: 1.35, top: '#f2c14e', long: true, bottom: '#f2c14e', shoes: '#2f4aa8', hair: 'black', style: 'spiky',
        acc: [
          x2((d, s) => [['torso', 'box', [d.tw * 0.25, d.torsoH * 0.9, d.td * 1.12], [s * d.tw * 0.4, d.torsoH * 0.5, 0], '#2f4aa8', { layer: 2, round: 0.4 }], ['head', 'cyl', [d.headW * 0.3, d.headH * 0.6, d.headW * 0.2], [s * d.headW * 0.4, top(d) + d.headH * 0.05, -d.headD * 0.05], 'black', { taper: 0, srot: [0, 0, -s * 20] }], ['head', 'ball', [d.headW * 0.2, d.headH * 0.35, d.headW * 0.2], [s * d.headW * 0.42, d.headY - d.headH * 0.12, d.headD * 0.2], 'black']]),
          wear('belt', '#c8323c'),
          boots('#2f4aa8'),
          gloves('#2f4aa8'),
          x2((d, _s, side) => [-1, 0, 1].map((i): Spec => [`hand${side}`, 'box', [d.aw * 0.12, d.H * 0.1, d.aw * 0.06], [i * d.aw * 0.3, d.H * 0.0, d.aw * 0.3], 'silver', { name: `claw${side}${i + 1}`, edge: 'sharp', mover: { kind: 'slide', axis: 'y', amount: -0.13 } }])),
        ],
      }),
      [
        [A.operate('claws', 'out'), ...talk('hands_on_hips', 'SNIKT! Back off, bub.'), A.operate('claws', 'in')],
        talk('point', "You're in my spot."),
      ],
    ),
  ),
  // A quiet man in a grey jumper who talks with his hands and a little whiteboard.
  e('mute', 'town', 'everyday people', () => {
    const rest: Arms = { armL: [-25, 0, 12], foreL: [-75, 0, -12] };
    return act(
      who('mute', {
        h: 1.74, top: '#7a7f85', long: true, bottom: 'denim', shoes: 'white', style: 'short', hair: '#a0522d',
        acc: [
          arms(rest),
          grip('L', rest, (a) => [['box', [a * 3.4, a * 2.4, a * 0.15], [-a * 0.6, a * 1.4, a * 0.4], 'white', { role: 'label', text: 'Hi there!', edge: 'sharp' }], ['box', [a * 3.6, a * 2.6, a * 0.1], [-a * 0.6, a * 1.4, a * 0.3], '#5c6166', { edge: 'sharp' }]]),
          grip('R', undefined, (a) => [['capsule', [a * 0.25, a * 1.2, a * 0.25], [0, a * 0.2, a * 0.6], 'black', { srot: [60, 0, 0] }]]),
        ],
      }),
      [talk('wave', '(writes: Hi there!)', rest), talk('nod', '(signs: thank you)')],
    );
  }),
  // Napoleon: short, in a navy coat with a red collar and gold epaulettes, white waistcoat and breeches, boots, a
  // bicorne worn side-on and his hand tucked into his waistcoat.
  e('napoleon bonaparte', 'town', 'history', () => {
    const rest: Arms = { armR: [-35, 0, -5], foreR: [-95, 0, 70] };
    return act(
      who('napoleon bonaparte', {
        h: 1.68, build: 1.1, skin: 'skin1', top: '#1f2a5a', long: true, bottom: 'white', shoes: 'black', hair: '#3b2a1e', style: 'short',
        acc: [
          // the bicorne side-on: a tall half-moon from the front, a thin lens from above, on a low crown, with a
          // blue-white-red cockade
          x((d) => {
            const W = d.headW, H = d.headH, t = top(d);
            return [
              ['head', 'ball', [W * 0.9, H * 0.36, d.headD * 0.86], [0, t - H * 0.04, 0], '#1d1d1d'],
              ['head', 'dome', [W * 2.15, H * 0.62, d.headD * 0.5], [0, t + H * 0.12, -d.headD * 0.04], '#1d1d1d'],
              ['head', 'cyl', [W * 0.2, W * 0.04, W * 0.2], [W * 0.38, t + H * 0.2, d.headD * 0.22], '#2f5aa8', { srot: [90, 0, 0], layer: 6 }],
              ['head', 'cyl', [W * 0.13, W * 0.05, W * 0.13], [W * 0.38, t + H * 0.2, d.headD * 0.235], 'white', { srot: [90, 0, 0], layer: 7 }],
              ['head', 'cyl', [W * 0.06, W * 0.06, W * 0.06], [W * 0.38, t + H * 0.2, d.headD * 0.25], '#c8323c', { srot: [90, 0, 0], layer: 8 }],
            ];
          }),
          wear('coat', '#1f2a5a'),
          x((d) => [['torso', 'box', [d.tw * 0.45, d.torsoH * 0.6, d.td * 0.1], [0, d.torsoH * 0.6, d.td * 0.56], 'white', { layer: 4 }], ['torso', 'box', [d.tw * 0.7, d.torsoH * 0.16, d.td * 0.08], [0, d.torsoH * 0.95, d.td * 0.4], '#c8323c', { layer: 5 }]]),
          shoulders('gold', 0.75),
          boots('black'),
          arms(rest),
          x((d) => [['hips', 'capsule', [d.lw * 0.3, d.legLen * 0.75, d.lw * 0.3], [-d.tw * 0.62, -d.legLen * 0.25, -d.td * 0.2], '#2a2726', { srot: [25, 0, 0] }], ['hips', 'box', [d.lw * 0.6, d.lw * 0.15, d.lw * 0.6], [-d.tw * 0.62, d.lw * 0.05, d.td * 0.1], 'gold']]),
        ],
      }),
      [talk('point', 'Onward, to victory!', rest), talk('nod', 'Impossible is not a French word.')],
    );
  }),
  // A Neanderthal in a fur pelt, heavy-browed and stooped, with a wooden club.
  e('neanderthal', 'town', 'history', () =>
    act(
      who('neanderthal', {
        h: 1.65, build: 1.4, skin: 'skin3', top: 'skin3', bottom: '#a8805a', skirt: '#8a6a4a', legs: 'skin3', shoes: 'skin3', hair: '#3b2a1e', style: 'long', beard: '#3b2a1e',
        acc: [
          lean(12),
          face('beard', '#3b2a1e'),
          x((d) => [['torso', 'box', [d.tw * 0.55, d.torsoH * 1.05, d.td * 1.15], [-d.tw * 0.1, d.torsoH * 0.45, 0], '#8a6a4a', { srot: [0, 0, -25], layer: 2, round: 0.4 }], ['head', 'box', [d.headW * 0.8, d.headH * 0.12, d.headD * 0.15], [0, d.headY + d.headH * 0.13, d.headD * 0.42], 'skin3', { round: 0.8 }], ...[[0.2, 0.3], [-0.25, 0.6], [0.0, 0.1]].map(([u, v]): Spec => ['torso', 'ball', [d.tw * 0.1, d.tw * 0.08, d.td * 0.05], [d.tw * u, d.torsoH * v, d.td * 0.6], '#5a3a22', { noInk: true, layer: 4 }])]),
          grip('R', undefined, (a, d) => [['cyl', [a * 0.6, d.H * 0.4, a * 0.6], [0, -d.H * 0.16, a * 0.8], '#7a4a2a', { taper: 1.8, srot: [20, 0, 0] }]]),
        ],
      }),
      [[A.spawn('fire', 'fire', near), ...talk('arms_up', 'Ooga! FIRE! Fire good!'), A.wait(1), A.remove('fire', 'fade')], talk('look_around', 'Hmm... rock. Good rock.')],
    ),
  ),
  // A ninja in black with a red headband, a katana across the back, crouched ready; vanishes in a puff of smoke.
  e('ninja', 'town', 'history', () => {
    const rest: Arms = { armR: [-45, 0, -25], foreR: [-50, 0, 25], armL: [-45, 0, 25], foreL: [-50, 0, -25] };
    return act(
      who('ninja', {
        h: 1.7, build: 1.05, top: '#1d1d1f', long: true, bottom: '#1d1d1f', shoes: '#1d1d1f', style: 'none',
        acc: [
          hat('hood', '#1d1d1f'),
          face('mask', '#1d1d1f'),
          hat('headband', '#c8323c'),
          x((d) => [['head', 'capsule', [d.headW * 0.1, d.headH * 0.5, d.headW * 0.06], [d.headW * 0.1, d.headY - d.headH * 0.0, -d.headD * 0.62], '#c8323c', { srot: [-40, 0, 20] }], ['head', 'capsule', [d.headW * 0.1, d.headH * 0.45, d.headW * 0.06], [-d.headW * 0.08, d.headY - d.headH * 0.05, -d.headD * 0.6], '#c8323c', { srot: [-50, 0, -15] }]]),
          wear('belt', '#c8323c'),
          x((d) => [rod('torso', [d.tw * 0.45, d.torsoH * 1.15, -d.td * 0.65], [-d.tw * 0.4, d.torsoH * 0.0, -d.td * 0.65], d.tw * 0.08, '#2a2726'), ['torso', 'capsule', [d.tw * 0.12, d.tw * 0.35, d.tw * 0.12], [d.tw * 0.5, d.torsoH * 1.2, -d.td * 0.65], '#c8323c', { srot: [0, 0, -42] }]]),
          arms(rest),
          joints({ legL: [-20, 0, 12], legR: [-20, 0, -12], shinL: [30, 0, 0], shinR: [30, 0, 0], footL: [-10, 0, 0], footR: [-10, 0, 0] }),
          lift(-0.03),
        ],
      }),
      [
        [A.par(A.face('player'), A.effect('smoke', { dur: 1.5 })), A.pose('hips', { scale: 0, dur: 0.15 }), A.wait(1.2), A.pose('hips', { scale: 1, dur: 0.15 }), A.say('...behind you.', 1.8)],
        [A.par(A.face('player'), A.anim('spin'), A.say('Hiyaa!', 1.5))],
      ],
    );
  }),
  // A nobleman in a purple velvet coat with gold trim, a lace cravat, a powdered wig tied back and a plumed hat,
  // a gold-topped cane in his hand.
  e('nobleman', 'town', 'royalty', () =>
    act(
      who('nobleman', {
        h: 1.76, top: '#6a2a8a', long: true, bottom: 'cream', legs: 'white', shoes: 'black', hair: 'white', style: 'ponytail',
        acc: [
          wear('coat', '#6a2a8a'),
          bands('gold', [0.2, 0.45], 0.03),
          x((d) => [['torso', 'torus', [d.tw * 0.85, d.tw * 0.85, d.td * 0.35], [0, d.torsoH * 1.0, 0], 'white', { srot: [90, 0, 0], tube: 0.5 }], ['torso', 'ball', [d.tw * 0.3, d.tw * 0.3, d.td * 0.3], [0, d.torsoH * 0.85, d.td * 0.52], 'white', { layer: 5 }], ['head', 'capsule', [d.headW * 0.15, d.headH * 0.7, d.headW * 0.06], [d.headW * 0.3, top(d) + d.headH * 0.25, -d.headD * 0.1], 'white', { srot: [-20, 0, -40] }]]),
          hat('beret', '#6a2a8a'),
          pole('R', undefined, 0.02, 0.76, 0.025, '#3a2a1a', (a) => [['ball', [0.055, 0.055, 0.055], [0, 0.03, a * 0.3], 'gold']]),
        ],
      }),
      [talk('bow', 'Good day to you, sir.'), talk('laugh', 'Ho ho! How perfectly delightful!')],
    ),
  ),
  // A noblewoman in a pink silk gown over a wide hooped skirt, a tiara, pearls and a lace fan.
  e('noblewoman', 'town', 'royalty', () => {
    const rest: Arms = { armL: [-30, 0, 15], foreL: [-80, 0, -25] };
    return act(
      who('noblewoman', {
        h: 1.66, skin: 'skin1', top: '#f4a1c0', long: true, bottom: '#f4a1c0', shoes: '#f4a1c0', hair: '#e8c56a', style: 'bun',
        acc: [
          x((d) => [
            ['hips', 'cyl', [d.tw * 2.5, d.legLen * 0.98, d.td * 3.0], [0, -d.legLen * 0.5, 0], '#f4a1c0', { taper: 0.4 }],
            ['hips', 'cyl', [d.tw * 2.52, d.legLen * 0.08, d.td * 3.02], [0, -d.legLen * 0.94, 0], 'white'],
            ['hips', 'cyl', [d.tw * 2.0, d.legLen * 0.06, d.td * 2.4], [0, -d.legLen * 0.55, 0], 'white', { noInk: true }],
            ['torso', 'box', [d.tw * 0.3, d.torsoH * 0.55, d.td * 0.08], [0, d.torsoH * 0.35, d.td * 0.52], 'white', { layer: 4, round: 0.4 }],
            ['torso', 'box', [d.tw * 1.05, d.torsoH * 0.12, d.td * 1.08], [0, d.torsoH * 0.95, 0], 'white', { layer: 3, round: 0.5 }],
          ]),
          hat('tiara', 'gold'),
          wear('necklace', 'white'),
          earrings('white'),
          gloves('white', 1.0),
          arms(rest),
          grip('L', rest, (a) => [['cyl', [a * 3.6, a * 0.1, a * 2.0], [-a * 0.6, a * 1.3, a * 0.6], 'white', { segs: 3, srot: [-90, 0, 0] }], ['capsule', [a * 0.15, a * 1.2, a * 0.15], [0, a * 0.3, a * 0.6], 'gold']]),
        ],
      }),
      [
        talk('bow', "Charmed, I'm sure.", rest),
        [A.par(A.face('player'), A.say('Oh my! How scandalous!', 2)), A.pose('foreL', { rot: [0, 0, 25], dur: 0.15 }), A.pose('foreL', { rot: [0, 0, -10], dur: 0.15 }), A.pose('foreL', { rot: [0, 0, 25], dur: 0.15 }), A.pose('foreL', { rot: [0, 0, 0], dur: 0.2 })],
      ],
    );
  }),
  // A desert nomad in flowing robes and a headscarf held by a black cord, a long staff and a pack.
  e('nomad', 'town', 'outdoors', () =>
    act(
      who('nomad', {
        h: 1.76, skin: 'skin4', top: '#d9c08a', long: true, bottom: '#d9c08a', shoes: '#8a5a35', hair: 'black', style: 'short', beard: 'black',
        acc: [
          x((d) => [['head', 'ball', [d.headW * 1.22, d.headH * 1.05, d.headD * 1.15], [0, d.headY + d.headH * 0.08, -d.headD * 0.08], 'white', { layer: -2 }], ['head', 'box', [d.headW * 1.25, d.headH * 0.8, d.headD * 0.4], [0, d.headY - d.headH * 0.35, -d.headD * 0.45], 'white', { layer: -3, round: 0.5 }], ['head', 'torus', [d.headW * 1.12, d.headD * 1.08, d.headH * 0.1], [0, top(d) - d.headH * 0.15, -d.headD * 0.04], '#1d1d1d', { srot: [80, 0, 0], tube: 0.2 }]]),
          face('beard', 'black'),
          wear('robe', '#d9c08a'),
          wear('sash', '#8a2a2a'),
          wear('backpack', '#8a5a35'),
          pole('R', undefined, 0.95, 0.85, 0.03, 'wood'),
        ],
      }),
      [
        [A.spawn('camel', 'camel', { rel: 'right', of: 'self', dist: 'close' }), ...talk('point', 'The oasis lies beyond those dunes.'), A.wait(1.5), A.remove('camel', 'fade')],
        talk('wave', 'Peace be upon you, traveller.'),
      ],
    ),
  ),
  // A novelist in a tweed coat and a long scarf, beard and glasses, his new book and a fountain pen.
  e('novelist', 'town', 'arts', () =>
    act(
      who('novelist', {
        h: 1.76, top: 'white', long: true, bottom: '#5a4a3a', shoes: 'brown', hair: 'gray', style: 'short', beard: 'gray', pose: 'hold',
        acc: [
          face('beard', 'gray'),
          face('glasses', 'black'),
          wear('coat', '#7a6a5a'),
          x((d) => [['torso', 'torus', [d.tw * 0.75, d.tw * 0.75, d.td * 0.3], [0, d.torsoH * 0.98, 0], '#8a2a2a', { srot: [90, 0, 0], tube: 0.35, layer: 4 }], ['torso', 'box', [d.tw * 0.15, d.torsoH * 0.9, d.td * 0.1], [d.tw * 0.18, d.torsoH * 0.5, d.td * 0.55], '#8a2a2a', { layer: 4 }]]),
          grip('R', 'hold', (a) => [['box', [a * 2.2, a * 0.5, a * 3.0], [-a * 1.0, a * 0.6, a * 0.3], '#1f3a6f', { srot: [-50, 0, 0], edge: 'sharp', round: 0.15 }], ['box', [a * 2.0, a * 0.52, a * 2.6], [-a * 0.9, a * 0.62, a * 0.35], 'cream', { srot: [-50, 0, 0], edge: 'sharp' }]]),
          grip('L', 'hold', (a) => [['capsule', [a * 0.2, a * 1.4, a * 0.2], [0, a * 0.5, a * 0.5], '#1d1d1d', { srot: [-30, 0, 20] }]]),
        ],
      }),
      [talk('look_around', 'Hmm... it was a dark and stormy night...', 'hold'), [A.spawn('book', 'book', near), ...talk('thumbs_up', 'My new novel! Want a signed copy?', 'hold'), A.remove('book', 'pop')]],
    ),
  ),
  // A nun in a black habit with a white coif and band, a veil, a silver cross; hands together.
  e('nun', 'town', 'religion', () => {
    const rest: Arms = { armR: [-40, 0, -4], foreR: [-80, 0, 50], armL: [-40, 0, 4], foreL: [-80, 0, -50] };
    return act(
      who('nun', {
        h: 1.64, top: '#1d1d1f', long: true, bottom: '#1d1d1f', shoes: 'black', style: 'none', skin: 'skin1',
        acc: [
          hat('hood', '#1d1d1f'),
          x((d) => [['head', 'torus', [d.headW * 1.0, d.headH * 1.0, d.headD * 0.18], [0, d.headY + d.headH * 0.02, d.headD * 0.35], 'white', { tube: 0.18 }], ['torso', 'ball', [d.tw * 0.75, d.torsoH * 0.3, d.td * 0.5], [0, d.torsoH * 0.9, d.td * 0.25], 'white']]),
          hat('veil', '#1d1d1f'),
          wear('robe', '#1d1d1f'),
          x((d) => [['torso', 'box', [d.tw * 0.06, d.tw * 0.24, d.td * 0.05], [0, d.torsoH * 0.55, d.td * 0.58], 'silver', { layer: 6 }], ['torso', 'box', [d.tw * 0.16, d.tw * 0.06, d.td * 0.05], [0, d.torsoH * 0.58, d.td * 0.58], 'silver', { layer: 6 }]]),
          arms(rest),
        ],
      }),
      [talk('nod', 'Bless you, child.'), [A.effect('sparkle', { dur: 2 }), ...talk('arms_up', '♪ Hallelujah! ♪', rest)]],
    );
  }),
  // A nurse in white with a capped red cross, a stethoscope round her neck and a clipboard.
  e('nurse', 'town', 'medical', () =>
    act(
      who('nurse', {
        h: 1.65, top: 'white', skirt: 'white', legs: 'white', shoes: 'white', hair: '#5a3a22', style: 'bun', pose: 'hold',
        acc: [
          hat('nurse'),
          wear('stethoscope'),
          wear('belt', 'white'),
          x((d) => [['torso', 'box', [d.tw * 0.14, d.tw * 0.14, d.td * 0.05], [d.tw * 0.25, d.torsoH * 0.75, d.td * 0.54], '#c8323c', { layer: 5 }], ['torso', 'box', [d.tw * 0.1, d.tw * 0.22, d.td * 0.05], [-d.tw * 0.25, d.torsoH * 0.72, d.td * 0.54], '#4f8fd6', { layer: 5 }]]),
          grip('R', 'hold', (a) => [['box', [a * 2.4, a * 0.2, a * 3.0], [-a * 0.8, a * 0.6, a * 0.3], 'wood', { srot: [-55, 0, 0], edge: 'sharp' }], ['box', [a * 2.1, a * 0.1, a * 2.6], [-a * 0.8, a * 0.75, a * 0.35], 'white', { srot: [-55, 0, 0], edge: 'sharp' }]]),
        ],
      }),
      [[A.spawn('band', 'bandage', near), ...talk('nod', 'There we go, all better.'), A.wait(1), A.remove('band', 'pop')], talk('point', 'The doctor will see you now.', 'hold')],
    ),
  ),
  // A nutritionist in a lab coat over lime green, glasses, a clipboard and a shiny red apple.
  e('nutritionist', 'town', 'medical', () => {
    const rest: Arms = { armL: [-25, 0, 12], foreL: [-80, 0, -15] };
    return act(
      who('nutritionist', {
        h: 1.65, top: '#7ad04a', long: true, bottom: '#c9b28a', shoes: 'white', style: 'ponytail', hair: '#2a1d16',
        acc: [
          wear('labcoat'),
          face('glasses', '#3fa7a0'),
          held('clipboard'),
          arms(rest),
          grip('L', rest, (a) => [['ball', [a * 1.9, a * 1.8, a * 1.9], [0, a * 1.0, a * 0.5], '#d23a2a'], ['capsule', [a * 0.15, a * 0.5, a * 0.15], [0, a * 2.0, a * 0.5], '#5a3a22'], ['ball', [a * 0.7, a * 0.3, a * 0.4], [a * 0.35, a * 2.05, a * 0.5], '#4a8a3a']]),
        ],
      }),
      [[A.spawn('apple', 'apple', near), ...talk('thumbs_up', 'An apple a day!', rest), A.remove('apple', 'pop')], talk('shake_head', 'Too much sugar, I am afraid.')],
    );
  }),
  // Odin the All-father: one eye under a patch, a long grey beard, a winged helmet, a grey cloak, the spear
  // Gungnir, and his two ravens on his shoulders (one flies off to gather news).
  e('odin', 'fantasy', 'gods', () =>
    act(
      who('odin', {
        h: 1.95, build: 1.3, top: '#4a4a50', long: true, bottom: '#3a3a3e', shoes: 'darkbrown', hair: 'lightgray', style: 'long', beard: 'lightgray',
        acc: [
          face('longbeard', 'lightgray'),
          face('eyepatch'),
          hat('helmet', 'silver'),
          x2((d, s) => [['head', 'ball', [d.headW * 0.5, d.headH * 0.3, d.headW * 0.12], [s * d.headW * 0.6, top(d) + d.headH * 0.12, 0], 'white', { srot: [0, 0, -s * 30] }]]),
          x2((d, s, side) => [
            ['torso', 'ball', [d.tw * 0.26, d.tw * 0.24, d.tw * 0.42], [s * d.tw * 0.45, d.torsoH * 1.1, -d.td * 0.05], '#1d1d1f', { name: `raven${side}`, piece: true }],
            [`raven${side}`, 'ball', [d.tw * 0.17, d.tw * 0.17, d.tw * 0.17], [0, d.tw * 0.14, d.tw * 0.16], '#1d1d1f'],
            [`raven${side}`, 'cyl', [d.tw * 0.06, d.tw * 0.12, d.tw * 0.06], [0, d.tw * 0.13, d.tw * 0.3], '#3a3a3a', { taper: 0, srot: [90, 0, 0] }],
            [`raven${side}`, 'box', [d.tw * 0.12, d.tw * 0.04, d.tw * 0.25], [0, -d.tw * 0.02, -d.tw * 0.28], '#1d1d1f', { srot: [-20, 0, 0] }],
          ]),
          x((d) => [['torso', 'box', [d.tw * 1.4, d.torsoH + d.legLen * 0.9, d.td * 0.12], [0, d.torsoH * 0.98, -d.td * 0.62], '#6a6e74', { off: [0, -(d.torsoH + d.legLen * 0.9) / 2, 0], layer: -3, round: 0.3 }]]),
          wear('belt', 'darkbrown'),
          pole('R', undefined, 1.25, 0.6, 0.04, 'darkwood', (a, _d, tip) => [['cyl', [0.08, 0.3, 0.025], [0, tip + 0.15, a * 0.3], 'gold', { taper: 0, segs: 4, edge: 'sharp' }]]),
        ],
      }),
      [
        [A.detach('ravenL', 'huginn'), A.move('huginn', { rel: 'far', of: 'self' }, { speed: 'fly', style: 'fly' }), ...talk('point', 'Fly, Huginn! Bring me news of the world!')],
        [A.reattach('ravenL'), ...talk('nod', 'Wisdom always has a price.')],
      ],
    ),
  ),
  // A Wagnerian soprano: horned helmet, long braids, a silver breastplate over a red gown, spear and shield.
  e('opera singer', 'town', 'music', () =>
    act(
      who('opera singer', {
        h: 1.75, build: 1.4, top: '#c8d0d8', long: true, bottom: '#8a1a2a', skirt: '#8a1a2a', shoes: 'brown', hair: '#e8c56a', style: 'pigtails',
        acc: [
          hat('viking'),
          wear('armor', '#c8d0d8'),
          wear('robe', '#8a1a2a'),
          x((d) => [['torso', 'box', [d.tw * 1.1, d.torsoH * 0.25, d.td * 1.15], [0, d.torsoH * 0.7, 0], '#c8d0d8', { layer: 2, round: 0.6 }]]),
          pole('R', undefined, 1.0, 0.6, 0.035, 'wood', (a, _d, tip) => [['cyl', [0.07, 0.24, 0.02], [0, tip + 0.12, a * 0.3], 'silver', { taper: 0, segs: 4, edge: 'sharp' }]]),
          grip('L', undefined, (a) => [['cyl', [0.6, 0.05, 0.6], [a * 0.6, -a * 0.6, a * 0.5], 'gold', { srot: [90, 0, 90], edge: 'sharp' }], ['cyl', [0.18, 0.08, 0.18], [a * 0.9, -a * 0.6, a * 0.5], '#8a1a2a', { srot: [90, 0, 90] }]]),
        ],
      }),
      [[A.effect('sparkle', { dur: 2 }), ...talk('arms_up', '♪ Ho-jo-to-ho! Ho-jo-to-HOOO! ♪')], talk('bow', 'Grazie! Grazie mille!')],
    ),
  ),
  // An optician in a white coat and teal tie, showing off a pair of frames.
  e('optician', 'town', 'medical', () => {
    const rest: Arms = { armL: [-30, 0, 12], foreL: [-85, 0, -15] };
    return act(
      who('optician', {
        h: 1.74, top: 'white', long: true, bottom: 'navy', shoes: 'black', style: 'short', hair: '#3b2a1e',
        acc: [
          face('glasses', 'black'),
          wear('labcoat'),
          wear('tie', '#3fa7a0'),
          arms(rest),
          grip('L', rest, (a) => [...[1, -1].map((s): Hold => ['torus', [a * 0.75, a * 0.6, a * 0.12], [-a * 0.3 + s * a * 0.42, a * 1.0, a * 0.6], '#1d1d1d', { tube: 0.2 }]), ['box', [a * 0.2, a * 0.08, a * 0.08], [-a * 0.3, a * 1.05, a * 0.6], '#1d1d1d'], ...[1, -1].map((s): Hold => ['ball', [a * 0.6, a * 0.45, a * 0.05], [-a * 0.3 + s * a * 0.42, a * 1.0, a * 0.6], 'glass', { noInk: true }]), ...[1, -1].map((s): Hold => ['box', [a * 0.06, a * 0.06, a * 1.3], [-a * 0.3 + s * a * 0.78, a * 1.05, a * 0.0], '#1d1d1d'])]),
        ],
      }),
      [[A.spawn('specs', 'eyeglasses', near), ...talk('thumbs_up', 'These frames suit you perfectly!', rest), A.remove('specs', 'pop')], talk('nod', 'Your lenses will be ready in an hour.')],
    );
  }),
  // An optometrist in a white coat with a pointer beside a real eye chart on its stand.
  e('optometrist', 'town', 'medical', () =>
    act(
      who('optometrist', {
        h: 1.66, top: '#9ac8f0', long: true, bottom: 'gray', shoes: 'black', style: 'bun', hair: '#7a3b1e',
        acc: [
          wear('labcoat'),
          face('glasses', 'navy'),
          grip('R', undefined, (a, d) => [seg([0, 0, a * 0.3], [0, -d.H * 0.15, d.H * 0.25], a * 0.1, '#1d1d1d')]),
          x(() => {
            const cx = -0.75, cz = 0.2;
            return [
              ['', 'box', [0.5, 0.75, 0.03], [cx, 1.4, cz], 'white', { edge: 'sharp' }],
              ['', 'box', [0.16, 0.16, 0.01], [cx, 1.66, cz + 0.02], 'white', { role: 'label', text: 'E', edge: 'sharp' }],
              ['', 'box', [0.3, 0.1, 0.01], [cx, 1.5, cz + 0.02], 'white', { role: 'label', text: 'F P', edge: 'sharp' }],
              ['', 'box', [0.36, 0.07, 0.01], [cx, 1.38, cz + 0.02], 'white', { role: 'label', text: 'T O Z', edge: 'sharp' }],
              ['', 'box', [0.4, 0.06, 0.01], [cx, 1.28, cz + 0.02], 'white', { role: 'label', text: 'L P E D', edge: 'sharp' }],
              ['', 'box', [0.42, 0.05, 0.01], [cx, 1.19, cz + 0.02], 'white', { role: 'label', text: 'P E C F D', edge: 'sharp' }],
              ['', 'cyl', [0.04, 1.05, 0.04], [cx, 0.52, cz - 0.03], 'silver', { edge: 'sharp' }],
              ['', 'cyl', [0.4, 0.03, 0.4], [cx, 0.015, cz - 0.03], '#3a3f4a', { edge: 'sharp' }],
            ];
          }),
        ],
      }),
      [talk('point', 'Read the bottom line, please.'), talk('nod', 'Better... number one, or number two?')],
    ),
  ),
  // A two-metre orc: green and tusked, a topknot, rough armour with spiked pauldrons, an axe.
  e('orc', 'fantasy', 'monsters', () =>
    act(
      who('orc', {
        h: 2.0, build: 1.5, skin: '#6a8a4a', top: '#5a4a3a', bottom: '#4a3a2a', shoes: 'black', hair: 'black', style: 'ponytail', eyes: '#d23a2a', blush: '#5a7a3a',
        acc: [
          pointyEars('#6a8a4a'),
          x2((d, s) => [['head', 'cyl', [d.headW * 0.12, d.headH * 0.22, d.headW * 0.12], [s * d.headW * 0.18, d.headY - d.headH * 0.26, d.headD * 0.47], 'cream', { taper: 0 }], ['torso', 'cyl', [d.tw * 0.2, d.tw * 0.3, d.tw * 0.2], [s * d.tw * 0.45, d.torsoH * 1.1, 0], 'silver', { taper: 0, edge: 'sharp' }]]),
          x((d) => [['head', 'box', [d.headW * 0.8, d.headH * 0.12, d.headD * 0.15], [0, d.headY + d.headH * 0.13, d.headD * 0.42], '#5a7a3a', { round: 0.8 }]]),
          wear('armor', '#4a4a4a'),
          wear('belt', 'darkbrown'),
          boots('black'),
          held('axe'),
        ],
      }),
      [talk('hands_on_hips', 'WAAAGH!'), talk('laugh', 'Puny human! Hur hur hur!')],
    ),
  ),
  // A Victorian orphan in patched clothes and a too-big cap, holding up an empty bowl.
  e('orphan', 'town', 'family', () =>
    act(
      who('orphan', {
        h: 'kid', top: '#8a7a5a', long: true, bottom: '#5a4a30', shoes: '#3a2a20', hair: '#5a3a22', style: 'short', pose: 'hold',
        acc: [
          x((d) => [['head', 'ball', [d.headW * 1.25, d.headH * 0.32, d.headD * 1.15], [d.headW * 0.05, top(d) + d.headH * 0.0, 0], '#6a6e74', { srot: [0, 0, -8] }], ['head', 'cyl', [d.headW * 0.85, d.headH * 0.04, d.headD * 0.5], [0, top(d) - d.headH * 0.1, d.headD * 0.45], '#6a6e74']]),
          x((d) => [['torso', 'box', [d.tw * 0.25, d.torsoH * 0.2, d.td * 0.06], [-d.tw * 0.2, d.torsoH * 0.35, d.td * 0.52], '#a0522d', { layer: 4 }], ['legR', 'box', [d.lw * 0.7, d.lw * 0.7, d.lw * 0.1], [0, -d.legLen * 0.25, d.lw * 0.5], '#8a8f3a', { layer: 4 }], ['head', 'ball', [d.headW * 0.12, d.headW * 0.08, d.headW * 0.05], [d.headW * 0.22, d.headY - d.headH * 0.15, d.headD * 0.47], '#8a7a6a', { noInk: true }]]),
          grip('R', 'hold', (a) => [['cyl', [a * 2.6, a * 1.0, a * 2.6], [-a * 0.9, a * 0.7, a * 0.4], '#c8c8c0', { taper: 1.5, edge: 'sharp' }], ['capsule', [a * 0.25, a * 2.0, a * 0.25], [-a * 0.4, a * 1.5, a * 0.4], 'silver', { srot: [0, 0, -20] }]]),
        ],
      }),
      [talk('nod', 'Please, sir... I want some more.'), [A.spawn('bread', 'bread', near), ...talk('arms_up', 'Bread! Oh, thank you!', 'hold'), A.remove('bread', 'pop')]],
    ),
  ),
  // A page boy in a navy waistcoat and bow tie, carrying the wedding rings on a white satin cushion.
  e('page boy', 'town', 'wedding', () =>
    act(
      who('page boy', {
        h: 1.3, head: 1.15, top: 'white', long: true, bottom: 'navy', shoes: 'black', hair: '#e8c56a', style: 'short', pose: 'hold',
        acc: [
          wear('vest', 'navy'),
          wear('bowtie', 'navy'),
          x((d) => [['torso', 'box', [d.tw * 0.75, d.tw * 0.18, d.tw * 0.55], [0, d.torsoH * 0.3, d.td * 1.15], 'white', { round: 0.8 }], ['torso', 'torus', [d.tw * 0.16, d.tw * 0.16, d.tw * 0.04], [-d.tw * 0.08, d.torsoH * 0.3 + d.tw * 0.13, d.td * 1.15], 'gold', { tube: 0.3 }], ['torso', 'torus', [d.tw * 0.14, d.tw * 0.14, d.tw * 0.04], [d.tw * 0.1, d.torsoH * 0.3 + d.tw * 0.12, d.td * 1.15], 'gold', { tube: 0.3 }]]),
        ],
      }),
      [talk('bow', 'The rings, sir.', 'hold'), talk('laugh', "I didn't drop them once!", 'hold')],
    ),
  ),
  // A palaeontologist with hat, vest and boots, a soft brush in one hand and a great fossil bone in the other.
  e('paleontologist', 'town', 'science', () => {
    const rest: Arms = { armL: [-28, 0, 14], foreL: [-75, 0, -15] };
    return act(
      who('paleontologist', {
        top: '#c9b07a', long: true, bottom: '#6a6a3a', shoes: 'darkbrown', hair: '#7a3b1e', style: 'ponytail',
        acc: [
          hat('cowboy', '#b8a070'),
          wear('vest', '#a8956a'),
          boots('darkbrown'),
          grip('R', undefined, (a) => [['capsule', [a * 0.3, a * 1.6, a * 0.3], [0, -a * 0.5, a * 0.5], 'wood', { srot: [30, 0, 0] }], ['box', [a * 0.7, a * 0.8, a * 0.3], [0, -a * 1.5, a * 1.0], '#c9a06a', { srot: [30, 0, 0] }]]),
          arms(rest),
          grip('L', rest, (a) => [['capsule', [a * 0.8, a * 3.6, a * 0.8], [-a * 0.6, a * 0.6, a * 0.5], '#e8dcc0', { srot: [0, 0, 70] }], ...[1, -1].flatMap((s): Hold[] => [['ball', [a * 1.0, a * 1.0, a * 0.9], [-a * 0.6 + s * a * 1.7, a * 0.6 + s * a * 0.6, a * 0.5], '#e8dcc0'], ['ball', [a * 1.0, a * 1.0, a * 0.9], [-a * 0.6 + s * a * 1.95, a * 0.6 + s * a * 0.05, a * 0.5], '#e8dcc0']])]),
        ],
      }),
      [
        [A.spawn('bone', 'bone', near), ...talk('arms_up', 'A T. rex bone!', rest), A.remove('bone', 'sink')],
        [A.par(A.face('player'), A.say('Gently... gently...', 2)), A.par(A.pose('foreR', { rot: [-40, 0, 15], dur: 0.25 }), A.effect('dust', { dur: 1.2 })), A.pose('foreR', { rot: [-40, 0, -15], dur: 0.25 }), A.pose('foreR', { rot: [-40, 0, 15], dur: 0.25 }), A.pose('foreR', { rot: [0, 0, 0], dur: 0.3 })],
      ],
    );
  }),
  // A paparazzo in a vest of pockets and a cap, a big camera with a long lens and a flash gun that fires.
  e('paparazzi', 'town', 'media', () => {
    const rest: Arms = { armR: [-60, 0, -10], foreR: [-60, 0, 20], armL: [-60, 0, 15], foreL: [-55, 0, -25] };
    return act(
      who('paparazzi', {
        h: 1.74, top: 'black', long: true, bottom: 'darkgray', shoes: 'black', style: 'short', hair: '#2a1d16', beard: '#2a1d16',
        acc: [
          hat('cap', '#3a3f4a'),
          face('beard', '#2a1d16'),
          wear('vest', '#5a5a3a'),
          x2((d, s) => [['torso', 'box', [d.tw * 0.22, d.torsoH * 0.16, d.td * 0.08], [s * d.tw * 0.24, d.torsoH * 0.35, d.td * 0.6], '#4a4a2a', { layer: 3 }]]),
          arms(rest),
          x((d) => [
            ['head', 'box', [d.headW * 0.7, d.headH * 0.4, d.headD * 0.35], [0, d.headY - d.headH * 0.05, d.headD * 0.75], '#1d1d1d', { edge: 'sharp', round: 0.2 }],
            ['head', 'cyl', [d.headW * 0.35, d.headD * 0.55, d.headW * 0.35], [0, d.headY - d.headH * 0.08, d.headD * 1.15], '#3a3f4a', { srot: [90, 0, 0], edge: 'sharp' }],
            ['head', 'box', [d.headW * 0.3, d.headH * 0.22, d.headD * 0.2], [d.headW * 0.15, d.headY + d.headH * 0.3, d.headD * 0.75], '#1d1d1d', { edge: 'sharp' }],
            ['head', 'box', [d.headW * 0.28, d.headH * 0.16, d.headD * 0.02], [d.headW * 0.15, d.headY + d.headH * 0.32, d.headD * 0.86], '#fff6c8', { name: 'flash', role: 'glow', noInk: true, mover: { kind: 'light' } }],
          ]),
        ],
      }),
      [
        [A.par(A.operate('flash', 'on'), A.effect('sparkle', { dur: 0.5 }), A.say('Flash! Over here!', 1.8)), A.operate('flash', 'off'), A.wait(0.3), A.operate('flash', 'on'), A.wait(0.2), A.operate('flash', 'off')],
        talk('point', 'Is that a celebrity?!', rest),
      ],
    );
  }),
  // A newsboy in a cap and waistcoat with a canvas bag of papers, waving the morning edition.
  e('paperboy', 'town', 'media', () => {
    const rest: Arms = { armR: [-20, 0, -120], foreR: [-10, 0, -20] };
    return act(
      who('paperboy', {
        h: 1.5, head: 1.08, top: 'white', long: true, bottom: '#7a5a3a', legs: 'gray', shoes: 'darkbrown', hair: '#7a3b1e', style: 'short',
        acc: [
          x((d) => [['head', 'ball', [d.headW * 1.2, d.headH * 0.32, d.headD * 1.1], [d.headW * 0.05, top(d) + d.headH * 0.0, 0], '#7a7f85', { srot: [0, 0, -6] }], ['head', 'cyl', [d.headW * 0.85, d.headH * 0.04, d.headD * 0.5], [0, top(d) - d.headH * 0.1, d.headD * 0.45], '#7a7f85']]),
          wear('vest', '#7a5a3a'),
          wear('sash', '#c9b28a'),
          x((d) => [['hips', 'box', [d.tw * 0.7, d.lw * 2.4, d.td * 0.7], [-d.tw * 0.6, -d.lw * 0.3, d.td * 0.2], '#c9b28a', { round: 0.3 }], ['hips', 'box', [d.tw * 0.55, d.lw * 0.6, d.td * 0.5], [-d.tw * 0.6, d.lw * 1.0, d.td * 0.2], 'paper', { edge: 'sharp' }]]),
          arms(rest),
          grip('R', rest, (a) => [['box', [a * 3.2, a * 2.4, a * 0.25], [0, a * 1.4, a * 0.4], 'paper', { role: 'label', text: 'EXTRA!', edge: 'sharp' }]]),
        ],
      }),
      [
        [A.par(A.face('player'), A.say('Extra! Extra! Read all about it!', 2.2)), A.pose('foreR', { rot: [0, 0, 25], dur: 0.2 }), A.pose('foreR', { rot: [0, 0, -15], dur: 0.2 }), A.pose('foreR', { rot: [0, 0, 25], dur: 0.2 }), A.pose('foreR', { rot: [0, 0, 0], dur: 0.2 })],
        [A.spawn('paper', 'newspaper', { rel: 'front', of: 'self', dist: 'near' }), ...talk('point', 'Catch! Your morning paper!', rest), A.wait(1), A.remove('paper', 'pop')],
      ],
    );
  }),
  // A paramedic in green with reflective bands, gloves and a stethoscope, a red trauma bag in hand.
  e('paramedic', 'town', 'medical', () =>
    act(
      who('paramedic', {
        h: 1.78, top: '#2f6a3a', long: true, bottom: '#2f6a3a', shoes: 'black', style: 'short', hair: '#3b2a1e',
        acc: [
          bands('#e8eef0', [0.3, 0.5], 0.06),
          legBands('#e8eef0'),
          wear('stethoscope'),
          x((d) => [['torso', 'box', [d.tw * 0.3, d.tw * 0.14, d.td * 0.05], [0, d.torsoH * 0.62, -d.td * 0.54], '#e8eef0', { role: 'label', text: 'PARAMEDIC', layer: -2 }]]),
          gloves('#6ab0e0'),
          boots('black'),
          grip('L', undefined, (a) => [['box', [a * 3.4, a * 2.4, a * 1.8], [0, -a * 2, a * 0.6], '#c8323c', { round: 0.3 }], ['box', [a * 1.4, a * 1.4, a * 0.05], [0, -a * 2, a * 1.55], 'white', { role: 'label', text: '+' }], ['arc', [a * 1.4, a * 0.8, a * 0.2], [0, -a * 0.6, a * 0.6], '#2a2726', { srot: [0, 90, 0] }]]),
        ],
      }),
      [talk('point', 'Make way! Paramedic coming through!'), [A.spawn('band', 'bandage', near), ...talk('nod', "Hold still, you'll be fine."), A.wait(1), A.remove('band', 'pop')]],
    ),
  ),
  // A paratrooper in camouflage and a helmet, harness straps, his chute packed on his back and a reserve on his
  // chest; on a click the canopy opens above him.
  e('paratrooper', 'town', 'military', () =>
    act(
      who('paratrooper', {
        h: 1.78, top: '#6a7a4a', long: true, bottom: '#6a7a4a', shoes: 'black', style: 'short', hair: '#3b2a1e',
        acc: [
          hat('military', '#4a5a30'),
          x((d) => [[0.2, 0.3, '#4a5a30'], [-0.25, 0.7, '#8a7a5a'], [0.1, 0.8, '#4a5a30'], [-0.15, 0.25, '#8a7a5a']].map(([u, v, c]): Spec => ['torso', 'ball', [d.tw * 0.25, d.torsoH * 0.18, d.td * 0.08], [d.tw * (u as number), d.torsoH * (v as number), d.td * 0.53], c as string, { noInk: true, layer: 4 }])),
          x((d) => [
            ['torso', 'box', [d.tw * 0.85, d.torsoH * 0.85, d.td * 0.7], [0, d.torsoH * 0.5, -d.td * 0.85], '#5a6a3a', { round: 0.4 }],
            ['torso', 'box', [d.tw * 0.55, d.torsoH * 0.3, d.td * 0.4], [0, d.torsoH * 0.3, d.td * 0.7], '#5a6a3a', { round: 0.4 }],
            ...[1, -1].map((s): Spec => ['torso', 'box', [d.tw * 0.08, d.torsoH * 1.05, d.td * 1.15], [s * d.tw * 0.22, d.torsoH * 0.5, 0], '#2a2726', { layer: 4 }]),
            ['torso', 'dome', [3.6, 1.3, 3.6], [0, d.torsoH + 2.4, 0], '#7a8a5a', { name: 'canopy', scale: 0 }],
            ...[[1, 1], [1, -1], [-1, 1], [-1, -1]].map(([u, v], i): Spec => rod('torso', [u * d.tw * 0.3, d.torsoH * 0.95, -d.td * 0.3], [u * 1.6, d.torsoH + 2.45, v * 1.0], 0.015, 'white', { name: `cord${i}`, scale: 0 })),
          ]),
          wear('belt', '#3a2a1a'),
          boots('black'),
        ],
      }),
      [
        [A.par(A.face('player'), A.anim('hop'), A.say('Geronimo!', 2), A.pose('canopy', { scale: 1, dur: 0.5 }), A.pose('cord0', { scale: 1, dur: 0.5 }), A.pose('cord1', { scale: 1, dur: 0.5 }), A.pose('cord2', { scale: 1, dur: 0.5 }), A.pose('cord3', { scale: 1, dur: 0.5 })), A.wait(2), A.par(A.pose('canopy', { scale: 0, dur: 0.6 }), A.pose('cord0', { scale: 0, dur: 0.6 }), A.pose('cord1', { scale: 0, dur: 0.6 }), A.pose('cord2', { scale: 0, dur: 0.6 }), A.pose('cord3', { scale: 0, dur: 0.6 }))],
        talk('point', 'The drop zone is that way!'),
      ],
    ),
  ),
  // A patient in a dotted hospital gown and slippers, a bandage round the head, wheeling an IV drip stand.
  e('patient', 'town', 'medical', () =>
    act(
      who('patient', {
        h: 1.7, top: '#a8d0e8', skirt: '#a8d0e8', legs: 'skin2', skin: 'skin2', shoes: 'white', hair: '#5a3a22', style: 'short',
        acc: [
          x((d) => [['head', 'torus', [d.headW * 1.04, d.headD * 1.0, d.headH * 0.14], [0, top(d) - d.headH * 0.2, 0], 'white', { srot: [90, 0, 0], tube: 0.25 }]]),
          x2((d, s) => [['torso', 'ball', [d.tw * 0.08, d.tw * 0.08, d.td * 0.05], [s * d.tw * 0.15, d.torsoH * 0.5, d.td * 0.52], 'navy', { noInk: true, layer: 4 }], ['torso', 'ball', [d.tw * 0.08, d.tw * 0.08, d.td * 0.05], [s * d.tw * 0.3, d.torsoH * 0.2, d.td * 0.52], 'navy', { noInk: true, layer: 4 }]]),
          x((d) => {
            const px = -d.tw * 1.3;
            return [
              ['', 'cyl', [0.03, 1.75, 0.03], [px, 0.95, 0.05], 'silver', { edge: 'sharp' }],
              ...[0, 72, 144, 216, 288].map((deg, i): Spec => ['', 'box', [0.28, 0.03, 0.03], [px + Math.cos((deg * Math.PI) / 180) * 0.14, 0.08, 0.05 + Math.sin((deg * Math.PI) / 180) * 0.14], 'silver', { srot: [0, -deg, 0], name: `leg${i}`, edge: 'sharp' }]),
              ...[0, 72, 144, 216, 288].map((deg, i): Spec => ['', 'ball', [0.05, 0.05, 0.05], [px + Math.cos((deg * Math.PI) / 180) * 0.27, 0.03, 0.05 + Math.sin((deg * Math.PI) / 180) * 0.27], '#2a2726', { name: `wheel${i}` }]),
              ['', 'capsule', [0.25, 0.02, 0.02], [px, 1.82, 0.05], 'silver', { srot: [0, 0, 90] }],
              ['', 'box', [0.12, 0.2, 0.04], [px + 0.08, 1.7, 0.05], 'glass', { round: 0.6 }],
              rod('', [px + 0.08, 1.6, 0.05], [-d.tw * 0.45, d.H * 0.55, 0.05], 0.008, '#c8e8f8'),
            ];
          }),
        ],
      }),
      [[A.par(A.face('player'), A.anim('shake'), A.say('*cough* *cough* Nurse?', 2))], talk('thumbs_up', 'Feeling better already!')],
    ),
  ),
  // A medieval peasant in a hooded tunic belted with rope, a wooden pitchfork and a basket of turnips.
  e('peasant', 'town', 'history', () =>
    act(
      who('peasant', {
        h: 1.68, top: '#a8905a', long: true, bottom: '#6a4a2a', shoes: 'darkbrown', hair: '#7a4a2a', style: 'short', beard: '#7a4a2a',
        acc: [
          hat('hood', '#8a6a3a'),
          x((d) => [['torso', 'ball', [d.tw * 0.9, d.torsoH * 0.3, d.td * 0.6], [0, d.torsoH * 0.95, -d.td * 0.1], '#8a6a3a']]),
          wear('belt', '#c9b28a'),
          x((d) => [['hips', 'cyl', [d.tw * 1.2, d.legLen * 0.35, d.td * 1.5], [0, -d.legLen * 0.1, 0], '#a8905a', { taper: 0.85 }]]),
          pole('R', undefined, 1.0, 0.6, 0.03, 'wood', (a, _d, tip) => [['box', [0.22, 0.03, 0.03], [0, tip, a * 0.3], 'wood', { edge: 'sharp' }], ...[-0.09, 0, 0.09].map((u): Hold => ['cyl', [0.02, 0.25, 0.02], [u, tip + 0.12, a * 0.3], 'wood', { taper: 0.3 }])]),
          grip('L', undefined, (a) => [['cyl', [a * 3.0, a * 2.0, a * 2.2], [0, -a * 2.0, a * 0.5], '#c9a06a', { taper: 1.2 }], ['arc', [a * 2.4, a * 1.8, a * 0.2], [0, -a * 1.1, a * 0.5], '#a8803a', { srot: [0, 90, 0] }], ...[[-0.6, 0.2], [0.5, -0.1], [0, 0.4]].map(([u, v]): Hold => ['ball', [a * 0.9, a * 0.8, a * 0.9], [u * a, -a * 0.9, a * (0.5 + v)], '#e8d8e8'])]),
        ],
      }),
      [talk('bow', 'Good morrow, my lord.'), [A.spawn('turnip', 'turnip', near), ...talk('thumbs_up', 'A fine harvest this year!'), A.remove('turnip', 'pop')]],
    ),
  ),
];
