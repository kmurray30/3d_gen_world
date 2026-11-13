/** Catalog chunk people-a: the words in assign/people-a.tsv. */
import { e, type CatalogEntry } from './types';
import { A, m, withAct } from '../dsl';
import { beast, body, face, hat, held, wear, who, type Extra, type WhoOpts } from '../accessories';
import type { PersonDims } from '../kit';
import type { FigPart, Figure, Shape, Vec3 } from '../types';
import type { Step } from '../../schema';
import { col } from '../colors';
import { apply, measure, solve, transpose } from '../math';
import { toEuler } from '../pose';

/* ----- local helpers: custom parts in a person's joint frames ----- */

let xn = 0;
type XO = Partial<Pick<FigPart, 'srot' | 'rot' | 'off' | 'taper' | 'segs' | 'tube' | 'round' | 'noInk' | 'layer' | 'apex' | 'text' | 'edge' | 'piece' | 'mover' | 'scale' | 'blend' | 'arc' | 'boxy' | 'cut' | 'profile'>> & { glow?: boolean; name?: string };
type XP = [parent: string, shape: Shape, size: Vec3, at: Vec3, color: string, o?: XO];
/** Extra parts: parent joint ('' = figure space), shape, size, joint position, colour; o.name names one so an act
 *  can move it (a hat that tips, a flame that goes out). */
const X = (f: (d: PersonDims) => XP[]): Extra => (p, d) => {
  for (const [parent, shape, size, at, color, o = {}] of f(d)) {
    const { glow, name, ...rest } = o;
    p.add({ name: name ?? `x${xn++}`, parent: parent || undefined, at, shape, size, color: col(color, color), layer: 3, ...rest, role: glow ? 'glow' : rest.text ? 'label' : undefined });
  }
};
/** Held kit things made of metal, wood or card: crisp edges in the cel model. */
const HARD = /^held_(sword|knife|briefcase|book|clipboard|phone|hammer|axe|pickaxe|wrench|club|bat|gavel|shield|spatula|pan|blaster|saw|chainsaw|scissors|syringe|camera|compass|map|letter|tray|skateboard|surfboard|trophy|gift|magnifier|racket|lantern)_/;
/** A person (names of custom parts restart for every build), with hand sockets so things can be put in their
 *  hands, and hard held things drawn crisp. */
const W = (key: string, o: WhoOpts): Figure => {
  xn = 0;
  const f = who(key, o);
  const parts = f.parts.map((p) => (HARD.test(p.name) && !p.edge ? { ...p, edge: 'sharp' as const } : p));
  const a = f.parts.find((p) => p.name === 'handR')?.size[0] ?? 0.08;
  return {
    ...f,
    parts,
    sockets: [...(f.sockets ?? []), { name: 'hand', kind: 'hand', at: [0, -a * 0.5, a * 0.4], part: 'handR', size: 0.35 }, { name: 'handL', kind: 'hand', at: [0, -a * 0.5, a * 0.4], part: 'handL', size: 0.35 }],
  };
};
type HP = [shape: Shape, size: Vec3, at: Vec3, color: string, o?: XO];
/** Something custom in a hand, positions in units of the arm width `a` from the wrist. */
const inHand = (side: 'L' | 'R', f: (a: number, d: PersonDims) => HP[]): Extra => X((d) => f(d.aw, d).map(([s, z, at, c, o]) => [`hand${side}`, s, z, at, c, o] as XP));
/** Something resting on an upturned palm when the forearm points forward (a 'hold' pose): positions as if
 *  in world axes from the wrist (x left, y up, z forward), in units of the arm width `a`. */
const onPalm = (side: 'L' | 'R', f: (a: number, d: PersonDims) => HP[]): Extra =>
  inHand(side, (a, d) => f(a, d).map(([s, z, at, c, o = {}]) => [s, z, [at[0], -at[2], at[1]], c, { ...o, srot: [(o.srot?.[0] ?? 0) + 90, o.srot?.[1] ?? 0, o.srot?.[2] ?? 0] }] as HP));
const hd = (d: PersonDims) => ({ W: d.headW, Hh: d.headH, D: d.headD, y: d.headY, top: d.headY + d.headH * 0.42 });
/** Change a built part (pose arms, lift the body). */
const tweak = (f: (list: FigPart[], d: PersonDims) => void): Extra => (p, d) => f(p.list, d);
const part = (list: FigPart[], n: string) => list.find((q) => q.name === n)!;
/** Arms out from the sides, degrees (0 hangs, 90 straight out, 170 overhead). */
const arms = (l: number, r = l): Extra => tweak((list) => {
  part(list, 'armL').rot = [0, 0, l];
  part(list, 'armR').rot = [0, 0, -r];
});
/** A rest pose joint by joint (degrees, as the joint's own turn): for poses who() has no name for, or one arm
 *  posed and the other hanging. */
const rest = (turns: Record<string, Vec3>): Extra => tweak((list) => {
  for (const [n, r] of Object.entries(turns)) part(list, n).rot = r;
});
/** Where the hips sit for a seated person (thighs level, feet on the floor). */
const sitHeight = (d: PersonDims) => (d.legLen + d.H * 0.045) / 2;
/** Sit down: thighs forward, shins down, hips at knee height (put a seat under them at sitHeight - lw / 2). */
const sit = (): Extra => tweak((list, d) => {
  part(list, 'hips').at[1] = sitHeight(d);
  part(list, 'legL').rot = [-88, 0, 4];
  part(list, 'legR').rot = [-88, 0, -4];
  part(list, 'shinL').rot = [88, 0, 0];
  part(list, 'shinR').rot = [88, 0, 0];
});
/** Stand the person on something dy metres high. */
const lift = (dy: number): Extra => tweak((list) => void (part(list, 'hips').at[1] += dy));

/** A socket on top of a named part (a counter, a cart, a stool seat): things set there sit on it. */
const topOf = (f: Figure, partName: string, name = 'top', kind: 'top' | 'seat' = 'top', size = 0.5): Figure => {
  const q = f.parts.find((r) => r.name === partName);
  if (!q) throw new Error(`${f.key}: no part ${partName}`);
  return { ...f, sockets: [...(f.sockets ?? []), { name, kind, at: [0, q.size[1] / 2, 0], part: partName, size }] };
};

/* ----- acts ----- */

/** A gesture and the line said with it, at the same time. */
const G = (gesture: string, line: string, dur = 2): Step => A.par(A.anim(gesture), A.say(line, dur));
const HANG: Record<string, Vec3> = { armL: [0, 0, 6], armR: [0, 0, -6], foreL: [0, 0, 0], foreR: [0, 0, 0] };
/** Gestures that move the arms: they play from hanging arms, so a person with a rest pose lowers them first. */
const ARM_GESTURES = new Set(['wave', 'point', 'clap', 'shrug', 'thumbs_up', 'arms_up', 'dance', 'laugh', 'cry', 'wink', 'gasp', 'cover_eyes', 'hands_on_hips', 'look_around', 'bow']);
const armsy = (s: Step): boolean => (s.op === 'anim' ? ARM_GESTURES.has((s as { name: string }).name) : s.op === 'par' ? (s as { do: Step[] }).do.some(armsy) : false);
/** Give a figure its clicks (each a list of steps; they alternate). A person posed at rest (holding a tray,
 *  arms folded) drops the pose for an arm gesture and takes it up again after. */
const act = (f: Figure, ...click: Step[][]): Figure => {
  if (f.rig !== 'biped') return withAct(f, { click });
  const delta: Array<[string, Vec3]> = [];
  for (const n of Object.keys(HANG)) {
    const r = f.parts.find((q) => q.name === n)?.rot ?? HANG[n];
    const dv = HANG[n].map((v, i) => v - r[i]) as Vec3;
    if (dv.some((v) => Math.abs(v) > 4)) delta.push([n, dv]);
  }
  if (!delta.length) return withAct(f, { click });
  const free = A.par(...delta.map(([n, r]) => A.pose(n, { rot: r, dur: 0.3 })));
  const back = A.par(...delta.map(([n]) => A.pose(n, { rot: [0, 0, 0], dur: 0.35 })));
  return withAct(f, { click: click.map((list) => list.flatMap((st) => (armsy(st) ? [free, st, back] : [st]))) });
};
/** Turn joints to a pose (degrees from rest, all at once), with a line; `extra` steps run alongside. */
const to = (turns: Record<string, Vec3>, line?: string, dur = 0.4, extra: Step[] = []): Step =>
  A.par(...Object.entries(turns).map(([p, r]) => A.pose(p, { rot: r, dur })), ...(line ? [A.say(line, 2.2)] : []), ...extra);
/** Hold a pose for a moment with a line, then go back to rest. */
const hold = (turns: Record<string, Vec3>, line?: string, secs = 1.6, extra: Step[] = []): Step[] => [
  to(turns, line, 0.4, extra),
  A.wait(secs),
  A.par(...Object.keys(turns).map((p) => A.pose(p, { rot: [0, 0, 0], dur: 0.45 }))),
];
// arm poses (turns from hanging, right arm; L() mirrors one for the left)
const L = (r: Vec3): Vec3 => [r[0], -r[1], -r[2]];
const SALUTE = { armR: [-12, 0, -72] as Vec3, foreR: [-30, 0, -118] as Vec3 };
const FIST = { armR: [-20, 0, -120] as Vec3, foreR: [-10, 0, -75] as Vec3 };
const OFFER = { armR: [-60, 0, 6] as Vec3, foreR: [-25, 0, 0] as Vec3 };
const SHAKE = { armR: [-55, 0, 8] as Vec3, foreR: [-20, 0, 0] as Vec3 };
const LIFT_L = { armL: [-70, 0, 0] as Vec3, foreL: [-40, 0, 0] as Vec3 };
const LIFT_R = { armR: [-70, 0, 0] as Vec3, foreR: [-40, 0, 0] as Vec3 };
const TO_MOUTH = { armR: [-30, 0, -20] as Vec3, foreR: [-120, 0, 15] as Vec3 };
/** Lift a hat (a part named 'hat') off the head with the right hand and put it back. */
const tipHat = (line: string): Step[] => [
  to({ armR: [-15, 0, -112], foreR: [-20, 0, -95] }, undefined, 0.4),
  A.par(A.pose('hat', { move: [0, 0.09, 0.02], rot: [-18, 0, 0], dur: 0.35 }), A.say(line, 2.2)),
  A.wait(1.3),
  A.par(A.pose('hat', { move: [0, 0, 0], rot: [0, 0, 0], dur: 0.35 }), A.pose('armR', { rot: [0, 0, 0], dur: 0.5 }), A.pose('foreR', { rot: [0, 0, 0], dur: 0.5 })),
];
/** A somersault: up, over and down again about the hips. */
const flip = (line: string, up = 1.0): Step[] => [
  A.par(A.pose('hips', { rot: [-180, 0, 0], move: [0, up, 0], dur: 0.45 }), A.say(line, 1.5)),
  A.pose('hips', { rot: [-360, 0, 0], move: [0, 0, 0], dur: 0.45 }),
  A.pose('hips', { rot: [0, 0, 0], dur: 0 }),
];
/** Something appears in front, is shown off, and goes again. */
const show = (word: string, line: string, gesture = 'point', how: 'pop' | 'fade' | 'sink' | 'fly_away' = 'pop'): Step[] => [
  A.spawn('it', word, { rel: 'front', of: 'self', dist: 'close' }),
  G(gesture, line),
  A.wait(1.6),
  A.remove('it', how),
];
// headwear
/** Headwear as one piece named 'hat' (its first part carries the rest), so an act can tip it or knock it off. */
const asHat = (list: XP[]): XP[] => {
  const [p0, ...more] = list;
  const a0 = p0[3];
  return [
    [p0[0], p0[1], p0[2], a0, p0[4], { ...p0[5], name: 'hat', piece: true }],
    ...more.map(([pa, s, z, at, c, o]) => (pa === 'head' ? ['hat', s, z, [at[0] - a0[0], at[1] - a0[1], at[2] - a0[2]], c, o] : [pa, s, z, at, c, o]) as XP),
  ];
};
/** The same for a kit hat (hat(...)): put it after the hat in acc. */
const nameHat = (): Extra => tweak((list) => {
  const hs = list.filter((q) => q.name.startsWith('hat_'));
  if (!hs.length) return;
  const a0 = hs[0].at;
  hs[0].name = 'hat';
  hs[0].piece = true;
  for (const q of hs.slice(1)) {
    q.parent = 'hat';
    q.at = [q.at[0] - a0[0], q.at[1] - a0[1], q.at[2] - a0[2]];
  }
});
const tophat = (c: string, band?: string, k = 1) => X((d) => {
  const { W: w, Hh, D, top } = hd(d);
  const r: XP[] = [['head', 'cyl', [w * 1.45, Hh * 0.05, D * 1.35], [0, top, 0], c], ['head', 'cyl', [w * 0.84, Hh * 0.85 * k, D * 0.8], [0, top + Hh * 0.43 * k, 0], c]];
  if (band) r.push(['head', 'cyl', [w * 0.86, Hh * 0.1, D * 0.82], [0, top + Hh * 0.08, 0], band]);
  return asHat(r);
});
const fedora = (c: string, band = 'black') => X((d) => {
  const { W: w, Hh, D, top } = hd(d);
  return asHat([['head', 'cyl', [w * 1.6, Hh * 0.04, D * 1.5], [0, top - Hh * 0.03, 0], c], ['head', 'cyl', [w * 0.86, Hh * 0.38, D * 0.8], [0, top + Hh * 0.14, 0], c, { taper: 0.8 }], ['head', 'cyl', [w * 0.88, Hh * 0.08, D * 0.82], [0, top + Hh * 0.01, 0], band], ['head', 'box', [w * 0.12, Hh * 0.1, D * 0.6], [0, top + Hh * 0.33, 0], c]]);
});
const bicorne = (c: string, trim = 'gold') => X((d) => {
  const { W: w, Hh, D, top } = hd(d);
  return asHat([['head', 'wedge', [w * 2.0, Hh * 0.55, D * 0.7], [0, top + Hh * 0.12, 0], c], ['head', 'ball', [w * 0.2, w * 0.2, w * 0.08], [0, top + Hh * 0.12, D * 0.36], trim], ['head', 'box', [w * 1.9, Hh * 0.05, D * 0.72], [0, top - Hh * 0.12, 0], trim, { round: 0.5 }]]);
});
const cap0 = (c: string) => X((d) => {
  const { W: w, Hh, D, top } = hd(d);
  return asHat([['head', 'ball', [w * 1.1, Hh * 0.56, D * 1.06], [0, top - Hh * 0.08, 0], c]]);
});
const bucket = (c: string) => X((d) => {
  const { W: w, Hh, D, top } = hd(d);
  return asHat([['head', 'cyl', [w * 0.98, Hh * 0.32, D * 0.94], [0, top + Hh * 0.04, 0], c, { taper: 0.9 }], ['head', 'cyl', [w * 1.55, Hh * 0.12, D * 1.5], [0, top - Hh * 0.1, 0], c, { taper: 0.65 }]]);
});
const pillbox = (c: string) => X((d) => {
  const { W: w, Hh, D, top } = hd(d);
  return asHat([['head', 'cyl', [w * 0.62, Hh * 0.22, D * 0.6], [0, top + Hh * 0.02, D * 0.05], c]]);
});
const crest = (c: string) => X((d) => {
  const { W: w, Hh, D, top } = hd(d);
  return [['head', 'ball', [w * 0.18, Hh * 0.5, D * 1.25], [0, top + Hh * 0.18, -D * 0.05], c]];
});
const feather = (c: string, x = 0.35) => X((d) => {
  const { W: w, Hh, top } = hd(d);
  return [['head', 'ball', [w * 0.12, Hh * 0.55, w * 0.2], [w * x, top + Hh * 0.2, -w * 0.1], c, { srot: [0, 0, -30] }]];
});
const greathelm = (c: string, slit = 'black') => X((d) => {
  const { W: w, Hh, D, y } = hd(d);
  return [['head', 'cyl', [w * 1.12, Hh * 1.12, D * 1.1], [0, y + Hh * 0.02, 0], c], ['head', 'box', [w * 0.75, Hh * 0.07, D * 0.1], [0, y + Hh * 0.08, D * 0.52], slit, { layer: 6 }]];
});
// face
const eyemask = (c: string) => X((d) => {
  const { W: w, Hh, D, y } = hd(d);
  const r: XP[] = [['head', 'ball', [w * 1.03, Hh * 0.26, D * 1.0], [0, y + Hh * 0.06, D * 0.02], c, { layer: 5 }]];
  for (const s of [1, -1]) r.push(['head', 'ball', [w * 0.18, Hh * 0.09, w * 0.06], [s * w * 0.19, y + Hh * 0.06, D * 0.5], 'white', { layer: 6, noInk: true }]);
  return r;
});
const cowl = (c: string, ears = true) => X((d) => {
  const { W: w, Hh, D, y, top } = hd(d);
  const r: XP[] = [['head', 'ball', [w * 1.1, Hh * 0.72, D * 1.07], [0, y + Hh * 0.2, -D * 0.02], c, { layer: 4 }], ['head', 'ball', [w * 1.05, Hh * 0.6, D * 0.9], [0, y - Hh * 0.05, -D * 0.12], c, { layer: -2 }]];
  for (const s of [1, -1]) {
    r.push(['head', 'ball', [w * 0.2, Hh * 0.08, w * 0.06], [s * w * 0.19, y + Hh * 0.04, D * 0.53], 'white', { layer: 6, noInk: true }]);
    if (ears) r.push(['head', 'cyl', [w * 0.24, Hh * 0.38, w * 0.12], [s * w * 0.3, top + Hh * 0.08, 0], c, { taper: 0, segs: 3, srot: [0, 0, -s * 8] }]);
  }
  return r;
});
const capBack = (c: string) => X((d) => {
  const { W: w, Hh, D, top } = hd(d);
  return asHat([['head', 'ball', [w * 1.08, Hh * 0.5, D * 1.04], [0, top - Hh * 0.08, 0], c], ['head', 'cyl', [w * 0.8, Hh * 0.04, D * 0.55], [0, top - Hh * 0.2, -D * 0.42], c]]);
});
const montera = (c = 'black') => X((d) => {
  const { W: w, Hh, D, top } = hd(d);
  return asHat([['head', 'ball', [w * 1.0, Hh * 0.35, D * 0.85], [0, top - Hh * 0.02, 0], c], ...[1, -1].map((s) => ['head', 'ball', [w * 0.45, Hh * 0.35, D * 0.5], [s * w * 0.48, top - Hh * 0.08, 0], c] as XP)]);
});
const pacifier = () => X((d) => {
  const { W: w, Hh, D, y } = hd(d);
  return [['head', 'cyl', [w * 0.32, w * 0.07, w * 0.26], [0, y - Hh * 0.2, D * 0.5], 'pink', { srot: [90, 0, 0], layer: 6 }], ['head', 'torus', [w * 0.2, w * 0.2, w * 0.05], [0, y - Hh * 0.22, D * 0.56], 'skyblue', { layer: 7 }]];
});
const glowEyes = (c: string) => X((d) => {
  const { W: w, Hh, D, y } = hd(d);
  return [1, -1].map((s) => ['head', 'ball', [w * 0.16, Hh * 0.08, w * 0.06], [s * w * 0.18, y + Hh * 0.04, D * 0.5], c, { glow: true }] as XP);
});
const binoculars = () => X((d) => [1, -1].map((s) => ['torso', 'cyl', [d.tw * 0.24, d.td * 0.75, d.tw * 0.24], [s * d.tw * 0.13, d.torsoH * 0.62, d.td * 0.8], 'black', { srot: [90, 0, 0], layer: 5 }] as XP));
const muscles = (c: string) => X((d) => [
  ...[1, -1].map((s) => [`arm${s > 0 ? 'L' : 'R'}`, 'ball', [d.aw * 1.6, d.upper * 0.6, d.aw * 1.5], [0, -d.upper * 0.45, d.aw * 0.1], c] as XP),
  ...[1, -1].map((s) => ['torso', 'ball', [d.tw * 0.5, d.torsoH * 0.28, d.td * 0.5], [s * d.tw * 0.22, d.torsoH * 0.72, d.td * 0.3], c] as XP),
]);
const tails = (c: string) => X((d) => [['torso', 'box', [d.tw * 0.9, d.legLen * 0.62, d.td * 0.15], [0, -d.legLen * 0.22, -d.td * 0.5], c, { layer: -2 }]]);
const gown = (c: string, k = 1) => X((d) => [['hips', 'cyl', [d.tw * 2.0 * k, d.legLen * 0.95, d.td * 2.6 * k], [0, -d.legLen * 0.47, 0], c, { taper: 0.45, layer: 2 }]]);
const sideHair = (c: string) => X((d) => {
  const { W: w, Hh, D, y } = hd(d);
  return [['head', 'capsule', [w * 1.1, Hh * 0.95, D * 0.62], [0, y - Hh * 0.05, -D * 0.22], c, { layer: -2 }]];
});
const wristbands = (c: string) => X((d) => [1, -1].map((s) => [`fore${s > 0 ? 'L' : 'R'}`, 'torus', [d.aw * 1.6, d.aw * 1.6, d.aw * 0.6], [0, -d.lower * 0.75, 0], c, { srot: [90, 0, 0], tube: 0.35 }] as XP));
const koopa = (shell: string, spikes = 'white') => X((d) => {
  const { tw, td, torsoH: t } = d;
  const r: XP[] = [['torso', 'ball', [tw * 1.55, t * 1.25, td * 1.7], [0, t * 0.5, -td * 0.55], shell, { layer: -3 }], ['torso', 'torus', [tw * 1.5, t * 1.2, td * 0.4], [0, t * 0.5, -td * 0.25], 'cream', { tube: 0.12, layer: -3 }]];
  for (const [x, y] of [[0.3, 0.8], [-0.3, 0.8], [0, 1.0], [0.42, 0.42], [-0.42, 0.42], [0, 0.55], [0, 0.15]]) r.push(['torso', 'cyl', [tw * 0.24, td * 0.8, tw * 0.24], [tw * x, t * y, -td * 1.35], spikes, { taper: 0, srot: [-90, 0, 0], layer: -4 }]);
  return r;
});
const muzzle = (c: string, k = 1) => X((d) => {
  const { W: w, Hh, D, y } = hd(d);
  return [['head', 'ball', [w * 0.85 * k, Hh * 0.42 * k, D * 0.55 * k], [0, y - Hh * 0.2, D * 0.4], c, { layer: 5 }], ...[1, -1].map((s) => ['head', 'ball', [w * 0.08, w * 0.08, w * 0.05], [s * w * 0.12, y - Hh * 0.08, D * (0.4 + 0.27 * k)], 'black', { layer: 6, noInk: true }] as XP)];
});
const horns2 = (c: string, k = 1) => X((d) => {
  const { W: w, Hh, D, top } = hd(d);
  return [1, -1].map((s) => ['head', 'cyl', [w * 0.22 * k, Hh * 0.5 * k, w * 0.22 * k], [s * w * 0.42, top + Hh * 0.05, D * 0.05], c, { taper: 0, srot: [0, 0, -s * 35] }] as XP);
});
/** Reach both arms forward (degrees from hanging). */
const reach = (deg: number, inward = 8): Extra => tweak((list) => {
  part(list, 'armL').rot = [-deg, 0, -inward];
  part(list, 'armR').rot = [-deg, 0, inward];
});
/** Scale a whole figure (a doll with child proportions at any size). */
function shrink(f: Figure, k: number): Figure {
  const sc = (v: Vec3): Vec3 => [v[0] * k, v[1] * k, v[2] * k];
  return measure({ ...f, parts: f.parts.map((p) => ({ ...p, at: sc(p.at), off: p.off ? sc(p.off) : undefined, size: sc(p.size) })) });
}
/** A rod in a plane of constant x, from (y1, z1) to (y2, z2). */
const rodYZ = (x: number, y1: number, z1: number, y2: number, z2: number, t: number, c: string): [Shape, Vec3, Vec3, string, XO] => {
  const len = Math.hypot(y2 - y1, z2 - z1);
  return ['capsule', [t, len + t, t], [x, (y1 + y2) / 2, (z1 + z2) / 2], c, { srot: [(Math.atan2(z2 - z1, y2 - y1) * 180) / Math.PI, 0, 0] }];
};
const openJacket = (c: string) => X((d) => [1, -1].map((s) => ['torso', 'box', [d.tw * 0.4, d.torsoH * 1.02, d.td * 1.1], [s * d.tw * 0.33, d.torsoH * 0.5, 0], c, { round: 0.4, layer: 2 }] as XP));
const crossShield = (bg = 'white', cross = 'red') => inHand('L', (a) => [['box', [a * 0.35, a * 5.2, a * 4.2], [a * 0.8, -a * 0.8, a * 0.5], bg, { round: 0.3 }], ['box', [a * 0.12, a * 4.2, a * 0.8], [a * 1.0, -a * 0.8, a * 0.5], cross], ['box', [a * 0.12, a * 0.8, a * 3.2], [a * 1.0, -a * 0.2, a * 0.5], cross]]);
const tabard = (c: string, cross?: string) => X((d) => {
  const { tw, td, torsoH: t, legLen: l } = d;
  const r: XP[] = [['torso', 'box', [tw * 0.9, t * 0.95 + l * 0.45, td * 1.12], [0, t * 0.5 - l * 0.22, 0], c, { round: 0.3, layer: 2 }]];
  if (cross) r.push(['torso', 'box', [tw * 0.16, t * 0.6, td * 0.08], [0, t * 0.55, td * 0.58], cross, { layer: 5 }], ['torso', 'box', [tw * 0.55, t * 0.14, td * 0.08], [0, t * 0.65, td * 0.58], cross, { layer: 5 }]);
  return r;
});
const ushanka = (c: string, star?: string) => X((d) => {
  const { W: w, Hh, D, y, top } = hd(d);
  const r: XP[] = [['head', 'ball', [w * 1.2, Hh * 0.6, D * 1.15], [0, top - Hh * 0.04, 0], c], ...[1, -1].map((s) => ['head', 'ball', [w * 0.3, Hh * 0.5, D * 0.6], [s * w * 0.55, y, -D * 0.05], c] as XP)];
  if (star) r.push(['head', 'ball', [w * 0.18, w * 0.18, w * 0.06], [0, top - Hh * 0.02, D * 0.58], star, { layer: 6 }]);
  return asHat(r);
});
const deerstalker = (c: string) => X((d) => {
  const { W: w, Hh, D, top } = hd(d);
  return asHat([['head', 'ball', [w * 1.1, Hh * 0.58, D * 1.06], [0, top - Hh * 0.08, 0], c], ['head', 'cyl', [w * 0.7, Hh * 0.04, D * 0.4], [0, top - Hh * 0.22, D * 0.5], c], ['head', 'cyl', [w * 0.7, Hh * 0.04, D * 0.4], [0, top - Hh * 0.22, -D * 0.5], c], ['head', 'ball', [w * 0.1, w * 0.1, w * 0.1], [0, top + Hh * 0.2, 0], c]]);
});
const headMirror = () => X((d) => {
  const { W: w, Hh, D, y } = hd(d);
  return [['head', 'torus', [w * 1.06, D * 1.02, Hh * 0.08], [0, y + Hh * 0.28, 0], 'darkgray', { srot: [90, 0, 0], tube: 0.1 }], ['head', 'cyl', [w * 0.32, w * 0.05, w * 0.32], [w * 0.1, y + Hh * 0.32, D * 0.55], 'silver', { srot: [80, 0, 0], layer: 6 }]];
});
const pipe = () => X((d) => {
  const { W: w, Hh, D, y } = hd(d);
  return [['head', 'capsule', [w * 0.06, w * 0.35, w * 0.06], [w * 0.12, y - Hh * 0.22, D * 0.62], 'darkbrown', { srot: [80, 0, 0], layer: 6 }], ['head', 'cyl', [w * 0.13, w * 0.16, w * 0.13], [w * 0.12, y - Hh * 0.18, D * 0.8], 'darkbrown', { layer: 6 }]];
});
const pointyCap = (c: string, k = 1) => X((d) => {
  const { W: w, Hh, D, top } = hd(d);
  return asHat([['head', 'cyl', [w * 1.0, Hh * 1.2 * k, D * 0.95], [0, top + Hh * 0.45 * k, -D * 0.05], c, { taper: 0, srot: [-8, 0, 0] }]]);
});
const divingHelmet = () => X((d) => {
  const { W: w, Hh, D, y } = hd(d);
  return [['head', 'ball', [w * 1.5, Hh * 1.4, D * 1.5], [0, y, 0], 'brass'], ['head', 'cyl', [w * 0.62, w * 0.12, w * 0.62], [0, y, D * 0.72], 'glass', { srot: [90, 0, 0], layer: 6 }], ['head', 'torus', [w * 0.7, w * 0.7, w * 0.12], [0, y, D * 0.76], 'brass', { tube: 0.2, layer: 7 }], ...[1, -1].map((s) => ['head', 'cyl', [w * 0.32, w * 0.1, w * 0.32], [s * w * 0.72, y, 0], 'glass', { srot: [0, 0, 90], layer: 6 }] as XP), ['torso', 'cyl', [d.tw * 1.25, d.torsoH * 0.18, d.td * 1.5], [0, d.torsoH * 0.95, 0], 'brass']];
});
const cuffs = () => X((d) => [1, -1].map((s) => [`fore${s > 0 ? 'L' : 'R'}`, 'torus', [d.aw * 1.5, d.aw * 1.5, d.aw * 0.4], [0, -d.lower * 0.8, 0], 'silver', { srot: [90, 0, 0], tube: 0.3 }] as XP));
const trayCups = (side: 'L' | 'R' = 'L') => inHand(side, (a) => [['cyl', [a * 4.5, a * 0.25, a * 4.5], [0, a * 0.5, a * 1.6], 'silver'], ...[-1, 1].flatMap((x) => [['cyl', [a * 0.9, a * 1.0, a * 0.9], [x * a * 1.1, a * 1.6, a * 1.6], 'glass', { taper: 1.3 }], ['capsule', [a * 0.15, a * 0.8, a * 0.15], [x * a * 1.1, a * 0.9, a * 1.6], 'glass']] as HP[])]);
const elfEars = (c: string) => X((d) => [1, -1].map((s) => ['head', 'cyl', [d.headW * 0.14, d.headH * 0.3, d.headW * 0.1], [s * d.headW * 0.55, d.headY + d.headH * 0.05, -d.headD * 0.02], c, { taper: 0, srot: [0, 0, -s * 55] }] as XP));
const raven = () => X((d) => {
  const { tw, torsoH: t } = d;
  const x = tw * 0.7, y = t * 1.0 + tw * 0.22;
  return [['torso', 'ball', [tw * 0.4, tw * 0.45, tw * 0.7], [x, y, 0], '#1d1d1d', { name: 'raven' }], ['raven', 'ball', [tw * 0.28, tw * 0.28, tw * 0.28], [0, tw * 0.34, tw * 0.2], '#1d1d1d'], ['raven', 'cyl', [tw * 0.1, tw * 0.22, tw * 0.1], [0, tw * 0.31, tw * 0.42], 'darkgray', { taper: 0, srot: [90, 0, 0] }], ['raven', 'box', [tw * 0.2, tw * 0.07, tw * 0.42], [0, -tw * 0.08, -tw * 0.45], '#1d1d1d', { srot: [20, 0, 0] }], ...[1, -1].map((s) => ['raven', 'ball', [tw * 0.05, tw * 0.05, tw * 0.03], [s * tw * 0.1, tw * 0.38, tw * 0.32], 'gold', { noInk: true }] as XP)];
});
const gasMask = (c = '#3a3a3a') => X((d) => {
  const { W: w, Hh, D, y } = hd(d);
  return [['head', 'ball', [w * 0.85, Hh * 0.75, D * 0.4], [0, y - Hh * 0.02, D * 0.33], c, { layer: 5 }], ...[1, -1].map((s) => ['head', 'ball', [w * 0.22, w * 0.18, w * 0.06], [s * w * 0.18, y + Hh * 0.08, D * 0.55], 'glass', { layer: 6 }] as XP), ...[1, -1].map((s) => ['head', 'cyl', [w * 0.24, w * 0.18, w * 0.24], [s * w * 0.28, y - Hh * 0.25, D * 0.5], 'darkgray', { srot: [90, 0, -s * 30], layer: 6 }] as XP)];
});
const fencingMask = () => X((d) => {
  const { W: w, Hh, D, y } = hd(d);
  return [['head', 'ball', [w * 1.0, Hh * 0.9, D * 0.55], [0, y - Hh * 0.02, D * 0.3], '#3a3a3a', { layer: 5 }], ['head', 'box', [w * 0.7, Hh * 0.3, D * 0.2], [0, y - Hh * 0.5, D * 0.3], 'white', { layer: 4 }]];
});
const fireHelmet = (c = 'red') => X((d) => {
  const { W: w, Hh, D, top } = hd(d);
  return asHat([['head', 'ball', [w * 1.15, Hh * 0.7, D * 1.12], [0, top - Hh * 0.05, 0], c], ['head', 'ball', [w * 1.4, Hh * 0.1, D * 1.7], [0, top - Hh * 0.22, -D * 0.15], c], ['head', 'box', [w * 0.35, Hh * 0.35, w * 0.05], [0, top + Hh * 0.05, D * 0.58], 'gold', { round: 0.4, layer: 6 }]]);
});
const flowerCrown = (c = 'pink') => X((d) => {
  const { W: w, Hh, D, top } = hd(d);
  const r: XP[] = [['head', 'torus', [w * 1.06, D * 1.02, Hh * 0.08], [0, top - Hh * 0.15, 0], 'leaf', { srot: [90, 0, 0], tube: 0.2 }]];
  for (let i = 0; i < 6; i++) {
    const t = (i / 6) * Math.PI * 2;
    r.push(['head', 'ball', [w * 0.16, w * 0.16, w * 0.16], [Math.sin(t) * w * 0.53, top - Hh * 0.12, Math.cos(t) * D * 0.51], i % 2 ? 'white' : c]);
  }
  return r;
});
/** A big mop of hair behind the face (yarn hair, wild hair). */
const mop = (c: string, k = 1) => X((d) => {
  const { W: w, Hh, D, y } = hd(d);
  return [['head', 'ball', [w * 1.5 * k, Hh * 1.2 * k, D * 1.0], [0, y + Hh * 0.1, -D * 0.28], c, { layer: -2 }]];
});
const bigEye = (c = 'white', iris = 'navy') => X((d) => {
  const { W: w, Hh, D, y } = hd(d);
  return [['head', 'ball', [w * 0.42, Hh * 0.34, w * 0.2], [0, y + Hh * 0.08, D * 0.42], c, { layer: 5 }], ['head', 'ball', [w * 0.18, w * 0.18, w * 0.08], [0, y + Hh * 0.08, D * 0.52], iris, { layer: 6, noInk: true }]];
});
const nose = (c: string, sz = 0.2) => X((d) => {
  const { W: w, Hh, D, y } = hd(d);
  return [['head', 'ball', [w * sz, w * sz, w * sz], [0, y - Hh * 0.05, D * 0.5], c, { layer: 6 }]];
});
// clothes
const suitX = (c: string, tie: string | null = 'red', bow = false, shirt = 'white') => X((d) => {
  const { tw, td, torsoH: t } = d;
  const r: XP[] = [['torso', 'box', [tw * 1.06, t * 1.02, td * 1.08], [0, t * 0.5, 0], c, { round: 0.5, layer: 1 }], ['torso', 'box', [tw * 0.26, t * 0.5, td * 0.1], [0, t * 0.72, td * 0.52], shirt]];
  if (tie && !bow) r.push(['torso', 'box', [tw * 0.09, t * 0.42, td * 0.08], [0, t * 0.68, td * 0.58], tie, { layer: 4 }]);
  if (tie && bow) for (const s of [1, -1]) r.push(['torso', 'ball', [tw * 0.18, tw * 0.12, td * 0.1], [s * tw * 0.08, t * 0.92, td * 0.55], tie, { layer: 4 }]);
  return r;
});
/** A text card on the chest (ink picks itself). */
const chest = (text: string, bg: string, w = 0.5, h = 0.28, y = 0.66) => X((d) => [['torso', 'box', [d.tw * w, d.torsoH * h, d.td * 0.08], [0, d.torsoH * y, d.td * 0.54], bg, { text, round: 0.2, layer: 5 }]]);
const patch = (c: string, w = 0.3, h = 0.22, y = 0.66, x = 0) => X((d) => [['torso', 'ball', [d.tw * w, d.torsoH * h, d.td * 0.1], [d.tw * x, d.torsoH * y, d.td * 0.52], c, { layer: 5 }]]);
const bands = (c: string, ys = [0.3, 0.62], on = 'torso') => X((d) => ys.map((y) => [on, 'torus', [d.tw * 1.08, d.td * 1.16, d.torsoH * 0.07], [0, d.torsoH * y, 0], c, { srot: [90, 0, 0], tube: 0.12, layer: 4 }] as XP));
/** Rings round a limb (striped stockings, cuff stripes): on 'foreL', 'armR', 'shinL'..., at fractions down it. */
const rings = (c: string, on: string, ys: number[], k = 1.15) => X((d) => {
  const arm = on.startsWith('fore') || on.startsWith('arm');
  const w = (arm ? d.aw : d.lw) * k;
  const len = on.startsWith('fore') ? d.lower : on.startsWith('arm') ? d.upper : d.legLen / 2;
  return ys.map((y) => [on, 'torus', [w, w, len * 0.09], [0, -len * y, 0], c, { srot: [90, 0, 0], tube: 0.32, layer: 4 }] as XP);
});
const epaul = (c = 'gold') => X((d) => [1, -1].map((s) => ['torso', 'ball', [d.aw * 1.7, d.aw * 0.55, d.td * 0.75], [s * d.tw * 0.5, d.torsoH * 0.98, 0], c, { layer: 4 }] as XP));
const buttons = (c = 'gold', n = 3, x = 0) => X((d) => Array.from({ length: n }, (_, i) => ['torso', 'ball', [d.tw * 0.07, d.tw * 0.07, d.td * 0.08], [d.tw * x, d.torsoH * (0.25 + (i * 0.5) / Math.max(1, n - 1)), d.td * 0.56], c, { layer: 5 }] as XP));
const ruff = (c = 'white') => X((d) => [['torso', 'torus', [d.tw * 0.95, d.td * 1.6, d.torsoH * 0.12], [0, d.torsoH * 0.98, 0], c, { srot: [90, 0, 0], tube: 0.45, layer: 4 }]]);
const collar = (c: string) => X((d) => [['torso', 'torus', [d.tw * 0.7, d.td * 1.0, d.torsoH * 0.07], [0, d.torsoH * 0.97, 0], c, { srot: [90, 0, 0], tube: 0.3, layer: 4 }]]);
const gloves = (c: string, k = 1) => X((d) => [1, -1].map((s) => [`hand${s > 0 ? 'L' : 'R'}`, 'ball', [d.aw * 1.4 * k, d.aw * 1.45 * k, d.aw * 1.15 * k], [0, -d.aw * 0.25, 0], c, { layer: 2 }] as XP));
const boots = (c: string, k = 1) => X((d) => [1, -1].map((s) => [`foot${s > 0 ? 'L' : 'R'}`, 'box', [d.lw * 1.25 * k, d.H * 0.06, d.lw * 1.9 * k], [0, -d.H * 0.016, d.lw * 0.32 * k], c, { round: 0.7, layer: 2 }] as XP));
const quiver = (c = 'brown') => X((d) => {
  const { tw, td, torsoH: t } = d;
  const r: XP[] = [['torso', 'cyl', [tw * 0.3, t * 0.8, tw * 0.3], [tw * 0.15, t * 0.6, -td * 0.75], c, { srot: [0, 0, 20], layer: -3 }]];
  for (const x of [0, 0.1]) r.push(['torso', 'cyl', [tw * 0.12, t * 0.18, tw * 0.04], [tw * (0.32 + x), t * 1.1, -td * 0.75], 'white', { srot: [0, 0, 20], taper: 0, layer: -3 }]);
  return r;
});
// held things
const candle = (side: 'L' | 'R' = 'R') => inHand(side, (a) => [['cyl', [a * 0.7, a * 2.4, a * 0.7], [0, a * 0.5, a * 0.6], 'cream'], ['ball', [a * 0.45, a * 0.8, a * 0.45], [0, a * 2.1, a * 0.6], 'flame', { glow: true }]]);
const flask = (liquid: string, side: 'L' | 'R' = 'R') => inHand(side, (a) => [['cyl', [a * 1.7, a * 1.5, a * 1.7], [0, -a * 0.3, a * 1.1], 'glass', { taper: 0.3 }], ['cyl', [a * 1.4, a * 0.7, a * 1.4], [0, -a * 0.6, a * 1.1], liquid, { taper: 0.6, glow: true }], ['cyl', [a * 0.5, a * 0.9, a * 0.5], [0, a * 0.8, a * 1.1], 'glass']]);
const tube = (liquid: string, side: 'L' | 'R' = 'R') => inHand(side, (a) => [['capsule', [a * 0.6, a * 2.6, a * 0.6], [0, a * 0.4, a * 0.9], 'glass'], ['capsule', [a * 0.5, a * 1.2, a * 0.5], [0, -a * 0.2, a * 0.9], liquid, { glow: true }]]);
const fishH = (c = 'orange', side: 'L' | 'R' = 'L') => inHand(side, (a) => [['ball', [a * 0.9, a * 1.2, a * 2.8], [0, -a * 1.2, a * 1.0], c, { srot: [80, 0, 0] }], ['wedge', [a * 1.2, a * 1.0, a * 0.3], [0, -a * 2.9, a * 1.3], c, { srot: [180, 90, 0] }]]);
const potplant = (side: 'L' | 'R' = 'L', bloom = 'pink') => inHand(side, (a) => [['cyl', [a * 2, a * 1.8, a * 2], [0, -a * 1.0, a * 1.2], '#c8693a', { taper: 1.3 }], ['ball', [a * 2.6, a * 2.2, a * 2.6], [0, a * 0.9, a * 1.2], 'leaf'], ['ball', [a * 0.8, a * 0.8, a * 0.8], [a * 0.6, a * 1.9, a * 1.6], bloom]]);
const cleaver = (side: 'L' | 'R' = 'R') => inHand(side, (a) => [['box', [a * 0.25, a * 2.2, a * 2.6], [0, -a * 1.6, a * 1.6], 'silver', { round: 0.1 }], ['capsule', [a * 0.4, a * 1.4, a * 0.4], [0, -a * 0.2, a * 0.5], 'darkwood']]);
const sack = (c: string, text?: string, side: 'L' | 'R' = 'L') => inHand(side, (a) => {
  const r: HP[] = [['ball', [a * 3, a * 3.2, a * 2.6], [0, -a * 2.4, a * 0.6], c], ['cyl', [a * 1.0, a * 0.8, a * 1.0], [0, -a * 0.6, a * 0.6], c, { taper: 1.4 }]];
  if (text) r.push(['box', [a * 1.4, a * 1.2, a * 0.1], [0, -a * 2.4, a * 1.95], c, { text, layer: 6 }]);
  return r;
});
const card = (text: string, bg: string, side: 'L' | 'R' = 'L', w = 4, h = 3) => inHand(side, (a) => [['box', [a * w, a * h, a * 0.2], [0, a * 0.2, a * 1.3], bg, { text, round: 0.15, srot: [-10, 0, 0] }]]);
const poleSign = (text: string, bg: string, side: 'L' | 'R' = 'R', octagon = false) => inHand(side, (a, d) => {
  const r: HP[] = [['capsule', [a * 0.3, d.H * 0.75, a * 0.3], [0, d.H * 0.18, a * 0.4], 'silver']];
  if (octagon) r.push(['cyl', [a * 5, a * 0.3, a * 5], [0, d.H * 0.58, a * 0.6], bg, { segs: 8, srot: [90, 22.5, 0] }]);
  r.push(['box', [a * (octagon ? 3.6 : 5), a * (octagon ? 1.6 : 3.5), a * 0.2], [0, d.H * 0.58, a * 0.85], octagon ? bg : bg, { text, round: 0.1, layer: 6 }]);
  return r;
});
const pompoms = (c: string) => X((d) => [1, -1].map((s) => [`hand${s > 0 ? 'L' : 'R'}`, 'ball', [d.aw * 3.2, d.aw * 3.2, d.aw * 3.2], [0, -d.aw * 0.6, 0], c, { layer: 5 }] as XP));
const palette = (side: 'L' | 'R' = 'L') => inHand(side, (a) => [['ball', [a * 3.6, a * 2.6, a * 0.3], [a * 0.6, -a * 0.2, a * 1.2], 'lightwood', { srot: [-20, 0, 0] }], ...(['red', 'blue', 'yellow', 'green'] as const).map((c, i) => ['ball', [a * 0.6, a * 0.6, a * 0.3], [a * (-0.4 + i * 0.6), a * (0.3 - (i % 2) * 0.4), a * 1.4], c, { noInk: true, layer: 6 }] as HP)]);
const dumbbell = (side: 'L' | 'R') => inHand(side, (a) => [['capsule', [a * 0.35, a * 3.2, a * 0.35], [0, -a * 0.2, a * 0.4], 'iron', { srot: [90, 0, 0] }], ['cyl', [a * 1.8, a * 0.5, a * 1.8], [0, -a * 0.2, a * 1.8], 'black', { srot: [90, 0, 0] }], ['cyl', [a * 1.8, a * 0.5, a * 1.8], [0, -a * 0.2, -a * 1.0], 'black', { srot: [90, 0, 0] }]]);
const spyglass = (side: 'L' | 'R' = 'L') => inHand(side, (a) => [['cyl', [a * 0.8, a * 3, a * 0.8], [0, -a * 0.3, a * 1.2], 'brass', { srot: [90, 0, 0], taper: 0.7 }], ['cyl', [a * 0.9, a * 0.4, a * 0.9], [0, -a * 0.3, a * 2.7], 'darkbrown', { srot: [90, 0, 0] }]]);
/** A 0.9 m diamond kite (silk on cedar cross spars, a wire on top, a tail with bows) flying up and away to the
 *  left on a long string from the left fist, with a key on the string. Put the left arm forward at shoulder
 *  height (upper arm -50, forearm -40 about x, so the hand's frame is world axes turned -90 about x). The string
 *  is the part 'kite' (its joint in the fist), so posing it sways the whole kite. */
const KITE_ARM = { armL: [-50, 0, 0] as Vec3, foreL: [-40, 0, 0] as Vec3 };
const kite = (c = 'red') => X((d) => {
  const a = d.aw;
  const P = (v: Vec3): Vec3 => [v[0], -v[2], v[1]]; // world axes -> the forward-pointing hand's frame
  const S = (r: Vec3): Vec3 => [r[0] + 90, r[1], r[2]];
  const g: Vec3 = [0, 0, a * 0.45]; // the grip, in the fist
  const k: Vec3 = [0.95, 1.85, -0.75]; // from the grip to the kite's cross point
  const len = Math.hypot(...k);
  const u = k.map((v) => v / len) as Vec3;
  const sr: Vec3 = [Math.atan2(u[2], u[1]) * (180 / Math.PI), 0, -Math.asin(u[0]) * (180 / Math.PI)];
  const kp = (t: number): Vec3 => [g[0] + u[0] * t, g[1] + u[1] * t, g[2] + u[2] * t];
  const key = kp(0.42);
  const r: XP[] = [
    ['handL', 'capsule', [0.012, len, 0.012], P(g), '#efe8d6', { name: 'kite', off: P(k.map((v) => v / 2) as Vec3), srot: S(sr), noInk: true }],
    // the sail's frame: x across, y up the spine, z out of the face (turned to face the viewer and the flier)
    ['kite', 'box', [0.02, 0.02, 0.02], P(k), c, { name: 'kiteSail', rot: S([-18, -22, 0]), noInk: true }],
    ['kiteSail', 'wedge', [0.66, 0.3, 0.008], [0, 0.15, 0], c],
    ['kiteSail', 'wedge', [0.66, 0.6, 0.008], [0, -0.3, 0], c, { srot: [0, 0, 180] }],
    ['kiteSail', 'capsule', [0.018, 0.92, 0.018], [0, -0.15, 0], 'lightwood'],
    ['kiteSail', 'capsule', [0.018, 0.68, 0.018], [0, 0, 0], 'lightwood', { srot: [0, 0, 90] }],
    ['kiteSail', 'capsule', [0.008, 0.16, 0.008], [0, 0.36, 0], 'iron'],
  ];
  // the tail: string swinging down from the bottom tip, a bow at each knot
  const tail: Vec3[] = [[0, -0.6, 0], [0.09, -0.84, -0.03], [0.02, -1.08, -0.06], [-0.07, -1.32, -0.08], [-0.01, -1.56, -0.1]];
  const bows = ['white', 'yellow', 'white', 'yellow'];
  for (let i = 1; i < tail.length; i++) {
    const [p, q] = [tail[i - 1], tail[i]];
    const t: Vec3 = [q[0] - p[0], q[1] - p[1], q[2] - p[2]];
    const tl = Math.hypot(...t);
    r.push(['kiteSail', 'capsule', [0.008, tl, 0.008], [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2, (p[2] + q[2]) / 2], '#efe8d6', { noInk: true, srot: [Math.atan2(t[2] / tl, t[1] / tl) * (180 / Math.PI), 0, -Math.asin(t[0] / tl) * (180 / Math.PI)] }]);
    for (const s of [1, -1]) r.push(['kiteSail', 'cyl', [0.075, 0.055, 0.02], [q[0] + s * 0.028, q[1], q[2]], bows[i - 1], { taper: 0, srot: [0, 0, s * 90] }]);
  }
  // the key, tied on the string near the hand
  r.push(
    ['kite', 'torus', [0.032, 0.032, 0.007], P([key[0] - g[0], key[1] - g[1] - 0.022, key[2] - g[2]]), 'brass', { tube: 0.3, srot: S([0, 0, 0]) }],
    ['kite', 'capsule', [0.011, 0.065, 0.011], P([key[0] - g[0], key[1] - g[1] - 0.07, key[2] - g[2]]), 'brass', { srot: S([0, 0, 0]) }],
    ['kite', 'box', [0.024, 0.02, 0.006], P([key[0] - g[0] + 0.014, key[1] - g[1] - 0.093, key[2] - g[2]]), 'brass', { round: 0.2, srot: S([0, 0, 0]) }],
  );
  return r;
});
/** A black flag on a 2.4 m pole held upright in the left fist, out to the side (put ANARCHY_ARM in rest() first).
 *  The pole's joint is turned to line up with the figure's axes at rest, so it stands upright and the flag
 *  (named 'flag', its joint on the pole) can wave about it. */
const ANARCHY_ARM = { armL: [-46, 0, 24] as Vec3, foreL: [-44, 0, 0] as Vec3 };
const blackFlag = (c = '#1d1d1f'): Extra => (p, d) => {
  const F = solve({ parts: p.list } as unknown as Figure, { j: {} }).get('handL')!;
  const Rt = transpose(F.R);
  const up = toEuler(Rt);
  const grip = apply(Rt, [0, 0, d.aw * 0.45]);
  const y0 = F.T[1], bottom = 0.12, top = 2.45, fw = 0.8, fh = 0.52;
  X(() => [
    ['handL', 'capsule', [0.035, top - bottom, 0.035], grip, 'darkwood', { name: 'pole', rot: up, off: [0, (top + bottom) / 2 - y0, 0] }],
    ['pole', 'ball', [0.06, 0.06, 0.06], [0, top - y0 + 0.02, 0], 'silver'],
    ['pole', 'box', [0.012, fh, 0.012], [0, top - y0 - 0.04 - fh / 2, 0], c, { name: 'flag' }],
    // the cloth, in three panels with a ripple, flying out to the side
    ['flag', 'box', [fw * 0.36, fh, 0.014], [fw * 0.17, 0, 0.02], c, { srot: [0, -14, 0], round: 0.05 }],
    ['flag', 'box', [fw * 0.36, fh * 0.97, 0.014], [fw * 0.5, -0.01, 0.045], c, { srot: [0, 10, 0], round: 0.05 }],
    ['flag', 'box', [fw * 0.32, fh * 0.94, 0.014], [fw * 0.82, -0.02, 0.025], c, { srot: [0, -8, 0], round: 0.05 }],
  ])(p, d);
};
const coil = (c: string, side: 'L' | 'R' = 'L') => inHand(side, (a) => [['torus', [a * 2.6, a * 2.6, a * 0.6], [0, -a * 1.4, a * 0.6], c, { tube: 0.25 }], ['torus', [a * 2.2, a * 2.2, a * 0.6], [0, -a * 1.4, a * 0.9], c, { tube: 0.25 }]]);
/** A rope loop hanging from the right hand; raised overhead and spun (pose spin about y) it twirls. */
const lasso = (c: string) => X((d) => {
  const a = d.aw;
  return [['handR', 'torus', [a * 5, a * 5, a * 0.3], [0, -a * 0.5, a * 0.3], c, { name: 'lasso', off: [0, -a * 2.8, 0], tube: 0.07 }]];
});
const hairdryer = (side: 'L' | 'R' = 'R') => inHand(side, (a) => [['capsule', [a * 0.6, a * 1.6, a * 0.6], [0, -a * 0.3, a * 0.5], 'magenta'], ['cyl', [a * 1.2, a * 2.4, a * 1.2], [0, a * 0.7, a * 1.3], 'magenta', { srot: [90, 0, 0], taper: 0.7 }]]);
const comb = (side: 'L' | 'R' = 'L') => inHand(side, (a) => [['box', [a * 0.3, a * 3, a * 0.7], [0, a * 0.6, a * 0.8], 'black', { round: 0.3 }]]);
const megaphone = (side: 'L' | 'R' = 'L') => inHand(side, (a) => [['cyl', [a * 2, a * 3, a * 2], [0, a * 0.2, a * 2.0], 'white', { taper: 0.35, srot: [-90, 0, 0] }], ['cyl', [a * 2.05, a * 0.4, a * 2.05], [0, a * 0.2, a * 3.4], 'red', { srot: [90, 0, 0] }]]);
const heartH = (side: 'L' | 'R' = 'L', c = 'red') => inHand(side, (a) => [['ball', [a * 1.4, a * 1.4, a * 1.0], [a * 0.55, a * 0.5, a * 1.3], c], ['ball', [a * 1.4, a * 1.4, a * 1.0], [-a * 0.55, a * 0.5, a * 1.3], c], ['cyl', [a * 2.1, a * 1.7, a * 1.0], [0, -a * 0.4, a * 1.3], c, { taper: 0, segs: 4, srot: [180, 45, 0] }]]);
const bomb = (side: 'L' | 'R' = 'L') => inHand(side, (a) => [['ball', [a * 2.6, a * 2.6, a * 2.6], [0, -a * 0.6, a * 1.6], 'black'], ['capsule', [a * 0.25, a * 1.2, a * 0.25], [0, a * 1.0, a * 1.6], 'tan'], ['ball', [a * 0.6, a * 0.6, a * 0.6], [0, a * 1.7, a * 1.6], 'flame', { glow: true }]]);
const toothH = (side: 'L' | 'R' = 'L') => inHand(side, (a) => [['ball', [a * 2.2, a * 1.7, a * 1.6], [0, a * 0.9, a * 1.3], 'white'], ['capsule', [a * 0.7, a * 1.6, a * 0.7], [a * 0.5, -a * 0.1, a * 1.3], 'white', { srot: [0, 0, 10] }], ['capsule', [a * 0.7, a * 1.6, a * 0.7], [-a * 0.5, -a * 0.1, a * 1.3], 'white', { srot: [0, 0, -10] }]]);
const fork = (side: 'L' | 'R' = 'R') => inHand(side, (a, d) => [['capsule', [a * 0.3, d.H * 0.2, a * 0.3], [0, d.H * 0.08, a * 0.4], 'silver'], ...[-1, 0, 1].map((x) => ['capsule', [a * 0.15, a * 1.4, a * 0.15], [x * a * 0.35, d.H * 0.18 + a * 0.6, a * 0.4], 'silver'] as HP), ['box', [a * 1.0, a * 0.3, a * 0.2], [0, d.H * 0.18, a * 0.4], 'silver']]);
const scythe = (side: 'L' | 'R' = 'R') => inHand(side, (a, d) => [['capsule', [a * 0.35, d.H * 1.05, a * 0.35], [0, d.H * 0.2, a * 0.4], 'darkwood'], ['wedge', [d.H * 0.4, a * 1.0, a * 0.2], [-d.H * 0.18, d.H * 0.68, a * 0.4], 'silver', { srot: [0, 0, -12], apex: -0.45 }]]);
const hourglass = (side: 'L' | 'R' = 'L') => inHand(side, (a) => [['cyl', [a * 1.6, a * 1.2, a * 1.6], [0, a * 1.3, a * 1.3], 'sand', { taper: 0.1, srot: [180, 0, 0] }], ['cyl', [a * 1.6, a * 1.2, a * 1.6], [0, a * 0.1, a * 1.3], 'sand', { taper: 0.1 }], ['cyl', [a * 2, a * 0.3, a * 2], [0, a * 2.0, a * 1.3], 'wood'], ['cyl', [a * 2, a * 0.3, a * 2], [0, -a * 0.6, a * 1.3], 'wood']]);

/* ----- things standing beside a person (figure space) ----- */
const beside = (f: (d: PersonDims) => [Shape, Vec3, Vec3, string, XO?][]) => X((d) => f(d).map(([s, z, at, c, o]) => ['', s, z, at, c, o] as XP));
const easelBoard = (text: string, x = 0.55) => beside((d) => {
  const k = d.H / 1.7;
  return [['box', [0.7 * k, 0.5 * k, 0.04], [x * k, 1.15 * k, -0.05], '#2f3a33', { text }], ['box', [0.74 * k, 0.04 * k, 0.08], [x * k, 0.88 * k, 0], 'wood'], ['capsule', [0.04 * k, 1.4 * k, 0.04 * k], [(x - 0.25) * k, 0.68 * k, 0], 'wood', { srot: [-6, 0, 8] }], ['capsule', [0.04 * k, 1.4 * k, 0.04 * k], [(x + 0.25) * k, 0.68 * k, 0], 'wood', { srot: [-6, 0, -8] }]];
});

/** Two (or more) built figures side by side as one figure; later ones get prefixed part names. */
function together(key: string, figs: [Figure, number, number?][]): Figure {
  const parts: FigPart[] = [];
  figs.forEach(([f, dx, dz = 0], i) => {
    const pre = i ? `${String.fromCharCode(97 + i)}_` : '';
    for (const p of f.parts) parts.push({ ...p, name: pre + p.name, parent: p.parent ? pre + p.parent : undefined, at: p.parent ? p.at : [p.at[0] + dx, p.at[1], p.at[2] + dz] });
  });
  return measure({ ...figs[0][0], key, parts });
}

export const ENTRIES: CatalogEntry[] = [
  // Lincoln: 1.93 m, frock coat and a stovepipe hat he can lift; the Gettysburg Address in his left hand.
  e('abraham lincoln', 'town', 'history', () => act(W('abraham lincoln', { h: 1.93, build: 0.88, skin: 'skin2', hair: '#1d1d1d', style: 'short', top: 'black', long: true, bottom: 'black', shoes: 'black', acc: [suitX('black', 'black', true), tails('black'), tophat('black', '#2a2726', 1.35), face('beard', '#1d1d1d'), rest({ armL: [-22, 0, 10], foreL: [-62, 0, -8] }), onPalm('L', (a) => [['box', [a * 2.6, a * 0.08, a * 3.4], [0, a * 0.5, a * 1.2], 'paper', { name: 'speech', srot: [-35, 0, 0], edge: 'sharp', round: 0.05 }]])] }),
    tipHat('Good day to you, friend.'),
    hold({ armL: [-30, 0, -4], foreL: [-30, 0, 0] }, 'Four score and seven years ago...', 2.4),
  )),
  // On a striped circus ball, arms out to balance; she somersaults off it and back.
  e('acrobat', 'town', 'entertainment', () => act(W('acrobat', { top: 'red', bottom: 'red', legs: 'white', shoes: 'white', hair: 'darkbrown', style: 'bun', build: 0.9, acc: [wear('belt', 'gold'), wear('sash', 'yellow'), arms(80), lift(0.6), beside(() => [
    ['ball', [0.6, 0.6, 0.6], [0, 0.3, 0], 'blue', { name: 'ball' }],
    ['torus', [0.62, 0.62, 0.1], [0, 0.3, 0], 'yellow', { tube: 0.12 }],
    ['torus', [0.62, 0.62, 0.1], [0, 0.3, 0], 'red', { tube: 0.12, srot: [0, 90, 0] }],
    ['torus', [0.5, 0.5, 0.08], [0, 0.3, 0], 'white', { tube: 0.1, srot: [90, 0, 0] }],
  ])] }),
    [...flip('Hup!', 1.1), G('bow', 'Ta-da!', 1.8)],
    [G('wobble', 'Whoa... steady, steady!')],
  )),
  // A 15 cm toy soldier on its display stand; a pull-string voice and a karate-chop arm.
  e('action figure', 'toys', 'dolls and figures', () => act(W('action figure', { h: 0.15, build: 1.25, skin: 'skin2', hair: 'darkbrown', style: 'short', top: 'olive', long: true, bottom: 'olive', shoes: 'black', acc: [hat('military', 'darkgreen'), face('beard', '#3b2a1e'), wear('belt', 'black'), wear('backpack', 'olive'), bands('#5a5f2a', [0.55]), held('blaster', 'black'), boots('black'), lift(0.01), beside(() => [['box', [0.1, 0.01, 0.075], [0, 0.005, 0], 'black', { edge: 'sharp', round: 0.3 }], ['box', [0.05, 0.004, 0.012], [0, 0.009, 0.03], 'gold', { edge: 'sharp', text: 'HERO' }]])] }),
    hold(SALUTE, 'Reporting for duty!', 1.4),
    hold({ armL: [-20, 0, 120], foreL: [-10, 0, 60] }, 'Hi-yah!', 1.0),
  )),
  // Hamlet in a ruff and cape, Yorick's skull on his palm.
  e('actor', 'town', 'entertainment', () => act(W('actor', { top: 'black', long: true, bottom: 'black', legs: 'black', shoes: 'black', hair: 'darkbrown', style: 'short', acc: [wear('cape', 'darkred'), ruff(), wear('belt', 'gold'), buttons('gold', 3), rest({ armR: [-22, 0, -8], foreR: [-72, 0, 10] }), onPalm('R', (a) => [['ball', [a * 1.7, a * 1.8, a * 1.9], [0, a * 1.6, a * 1.0], 'cream', { name: 'skull' }], ['box', [a * 1.0, a * 0.7, a * 0.9], [0, a * 0.8, a * 1.5], 'cream'], ...[1, -1].map((s) => ['ball', [a * 0.45, a * 0.5, a * 0.2], [s * a * 0.4, a * 1.7, a * 1.95], 'black', { noInk: true, layer: 6 }] as HP)])] }),
    hold({ armR: [-35, 0, 0] }, 'Alas, poor Yorick!', 2.0),
    [G('bow', 'Thank you, thank you!')],
  )),
  // A film star in a red gown and sunglasses; waves to her fans and blows them a kiss.
  e('actress', 'town', 'entertainment', () => act(W('actress', { pose: 'hips', skin: 'skin1', top: 'red', skirt: 'red', legs: 'skin1', shoes: 'red', hair: 'gold', style: 'long', acc: [gown('red', 0.9), wear('necklace', 'white'), face('sunglasses'), held('bag', 'gold', 'L')] }),
    [G('wave', 'Hello, darlings!')],
    [A.par(A.anim('wink'), A.effect('hearts', { dur: 1.6 }), A.say('Mwah! Love you all!', 2))],
  )),
  // A naval admiral: bicorne, gold epaulettes and buttons, a sword and a spyglass.
  e('admiral', 'town', 'military', () => act(W('admiral', { top: 'navy', long: true, bottom: 'navy', shoes: 'black', hair: 'white', style: 'short', acc: [bicorne('black'), epaul(), buttons('gold', 4, 0.22), buttons('gold', 4, -0.22), rings('gold', 'foreR', [0.72, 0.8]), rings('gold', 'foreL', [0.72, 0.8]), wear('medal'), held('sword'), spyglass('L')] }),
    hold(SALUTE, 'At ease, sailor.', 1.5),
    [G('point', 'Full speed ahead!')],
  )),
  // Wonder Woman: tiara, gold eagle, silver bracers she crosses to block, the golden lasso at her hip.
  e('agent diana prince', 'town', 'superheroes', () => act(W('agent diana prince', { h: 1.8, build: 1.05, skin: 'skin2', hair: '#1d1d1d', style: 'long', top: 'red', bottom: 'navy', skirt: 'navy', legs: 'skin2', shoes: 'red', acc: [hat('tiara', 'gold'), wear('belt', 'gold'), patch('gold', 0.55, 0.14, 0.82), wristbands('silver'), boots('red', 1.05), coil('gold', 'L')] }),
    hold({ armR: [-95, 0, -8], foreR: [-45, 0, 85], armL: [-95, 0, 8], foreL: [-45, 0, -85] }, 'Bullets bounce off!', 1.4, [A.effect('sparkle', { dur: 1.2 })]),
    [G('hands_on_hips', 'Who goes there?')],
  )),
  // In a bronze cuirass and crested helmet with sword and round shield.
  e('alexander the great', 'town', 'history', () => act(W('alexander the great', { skin: 'skin2', hair: 'gold', style: 'short', top: 'white', skirt: 'white', legs: 'skin2', shoes: 'brown', acc: [wear('armor', 'bronze'), wear('cape', 'red'), hat('helmet', 'bronze'), crest('red'), X((d) => [-0.3, -0.1, 0.1, 0.3].map((xx) => ['hips', 'box', [d.tw * 0.18, d.legLen * 0.32, d.td * 0.1], [d.tw * xx, -d.legLen * 0.12, d.td * 0.55], 'bronze', { layer: 4 }] as XP)), boots('brown'), held('sword'), inHand('L', (a, d) => [['cyl', [d.H * 0.32, a * 0.4, d.H * 0.32], [a * 0.7, -a * 0.6, a * 0.5], 'bronze', { srot: [90, 0, 90], edge: 'sharp' }], ['cyl', [d.H * 0.12, a * 0.5, d.H * 0.12], [a * 0.95, -a * 0.6, a * 0.5], 'red', { srot: [90, 0, 90] }]])] }),
    [G('point', 'Onward, to Persia!')],
    [G('arms_up', 'Victory is ours!')],
  )),
  // A little grey-green visitor: big head, huge black eyes, antennae, a silver suit and a ray gun.
  e('alien', 'fantasy', 'aliens', () => act(W('alien', { pose: 'wave', h: 1.5, head: 1.25, build: 0.8, skin: '#8fe36b', style: 'none', eyes: '#1d1d1d', top: 'silver', long: true, bottom: 'silver', shoes: 'silver', acc: [hat('antennae', '#8fe36b'), X((d) => [1, -1].map((s) => ['head', 'ball', [d.headW * 0.32, d.headH * 0.26, d.headW * 0.1], [s * d.headW * 0.2, d.headY + d.headH * 0.03, d.headD * 0.45], 'black', { srot: [0, 0, s * 25], layer: 6 }] as XP)), wear('belt', 'purple'), collar('purple'), held('blaster', 'lime', 'L')] }),
    [G('wave', 'Greetings, Earthling!')],
    [G('point', 'Take me to your leader.')],
  )),
  // A white cotta over a red cassock, holding a lit candle in both hands (it can be blown out).
  e('altar boy', 'town', 'religion', () => act(W('altar boy', { h: 'kid', top: 'white', long: true, bottom: 'red', skirt: 'red', legs: 'red', shoes: 'black', style: 'short', acc: [X((d) => [['torso', 'cyl', [d.tw * 1.5, d.torsoH * 0.5 + d.legLen * 0.35, d.td * 1.7], [0, d.torsoH * 0.25 - d.legLen * 0.17, 0], 'white', { taper: 0.75, layer: 2 }]]), collar('white'), rest({ armR: [-22, 0, -14], foreR: [-66, 0, 22], armL: [-22, 0, 14], foreL: [-66, 0, -22] }), onPalm('R', (a) => [['cyl', [a * 0.7, a * 3.4, a * 0.7], [-a * 0.3, a * 1.8, a * 0.6], 'cream'], ['ball', [a * 0.5, a * 0.9, a * 0.5], [-a * 0.3, a * 4.0, a * 0.6], 'flame', { glow: true, name: 'flame' }], ['cyl', [a * 1.4, a * 0.2, a * 1.4], [-a * 0.3, a * 0.2, a * 0.6], 'gold']])] }),
    [G('bow', 'Peace be with you.')],
    [A.par(A.pose('flame', { scale: 0, dur: 0.3 }), A.effect('smoke', { dur: 1.2 }), A.say('Fffff!', 1)), A.wait(1.6), A.par(A.pose('flame', { scale: 1, dur: 0.3 }), A.effect('sparkle', { dur: 0.8 }), A.say('There, lit again.', 1.8))],
  )),
  // A tall warrior woman with spear and round shield; raises the shield, then lets you pass.
  e('amazon (person)', 'town', 'warriors', () => act(W('amazon (person)', { h: 1.85, build: 1.1, skin: 'skin3', hair: '#1d1d1d', style: 'ponytail', top: 'gold', skirt: 'darkred', legs: 'skin3', shoes: 'brown', acc: [hat('headband', 'gold'), wear('armor', 'gold'), wear('belt', 'gold'), wristbands('gold'), boots('brown'), held('spear'), inHand('L', (a, d) => [['cyl', [d.H * 0.3, a * 0.4, d.H * 0.3], [a * 0.7, -a * 0.6, a * 0.5], 'bronze', { srot: [90, 0, 90], edge: 'sharp' }], ['cyl', [d.H * 0.08, a * 0.5, d.H * 0.08], [a * 0.95, -a * 0.6, a * 0.5], 'gold', { srot: [90, 0, 90] }]])] }),
    hold({ armL: [-75, 0, 10], foreL: [-15, 0, 0] }, 'Shields up! Who dares?', 1.6),
    [G('nod', 'You may pass, friend.')],
  )),
  // A diplomat in a dark suit and sash with a flag pin; offers a handshake.
  e('ambassador', 'town', 'politics', () => act(W('ambassador', { top: 'black', long: true, bottom: 'black', shoes: 'black', hair: 'gray', style: 'short', acc: [suitX('black', 'navy'), wear('sash', 'skyblue'), wear('medal'), patch('blue', 0.1, 0.07, 0.82, 0.3), held('briefcase', 'black', 'L')] }),
    hold(SHAKE, 'Pleased to meet you.', 1.6),
    [G('bow', 'Welcome, on behalf of my nation.', 2.2)],
  )),
  // Hood, mask, a black flag on a pole held to one side and an A on the chest; shakes a fist, then shakes his head
  // at bosses, the flag flapping.
  e('anarchist', 'town', 'crime', () => act(W('anarchist', { top: 'black', long: true, bottom: 'black', shoes: 'black', acc: [hat('hood', 'black'), face('mask', 'black'), chest('A', 'red', 0.4, 0.3), wear('backpack', 'darkgray'), rest(ANARCHY_ARM), blackFlag()] }),
    hold(FIST, 'No rules!', 1.4, [A.pose('flag', { rot: [0, 22, 0], dur: 0.35, times: 2 })]),
    [A.par(A.anim('shake_head'), A.pose('flag', { rot: [0, -18, 0], dur: 0.4, times: 2 }), A.say('Who needs a boss?', 2))],
  )),
  // A TV news anchor: suit, tie, perfect hair, a microphone and his script.
  e('anchorman', 'town', 'media', () => act(W('anchorman', { top: 'white', long: true, bottom: 'maroon', shoes: 'black', hair: 'darkbrown', style: 'short', skin: 'skin1', acc: [suitX('maroon', 'navy'), face('mustache', 'darkbrown'), held('mic'), held('letter', 'paper', 'L')] }),
    [G('nod', 'Good evening. Here is the news.', 2.2)],
    [G('point', 'And now, the weather!')],
  )),
  // A white android with ear discs and a glowing chest core: scans the room, powers down, boots up.
  e('android', 'fantasy', 'robots', () => act(W('android', { skin: '#d4d7da', style: 'none', eyes: '#3fc8e8', top: 'white', long: true, bottom: 'white', shoes: 'silver', acc: [X((d) => [1, -1].map((s) => ['head', 'cyl', [d.headW * 0.3, d.headW * 0.14, d.headW * 0.3], [s * d.headW * 0.52, d.headY, 0], 'steel', { srot: [0, 0, 90], edge: 'sharp' }] as XP)), X((d) => [['head', 'box', [d.headW * 0.7, d.headH * 0.05, d.headW * 0.05], [0, d.headY + d.headH * 0.36, d.headD * 0.4], 'steel', { layer: 6 }]]), patch('lightgray', 0.5, 0.35, 0.68), X((d) => [['torso', 'cyl', [d.tw * 0.22, d.td * 0.1, d.tw * 0.22], [0, d.torsoH * 0.7, d.td * 0.56], 'cyan', { glow: true, srot: [90, 0, 0], name: 'core', mover: { kind: 'light', on: true } }]]), bands('steel', [0.05]), rings('steel', 'foreR', [0.45]), rings('steel', 'foreL', [0.45]), rings('steel', 'shinR', [0.5]), rings('steel', 'shinL', [0.5]), gloves('steel')] }),
    [A.par(A.pose('head', { rot: [0, 70, 0], dur: 0.6 }), A.say('Scanning...', 2.5)), A.pose('head', { rot: [0, -70, 0], dur: 1.0 }), A.pose('head', { rot: [0, 0, 0], dur: 0.5 })],
    [A.operate('core', 'off'), A.par(A.pose('head', { rot: [28, 0, 0], dur: 0.5 }), A.say('Powering down...', 1.6)), A.wait(1.4), A.operate('core', 'on'), A.pose('head', { rot: [0, 0, 0], dur: 0.3 }), G('wave', 'Hello, human!')],
  )),
  // Scrubs, cap and mask, holding the anaesthetic mask on its tube.
  e('anesthesiologist', 'town', 'medical', () => act(W('anesthesiologist', { top: 'teal', bottom: 'teal', shoes: 'white', acc: [cap0('teal'), face('mask', 'skyblue'), wear('stethoscope'), inHand('R', (a) => [['cyl', [a * 1.4, a * 1.0, a * 1.4], [0, -a * 0.6, a * 1.3], 'glass', { taper: 0.5, srot: [-90, 0, 0] }], ['capsule', [a * 0.35, a * 4, a * 0.35], [0, -a * 2.4, a * 0.6], 'skyblue', { srot: [20, 0, 0] }]]), held('clipboard', 'wood', 'L')] }),
    [G('nod', 'Count backwards from ten...', 2.2)],
    [G('wave', 'Sweet dreams!')],
  )),
  // White robe, a glowing halo and big feathered wings: she rises into the air, wings spread.
  e('angel', 'fantasy', 'spirits', () => act(W('angel', { top: 'white', bottom: 'white', skirt: 'white', legs: 'white', long: true, hair: 'gold', style: 'long', skin: 'skin1', acc: [X((d) => [['head', 'torus', [d.headW * 0.9, d.headW * 0.9, d.headW * 0.1], [0, d.headY + d.headH * 0.72, -d.headD * 0.1], '#ffe680', { srot: [80, 0, 0], tube: 0.18, glow: true }]]), gown('white', 0.85), wear('belt', 'gold'), X((d) => [1, -1].map((s) => ['torso', 'ball', [d.tw * 1.7, d.torsoH * 1.5, d.td * 0.14], [s * d.tw * 0.25, d.torsoH * 0.8, -d.td * 0.62], 'white', { name: s > 0 ? 'wingL' : 'wingR', off: [s * d.tw * 0.8, 0, 0], srot: [0, s * 18, -s * 22], layer: -3 }] as XP)), held('trumpet', 'gold')] }),
    [A.par(A.pose('hips', { move: [0, 0.4, 0], dur: 1.0 }), A.pose('wingL', { rot: [0, -25, 15], dur: 0.5 }), A.pose('wingR', { rot: [0, 25, -15], dur: 0.5 }), A.effect('sparkle', { dur: 1.8 }), A.say('Peace on earth!', 2.2)), A.wait(1.2), A.par(A.pose('hips', { move: [0, 0, 0], dur: 1.0 }), A.pose('wingL', { rot: [0, 0, 0], dur: 0.8 }), A.pose('wingR', { rot: [0, 0, 0], dur: 0.8 }))],
    [G('wave', 'Bless you!')],
  )),
  // Bucket hat, fishing vest and a real 2.4 m rod (cork grip, reel, tapered blank, line down to a red and white
  // float): casts the line, then holds up the fish that bit.
  e('angler', 'town', 'outdoors', () => act(W('angler', { top: 'tan', bottom: 'darkgreen', shoes: 'darkgreen', acc: [bucket('olive'), wear('vest', 'olive'), boots('darkgreen'), inHand('R', (a) => {
    const fy = -a * 0.6, fz = a * 0.5, dy = 0.7, dz = 0.714, ang = 45.6;
    /** A point s metres along the rod from the fist, `off` below it. */
    const P = (s: number, off = 0): Vec3 => [0, fy + dy * s - dz * off, fz + dz * s + dy * off];
    const tip = P(2.0);
    return [
      ['cyl', [a * 0.42, 0.46, a * 0.42], P(-0.11), 'tan', { srot: [ang, 0, 0] }],
      ['ball', [a * 0.5, a * 0.5, a * 0.5], P(-0.34), 'darkgray'],
      ['cyl', [a * 0.24, 1.9, a * 0.24], P(1.07), '#2a2a2a', { srot: [ang, 0, 0], taper: 0.25 }],
      ['cyl', [a * 0.95, a * 0.4, a * 0.95], P(0.03, a * 0.6), 'silver', { srot: [0, 0, 90], edge: 'sharp' }],
      ['capsule', [a * 0.05, 1.7, a * 0.05], [0, tip[1] - 0.85, tip[2]], 'white', { noInk: true }],
      ['ball', [a * 0.75, a * 0.85, a * 0.75], [0, tip[1] - 1.72, tip[2]], 'red'],
      ['ball', [a * 0.55, a * 0.4, a * 0.55], [0, tip[1] - 1.62, tip[2]], 'white'],
    ];
  }), inHand('L', (a) => [['ball', [a * 1.0, a * 1.4, a * 3.4], [0, -a * 1.9, a * 0.6], 'silver', { srot: [85, 0, 0], name: 'catch', scale: 0 }], ['wedge', [a * 1.2, a * 1.0, a * 0.3], [0, -a * 3.6, a * 0.75], 'silver', { srot: [180, 90, 0], name: 'catchTail', scale: 0 }]])] }),
    [to({ armR: [40, 0, 0] }, undefined, 0.35), A.par(A.pose('armR', { rot: [-35, 0, 0], dur: 0.25 }), A.say('Here, fishy fishy...', 2)), A.wait(1.2), A.pose('armR', { rot: [0, 0, 0], dur: 0.5 })],
    [A.par(A.pose('catch', { scale: 1, dur: 0.3 }), A.pose('catchTail', { scale: 1, dur: 0.3 }), A.pose('armL', { rot: [0, 0, 120], dur: 0.4 }), A.say('Got one! A big one!', 2)), A.wait(1.6), A.par(A.pose('armL', { rot: [0, 0, 0], dur: 0.4 }), A.pose('catch', { scale: 0, dur: 0.3 }), A.pose('catchTail', { scale: 0, dur: 0.3 }))],
  )),
  // Raggedy Ann: red yarn hair, button nose, blue dress and white apron, floppy as a rag doll.
  e('ann', 'town', 'storybook', () => act(W('ann', { h: 'kid', skin: 'skin1', hair: 'red', style: 'short', top: 'skyblue', skirt: 'skyblue', legs: 'white', shoes: 'black', blush: 'red', acc: [mop('red'), wear('apron', 'white'), nose('red', 0.14), rings('red', 'shinL', [0.2, 0.4, 0.6, 0.8], 1.05), rings('red', 'shinR', [0.2, 0.4, 0.6, 0.8], 1.05)] }),
    [G('dance', 'Let\'s play!')],
    [A.par(A.anim('fall_over'), A.say('Oopsie-daisy!', 1.8)), A.wait(1.2), A.set({ tilt: 0, dur: 0.5 })],
  )),
  // King of the seas: orange scale shirt, green leggings, long blond hair and beard, a gold trident.
  e('aquaman', 'town', 'superheroes', () => act(W('aquaman', { h: 1.85, build: 1.2, skin: 'skin2', top: 'orange', long: true, bottom: 'darkgreen', shoes: 'darkgreen', hair: 'gold', style: 'long', acc: [face('beard', 'gold'), X((d) => [0.25, 0.45, 0.65].flatMap((y) => [-0.25, 0, 0.25].map((xx) => ['torso', 'ball', [d.tw * 0.2, d.torsoH * 0.12, d.td * 0.06], [d.tw * xx, d.torsoH * y, d.td * 0.53], '#e8a020', { layer: 4, noInk: true }] as XP))), wear('belt', 'gold'), gloves('darkgreen'), held('trident', 'gold', 'L')] }),
    [A.par(A.anim('point'), A.effect('water_spray', { dur: 1.5 }), A.say('Rise, ocean!', 2))],
    show('goldfish', 'Say hello, little friend!', 'wave', 'sink'),
  )),
  // Pith helmet, khaki vest and a trowel; digs up a bone, and studies a find through her magnifier.
  e('archaeologist', 'town', 'science', () => act(W('archaeologist', { top: 'tan', bottom: '#a08a5a', shoes: 'brown', acc: [hat('helmet', 'beige'), nameHat(), wear('vest', '#8a6a3a'), wear('scarf', 'red'), boots('brown'), held('shovel'), held('magnifier', 'gold', 'L')] }),
    show('bone', 'An ancient bone!', 'point', 'sink'),
    hold({ armL: [-60, 0, -30], foreL: [-70, 0, -10] }, 'Hmm... fascinating.', 2.0),
  )),
  // A green archer with a feathered cap and quiver: draws the bow and looses an arrow.
  e('archer', 'town', 'warriors', () => act(W('archer', { top: 'darkgreen', long: true, bottom: 'brown', shoes: 'darkbrown', hair: 'brown', style: 'short', acc: [hat('beret', 'darkgreen'), nameHat(), feather('red'), wear('belt', 'brown'), quiver(), boots('darkbrown'), held('bow', 'wood', 'L')] }),
    [to({ armL: [-5, 0, 85], armR: [-5, 0, -80], foreR: [0, 0, -100] }, undefined, 0.5), A.spawn('arrow', 'arrow', { rel: 'front', of: 'self', dist: 'close', height: 'low' }), A.par(A.move('arrow', { rel: 'front', of: 'self', dist: 'far' }, { speed: 'fly' }), A.say('Bullseye!', 1.5)), A.remove('arrow', 'fade'), A.par(A.pose('armL', { rot: [0, 0, 0], dur: 0.4 }), A.pose('armR', { rot: [0, 0, 0], dur: 0.4 }), A.pose('foreR', { rot: [0, 0, 0], dur: 0.4 }))],
    [G('bow', 'At your service.')],
  )),
  // Hard hat, glasses and a roll of blueprints that she unrolls to show the plan.
  e('architect', 'town', 'office', () => act(W('architect', { top: 'black', long: true, bottom: 'gray', shoes: 'black', acc: [hat('hard', 'white'), nameHat(), face('glasses', 'black'), rest({ armR: [-20, 0, -6], foreR: [-66, 0, 8], armL: [-20, 0, 6], foreL: [-66, 0, -8] }), onPalm('R', (a) => [['cyl', [a * 0.9, a * 4.6, a * 0.9], [a * 1.8, a * 0.5, a * 0.8], 'skyblue', { srot: [0, 0, 90] }], ['box', [a * 4.4, a * 0.05, a * 3.4], [a * 1.8, a * 0.9, a * 2.6], '#3a6fb0', { name: 'plan', scale: 0, srot: [-40, 0, 0], edge: 'sharp', round: 0.05 }]])] }),
    [A.par(A.pose('plan', { scale: 1, dur: 0.5 }), A.say('Here is the plan!', 2)), A.wait(1.8), A.pose('plan', { scale: 0, dur: 0.4 })],
    [G('nod', 'It will stand for a hundred years.', 2.2)],
  )),
  // A shifty figure in a dark hoodie with a red fuel can, striking a match; the match goes out.
  e('arsonist', 'town', 'crime', () => act(W('arsonist', { top: 'darkgray', long: true, bottom: 'black', shoes: 'black', acc: [hat('beanie', 'black'), nameHat(), inHand('R', (a) => [['capsule', [a * 0.2, a * 1.8, a * 0.2], [0, a * 0.4, a * 0.9], 'tan', { srot: [30, 0, 0] }], ['ball', [a * 0.5, a * 0.8, a * 0.5], [0, a * 1.3, a * 1.4], 'flame', { glow: true, name: 'match', scale: 0 }]]), inHand('L', (a) => [['box', [a * 2.4, a * 2.8, a * 1.2], [0, -a * 2.2, a * 0.6], 'red', { edge: 'sharp', round: 0.15 }], ['cyl', [a * 0.4, a * 1.0, a * 0.4], [a * 0.8, -a * 0.6, a * 0.6], 'black', { srot: [0, 0, -30] }]])] }),
    [A.par(A.pose('match', { scale: 1, dur: 0.2 }), A.anim('laugh'), A.say('Heh heh heh...', 2))],
    [A.par(A.pose('match', { scale: 0, dur: 0.2 }), A.effect('smoke', { dur: 1 }), A.anim('shake_head'), A.say('Rats, it went out.', 2))],
  )),
  // Beret, smock and palette, with a canvas on an easel: dabs at it and a painting appears.
  e('artist', 'town', 'arts', () => act(W('artist', { top: 'white', long: true, bottom: 'black', shoes: 'black', hair: '#1d1d1d', style: 'short', acc: [hat('beret', 'black'), nameHat(), face('mustache', '#1d1d1d'), rest({ armR: [-25, 0, -15], foreR: [-55, 0, 20], armL: [-15, 0, 10], foreL: [-60, 0, -10] }), held('paintbrush'), palette(), patch('blue', 0.14, 0.08, 0.4, 0.2), patch('red', 0.12, 0.08, 0.3, -0.25), patch('yellow', 0.12, 0.08, 0.55, -0.1), beside((d) => {
    const k = d.H / 1.7, ex = -0.75 * k, ez = 0.25;
    return [
      ['capsule', [0.035, 1.75 * k, 0.035], [ex - 0.24 * k, 0.86 * k, ez + 0.08], 'wood', { srot: [-6, 0, -9], edge: 'sharp' }],
      ['capsule', [0.035, 1.75 * k, 0.035], [ex + 0.24 * k, 0.86 * k, ez + 0.08], 'wood', { srot: [-6, 0, 9], edge: 'sharp' }],
      ['capsule', [0.035, 1.6 * k, 0.035], [ex, 0.78 * k, ez - 0.32], 'wood', { srot: [20, 0, 0], edge: 'sharp' }],
      ['box', [0.62 * k, 0.04, 0.07], [ex, 0.72 * k, ez + 0.1], 'wood', { edge: 'sharp' }],
      ['box', [0.56 * k, 0.46 * k, 0.03], [ex, 1.0 * k, ez + 0.06], 'white', { srot: [-6, 0, 0], edge: 'sharp', round: 0.05 }],
      ['box', [0.5 * k, 0.4 * k, 0.012], [ex, 1.0 * k, ez + 0.085], '#7ec0e8', { srot: [-6, 0, 0], name: 'picture', scale: 0, edge: 'sharp', round: 0.05 }],
      ['ball', [0.3 * k, 0.14 * k, 0.012], [ex - 0.06 * k, 0.88 * k, ez + 0.1], 'green', { srot: [-6, 0, 0], name: 'hill', scale: 0, noInk: true }],
      ['ball', [0.09 * k, 0.09 * k, 0.012], [ex + 0.13 * k, 1.1 * k, ez + 0.1], 'yellow', { srot: [-6, 0, 0], name: 'sun', scale: 0, noInk: true }],
    ];
  })] }),
    [A.par(A.anim('point'), A.pose('picture', { scale: 1, dur: 0.8 }), A.pose('hill', { scale: 1, dur: 1.2 }), A.pose('sun', { scale: 1, dur: 1.6 }), A.say('Voilà! A masterpiece!', 2.2))],
    [A.par(A.anim('shake_head'), A.pose('picture', { scale: 0, dur: 0.6 }), A.pose('hill', { scale: 0, dur: 0.6 }), A.pose('sun', { scale: 0, dur: 0.6 }), A.say('No, no... start again.', 2))],
  )),
  // Hooded and masked in a dark cloak, a dagger at hand; checks nobody saw, then vanishes in smoke.
  e('assassin', 'town', 'crime', () => act(W('assassin', { top: 'black', long: true, bottom: 'black', shoes: 'black', acc: [wear('cloak', '#1d1d1d'), hat('hood', '#1d1d1d'), face('mask', 'black'), wear('belt', 'darkred'), wear('sash', 'darkred'), gloves('#2a2726'), boots('#2a2726'), held('knife'), rest({ armL: [-30, 0, 20], foreL: [-60, 0, -30] })] }),
    [G('look_around', 'Hmm... where is my target?')],
    [A.par(A.effect('smoke', { dur: 2 }), A.anim('spin'), A.say('Poof!', 1.2))],
  )),
  // A white spacesuit with life-support pack and a gold visor that flips up; floats in low gravity.
  e('astronaut', 'town', 'science', () => act(W('astronaut', { h: 1.75, build: 1.25, top: 'white', long: true, bottom: 'white', shoes: 'white', acc: [X((d) => {
    const { W: w, Hh, D, y } = hd(d);
    return [
      ['head', 'ball', [w * 1.32, Hh * 1.3, D * 1.32], [0, y + Hh * 0.04, 0], 'white', { name: 'helmet' }],
      ['head', 'ball', [w * 1.0, Hh * 0.74, D * 0.5], [0, y + Hh * 0.04, 0], '#e8b83a', { name: 'visor', off: [0, 0, D * 0.44], mover: { kind: 'swing', axis: 'x', amount: -60 }, layer: 6 }],
      ['torso', 'torus', [d.tw * 1.2, d.td * 1.5, d.torsoH * 0.12], [0, d.torsoH * 0.98, 0], 'lightgray', { srot: [90, 0, 0], tube: 0.35 }],
      ['torso', 'box', [d.tw * 0.95, d.torsoH * 0.85, d.td * 0.8], [0, d.torsoH * 0.55, -d.td * 0.85], 'white', { round: 0.25, edge: 'sharp' }],
      ['torso', 'box', [d.tw * 0.4, d.torsoH * 0.25, d.td * 0.12], [0, d.torsoH * 0.5, d.td * 0.56], 'lightgray', { round: 0.2, edge: 'sharp' }],
      ...[-0.1, 0, 0.1].map((xx, i) => ['torso', 'ball', [d.tw * 0.07, d.tw * 0.07, d.td * 0.05], [d.tw * xx, d.torsoH * 0.52, d.td * 0.63], ['red', 'lime', 'cyan'][i], { glow: true, noInk: true, layer: 6 }] as XP),
    ];
  }), patch('navy', 0.22, 0.14, 0.78, 0.25), patch('red', 0.12, 0.08, 0.78, -0.25), gloves('white', 1.2), boots('white', 1.08)] }),
    [A.operate('visor', 'open'), G('wave', 'Hello from space!'), A.wait(0.6), A.operate('visor', 'close')],
    [A.par(A.pose('hips', { move: [0, 0.6, 0], dur: 1.2 }), A.pose('armR', { rot: [0, 0, -50], dur: 1.2 }), A.pose('armL', { rot: [0, 0, 50], dur: 1.2 }), A.say('Look, no gravity!', 2.4)), A.par(A.pose('hips', { move: [0, 0, 0], dur: 1.2 }), A.pose('armR', { rot: [0, 0, 0], dur: 1.2 }), A.pose('armL', { rot: [0, 0, 0], dur: 1.2 }))],
  )),
  // Beside a brass telescope on a wooden tripod; tilts it up to the sky.
  e('astronomer', 'town', 'science', () => act(W('astronomer', { top: 'navy', long: true, bottom: 'darkgray', shoes: 'black', acc: [face('glasses'), face('beard', 'gray'), card('★ ☾', 'navy', 'L'), X((d) => {
    const k = d.H / 1.7, x0 = -0.7 * k, top = 1.05 * k;
    return [
      ...[[0, 0.22], [0.2, -0.12], [-0.2, -0.12]].map(([dx, dz]) => ['', 'capsule', [0.035, top * 1.06, 0.035], [x0 + dx * 0.5 * k, top / 2, dz * 0.5 * k], 'darkwood', { srot: [-dz * 25, 0, dx * 25], edge: 'sharp' }] as XP),
      ['', 'cyl', [0.09, 0.08, 0.09], [x0, top, 0], 'brass', { edge: 'sharp' }],
      ['', 'cyl', [0.13 * k, 0.95 * k, 0.13 * k], [x0, top + 0.12 * k, 0], 'brass', { name: 'scope', srot: [55, 0, 0], off: [0, 0.2 * k, 0.14 * k], taper: 0.8, edge: 'sharp', mover: { kind: 'swing', axis: 'x', amount: -30 } }],
      ['scope', 'cyl', [0.16 * k, 0.06 * k, 0.16 * k], [0, 0.47 * k, 0.4 * k], '#2a2726', { srot: [55, 0, 0], edge: 'sharp' }],
      ['scope', 'cyl', [0.045 * k, 0.12 * k, 0.045 * k], [0, -0.07 * k, -0.33 * k], '#2a2726', { srot: [55, 0, 0] }],
      ['scope', 'cyl', [0.04 * k, 0.3 * k, 0.04 * k], [0, 0.3 * k, 0.05 * k], 'brass', { srot: [55, 0, 0] }],
    ];
  })] }),
    [A.operate('scope', 'open'), G('point', 'Look, a shooting star!'), A.effect('sparkle', { dur: 1.2 }), A.operate('scope', 'close')],
    [G('look_around', 'Hmm, is that Saturn?')],
  )),
  // A science T-shirt, glasses and a book: shrugs at what cannot be shown.
  e('atheist', 'town', 'religion', () => act(W('atheist', { pose: 'cross', top: 'teal', bottom: 'denim', shoes: 'white', acc: [face('glasses'), chest('?', 'white', 0.3, 0.26)] }),
    [G('shrug', 'I\'ll believe it when I see it.', 2.2)],
    [G('shake_head', 'Show me the evidence!')],
  )),
  // A runner in vest, shorts and headband with a gold medal: jumping jacks, then celebrates.
  e('athlete', 'sports', 'athletes', () => act(W('athlete', { skin: 'skin4', top: 'red', bottom: 'navy', legs: 'skin4', shorts: true, shoes: 'white', hair: '#1d1d1d', style: 'short', acc: [hat('headband', 'white'), chest('7', 'white', 0.45, 0.25, 0.55), wear('medal'), wristbands('white')] }),
    [to({ armR: [0, 0, -150], armL: [0, 0, 150], legL: [0, 0, 14], legR: [0, 0, -14] }, 'One, two! One, two!', 0.3), to({ armR: [0, 0, 0], armL: [0, 0, 0], legL: [0, 0, 0], legR: [0, 0, 0] }, undefined, 0.3), to({ armR: [0, 0, -150], armL: [0, 0, 150], legL: [0, 0, 14], legR: [0, 0, -14] }, undefined, 0.3), to({ armR: [0, 0, 0], armL: [0, 0, 0], legL: [0, 0, 0], legR: [0, 0, 0] }, undefined, 0.3)],
    [G('arms_up', 'I won the gold!')],
  )),
  // A baby in a sleepsuit with a dummy and a rattle: giggles, then wails.
  e('baby', 'town', 'family', () => act(W('baby', { h: 'baby', skin: 'skin1', hair: 'gold', style: 'short', top: 'skyblue', long: true, bottom: 'skyblue', shoes: 'skyblue', acc: [pacifier(), inHand('R', (a) => [['capsule', [a * 0.5, a * 2, a * 0.5], [0, a * 0.3, a * 0.6], 'pink'], ['ball', [a * 1.6, a * 1.6, a * 1.6], [0, a * 1.6, a * 0.6], 'yellow', { name: 'rattle' }]]), rest({ armR: [-30, 0, -20], foreR: [-40, 0, 0] })] }),
    [A.par(A.anim('laugh'), A.pose('armR', { rot: [-50, 0, 0], dur: 0.2 }), A.say('Hee hee! Goo goo!', 2)), A.pose('armR', { rot: [10, 0, 0], dur: 0.2 }), A.pose('armR', { rot: [-50, 0, 0], dur: 0.2 }), A.pose('armR', { rot: [0, 0, 0], dur: 0.3 })],
    [G('cry', 'Waaah!')],
  )),
  // A babysitter with a phone and a baby bottle, and the toddler she minds, who cheers for the bottle.
  e('babysitter', 'town', 'family', () => act(together('babysitter', [[W('babysitter', { top: 'pink', bottom: 'denim', shoes: 'white', style: 'ponytail', acc: [held('phone', 'black', 'L'), inHand('R', (a) => [['cyl', [a * 1.1, a * 2.2, a * 1.1], [0, a * 0.4, a * 0.8], 'white'], ['cyl', [a * 0.7, a * 0.8, a * 0.7], [0, a * 1.8, a * 0.8], 'skyblue', { taper: 0.4 }]])] }), -0.25], [W('babysitter baby', { h: 'baby', top: 'yellow', long: true, bottom: 'yellow', shoes: 'white', style: 'short', acc: [pacifier()] }), 0.42, 0.15]]),
    hold(OFFER, 'Bottle time, little one!', 1.4),
    [A.par(A.pose('b_armR', { rot: [0, 0, -140], dur: 0.35 }), A.pose('b_armL', { rot: [0, 0, 140], dur: 0.35 }), A.say('Yay! Bottle!', 1.8)), A.wait(1.2), A.par(A.pose('b_armR', { rot: [0, 0, 0], dur: 0.4 }), A.pose('b_armL', { rot: [0, 0, 0], dur: 0.4 }))],
  )),
  // A baker in whites with a baguette and rolling pin: brings out a cake, then puffs flour everywhere.
  e('baker', 'town', 'food service', () => act(W('baker', { top: 'white', long: true, bottom: 'gray', shoes: 'black', acc: [hat('chef'), nameHat(), wear('apron', 'cream'), wear('scarf', 'red'), patch('white', 0.3, 0.12, 0.3, 0.1), inHand('L', (a) => [['capsule', [a * 1.1, a * 6, a * 1.1], [0, a * 1.2, a * 0.9], 'bread', { srot: [-25, 0, 0] }], ...[0.2, 1.2, 2.2].map((t) => ['capsule', [a * 0.3, a * 0.9, a * 0.2], [0, a * t, a * 1.5 + a * t * 0.45], 'crust', { srot: [40, 0, 0] }] as HP)]), inHand('R', (a) => [['capsule', [a * 1.0, a * 4.5, a * 1.0], [0, -a * 0.4, a * 0.8], 'lightwood', { srot: [90, 0, 0] }], ['capsule', [a * 0.4, a * 1.4, a * 0.4], [0, -a * 0.4, -a * 1.9], 'wood', { srot: [90, 0, 0] }], ['capsule', [a * 0.4, a * 1.4, a * 0.4], [0, -a * 0.4, a * 3.5], 'wood', { srot: [90, 0, 0] }]])] }),
    show('cake', 'Fresh from the oven!', 'point'),
    [A.par(A.effect('dust', { dur: 1.4 }), A.anim('laugh'), A.say('Oops! Flour everywhere!', 2))],
  )),
  // Pinstripes, bowler, monocle and mustache, a bag of money and a briefcase.
  e('banker', 'town', 'office', () => act(W('banker', { top: 'white', long: true, bottom: '#3a3a4a', shoes: 'black', hair: 'white', style: 'short', build: 1.2, acc: [suitX('#3a3a4a', 'gold'), hat('bowler', 'black'), nameHat(), face('monocle'), face('mustache', 'white'), X((d) => [['torso', 'capsule', [d.tw * 0.03, d.tw * 0.35, d.tw * 0.03], [d.tw * 0.2, d.torsoH * 0.45, d.td * 0.56], 'gold', { srot: [0, 0, 70] }]]), sack('#c8a46a', '$'), held('briefcase', 'black')] }),
    tipHat('Good day, sir.'),
    [A.par(A.anim('laugh'), A.effect('sparkle', { dur: 1.2 }), A.say('Ho ho! Profits are up!', 2))],
  )),
  // A huge warrior in furs with a horned helmet and a battle-axe; roars, then lifts the axe.
  e('barbarian', 'town', 'warriors', () => act(W('barbarian', { h: 1.9, build: 1.35, skin: 'skin3', top: 'skin3', bottom: '#6b4a2e', legs: 'skin3', shorts: true, shoes: 'brown', hair: '#1d1d1d', style: 'long', acc: [hat('viking', 'iron'), nameHat(), face('beard', '#1d1d1d'), X((d) => [['torso', 'ball', [d.tw * 1.25, d.torsoH * 0.4, d.td * 1.4], [0, d.torsoH * 0.9, -d.td * 0.05], '#a07a50', { layer: 2 }]]), wear('belt', 'brown'), wear('sash', '#6b4a2e'), wristbands('#6b4a2e'), boots('#6b4a2e'), held('axe')] }),
    [G('arms_up', 'RAAARGH!')],
    hold({ armR: [0, 0, -160] }, 'For glory!', 1.4),
  )),
  // A barber in waistcoat and bowtie with scissors and comb, by a barber's pole that turns.
  e('barber', 'town', 'beauty', () => act(W('barber', { top: 'white', bottom: 'black', shoes: 'black', hair: '#1d1d1d', style: 'short', acc: [wear('vest', 'black'), wear('bowtie', 'red'), face('mustache', '#1d1d1d'), rest({ armL: [-20, 0, 10], foreL: [-60, 0, -10] }), held('scissors'), comb(), X((d) => {
    const k = d.H / 1.7, x0 = -0.62 * k;
    return [
      ['', 'cyl', [0.28, 0.04, 0.28], [x0, 0.02, 0.1], 'silver', { edge: 'sharp' }],
      ['', 'cyl', [0.05, 0.86 * k, 0.05], [x0, 0.45 * k, 0.1], 'silver', { edge: 'sharp' }],
      ['', 'cyl', [0.19, 0.07, 0.19], [x0, 0.9 * k, 0.1], 'silver', { edge: 'sharp' }],
      ['', 'cyl', [0.15, 0.62 * k, 0.15], [x0, 1.25 * k, 0.1], 'white', { name: 'pole', mover: { kind: 'spin', axis: 'y', amount: 90, on: true } }],
      ...[-0.22, -0.08, 0.06, 0.2].map((yy, i) => ['pole', 'torus', [0.16, 0.16, 0.035], [0, yy * k, 0], i % 2 ? 'blue' : 'red', { srot: [62, 0, 0], tube: 0.3 }] as XP),
      ['', 'cyl', [0.19, 0.07, 0.19], [x0, 1.6 * k, 0.1], 'silver', { edge: 'sharp' }],
      ['', 'ball', [0.17, 0.14, 0.17], [x0, 1.68 * k, 0.1], 'silver'],
    ];
  })] }),
    hold({ armR: [-65, 0, -15], foreR: [-30, 0, 0] }, 'Snip, snip! Just a trim?', 1.6),
    [G('point', 'Next, please!')],
  )),
  // Black shirt and green apron, a cup of coffee held out with steam rising.
  e('barista', 'town', 'food service', () => act(W('barista', { top: 'black', bottom: 'black', shoes: 'black', style: 'bun', acc: [wear('apron', 'darkgreen'), wear('badge', 'white'), rest({ armR: [-20, 0, -8], foreR: [-68, 0, 8] }), onPalm('R', (a) => [['cyl', [a * 1.2, a * 1.6, a * 1.2], [0, a * 1.0, a * 1.0], 'white', { taper: 1.2 }], ['cyl', [a * 1.25, a * 0.2, a * 1.25], [0, a * 1.85, a * 1.0], 'coffee'], ['torus', [a * 0.8, a * 0.8, a * 0.2], [a * 0.75, a * 1.1, a * 1.0], 'white', { tube: 0.25 }]])] }),
    hold({ armR: [-35, 0, 0] }, 'One latte, extra foam!', 1.6, [A.effect('steam', { dur: 1.6 })]),
    [G('wave', 'Have a nice day!')],
  )),
  // Cap, pinstripe jersey and a bat: swings, and the ball flies away.
  e('baseball player', 'sports', 'athletes', () => act(W('baseball player', { top: 'white', bottom: 'white', legs: 'navy', shoes: 'black', acc: [hat('cap', 'navy'), nameHat(), chest('12', 'white', 0.4, 0.25), wear('belt', 'navy'), held('bat'), inHand('L', (a) => [['ball', [a * 2.4, a * 2.8, a * 1.4], [0, -a * 0.4, a * 0.4], 'brown']])] }),
    [to({ torso: [0, -50, 0], armR: [-85, 0, -10] }, undefined, 0.35), A.spawn('ball', 'baseball', { rel: 'front', of: 'self', dist: 'close', height: 'low' }), A.par(A.pose('torso', { rot: [0, 70, 0], dur: 0.2 }), A.move('ball', { rel: 'far', of: 'self' }, { speed: 'fly' }), A.say('Crack! Home run!', 2)), A.remove('ball', 'fade'), A.par(A.pose('torso', { rot: [0, 0, 0], dur: 0.4 }), A.pose('armR', { rot: [0, 0, 0], dur: 0.4 }))],
    [G('thumbs_up', 'Play ball!')],
  )),
  // Two metres tall in a purple 23 jersey: dribbles the ball, then shoots.
  e('basketball player', 'sports', 'athletes', () => act(W('basketball player', { h: 1.98, build: 0.95, skin: 'skin5', top: 'purple', bottom: 'purple', legs: 'skin5', shorts: true, shoes: 'white', hair: '#1d1d1d', style: 'short', acc: [chest('23', 'yellow', 0.4, 0.25), hat('headband', 'white'), wristbands('white'), X((d) => [['handR', 'ball', [d.aw * 3.2, d.aw * 3.2, d.aw * 3.2], [0, -d.aw * 2.2, d.aw * 0.8], 'orange', { name: 'ball' }], ['ball', 'torus', [d.aw * 3.25, d.aw * 3.25, d.aw * 0.15], [0, 0, 0], '#2a2726', { tube: 0.04, srot: [0, 90, 0] }], ['ball', 'torus', [d.aw * 3.25, d.aw * 3.25, d.aw * 0.15], [0, 0, 0], '#2a2726', { tube: 0.04 }]])] }),
    [A.par(A.pose('ball', { move: [0, -0.5, 0], dur: 0.2 }), A.say('Bounce, bounce...', 2)), A.pose('ball', { move: [0, 0, 0], dur: 0.2 }), A.pose('ball', { move: [0, -0.5, 0], dur: 0.2 }), A.pose('ball', { move: [0, 0, 0], dur: 0.2 }), A.pose('ball', { move: [0, -0.5, 0], dur: 0.2 }), A.pose('ball', { move: [0, 0, 0], dur: 0.2 })],
    [A.spawn('shot', 'basketball', { rel: 'front', of: 'self', dist: 'close', height: 'high' }), A.par(A.anim('arms_up'), A.move('shot', { rel: 'far', of: 'self' }, { speed: 'fly' }), A.say('Swish! Nothing but net!', 2)), A.remove('shot', 'fade')],
  )),
  // The caped crusader: grey suit, black cowl and cape, yellow belt and bat badge.
  e('batman', 'town', 'superheroes', () => act(W('batman', { pose: 'hips', h: 1.88, build: 1.2, skin: 'skin1', top: 'darkgray', long: true, bottom: 'darkgray', shoes: 'black', style: 'none', acc: [cowl('black'), wear('cape', 'black'), wear('belt', 'yellow'), patch('yellow', 0.46, 0.2, 0.72), X((d) => [['torso', 'wedge', [d.tw * 0.36, d.torsoH * 0.12, d.td * 0.05], [0, d.torsoH * 0.72, d.td * 0.58], 'black', { srot: [0, 0, 180], layer: 6 }]]), gloves('black'), boots('black')] }),
    [G('nod', 'I am Batman.')],
    [A.par(A.effect('smoke', { dur: 2 }), A.anim('spin'), A.say('To the Batcave!', 2))],
  )),
  // A stylist in a pink smock with a hair dryer and a comb.
  e('beautician', 'town', 'beauty', () => act(W('beautician', { top: 'pink', bottom: 'white', shoes: 'white', hair: '#a0522d', style: 'long', acc: [wear('apron', 'magenta'), hairdryer(), comb()] }),
    hold({ armR: [-70, 0, -40], foreR: [-30, 0, 0] }, 'Whoosh! Lovely and dry!', 1.6, [A.effect('steam', { dur: 1.5 })]),
    [G('clap', 'You look fabulous!')],
  )),
  // Wild grey hair, a white cravat and a conductor's baton: conducts his Fifth, and cups an ear.
  e('beethoven', 'town', 'history', () => act(W('beethoven', { skin: 'skin2', hair: '#8f969e', style: 'long', top: 'darkgreen', long: true, bottom: 'black', shoes: 'black', acc: [mop('#8f969e', 1.1), wear('scarf', 'white'), tails('darkgreen'), held('scroll', 'paper', 'L'), held('baton', 'black')] }),
    [to({ armR: [-60, 0, -60] }, '♪ Da-da-da-DUM! ♪', 0.25), to({ armR: [-40, 0, -15] }, undefined, 0.2), to({ armR: [-60, 0, -60] }, undefined, 0.25), to({ armR: [-40, 0, -15] }, undefined, 0.2), to({ armR: [-90, 0, -40] }, undefined, 0.3), A.wait(0.4), to({ armR: [0, 0, 0] }, undefined, 0.4)],
    hold({ armR: [-20, 0, -62], foreR: [-25, 0, -112] }, 'Eh? Speak up!', 1.6),
  )),
  // Patched coat, beanie and scarf, holding out a tin cup.
  e('beggar', 'town', 'street', () => act(W('beggar', { top: '#8a7a5a', long: true, bottom: '#6b5a3a', shoes: 'darkbrown', hair: 'gray', style: 'short', acc: [hat('beanie', 'darkgray'), nameHat(), face('beard', 'gray'), wear('scarf', 'darkred'), patch('#a08a5a', 0.2, 0.16, 0.35, 0.2), patch('#5a4a2a', 0.16, 0.12, 0.6, -0.2), rest({ armR: [-20, 0, -8], foreR: [-65, 0, 8] }), onPalm('R', (a) => [['cyl', [a * 1.3, a * 1.5, a * 1.3], [0, a * 1.0, a * 1.0], 'steel', { taper: 1.1, edge: 'sharp' }]]), card('PLEASE HELP', '#d9b98a', 'L')] }),
    hold({ armR: [-35, 0, 0] }, 'Spare some change?', 1.6),
    [A.par(A.anim('bow'), A.effect('sparkle', { dur: 1 }), A.say('Thank you, kind soul.', 2))],
  )),
  // A hotel bellhop in red with a pillbox hat, beside a brass luggage cart loaded with cases.
  e('bellhop', 'town', 'hotel', () => act(topOf(W('bellhop', { top: 'red', long: true, bottom: 'black', shoes: 'black', acc: [pillbox('red'), X((d) => [['hat', 'box', [d.headW * 0.66, d.headH * 0.05, d.headD * 0.62], [0, -d.headH * 0.06, 0], 'gold']]), epaul('gold'), buttons('gold', 4, 0.15), buttons('gold', 4, -0.15), gloves('white', 0.9), X((d) => {
    const k = d.H / 1.7, x0 = 0.85 * k, z0 = 0.05;
    const r: XP[] = [
      ['', 'box', [0.62, 0.05, 1.05], [x0, 0.24, z0], 'brass', { edge: 'sharp', round: 0.2 }],
      ['', 'box', [0.58, 0.02, 1.0], [x0, 0.275, z0], 'darkred', { edge: 'sharp', round: 0.1, name: 'cart' }],
      ...[[0.25, 0.42], [-0.25, 0.42], [0.25, -0.42], [-0.25, -0.42]].map(([dx, dz], i) => ['', 'cyl', [0.15, 0.05, 0.15], [x0 + dx, 0.075, z0 + dz], 'rubber', { srot: [0, 0, 90], name: `wheel${i + 1}`, edge: 'soft' }] as XP),
      ...[[0.27, 0.5], [-0.27, 0.5], [0.27, -0.5], [-0.27, -0.5]].map(([dx, dz]) => ['', 'cyl', [0.03, 1.55, 0.03], [x0 + dx, 1.03, z0 + dz], 'brass', { edge: 'sharp' }] as XP),
      ...[0.5, -0.5].map((dz) => ['', 'arc', [0.6, 0.3, 0.035], [x0, 1.8, z0 + dz], 'brass', { tube: 0.12, arc: 180, edge: 'sharp' }] as XP),
      ['', 'cyl', [0.03, 1.0, 0.03], [x0, 1.95, z0], 'brass', { srot: [90, 0, 0], edge: 'sharp' }],
      ['', 'box', [0.46, 0.3, 0.62], [x0, 0.44, z0 - 0.18], '#6b4a2e', { edge: 'sharp', round: 0.12 }],
      ['', 'box', [0.4, 0.24, 0.42], [x0, 0.72, z0 - 0.2], '#c8955a', { edge: 'sharp', round: 0.12 }],
      ['', 'cyl', [0.32, 0.22, 0.32], [x0, 0.4, z0 + 0.3], '#4f8fd6', { edge: 'sharp' }],
      ['', 'arc', [0.12, 0.08, 0.02], [x0, 0.88, z0 - 0.2], 'darkbrown', { tube: 0.3, arc: 180 }],
    ];
    return r;
  })] }), 'cart', 'cart'),
    [G('bow', 'Welcome! May I take your bags?', 2.2)],
    [G('point', 'Your room is this way!')],
  )),
  // Bald with long grey sides, little glasses and a waistcoat, flying his kite with a key on the string.
  e('benjamin franklin', 'town', 'history', () => act(W('benjamin franklin', { skin: 'skin1', hair: '#d4d7da', style: 'bald', top: 'brown', long: true, bottom: 'brown', legs: 'white', shoes: 'black', build: 1.15, acc: [sideHair('#d4d7da'), face('glasses', '#5a3a22'), wear('vest', 'tan'), rest(KITE_ARM), kite('red')] }),
    [A.par(A.effect('sparkle', { dur: 1.5 }), A.expr('surprised'), A.pose('kite', { rot: [0, 10, 0], dur: 0.3, times: 3 }), A.say('Electricity!', 2)), A.expr('neutral')],
    [G('nod', 'Early to bed, early to rise.', 2.2)],
  )),
  // Sasquatch: 2.4 m, shaggy brown, big feet; shy, then roars.
  e('bigfoot', 'fantasy', 'cryptids', () => act(W('bigfoot', { h: 2.4, build: 1.4, skin: '#9a7458', hair: '#5a3a22', style: 'long', top: '#5a3a22', long: true, bottom: '#5a3a22', shoes: '#3b2a1e', eyes: '#1d1d1d', acc: [mop('#5a3a22', 0.95), X((d) => [['torso', 'ball', [d.tw * 0.6, d.torsoH * 0.45, d.td * 0.3], [0, d.torsoH * 0.55, d.td * 0.42], '#7a5a40', { layer: 3 }]]), boots('#3b2a1e', 1.15), gloves('#5a3a22', 1.3)] }),
    [G('look_around', 'Hrrm...?', 1.6)],
    [G('arms_up', 'ROOAAARR!')],
  )),
  // A biker in leathers, bandana, shades and beard, gripping invisible handlebars to rev up.
  e('biker', 'town', 'drivers', () => act(W('biker', { top: 'black', long: true, bottom: 'denim', shoes: 'black', hair: 'gray', build: 1.2, acc: [hat('bandana', '#2a2726'), face('sunglasses'), face('beard', 'gray'), wear('vest', '#2a2726'), wear('belt', 'silver'), gloves('#2a2726'), boots('black'), inHand('L', (a) => [['ball', [a * 3, a * 3, a * 3], [0, -a * 1.4, a * 1.0], 'red'], ['ball', [a * 2.2, a * 1.2, a * 1], [0, -a * 1.2, a * 2.2], 'black']])] }),
    hold({ armR: [-62, 0, -18], foreR: [-25, 0, 0], armL: [-62, 0, 18], foreL: [-25, 0, 0] }, 'Vroom, vroom!', 1.4, [A.effect('smoke', { dur: 1.2 })]),
    [G('thumbs_up', 'Ride free, friend!')],
  )),
  // Lab coat and glasses, a glowing test tube; shows off a frog.
  e('biologist', 'town', 'science', () => act(W('biologist', { top: 'white', bottom: 'darkgray', shoes: 'black', acc: [wear('labcoat'), face('glasses'), tube('lime'), held('clipboard', 'wood', 'L')] }),
    show('frog', 'A fine specimen!', 'point', 'fade'),
    hold(LIFT_R, 'Look, it\'s glowing!', 1.6, [A.effect('sparkle', { dur: 1.2 })]),
  )),
  // Bush hat and vest, binoculars up to the eyes, a bird book in hand.
  e('birdwatcher', 'town', 'outdoors', () => act(W('birdwatcher', { top: 'tan', bottom: 'olive', shoes: 'brown', acc: [bucket('tan'), wear('vest', 'olive'), held('book', 'darkgreen', 'L'), inHand('R', (a) => [1, -1].map((s) => ['cyl', [a * 0.9, a * 1.8, a * 0.9], [s * a * 0.55, -a * 0.6, a * 0.8], 'black', { srot: [90, 0, 0] }] as HP))] }),
    hold({ armR: [-40, 0, -28], foreR: [-112, 0, 30] }, 'Ooh, a red robin!', 1.8),
    [A.spawn('bird', 'bird', { rel: 'near', of: 'self', dist: 'close', height: 'high' }), G('point', 'There it goes!'), A.move('bird', { rel: 'far', of: 'self' }, { speed: 'fly', style: 'fly' }), A.remove('bird', 'fly_away')],
  )),
  // Black plate armour, a great helm with an eye slit, sword and shield: none shall pass.
  e('black knight', 'town', 'warriors', () => act(W('black knight', { top: 'black', long: true, bottom: 'black', shoes: 'black', build: 1.15, acc: [wear('armor', '#3a3a3a'), greathelm('#3a3a3a'), crest('black'), gloves('#3a3a3a'), boots('#3a3a3a'), rings('#3a3a3a', 'shinL', [0.3, 0.6], 1.3), rings('#3a3a3a', 'shinR', [0.3, 0.6], 1.3), held('sword'), held('shield', 'black', 'L')] }),
    [G('hands_on_hips', 'None shall pass!')],
    hold({ armR: [0, 0, -155] }, 'Have at you!', 1.4),
  )),
  // A smith in a leather apron at a real anvil on its stump, a glowing horseshoe on it: hammers, then quenches.
  e('blacksmith', 'town', 'trades', () => act(topOf(W('blacksmith', { build: 1.3, top: 'gray', bottom: 'darkbrown', shoes: 'black', hair: '#1d1d1d', style: 'short', acc: [wear('apron', 'leather'), face('beard', '#1d1d1d'), gloves('#5a3a22'), held('hammer'), X((d) => {
    const k = d.H / 1.7, x0 = -0.62 * k, z0 = 0.3;
    return [
      ['', 'cyl', [0.4, 0.5, 0.4], [x0, 0.25, z0], 'darkwood', { segs: 9 }],
      ['', 'box', [0.34, 0.08, 0.24], [x0, 0.54, z0], 'iron', { edge: 'sharp', round: 0.15 }],
      ['', 'box', [0.16, 0.12, 0.13], [x0, 0.64, z0], 'iron', { edge: 'sharp', round: 0.15 }],
      ['', 'box', [0.46, 0.12, 0.17], [x0 - 0.04, 0.76, z0], 'iron', { edge: 'sharp', round: 0.12, name: 'anvil' }],
      ['', 'cyl', [0.15, 0.24, 0.12], [x0 + 0.3, 0.78, z0], 'iron', { taper: 0.05, srot: [0, 0, -90], edge: 'sharp' }],
      ['', 'torus', [0.12, 0.12, 0.025], [x0 - 0.06, 0.835, z0], '#ff7a2a', { srot: [90, 0, 0], tube: 0.3, arc: 270, name: 'hot', glow: true, mover: { kind: 'light', on: true } }],
    ];
  })] }), 'anvil', 'top', 'top', 0.3),
    [A.operate('hot', 'on'), to({ armR: [-150, 0, 5] }, undefined, 0.3), A.par(A.pose('armR', { rot: [-55, 0, 5], dur: 0.15 }), A.effect('sparkle', { dur: 0.6 }), A.say('Clang! Clang!', 1.8)), A.pose('armR', { rot: [-150, 0, 5], dur: 0.3 }), A.par(A.pose('armR', { rot: [-55, 0, 5], dur: 0.15 }), A.effect('sparkle', { dur: 0.6 })), A.pose('armR', { rot: [0, 0, 0], dur: 0.4 })],
    [A.par(A.operate('hot', 'off'), A.effect('steam', { dur: 1.6 }), A.anim('nod'), A.say('Hssss! Good, strong steel.', 2))],
  )),
  // Bulging muscles and two dumbbells: a double-biceps flex, then curls.
  e('bodybuilder', 'sports', 'athletes', () => act(W('bodybuilder', { build: 1.5, skin: 'skin3', top: 'skin3', bottom: 'red', legs: 'skin3', shorts: true, shoes: 'black', hair: '#1d1d1d', style: 'short', acc: [muscles('skin3'), wear('belt', 'black'), dumbbell('R'), dumbbell('L')] }),
    hold({ armR: [0, 0, -84], foreR: [0, 0, -100], armL: [0, 0, 84], foreL: [0, 0, 100] }, 'Check out these guns!', 1.6),
    [to({ foreR: [-130, 0, 0], foreL: [-130, 0, 0] }, 'One... two... feel the burn!', 0.45), to({ foreR: [0, 0, 0], foreL: [0, 0, 0] }, undefined, 0.45), to({ foreR: [-130, 0, 0], foreL: [-130, 0, 0] }, undefined, 0.45), to({ foreR: [0, 0, 0], foreL: [0, 0, 0] }, undefined, 0.45)],
  )),
  // A shadow in a hooded cloak with glowing eyes and a sack: jumps out with a BOO.
  e('bogeyman', 'fantasy', 'monsters', () => act(W('bogeyman', { pose: 'reach', h: 1.9, build: 0.8, skin: '#4a4a55', eyes: '#1d1d1d', style: 'none', top: 'black', long: true, bottom: 'black', shoes: 'black', acc: [wear('cloak', '#1d1d1d'), gown('#1d1d1d', 0.85), hat('hood', '#1d1d1d'), glowEyes('yellow'), gloves('#2a2a33', 1.2)] }),
    [A.par(A.anim('arms_up'), A.effect('smoke', { dur: 1.4 }), A.say('BOO!', 1.6))],
    [G('laugh', 'Heh heh heh... sleep tight.', 2.2)],
  )),
  // A bulky padded bomb suit and helmet, a bomb with a lit fuse and wire cutters.
  e('bomb disposal expert', 'town', 'military', () => act(W('bomb disposal expert', { build: 1.45, top: 'darkgreen', long: true, bottom: 'darkgreen', shoes: 'black', acc: [X((d) => {
    const { W: w, Hh, D, y } = hd(d);
    return [['head', 'ball', [w * 1.3, Hh * 1.25, D * 1.3], [0, y + Hh * 0.04, 0], 'darkgreen', { name: 'helmet' }], ['head', 'box', [w * 0.9, Hh * 0.55, D * 0.1], [0, y + Hh * 0.02, D * 0.62], '#8fb8c8', { round: 0.4, layer: 6, edge: 'sharp' }], ['torso', 'box', [d.tw * 1.3, d.torsoH * 0.5, d.td * 0.5], [0, d.torsoH * 0.95, -d.td * 0.15], 'olive', { round: 0.5 }]];
  }), wear('armor', 'olive'), gloves('black', 1.2), boots('black', 1.1), inHand('L', (a) => [['ball', [a * 2.6, a * 2.6, a * 2.6], [0, -a * 0.6, a * 1.6], 'black'], ['capsule', [a * 0.25, a * 1.2, a * 0.25], [0, a * 1.0, a * 1.6], 'tan'], ['ball', [a * 0.6, a * 0.6, a * 0.6], [0, a * 1.7, a * 1.6], 'flame', { glow: true, name: 'fuse' }]]), held('scissors')] }),
    [A.pose('fuse', { scale: 1, dur: 0.2 }), G('look_around', 'Red wire... or blue wire?')],
    [to(LIFT_R, 'Snip!', 0.35), A.pose('fuse', { scale: 0, dur: 0.15 }), A.par(A.pose('armR', { rot: [0, 0, 0], dur: 0.4 }), A.pose('foreR', { rot: [0, 0, 0], dur: 0.4 })), G('thumbs_up', 'Phew! All safe.')],
  )),
  // A loud check suit and fedora, a betting slip and a fat wad of cash.
  e('bookie', 'town', 'crime', () => act(W('bookie', { top: 'white', long: true, bottom: 'brown', shoes: 'black', acc: [suitX('#a0522d', 'yellow'), fedora('tan'), X((d) => [['head', 'capsule', [d.headW * 0.05, d.headW * 0.3, d.headW * 0.05], [d.headW * 0.15, d.headY - d.headH * 0.22, d.headD * 0.58], 'darkbrown', { srot: [80, 0, 20], layer: 6 }]]), card('5 TO 1', 'paper', 'R', 3, 3.6), inHand('L', (a) => [['box', [a * 2.4, a * 1.0, a * 1.2], [0, -a * 0.4, a * 1.0], 'green', { edge: 'sharp' }], ['box', [a * 0.6, a * 1.05, a * 1.25], [0, -a * 0.4, a * 1.0], 'gold']])] }),
    hold(LIFT_R, 'Five to one on the grey horse!', 1.8),
    [G('wink', 'Place your bets, place your bets!')],
  )),
  // The boss in a sharp suit with a mug of coffee and a phone.
  e('boss', 'town', 'office', () => act(W('boss', { hair: 'gray', style: 'short', top: 'white', long: true, bottom: 'black', shoes: 'black', build: 1.15, acc: [suitX('#2a2726', 'red'), rest({ armR: [-20, 0, -8], foreR: [-70, 0, 8], armL: [-6, 0, 38], foreL: [-10, 0, -110] }), onPalm('R', (a) => [['cyl', [a * 1.2, a * 1.6, a * 1.2], [0, a * 1.0, a * 1.0], 'white', { taper: 1.2 }], ['cyl', [a * 1.25, a * 0.2, a * 1.25], [0, a * 1.85, a * 1.0], 'coffee'], ['torus', [a * 0.8, a * 0.8, a * 0.2], [a * 0.75, a * 1.1, a * 1.0], 'white', { tube: 0.25 }]])] }),
    [G('point', 'You\'re hired!')],
    [G('hands_on_hips', 'Is that report done yet?')],
  )),
  // Straw hat and green vest with a potted plant whose flower opens, and a magnifier.
  e('botanist', 'town', 'science', () => act(W('botanist', { top: 'green', bottom: 'tan', shoes: 'brown', acc: [hat('straw'), nameHat(), wear('vest', 'darkgreen'), rest({ armL: [-20, 0, 10], foreL: [-65, 0, -10] }), onPalm('L', (a) => [['cyl', [a * 2.2, a * 2.0, a * 2.2], [0, a * 1.0, a * 0.8], '#c8693a', { taper: 1.3 }], ['capsule', [a * 0.25, a * 2.6, a * 0.25], [0, a * 2.9, a * 0.8], 'green'], ['ball', [a * 1.6, a * 0.5, a * 0.9], [a * 0.6, a * 2.5, a * 0.8], 'leaf', { srot: [0, 0, -30] }], ['ball', [a * 1.6, a * 0.5, a * 0.9], [-a * 0.6, a * 3.0, a * 0.8], 'leaf', { srot: [0, 0, 30] }], ['ball', [a * 1.6, a * 1.2, a * 1.6], [0, a * 4.3, a * 0.8], 'yellow', { name: 'bloom', scale: 0 }], ['ball', [a * 0.9, a * 0.7, a * 0.9], [0, a * 4.2, a * 0.8], 'green']]), held('magnifier', 'gold')] }),
    [A.par(A.pose('bloom', { scale: 1, dur: 1.0 }), A.effect('sparkle', { dur: 1.2 }), A.say('Look, it bloomed!', 2))],
    [A.par(A.pose('bloom', { scale: 0, dur: 0.6 }), A.anim('nod'), A.say('Water it every day.', 2))],
  )),
  // A big bouncer, arms folded, by a velvet rope on brass posts.
  e('bouncer', 'town', 'law and order', () => act(W('bouncer', { h: 1.9, build: 1.45, skin: 'skin4', style: 'bald', top: 'black', bottom: 'black', shoes: 'black', pose: 'cross', acc: [face('sunglasses'), chest('SECURITY', 'black', 0.8, 0.14, 0.75), X((d) => [['head', 'capsule', [d.headW * 0.05, d.headH * 0.3, d.headW * 0.05], [-d.headW * 0.5, d.headY, d.headD * 0.1], 'black', { srot: [0, 0, 20] }]]), beside(() => [
    ...[0.65, 1.55].flatMap((xx) => [['cyl', [0.3, 0.04, 0.3], [xx, 0.02, 0.15], 'brass', { edge: 'sharp' }], ['cyl', [0.06, 0.95, 0.06], [xx, 0.5, 0.15], 'brass', { edge: 'sharp' }], ['ball', [0.1, 0.1, 0.1], [xx, 1.0, 0.15], 'brass']] as HP[]),
    ['arc', [0.9, 0.22, 0.05], [1.1, 0.93, 0.15], 'darkred', { arc: 180, tube: 0.25, srot: [0, 0, 180] }],
  ])] }),
    [G('shake_head', 'Sorry. Not on the list.')],
    [G('nod', 'Alright, you can go in.')],
  )),
  // Cowboy hat, duster and a wanted poster he holds up.
  e('bounty hunter', 'town', 'law and order', () => act(W('bounty hunter', { top: '#8a6a3a', long: true, bottom: 'darkbrown', shoes: 'black', acc: [hat('cowboy', '#3a2a20'), nameHat(), wear('coat', '#6b4a2e'), face('beard', '#5a3a22'), wear('belt', 'black'), boots('#3a2a20'), card('WANTED', '#e8d29a', 'L', 4, 5), held('blaster', 'darkgray')] }),
    hold({ armL: [-75, 0, 10], foreL: [-30, 0, 0] }, 'Seen this varmint?', 1.8),
    tipHat('I always get my man.'),
  )),
  // In a two-tone bowling shirt with a ball, beside three pins; bowls a strike.
  e('bowler (person)', 'sports', 'athletes', () => act(W('bowler (person)', { top: 'teal', bottom: 'tan', shoes: 'red', acc: [X((d) => [['torso', 'box', [d.tw * 0.3, d.torsoH * 1.0, d.td * 1.1], [d.tw * 0.3, d.torsoH * 0.5, 0], 'white', { round: 0.4, layer: 2 }]]), wear('belt', 'brown'), X((d) => [['handR', 'ball', [d.aw * 2.6, d.aw * 2.6, d.aw * 2.6], [0, -d.aw * 0.8, d.aw * 1.2], 'black', { name: 'ball' }]]), X((d) => {
    const k = d.H / 1.7;
    return [[0.62, 0.35], [0.5, 0.15], [0.74, 0.15]].flatMap(([xx, zz], i) => {
      const n = `pin${i + 1}`, x0 = xx * k;
      return [
        ['', 'ball', [0.12, 0.2, 0.12], [x0, 0.1, zz], 'white', { name: n, off: [0, 0.03, 0], piece: true }],
        [n, 'capsule', [0.07, 0.16, 0.07], [0, 0.17, 0], 'white'],
        [n, 'ball', [0.085, 0.1, 0.085], [0, 0.29, 0], 'white'],
        [n, 'torus', [0.075, 0.075, 0.02], [0, 0.21, 0], 'red', { srot: [90, 0, 0], tube: 0.35 }],
      ] as XP[];
    });
  })] }),
    [to({ armR: [55, 0, 0] }, undefined, 0.35), A.par(A.pose('armR', { rot: [-60, 0, 0], dur: 0.25 }), A.pose('ball', { scale: 0, dur: 0.1, delay: 0.2 })), A.spawn('b', 'bowling ball', { rel: 'front', of: 'self', dist: 'close' }), A.move('b', { rel: 'far', of: 'self' }, { speed: 'run', style: 'slide' }), A.par(A.pose('pin1', { rot: [0, 0, -85], dur: 0.3 }), A.pose('pin2', { rot: [70, 0, 30], dur: 0.35 }), A.pose('pin3', { rot: [-70, 0, -40], dur: 0.4 }), A.anim('arms_up'), A.say('Strike!', 1.6)), A.remove('b', 'fade'), A.wait(0.8), A.par(A.pose('pin1', { rot: [0, 0, 0], dur: 0.3 }), A.pose('pin2', { rot: [0, 0, 0], dur: 0.3 }), A.pose('pin3', { rot: [0, 0, 0], dur: 0.3 }), A.pose('armR', { rot: [0, 0, 0], dur: 0.3 }), A.pose('ball', { scale: 1, dur: 0.3 }))],
    [G('thumbs_up', 'Lucky shirt, lucky shoes!')],
  )),
  // The Koopa king: 2.5 m, spiked shell, horns, red mane; breathes fire and stomps.
  e('bowser', 'fantasy', 'game characters', () => act(W('bowser', { h: 2.5, build: 1.45, skin: '#e8b83a', hair: 'red', style: 'none', top: '#f6e08a', bottom: '#e8b83a', shoes: '#e8b83a', eyes: '#c0392b', acc: [koopa('darkgreen'), horns2('cream', 1.5), mop('red', 0.7), muzzle('#f6e08a'), wristbands('black'), bands('#e8b83a', [0.3, 0.5])] }),
    [A.par(A.anim('arms_up'), A.effect('fire', { dur: 1.6 }), A.say('GWAHAHA!', 2))],
    [G('hands_on_hips', 'Bow before the Koopa King!', 2.2)],
  )),
  // Gloves up in a guard: jabs, then raises his arms as champ.
  e('boxer (person)', 'sports', 'athletes', () => act(W('boxer (person)', { build: 1.2, skin: 'skin4', top: 'skin4', bottom: 'red', legs: 'skin4', shorts: true, shoes: 'white', hair: '#1d1d1d', style: 'short', acc: [muscles('skin4'), gloves('red', 2.0), wear('belt', 'gold'), rest({ armR: [-30, 0, -15], foreR: [-110, 0, 20], armL: [-30, 0, 15], foreL: [-110, 0, -20] })] }),
    [to({ armR: [-55, 0, 10], foreR: [100, 0, -20] }, 'Jab! Jab!', 0.12), to({ armR: [0, 0, 0], foreR: [0, 0, 0] }, undefined, 0.15), to({ armL: [-55, 0, -10], foreL: [100, 0, 20] }, undefined, 0.12), to({ armL: [0, 0, 0], foreL: [0, 0, 0] }, undefined, 0.15), to({ armR: [-55, 0, 10], foreR: [100, 0, -20] }, undefined, 0.12), to({ armR: [0, 0, 0], foreR: [0, 0, 0] }, undefined, 0.15)],
    [A.par(A.pose('armR', { rot: [30, 0, -120], dur: 0.4 }), A.pose('armL', { rot: [30, 0, 120], dur: 0.4 }), A.say('Still the champ!', 2)), A.wait(1.4), A.par(A.pose('armR', { rot: [0, 0, 0], dur: 0.4 }), A.pose('armL', { rot: [0, 0, 0], dur: 0.4 }))],
  )),
  // Flowers behind his back... no, held out, and a heart: he offers them.
  e('boyfriend', 'town', 'family', () => act(W('boyfriend', { top: 'blue', long: true, bottom: 'denim', shoes: 'white', style: 'short', acc: [openJacket('navy'), held('bouquet'), heartH('L')] }),
    hold(OFFER, 'These are for you!', 1.6, [A.effect('hearts', { dur: 1.6 })]),
    [G('wink', 'You look amazing today!')],
  )),
  // In a white gown, veil and tiara with her bouquet: throws it over her shoulder.
  e('bride', 'town', 'wedding', () => act(W('bride', { pose: 'hold', skin: 'skin1', top: 'white', long: true, skirt: 'white', legs: 'white', shoes: 'white', hair: '#a0522d', style: 'bun', acc: [hat('veil', 'white'), hat('tiara', 'silver'), gown('white'), wear('necklace', 'white'), onPalm('R', (a) => [['cyl', [a * 0.9, a * 2.2, a * 0.9], [a * 1.5, a * 0.6, a * 0.7], 'green', { taper: 1.8 }], ...[[0, 0], [0.7, 0.3], [-0.7, 0.3], [0.3, -0.6], [-0.3, -0.6], [0, 0.7]].map(([dx, dz], i) => ['ball', [a * 1.0, a * 0.9, a * 1.0], [a * (1.5 + dx), a * 2.0, a * (0.7 + dz)], ['white', 'pink', 'white', 'cream', 'pink', 'white'][i]] as HP), ['torus', [a * 1.1, a * 1.1, a * 0.3], [a * 1.5, a * 1.0, a * 0.7], 'white', { srot: [90, 0, 0], tube: 0.3 }]])] }),
    [A.spawn('b', 'bouquet', { rel: 'near', of: 'self', dist: 'close', height: 'high' }), A.par(A.anim('arms_up'), A.move('b', { rel: 'behind', of: 'self', dist: 'far' }, { speed: 'fly' }), A.say('Catch!', 1.5)), A.remove('b', 'fade')],
    [G('nod', 'I do!')],
  )),
  // In lilac with a flower in her hair: catches the bouquet.
  e('bridesmaid', 'town', 'wedding', () => act(W('bridesmaid', { pose: 'hold', top: '#c9a0dc', skirt: '#c9a0dc', legs: '#c9a0dc', shoes: '#c9a0dc', style: 'long', acc: [hat('flower', 'white'), gown('#c9a0dc', 0.8), wear('necklace', 'silver'), onPalm('R', (a) => [['cyl', [a * 0.6, a * 1.4, a * 0.6], [a * 1.5, a * 0.5, a * 0.7], 'green', { taper: 1.6 }], ...[[0, 0], [0.5, 0.2], [-0.5, 0.2], [0, -0.5]].map(([dx, dz], i) => ['ball', [a * 0.8, a * 0.7, a * 0.8], [a * (1.5 + dx), a * 1.3, a * (0.7 + dz)], ['white', '#c9a0dc', 'white', 'pink'][i]] as HP)])] }),
    [A.spawn('b', 'bouquet', { rel: 'front', of: 'self', dist: 'close', height: 'high' }), A.par(A.anim('arms_up'), A.say('I caught the bouquet!', 2)), A.attach('b', 'self', 'hand'), A.wait(1.4), A.remove('b', 'fade')],
    [G('clap', 'What a lovely wedding!')],
  )),
  // Billionaire in a tuxedo with a glass: a toast, and a wink.
  e('bruce wayne', 'town', 'superheroes', () => act(W('bruce wayne', { h: 1.88, skin: 'skin1', hair: '#1d1d1d', style: 'short', top: 'white', long: true, bottom: 'black', shoes: 'black', acc: [suitX('black', 'black', true), patch('white', 0.1, 0.07, 0.82, 0.3), inHand('R', (a) => [['cyl', [a * 1.0, a * 1.4, a * 1.0], [0, a * 1.4, a * 1.0], 'glass', { taper: 1.3 }], ['cyl', [a * 0.85, a * 0.6, a * 0.85], [0, a * 1.2, a * 1.0], 'gold', { taper: 1.2 }], ['capsule', [a * 0.2, a * 1.0, a * 0.2], [0, a * 0.4, a * 1.0], 'glass'], ['cyl', [a * 0.8, a * 0.1, a * 0.8], [0, -a * 0.05, a * 1.0], 'glass']])] }),
    hold({ armR: [-95, 0, -10], foreR: [-30, 0, 0] }, 'A toast, to Gotham!', 1.6),
    [G('wink', 'Me? Batman? Never.')],
  )),
  // Matador: gold suit of lights, montera and a red muleta on its stick: swirls it, then bows.
  e('bullfighter', 'town', 'entertainment', () => act(W('bullfighter', { top: 'gold', long: true, bottom: 'gold', legs: 'pink', shoes: 'black', hair: '#1d1d1d', style: 'short', acc: [montera(), epaul('gold'), wear('belt', 'red'), X((d) => [['torso', 'box', [d.tw * 0.1, d.torsoH * 0.3, d.td * 0.08], [0, d.torsoH * 0.78, d.td * 0.56], 'red', { layer: 5 }]]), X((d) => {
    const a = d.aw;
    return [['handR', 'capsule', [a * 0.3, a * 6, a * 0.3], [0, -a * 0.3, a * 1.2], 'wood', { srot: [0, 0, 90], name: 'stick' }], ['stick', 'box', [a * 5.8, a * 5.2, a * 0.15], [-a * 0.2, -a * 2.7, 0], 'red', { round: 0.2, name: 'muleta', edge: 'soft' }]];
  })] }),
    [to({ armR: [-60, 0, -55] }, 'Olé!', 0.35), to({ armR: [-60, 0, 35] }, undefined, 0.5), to({ armR: [-60, 0, -55] }, undefined, 0.5), to({ armR: [0, 0, 0] }, undefined, 0.4)],
    [G('bow', 'Gracias, gracias!')],
  )),
  // A big kid with his cap on backwards and a slingshot.
  e('bully', 'town', 'school', () => act(W('bully', { pose: 'cross', h: 1.55, build: 1.35, top: 'darkgray', bottom: 'denim', shoes: 'black', acc: [capBack('red')] }),
    [G('hands_on_hips', 'Hey! What are you looking at?')],
    [G('laugh', 'Ha ha! Made you look!')],
  )),
  // A grey official with a rubber stamp and a stack of forms: stamps, then refuses.
  e('bureaucrat', 'town', 'office', () => act(W('bureaucrat', { hair: 'gray', style: 'short', top: 'white', long: true, bottom: 'gray', shoes: 'black', acc: [suitX('gray', 'navy'), face('glasses'), rest({ armL: [-20, 0, 10], foreL: [-62, 0, -10] }), inHand('R', (a) => [['capsule', [a * 0.7, a * 1.6, a * 0.7], [0, a * 0.6, a * 0.7], 'darkwood'], ['box', [a * 1.8, a * 0.6, a * 1.2], [0, -a * 0.3, a * 0.7], 'red', { edge: 'sharp' }]]), onPalm('L', (a) => [['box', [a * 2.6, a * 1.6, a * 3.2], [0, a * 0.9, a * 1.3], 'paper', { edge: 'sharp', round: 0.05 }], ['box', [a * 2.4, a * 0.05, a * 3.0], [0, a * 1.72, a * 1.3], '#f2e6c8', { edge: 'sharp' }]])] }),
    [to({ armR: [-75, 0, -12], foreR: [-50, 0, 0] }, undefined, 0.3), A.par(A.pose('foreR', { rot: [-10, 0, 0], dur: 0.12 }), A.say('Stamp! Approved.', 1.8)), A.pose('foreR', { rot: [-50, 0, 0], dur: 0.2 }), A.pose('foreR', { rot: [-10, 0, 0], dur: 0.12 }), A.par(A.pose('armR', { rot: [0, 0, 0], dur: 0.4 }), A.pose('foreR', { rot: [0, 0, 0], dur: 0.4 }))],
    [G('shake_head', 'Wrong form. Next!')],
  )),
  // Navy suit and red tie, briefcase in hand: offers a handshake, takes a call.
  e('businessman', 'town', 'office', () => act(W('businessman', { top: 'white', long: true, bottom: 'navy', shoes: 'black', hair: 'darkbrown', style: 'short', acc: [suitX('navy', 'red'), held('briefcase', 'black', 'L'), held('phone', 'black')] }),
    hold(SHAKE, 'Let\'s make a deal.', 1.6),
    hold({ armR: [-20, 0, -62], foreR: [-25, 0, -112] }, 'Hello? Buy! Sell!', 1.6),
  )),
  // Navy skirt suit, hair in a bun, briefcase and phone.
  e('businesswoman', 'town', 'office', () => act(W('businesswoman', { skin: 'skin1', top: 'white', long: true, skirt: 'navy', bottom: 'navy', legs: 'skin1', shoes: 'black', hair: '#3b2a1e', style: 'bun', acc: [suitX('navy', null), wear('necklace', 'white'), held('briefcase', 'black', 'L'), held('phone', 'black')] }),
    hold({ armR: [-20, 0, -62], foreR: [-25, 0, -112] }, 'Book the meeting for nine.', 1.8),
    [G('point', 'Let\'s get to work!')],
  )),
  // Striped apron and paper hat at a wooden chopping block with a steak; chops with the cleaver.
  e('butcher', 'town', 'food service', () => act(topOf(W('butcher', { top: 'white', bottom: 'darkgray', shoes: 'black', acc: [pillbox('white'), wear('apron', 'white'), X((d) => [-0.25, -0.08, 0.08, 0.25].map((xx) => ['torso', 'box', [d.tw * 0.05, d.torsoH * 0.5, d.td * 0.04], [d.tw * xx, d.torsoH * 0.35, d.td * 0.58], 'navy', { layer: 5 }] as XP)), face('mustache', '#3b2a1e'), cleaver(), X((d) => {
    const k = d.H / 1.7, x0 = -0.5 * k, z0 = 0.42;
    return [
      ['', 'box', [0.62, 0.28, 0.5], [x0, 0.76, z0], 'lightwood', { edge: 'sharp', round: 0.08, name: 'block' }],
      ...[[0.26, 0.2], [-0.26, 0.2], [0.26, -0.2], [-0.26, -0.2]].map(([dx, dz]) => ['', 'box', [0.07, 0.62, 0.07], [x0 + dx, 0.31, z0 + dz], 'wood', { edge: 'sharp' }] as XP),
      ['', 'ball', [0.26, 0.06, 0.18], [x0 + 0.06, 0.92, z0 + 0.02], 'meat', { name: 'steak' }],
      ['', 'ball', [0.1, 0.03, 0.07], [x0 - 0.02, 0.945, z0 + 0.02], 'cream', { noInk: true }],
    ];
  })] }), 'block'),
    [to({ armR: [-150, 0, 0] }, undefined, 0.3), A.par(A.pose('armR', { rot: [-55, 0, 0], dur: 0.12 }), A.say('Chop!', 1.2)), A.pose('armR', { rot: [-150, 0, 0], dur: 0.3 }), A.par(A.pose('armR', { rot: [-55, 0, 0], dur: 0.12 }), A.say('Chop!', 1.2)), A.pose('armR', { rot: [0, 0, 0], dur: 0.4 })],
    show('sausage', 'Fresh sausages today!', 'point'),
  )),
  // Tails, white gloves and a silver tray: lifts the cloche to show a cake.
  e('butler', 'town', 'hotel', () => act(W('butler', { hair: 'gray', style: 'short', top: 'white', long: true, bottom: 'black', shoes: 'black', acc: [suitX('black', 'black', true), tails('black'), gloves('white', 0.9), rest({ armL: [-20, 0, 12], foreL: [-66, 0, -12] }), X((d) => {
    const a = d.aw;
    const P = (x: number, y: number, z: number): Vec3 => [x, -z, y];
    return [
      ['handL', 'cyl', [a * 5, a * 0.25, a * 5], P(0, a * 0.4, a * 1.8), 'silver', { srot: [90, 0, 0], edge: 'sharp' }],
      ['handL', 'cyl', [a * 2.2, a * 1.2, a * 2.2], P(0, a * 1.1, a * 1.8), 'chocolate', { srot: [90, 0, 0] }],
      ['handL', 'ball', [a * 0.5, a * 0.5, a * 0.5], P(0, a * 1.9, a * 1.8), 'red', { srot: [90, 0, 0] }],
      ['handL', 'dome', [a * 3.8, a * 2.8, a * 3.8], P(0, a * 1.9, a * 1.8), 'silver', { srot: [90, 0, 0], name: 'cloche', piece: true, edge: 'sharp' }],
      ['cloche', 'ball', [a * 0.6, a * 0.5, a * 0.6], [0, 0, a * 1.45], 'silver', { srot: [90, 0, 0] }],
    ];
  })] }),
    [A.par(A.pose('cloche', { move: [0, 0, 0.2], dur: 0.5 }), A.say('Dinner is served.', 2)), A.wait(1.6), A.pose('cloche', { move: [0, 0, 0], dur: 0.4 })],
    [G('bow', 'Will that be all, sir?')],
  )),
  // A taxi driver in cap and vest with a TAXI sign and the car keys.
  e('cab driver', 'town', 'drivers', () => act(W('cab driver', { top: 'white', bottom: 'darkgray', shoes: 'black', acc: [hat('cap', 'darkgray'), nameHat(), wear('vest', 'black'), X((d) => [-0.3, -0.1, 0.1, 0.3].map((xx, i) => ['torso', 'box', [d.tw * 0.2, d.torsoH * 0.08, d.td * 0.06], [d.tw * xx, d.torsoH * 0.82, d.td * 0.58], i % 2 ? 'black' : 'yellow', { layer: 6 }] as XP)), card('TAXI', 'yellow', 'L', 4.4, 2.2), inHand('R', (a) => [['torus', [a * 1.2, a * 1.2, a * 0.2], [0, -a * 0.6, a * 0.8], 'silver', { tube: 0.2 }], ['box', [a * 0.4, a * 1.0, a * 0.15], [0, -a * 1.4, a * 0.8], 'gold', { edge: 'sharp' }]])] }),
    [G('nod', 'Hop in! Where to?')],
    tipHat('Beep beep! Meter\'s running.'),
  )),
  // Cable repair man in cap and tool belt with a coil of cable and a wrench.
  e('cable guy', 'town', 'trades', () => act(W('cable guy', { pose: 'hips', top: 'navy', bottom: 'tan', shoes: 'brown', acc: [hat('cap', 'navy'), nameHat(), chest('CABLE', 'navy', 0.5, 0.12, 0.8), wear('tool belt'), coil('black'), held('wrench')] }),
    [G('shrug', 'I\'ll be there between nine and five.', 2.4)],
    [G('thumbs_up', 'All fixed! Try it now.')],
  )),
  // Hair net, blue apron and gloves, a ladle and a lunch tray: offers a scoop, refuses seconds.
  e('cafeteria worker', 'town', 'food service', () => act(W('cafeteria worker', { top: 'white', bottom: 'darkgray', shoes: 'white', style: 'bun', acc: [cap0('#eef2f4'), wear('apron', 'skyblue'), gloves('skyblue', 0.9), inHand('R', (a, d) => [['capsule', [a * 0.3, d.H * 0.22, a * 0.3], [0, d.H * 0.06, a * 0.6], 'silver'], ['dome', [a * 1.4, a * 0.8, a * 1.4], [0, -d.H * 0.05, a * 0.9], 'silver', { srot: [180, 0, 0], edge: 'sharp' }]]), inHand('L', (a) => [['box', [a * 4.4, a * 0.3, a * 3.4], [0, a * 0.4, a * 1.6], 'lightgray', { round: 0.3, edge: 'sharp' }], ['ball', [a * 1.2, a * 0.6, a * 1.2], [-a * 1, a * 0.8, a * 1.2], 'lettuce'], ['ball', [a * 1.2, a * 0.6, a * 1.2], [a * 1, a * 0.8, a * 1.2], 'cheese'], ['ball', [a * 1.2, a * 0.6, a * 1.2], [0, a * 0.8, a * 2.4], 'meat']])] }),
    hold({ armR: [-70, 0, -10], foreR: [-30, 0, 0] }, 'One scoop or two?', 1.6),
    [G('shake_head', 'No seconds today!')],
  )),
  // Cap on backwards and headphones, a broadcast camera on his shoulder with a red REC light.
  e('camera man', 'town', 'media', () => act(W('camera man', { top: 'black', bottom: 'denim', shoes: 'black', acc: [capBack('black'), hat('headphones', 'darkgray'), rest({ armR: [-30, 0, -40], foreR: [-40, 0, -95] }), X((d) => {
    const k = d.H / 1.7, x0 = -d.tw * 0.62, y0 = d.torsoH * 1.08, z0 = d.td * 0.3;
    return [
      ['torso', 'box', [0.16 * k, 0.2 * k, 0.42 * k], [x0, y0, z0], '#3a3633', { round: 0.15, edge: 'sharp', name: 'camera' }],
      ['camera', 'cyl', [0.11 * k, 0.18 * k, 0.11 * k], [0, 0, 0.29 * k], '#1d1d1d', { srot: [90, 0, 0], edge: 'sharp' }],
      ['camera', 'cyl', [0.15 * k, 0.07 * k, 0.15 * k], [0, 0, 0.4 * k], '#1d1d1d', { srot: [90, 0, 0], taper: 1.3, edge: 'sharp' }],
      ['camera', 'cyl', [0.1 * k, 0.01, 0.1 * k], [0, 0, 0.44 * k], '#5a7a9a', { srot: [90, 0, 0], noInk: true }],
      ['camera', 'box', [0.04 * k, 0.04 * k, 0.26 * k], [0, 0.13 * k, 0.02 * k], '#1d1d1d', { edge: 'sharp' }],
      ['camera', 'box', [0.07 * k, 0.07 * k, 0.1 * k], [-0.1 * k, 0.05 * k, 0.12 * k], '#1d1d1d', { edge: 'sharp' }],
      ['camera', 'ball', [0.03 * k, 0.03 * k, 0.03 * k], [0.06 * k, 0.09 * k, 0.21 * k], 'red', { name: 'rec', glow: true, mover: { kind: 'light' } }],
      ['camera', 'box', [0.1 * k, 0.04 * k, 0.005], [0.081 * k, 0, 0], 'white', { text: 'TV', srot: [0, 90, 0] }],
    ];
  })] }),
    [A.operate('rec', 'on'), A.par(A.pose('head', { rot: [8, 0, 0], dur: 0.4 }), A.say('Rolling... and smile!', 2)), A.wait(1.6), A.par(A.operate('rec', 'off'), A.pose('head', { rot: [0, 0, 0], dur: 0.4 }))],
    [G('thumbs_up', 'That\'s a wrap!')],
  )),
  // Camp counsellor in cap and camp shirt with a whistle and clipboard.
  e('camp counselor', 'town', 'outdoors', () => act(W('camp counselor', { skin: 'skin2', top: 'darkgreen', bottom: 'tan', legs: 'skin2', shorts: true, shoes: 'brown', style: 'ponytail', acc: [hat('cap', 'darkgreen'), nameHat(), chest('CAMP', 'darkgreen', 0.5, 0.14, 0.72), wear('whistle'), held('clipboard', 'wood', 'L')] }),
    hold(TO_MOUTH, 'Tweeet! Line up, campers!', 1.4),
    [G('wave', 'Come on, everyone! S\'mores time!', 2.2)],
  )),
  // A hungry diner in a dark suit, a white napkin tucked in at the collar, tongue out, a fork and a knife held up
  // in his fists: bangs them impatiently, then wonders what is for dinner.
  e('cannibal', 'town', 'villains', () => act(W('cannibal', { skin: 'skin1', hair: '#5a3a22', style: 'short', top: '#2b2b30', long: true, bottom: '#2b2b30', shoes: 'black', acc: [suitX('#2b2b30', 'darkred'), X((d) => {
    const { W: w, Hh, D, y } = hd(d);
    return [
      ['torso', 'wedge', [d.tw * 0.78, d.torsoH * 0.62, d.td * 0.06], [0, d.torsoH * 0.62, d.td * 0.6], 'white', { srot: [0, 0, 180], layer: 6 }],
      ...[1, -1].map((s) => ['torso', 'ball', [d.tw * 0.16, d.tw * 0.12, d.td * 0.1], [s * d.tw * 0.12, d.torsoH * 0.95, d.td * 0.5], 'white', { layer: 6 }] as XP),
      ['head', 'ball', [w * 0.14, Hh * 0.08, w * 0.08], [w * 0.1, y - Hh * 0.25, D * 0.48], 'pink', { layer: 6 }],
    ];
  }), rest({ armR: [-15, 0, -10], foreR: [-70, 0, 0], armL: [-15, 0, 10], foreL: [-70, 0, 0] }), onPalm('R', (a) => [
    ['capsule', [a * 0.32, 0.13, a * 0.32], [0, 0.05, a * 0.9], 'silver'],
    ['box', [a * 1.05, a * 0.3, a * 0.22], [0, 0.125, a * 0.9], 'silver', { round: 0.5 }],
    ...[-0.45, -0.15, 0.15, 0.45].map((x) => ['capsule', [a * 0.13, a * 1.3, a * 0.13], [x * a, 0.125 + a * 0.6, a * 0.9], 'silver'] as HP),
  ]), onPalm('L', (a) => [
    ['capsule', [a * 0.34, 0.11, a * 0.34], [0, 0.04, a * 0.9], 'darkwood'],
    ['box', [a * 0.14, 0.15, a * 0.5], [0, 0.17, a * 0.95], 'silver', { round: 0.6, edge: 'sharp' }],
  ])] }),
    [A.par(A.pose('foreR', { rot: [-22, 0, 0], dur: 0.18, times: 3 }), A.pose('foreL', { rot: [-22, 0, 0], dur: 0.18, times: 3 }), A.say('Dinner time! Dinner time!', 2))],
    [G('look_around', 'Hmm... what is on the menu tonight?')],
  )),
  // A sea captain: white peaked cap, beard, pipe and a ship's wheel he turns.
  e('captain', 'town', 'sailors', () => act(W('captain', { top: 'navy', long: true, bottom: 'white', shoes: 'black', hair: 'white', style: 'short', acc: [hat('police', 'white'), nameHat(), face('beard', 'white'), buttons('gold', 3, 0.18), buttons('gold', 3, -0.18), rings('gold', 'foreR', [0.75]), rings('gold', 'foreL', [0.75]), pipe(), X((d) => {
    const a = d.aw;
    return [
      ['handL', 'torus', [a * 5, a * 5, a * 0.5], [a * 0.6, -a * 0.6, a * 1.4], 'darkwood', { srot: [0, 90, 0], tube: 0.12, name: 'helm', edge: 'sharp' }],
      ['helm', 'cyl', [a * 0.9, a * 0.7, a * 0.9], [0, 0, 0], 'brass', { srot: [0, 0, 90] }],
      ...[0, 45, 90, 135].map((r) => ['helm', 'capsule', [a * 0.3, a * 6.6, a * 0.3], [0, 0, 0], 'wood', { srot: [r, 0, 0] }] as XP),
    ];
  })] }),
    [A.par(A.pose('helm', { rot: [180, 0, 0], dur: 1.2 }), A.say('Hard to starboard!', 2)), A.pose('helm', { rot: [0, 0, 0], dur: 1.0 })],
    hold(SALUTE, 'Welcome aboard!', 1.5),
  )),
  // A heart doctor in a lab coat with a stethoscope, holding a heart that beats.
  e('cardiologist', 'town', 'medical', () => act(W('cardiologist', { top: 'skyblue', bottom: 'skyblue', shoes: 'white', acc: [wear('labcoat'), wear('stethoscope'), face('glasses'), X((d) => {
    const a = d.aw;
    return [['handL', 'ball', [a * 1.4, a * 1.4, a * 1.0], [a * 0.55, a * 0.5, a * 1.3], 'red', { name: 'heart' }], ['heart', 'ball', [a * 1.4, a * 1.4, a * 1.0], [-a * 1.1, 0, 0], 'red'], ['heart', 'cyl', [a * 2.1, a * 1.7, a * 1.0], [-a * 0.55, -a * 0.9, 0], 'red', { taper: 0, segs: 4, srot: [180, 45, 0] }]];
  })] }),
    [A.par(A.pose('heart', { scale: 1.3, dur: 0.15 }), A.say('Ba-dum, ba-dum!', 2)), A.pose('heart', { scale: 1, dur: 0.25 }), A.pose('heart', { scale: 1.3, dur: 0.15 }), A.pose('heart', { scale: 1, dur: 0.25 }), A.pose('heart', { scale: 1.3, dur: 0.15 }), A.pose('heart', { scale: 1, dur: 0.25 })],
    [G('thumbs_up', 'Strong and healthy!')],
  )),
  // Flannel shirt, tool belt and hammer at a sawhorse with a board: hammers in a nail.
  e('carpenter', 'town', 'trades', () => act(topOf(W('carpenter', { top: 'red', long: true, bottom: 'denim', shoes: 'brown', acc: [hat('cap', 'tan'), nameHat(), bands('darkred', [0.25, 0.5, 0.75]), wear('tool belt'), X((d) => [['head', 'capsule', [d.headW * 0.05, d.headW * 0.3, d.headW * 0.05], [d.headW * 0.52, d.headY + d.headH * 0.1, 0], 'yellow', { srot: [0, 0, 20] }]]), held('hammer'), X((d) => {
    const k = d.H / 1.7, x0 = -0.55 * k, z0 = 0.4;
    return [
      ['', 'box', [0.09, 0.09, 0.95], [x0, 0.62, z0], 'lightwood', { edge: 'sharp', round: 0.1 }],
      ...[[0.12, 0.38], [-0.12, 0.38], [0.12, -0.38], [-0.12, -0.38]].map(([dx, dz]) => ['', 'box', [0.05, 0.66, 0.06], [x0 + dx, 0.3, z0 + dz * 0.95], 'lightwood', { srot: [0, 0, dx > 0 ? -12 : 12], edge: 'sharp' }] as XP),
      ['', 'box', [0.28, 0.03, 1.1], [x0, 0.68, z0], 'tan', { edge: 'sharp', round: 0.1, name: 'board' }],
      ['', 'cyl', [0.012, 0.03, 0.012], [x0, 0.71, z0 + 0.1], 'silver'],
    ];
  })] }), 'board', 'top', 'top', 0.4),
    [to({ armR: [-150, 0, 10] }, undefined, 0.3), A.par(A.pose('armR', { rot: [-60, 0, 10], dur: 0.12 }), A.effect('dust', { dur: 0.6 }), A.say('Bang! Bang!', 1.6)), A.pose('armR', { rot: [-150, 0, 10], dur: 0.3 }), A.par(A.pose('armR', { rot: [-60, 0, 10], dur: 0.12 }), A.effect('dust', { dur: 0.6 })), A.pose('armR', { rot: [0, 0, 0], dur: 0.4 })],
    [G('thumbs_up', 'Measure twice, cut once!')],
  )),
  // Striped jumper, beanie and mask, a sack of loot and a torch that clicks on.
  e('cat burglar', 'town', 'crime', () => act(W('cat burglar', { top: 'black', long: true, bottom: 'black', shoes: 'black', acc: [hat('beanie', 'black'), nameHat(), eyemask('black'), bands('white', [0.25, 0.5, 0.75]), gloves('black'), sack('gray', '$'), inHand('R', (a) => [['cyl', [a * 0.7, a * 2.2, a * 0.7], [0, -a * 0.2, a * 1.2], 'black', { srot: [90, 0, 0], edge: 'sharp' }], ['cyl', [a * 0.75, a * 0.2, a * 0.75], [0, -a * 0.2, a * 2.35], 'yellow', { srot: [90, 0, 0], glow: true, name: 'torch', mover: { kind: 'light' } }]])] }),
    [A.operate('torch', 'on'), G('look_around', 'Hmm... now where is the safe?'), A.operate('torch', 'off')],
    [G('cover_eyes', 'Uh oh. The alarm!')],
  )),
  // Black catsuit, cat ears, goggles, tail and whip: cracks it, then winks.
  e('catwoman', 'town', 'superheroes', () => act(W('catwoman', { skin: 'skin1', hair: '#1d1d1d', style: 'long', top: 'black', long: true, bottom: 'black', shoes: 'black', acc: [hat('catears', 'black'), face('goggles', 'silver'), gloves('black'), boots('black'), body('cattail', 'black'), held('whip', 'black')] }),
    [to({ armR: [-10, 0, -150] }, undefined, 0.3), A.par(A.pose('armR', { rot: [-80, 0, -20], dur: 0.15 }), A.say('Crack!', 1.4)), A.wait(0.6), A.pose('armR', { rot: [0, 0, 0], dur: 0.4 })],
    [G('wink', 'Meow.', 1.6)],
  )),
  // Seated on a stool with a full-size cello between her knees, bow in hand: plays a phrase, then bows.
  e('cellist', 'town', 'music', () => act(W('cellist', { top: 'black', long: true, bottom: 'black', shoes: 'black', style: 'bun', acc: [sit(), rest({ armR: [-62, 0, -8], foreR: [-28, 0, 38], armL: [-70, 0, 30], foreL: [-55, 0, -40] }), X((d) => {
    const k = d.H / 1.7, seat = sitHeight(d) - d.lw * 0.5, wood = '#8a4a22';
    return [
      ['', 'cyl', [0.36 * k, 0.04, 0.36 * k], [0, seat - 0.02, -0.04], 'darkwood', { edge: 'sharp' }],
      ...[[0.12, 0.1], [-0.12, 0.1], [0, -0.15]].map(([dx, dz]) => ['', 'cyl', [0.035, seat - 0.04, 0.035], [dx * k, (seat - 0.04) / 2, -0.04 + dz * k], 'darkwood', { edge: 'sharp' }] as XP),
      ['', 'ball', [0.44 * k, 0.42 * k, 0.22 * k], [0.04 * k, 0.46 * k, 0.42 * k], wood, { name: 'cello', rot: [-14, 0, -10] }],
      ['cello', 'ball', [0.36 * k, 0.34 * k, 0.2 * k], [0, 0.38 * k, 0], wood],
      ['cello', 'box', [0.3 * k, 0.2 * k, 0.2 * k], [0, 0.2 * k, 0], wood, { round: 0.6 }],
      ['cello', 'box', [0.05 * k, 0.66 * k, 0.025 * k], [0, 0.64 * k, 0.12 * k], '#1d1d1d', { edge: 'sharp' }],
      ['cello', 'box', [0.05 * k, 0.3 * k, 0.05 * k], [0, 0.72 * k, 0.07 * k], '#3a2414', { edge: 'sharp' }],
      ['cello', 'box', [0.05 * k, 0.14 * k, 0.06 * k], [0, 0.94 * k, 0.05 * k], '#3a2414', { edge: 'sharp' }],
      ['cello', 'ball', [0.06 * k, 0.07 * k, 0.07 * k], [0, 1.03 * k, 0.05 * k], '#3a2414'],
      ['cello', 'box', [0.1 * k, 0.05 * k, 0.015 * k], [0, 0.06 * k, 0.12 * k], 'cream', { edge: 'sharp' }],
      ['cello', 'box', [0.06 * k, 0.17 * k, 0.012 * k], [0, -0.09 * k, 0.115 * k], '#1d1d1d', { edge: 'sharp' }],
      ['cello', 'box', [0.025 * k, 0.8 * k, 0.004 * k], [0, 0.4 * k, 0.128 * k], '#8a8f94', { edge: 'sharp', noInk: true }],
      ...[1, -1].map((s) => ['cello', 'box', [0.012 * k, 0.11 * k, 0.005 * k], [s * 0.085 * k, 0.08 * k, 0.11 * k], '#1d1d1d', { noInk: true, srot: [0, 0, s * 8] }] as XP),
      ['cello', 'cyl', [0.014, 0.26 * k, 0.014], [0, -0.33 * k, 0], 'silver'],
      ['handR', 'capsule', [d.aw * 0.18, 0.72 * k, d.aw * 0.18], [0.3 * k, -d.aw * 0.7, d.aw * 0.4], 'darkwood', { srot: [0, 0, 90], name: 'bow' }],
      ['bow', 'box', [d.aw * 0.1, 0.66 * k, d.aw * 0.25], [0, -d.aw * 0.35, 0], 'cream', { noInk: true, srot: [0, 0, 90] }],
    ];
  })] }),
    [to({ armR: [0, 0, -22] }, '♪ Mmm-mmm-mmm ♪', 0.6), to({ armR: [0, 0, 16] }, undefined, 0.8), to({ armR: [0, 0, -22] }, undefined, 0.8), to({ armR: [0, 0, 0] }, undefined, 0.6)],
    [G('nod', 'Bach. Always Bach.')],
  )),
  // Half man, half horse: a horse's body with a bearded archer's chest, bow and quiver.
  e('centaur', 'fantasy', 'myths', () => act(beast('centaur', { color: '#a0623a', body: [1.5, 0.72, 0.58], legL: 0.92, legW: 0.13, hoof: 'darkbrown', neckL: 0.72, neckLean: 0, neckW: 0.18, head: [0.27, 0.3, 0.26], headColor: '#e2ac83', ears: 'side', earSize: 0.06, tail: 'long', tailColor: 'darkbrown', acc: [(p) => {
    const add = (name: string, parent: string, shape: Shape, size: Vec3, at: Vec3, color: string, o: Partial<FigPart> = {}) => p.add({ name, parent, shape, size, at, color: col(color, color), layer: 2, ...o });
    const skin = '#e2ac83';
    add('chest', 'neck', 'box', [0.44, 0.5, 0.26], [0, 0.36, 0], skin, { round: 0.6 });
    add('sash', 'neck', 'box', [0.1, 0.6, 0.28], [0, 0.36, 0], 'red', { srot: [0, 0, 35], layer: 3 });
    add('hair', 'head', 'ball', [0.3, 0.3, 0.27], [0, 0.07, -0.03], '#5a3a22', { layer: 1 });
    add('beard', 'head', 'ball', [0.2, 0.13, 0.1], [0, -0.05, 0.12], '#5a3a22', { layer: 4 });
    add('belt', 'neck', 'torus', [0.46, 0.46, 0.08], [0, 0.1, 0], '#e2b23a', { srot: [90, 0, 0], tube: 0.25 });
    for (const [n, s] of [['L', 1], ['R', -1]] as const) {
      add(`shoulder${n}`, 'neck', 'ball', [0.13, 0.13, 0.13], [s * 0.25, 0.56, 0], skin);
      add(`arm${n}`, 'neck', 'capsule', [0.1, 0.5, 0.1], [s * 0.29, 0.56, 0.02], skin, { off: [0, -0.22, 0], srot: [-12, 0, s * 8] });
      add(`hand${n}`, `arm${n}`, 'ball', [0.1, 0.11, 0.1], [s * 0.03, -0.46, 0.08], skin);
    }
    add('bow', 'handL', 'torus', [0.08, 0.8, 0.04], [0.05, 0, 0.02], 'wood', { tube: 0.15 });
    add('quiver', 'neck', 'cyl', [0.1, 0.42, 0.1], [-0.1, 0.42, -0.2], 'brown', { srot: [0, 0, 25] });
    for (const dx of [0, 0.03]) add(`fletch${dx}`, 'quiver', 'cyl', [0.03, 0.09, 0.012], [dx - 0.02, 0.25, 0], 'white', { taper: 0 });
  }] }),
    hold({ armL: [-80, 0, 0], armR: [-80, 0, 30] }, 'My arrows never miss!', 1.6),
    [G('look_around', 'The stars say a storm is coming.', 2.4)],
  )),
  // The three-headed hound of the underworld, spiked collars and all: barks three times, then wags.
  e('cerberus', 'fantasy', 'myths', () => act(beast('cerberus', { color: '#3a3330', body: [1.6, 0.8, 0.72], legL: 0.75, legW: 0.18, neckL: 0.32, neckLean: 30, neckW: 0.3, head: [0.42, 0.34, 0.32], snout: { len: 0.22, h: 0.16, w: 0.18, color: '#2a2420' }, nose: 'black', ears: 'pointy', earSize: 0.14, tail: 'long', acc: [(p) => {
    const add = (name: string, parent: string, shape: Shape, size: Vec3, at: Vec3, color: string, o: Partial<FigPart> = {}) => p.add({ name, parent, shape, size, at, color: col(color, color), layer: 2, ...o });
    add('collar', 'neck', 'torus', [0.36, 0.36, 0.08], [0, 0.12, 0], 'red', { srot: [90, 0, 0], tube: 0.3 });
    for (const [n, s] of [['L', 1], ['R', -1]] as const) {
      add(`neck${n}`, 'body', 'capsule', [0.26, 0.5, 0.26], [s * 0.28, 0.32, 0.62], '#3a3330', { srot: [40, 0, -s * 30] });
      add(`head${n}`, 'body', 'ball', [0.3, 0.32, 0.4], [s * 0.42, 0.52, 0.78], '#3a3330');
      add(`snout${n}`, 'body', 'ball', [0.17, 0.15, 0.24], [s * 0.45, 0.47, 0.98], '#2a2420');
      add(`nose${n}`, 'body', 'ball', [0.07, 0.06, 0.04], [s * 0.45, 0.51, 1.1], 'black');
      add(`eyeX${n}`, 'body', 'ball', [0.06, 0.06, 0.04], [s * 0.38, 0.6, 0.95], 'red', { role: 'glow' });
      add(`eyeY${n}`, 'body', 'ball', [0.06, 0.06, 0.04], [s * 0.52, 0.6, 0.93], 'red', { role: 'glow' });
      add(`ear${n}1`, 'body', 'cyl', [0.1, 0.16, 0.05], [s * 0.34, 0.72, 0.74], '#3a3330', { taper: 0, segs: 3 });
      add(`ear${n}2`, 'body', 'cyl', [0.1, 0.16, 0.05], [s * 0.52, 0.72, 0.74], '#3a3330', { taper: 0, segs: 3 });
      add(`collar${n}`, 'body', 'torus', [0.3, 0.3, 0.07], [s * 0.34, 0.4, 0.66], 'red', { srot: [50, 0, -s * 30], tube: 0.3 });
      for (const k of [0, 1, 2]) add(`spike${n}${k}`, 'body', 'cyl', [0.04, 0.07, 0.04], [s * (0.24 + k * 0.1), 0.47 - k * 0.04, 0.58 + k * 0.06], 'silver', { taper: 0, srot: [-30, 0, -s * 50] });
    }
  }] }),
    [A.par(A.anim('shake'), A.say('Woof! Woof! WOOF!', 2))],
    [G('wag', 'Arf? ♥', 1.6)],
  )),
  // Laurel wreath, gold medal and sash, the trophy held high.
  e('champion', 'sports', 'athletes', () => act(W('champion', { top: 'white', bottom: 'navy', shoes: 'white', acc: [X((d) => [['head', 'torus', [d.headW * 1.08, d.headD * 1.04, d.headH * 0.12], [0, d.headY + d.headH * 0.25, 0], 'green', { srot: [90, 0, 0], tube: 0.25 }]]), wear('medal'), wear('sash', 'red'), rest({ armL: [0, 0, 165] }), inHand('L', (a) => [['cyl', [a * 2, a * 2, a * 2], [0, -a * 2.6, 0], 'gold', { taper: 0.6, srot: [180, 0, 0], edge: 'sharp' }], ['cyl', [a * 0.6, a * 1.2, a * 0.6], [0, -a * 1.2, 0], 'gold', { edge: 'sharp' }], ['cyl', [a * 1.4, a * 0.4, a * 1.4], [0, -a * 0.5, 0], 'darkwood', { edge: 'sharp' }], ...[1, -1].map((s) => ['arc', [a * 1.2, a * 1.2, a * 0.2], [s * a * 1.1, -a * 2.7, 0], 'gold', { arc: 180, tube: 0.25, srot: [0, 0, s * 90 + 180] }] as HP)])] }),
    [A.par(A.anim('hop'), A.effect('sparkle', { dur: 1.4 }), A.say('Number one!', 1.8))],
    [G('bow', 'Thank you, fans!')],
  )),
  // Long white beard and frock coat, his notebook, and a giant Galapagos tortoise that pokes its head out.
  e('charles darwin', 'town', 'science', () => act(W('charles darwin', { skin: 'skin1', hair: 'white', style: 'bald', top: 'black', long: true, bottom: 'darkgray', shoes: 'black', acc: [sideHair('white'), face('longbeard', 'white'), wear('vest', 'darkgray'), tails('black'), held('book', 'darkgreen'), X((d) => {
    const k = d.H / 1.7, x0 = 0.75 * k, z0 = 0.15;
    return [
      ['', 'dome', [0.62, 0.4, 0.78], [x0, 0.33, z0], '#6b5a3a', { name: 'shell' }],
      ['', 'box', [0.66, 0.05, 0.82], [x0, 0.14, z0], '#8a7a5a', { round: 0.8 }],
      ...[[0, 0.12, 0.3, 0.26], [0.17, 0.08, 0.26, 0.2], [-0.17, 0.08, 0.26, 0.2], [0, -0.22, 0.24, 0.22], [0.2, -0.16, 0.22, 0.18], [-0.2, -0.16, 0.22, 0.18]].map(([dx, dz, w, dd]) => ['', 'dome', [w, 0.08, dd], [x0 + dx, 0.27 + 0.18 * (1 - Math.hypot(dx, dz) * 2), z0 + dz], '#8a7448', { noInk: true }] as XP),
      ...[[0.24, 0.25], [-0.24, 0.25], [0.24, -0.25], [-0.24, -0.25]].map(([dx, dz]) => ['', 'cyl', [0.12, 0.2, 0.12], [x0 + dx, 0.1, z0 + dz], '#8a8070'] as XP),
      ['', 'capsule', [0.1, 0.24, 0.1], [x0, 0.2, z0 + 0.42], '#8a8070', { name: 'thead', srot: [70, 0, 0] }],
      ['thead', 'ball', [0.13, 0.11, 0.16], [0, 0.04, 0.12], '#8a8070'],
      ...[1, -1].map((s) => ['thead', 'ball', [0.025, 0.025, 0.02], [s * 0.05, 0.07, 0.16], 'black', { noInk: true }] as XP),
    ];
  })] }),
    [A.par(A.pose('thead', { move: [0, 0.04, 0.12], dur: 0.6 }), A.anim('nod'), A.say('Hello, old friend.', 2)), A.wait(1.2), A.pose('thead', { move: [0, 0, 0], dur: 0.6 })],
    [G('look_around', 'Every finch is a little different...', 2.4)],
  )),
  // Ponytail, bow, a GO top and two big pom-poms.
  e('cheerleader', 'sports', 'athletes', () => act(W('cheerleader', { skin: 'skin1', hair: 'gold', style: 'ponytail', top: 'red', skirt: 'red', legs: 'skin1', shoes: 'white', acc: [hat('bow', 'white'), chest('GO', 'white', 0.4, 0.2), pompoms('yellow')] }),
    [A.par(A.anim('arms_up'), A.anim('hop', 2), A.say('Go, team, go!', 2))],
    [G('dance', 'Two, four, six, eight!')],
  )),
  // Toque, red neckerchief and a frying pan: flips a pancake high, then kisses his fingers.
  e('chef', 'town', 'food service', () => act(W('chef', { top: 'white', long: true, bottom: 'darkgray', shoes: 'black', hair: '#1d1d1d', style: 'short', acc: [hat('chef'), nameHat(), wear('scarf', 'red'), buttons('black', 3, 0.15), buttons('black', 3, -0.15), face('mustache', '#1d1d1d'), rest({ armR: [-20, 0, -8], foreR: [-68, 0, 8] }), onPalm('R', (a) => [['capsule', [a * 0.4, a * 3.2, a * 0.4], [0, a * 0.3, a * 1.4], 'black', { srot: [90, 0, 0] }], ['cyl', [a * 3.6, a * 0.5, a * 3.6], [0, a * 0.5, a * 4.6], 'iron', { edge: 'sharp' }], ['cyl', [a * 2.8, a * 0.3, a * 2.8], [0, a * 1.0, a * 4.6], '#e8b860', { name: 'flapjack' }]]), held('spatula', 'silver', 'L')] }),
    [A.par(A.pose('flapjack', { move: [0, 0, 0.45], rot: [180, 0, 0], dur: 0.4 }), A.say('Hup!', 1.2)), A.pose('flapjack', { move: [0, 0, 0], rot: [360, 0, 0], dur: 0.4 }), A.pose('flapjack', { rot: [0, 0, 0], dur: 0 }), A.say('Perfect flip!', 1.6)],
    hold({ armL: [-30, 0, 20], foreL: [-120, 0, -15] }, 'Mwah! Magnifique!', 1.4),
  )),
  // Goggles and lab coat with a bubbling flask: mixes, then a small bang.
  e('chemist', 'town', 'science', () => act(W('chemist', { top: 'white', bottom: 'navy', shoes: 'black', acc: [wear('labcoat'), face('goggles', 'teal'), gloves('#9adf8a', 0.9), flask('lime'), tube('magenta', 'L')] }),
    hold(LIFT_R, 'Bubble, bubble...', 1.6, [A.effect('steam', { dur: 1.5 })]),
    [A.par(A.effect('explosion', { dur: 0.8 }), A.anim('gasp'), A.say('Whoops! Too much!', 2))],
  )),
  // The police chief: white peaked cap, gold braid, badge and medals.
  e('chief', 'town', 'law and order', () => act(W('chief', { pose: 'hips', top: 'navy', long: true, bottom: 'navy', shoes: 'black', hair: 'gray', style: 'short', build: 1.15, acc: [hat('police', 'white'), nameHat(), face('mustache', 'gray'), epaul('gold'), wear('badge'), wear('medal'), chest('CHIEF', 'gold', 0.5, 0.13, 0.86)] }),
    [G('point', 'You! In my office, now!')],
    [G('nod', 'Good work, officer.')],
  )),
  // A kid with a backpack and a red balloon on a string, which floats away.
  e('child', 'town', 'family', () => act(W('child', { h: 'kid', top: 'yellow', bottom: 'denim', shoes: 'red', style: 'pigtails', acc: [wear('backpack', 'red'), X((d) => [['handR', 'capsule', [d.aw * 0.06, d.H * 0.5, d.aw * 0.06], [0, d.H * 0.25, d.aw * 0.35], 'white', { name: 'balloon', noInk: true }], ['balloon', 'ball', [d.H * 0.17, d.H * 0.2, d.H * 0.17], [0, d.H * 0.33, 0], 'red'], ['balloon', 'cyl', [d.H * 0.03, d.H * 0.02, d.H * 0.03], [0, d.H * 0.225, 0], 'red', { taper: 0 }]])] }),
    [A.pose('balloon', { move: [0, 0, 0], scale: 1, dur: 0.4 }), G('wave', 'Hi! Wanna play?')],
    [A.par(A.pose('balloon', { move: [0, 2.6, 0], dur: 2.4 }), A.anim('cry'), A.say('My balloon!', 2)), A.pose('balloon', { scale: 0, dur: 0.3 })],
  )),
  // Sooty in a battered top hat, with his round brush on its long pole.
  e('chimney sweeper', 'town', 'trades', () => act(W('chimney sweeper', { skin: 'skin2', top: 'black', long: true, bottom: 'black', shoes: 'black', acc: [tophat('#2a2726'), wear('scarf', 'red'), patch('darkgray', 0.15, 0.1, 0.4, 0.2), X((d) => [['head', 'ball', [d.headW * 0.25, d.headH * 0.12, d.headW * 0.05], [d.headW * 0.18, d.headY - d.headH * 0.1, d.headD * 0.48], '#5a5a5a', { noInk: true, layer: 6 }]]), inHand('R', (a, d) => [['capsule', [a * 0.3, d.H * 0.9, a * 0.3], [-d.H * 0.1, d.H * 0.185, a * 0.4], 'wood', { srot: [0, 0, 13] }], ['ball', [a * 3.2, a * 3.2, a * 3.2], [-d.H * 0.2, d.H * 0.64, a * 0.4], 'black'], ...[0, 60, 120].map((r) => ['capsule', [a * 0.3, a * 4.4, a * 0.3], [-d.H * 0.2, d.H * 0.64, a * 0.4], 'black', { srot: [r, 0, 90] }] as HP)])] }),
    [A.par(A.effect('smoke', { dur: 1.4 }), A.anim('shake'), A.say('Cough! Sooty work!', 2))],
    tipHat('Good luck to ya, guv!'),
  )),
  // A Chinese dragon 12 m long: a serpent body in waves on four clawed legs, antlers, whiskers, a mane and a
  // flaming pearl it chases. Profile view; the body undulates segment by segment.
  e('chinese dragon', 'fantasy', 'dragons', () => {
    const b = m('chinese dragon', { view: 'side' });
    const N = 16;
    const seg = (i: number): Vec3 => [0, 1.55 + 0.75 * Math.sin(i * 0.72 + 0.3), 3.9 - i * 0.62];
    for (let i = 0; i < N; i++) {
      const at = seg(i);
      const r = 0.92 - i * 0.042;
      const name = `seg${i}`;
      b.ball([r * 0.95, r, 0.82], at, { color: '#d02a1e', name, parent: i ? `seg${i - 1}` : undefined });
      b.ball([r * 0.55, r * 0.3, 0.62], [at[0], at[1] - r * 0.4, at[2]], { color: '#f2c14e', parent: name, noInk: true });
      b.cone([0.1 + r * 0.08, 0.2 + r * 0.22, 0.26], [at[0], at[1] + r * 0.5, at[2] - 0.05], { color: '#8a1a14', rot: [-35, 0, 0], parent: name, edge: 'sharp' });
    }
    // legs on segments 2 and 10, each ending in a three-clawed foot on the ground
    for (const i of [2, 10]) {
      const [, y, z] = seg(i);
      b.pair((s) => {
        const top: Vec3 = [s * 0.3, y - 0.25, z];
        const knee: Vec3 = [s * 0.55, Math.max(0.6, y * 0.45), z + 0.25];
        const foot: Vec3 = [s * 0.5, 0.1, z + 0.35];
        b.rod(top, knee, 0.24, '#c8281e', { parent: `seg${i}` });
        b.rod(knee, foot, 0.18, '#c8281e', { parent: `seg${i}` });
        b.ball([0.24, 0.14, 0.28], foot, { color: '#f2c14e', parent: `seg${i}` });
        for (const dx of [-0.08, 0, 0.08]) b.cone([0.05, 0.12, 0.05], [foot[0] + dx, 0.05, foot[2] + 0.18], { color: 'white', rot: [100, 0, 0], parent: `seg${i}` });
      });
    }
    // tail tuft
    const t = seg(N - 1);
    for (const [ry, c] of [[-25, '#f2c14e'], [0, '#e8702a'], [25, '#f2c14e']] as const) b.cone([0.3, 0.9, 0.12], [t[0], t[1], t[2] - 0.6], { color: c, rot: [-95, ry, 0], parent: `seg${N - 1}` });
    // head on the front segment
    const [, hy, hz] = seg(0);
    b.ball([1.0, 0.85, 1.05], [0, hy + 0.35, hz + 0.75], { color: '#c8281e', name: 'head', parent: 'seg0' })
      .box([0.62, 0.36, 0.8], [0, hy + 0.28, hz + 1.4], { color: '#c8281e', round: 0.6, parent: 'head' })
      .box([0.56, 0.12, 0.7], [0, hy + 0.04, hz + 1.3], { color: '#f2c14e', round: 0.6, name: 'jaw', parent: 'head', pivot: [0, hy + 0.12, hz + 0.95], mover: { kind: 'swing', axis: 'x', amount: 28 } })
      .pair((s) => b
        .ball([0.12, 0.1, 0.1], [s * 0.18, hy + 0.48, hz + 1.75], { color: '#7a1a14', parent: 'head' })
        .ball([0.24, 0.24, 0.14], [s * 0.3, hy + 0.62, hz + 1.12], { color: 'white', parent: 'head' })
        .ball(0.12, [s * 0.32, hy + 0.62, hz + 1.19], { color: 'black', noInk: true, parent: 'head' })
        .ball([0.2, 0.12, 0.26], [s * 0.26, hy + 0.78, hz + 1.1], { color: '#2e8a4a', parent: 'head' })
        .rod([s * 0.2, hy + 0.75, hz + 0.6], [s * 0.42, hy + 1.6, hz + 0.1], 0.09, '#f2c14e', { parent: 'head' })
        .rod([s * 0.32, hy + 1.2, hz + 0.33], [s * 0.62, hy + 1.45, hz + 0.6], 0.06, '#f2c14e', { parent: 'head' })
        .rod([s * 0.38, hy + 1.45, hz + 0.2], [s * 0.6, hy + 1.85, hz + 0.25], 0.05, '#f2c14e', { parent: 'head' })
        .rod([s * 0.22, hy + 0.36, hz + 1.72], [s * 0.85, hy + 0.55, hz + 2.4], 0.035, '#f2c14e', { parent: 'head' })
        .rod([s * 0.85, hy + 0.55, hz + 2.4], [s * 1.15, hy + 0.2, hz + 2.5], 0.03, '#f2c14e', { parent: 'head' })
        .cone([0.2, 0.35, 0.1], [s * 0.48, hy + 0.3, hz + 0.75], { color: 'white', rot: [0, 0, s * 70], parent: 'head' }))
      .ball([0.5, 0.35, 0.3], [0, hy - 0.12, hz + 1.0], { color: '#f2c14e', parent: 'head' });
    for (let k = 0; k < 5; k++) b.cone([0.24, 0.55, 0.12], [0, hy + 0.2 + k * 0.12, hz + 0.25 - k * 0.12], { color: k % 2 ? '#e8702a' : '#f2c14e', rot: [-120 + k * 6, 0, 0], parent: 'head' });
    b.ball(0.42, [0, hy + 0.45, hz + 2.6], { color: '#fff1b8', glow: true, name: 'pearl' });
    for (const r of [0, 120, 240]) b.cone([0.18, 0.5, 0.06], [0, hy + 0.75, hz + 2.6], { color: '#ff9a3a', rot: [0, r, 0], parent: 'pearl', glow: true, noInk: true });
    const wave = (k: number): Step => A.par(...[2, 4, 6, 8, 10, 12].map((i, j) => A.pose(`seg${i}`, { rot: [k * (j % 2 ? -9 : 9), 0, 0], dur: 0.5 })));
    return b.act({
      click: [
        [A.par(wave(1), A.operate('jaw', 'open'), A.say('ROOOAR!', 1.8)), wave(-1), wave(1), A.par(wave(0), A.operate('jaw', 'close'))],
        [A.par(A.pose('pearl', { move: [0, 0.6, 0.8], dur: 0.6 }), A.pose('head', { rot: [-12, 0, 0], dur: 0.6 }), A.operate('jaw', 'open')), A.par(A.effect('sparkle', { dur: 1.2 }), A.pose('pearl', { move: [0, 0, 0], dur: 0.8 }), A.pose('head', { rot: [0, 0, 0], dur: 0.8 }), A.operate('jaw', 'close'))],
      ],
    }).done();
  }),
  // A choir boy in red cassock and white ruff, hymn book open in both hands: sings out.
  e('choir boy', 'town', 'religion', () => act(W('choir boy', { h: 'kid', top: 'white', long: true, bottom: 'red', skirt: 'red', legs: 'red', shoes: 'black', style: 'short', acc: [X((d) => [['torso', 'cyl', [d.tw * 1.5, d.torsoH * 0.45 + d.legLen * 0.3, d.td * 1.7], [0, d.torsoH * 0.28 - d.legLen * 0.14, 0], 'white', { taper: 0.75, layer: 2 }]]), ruff('white'), rest({ armR: [-22, 0, -12], foreR: [-62, 0, 18], armL: [-22, 0, 12], foreL: [-62, 0, -18] }), onPalm('R', (a) => [['box', [a * 2.4, a * 0.25, a * 3.0], [a * 1.0, a * 0.7, a * 1.2], 'paper', { srot: [-35, 0, 8], edge: 'sharp' }], ['box', [a * 2.4, a * 0.22, a * 3.0], [a * 3.3, a * 0.7, a * 1.2], 'paper', { srot: [-35, 0, -8], edge: 'sharp' }], ['box', [a * 5.0, a * 0.15, a * 3.1], [a * 2.15, a * 0.5, a * 1.2], 'darkred', { srot: [-35, 0, 0], edge: 'sharp' }]])] }),
    [A.par(A.pose('head', { rot: [-14, 0, 0], dur: 0.5 }), A.say('♪ Al-le-lu-ia! ♪', 2.6)), A.wait(2), A.pose('head', { rot: [0, 0, 0], dur: 0.5 })],
    [G('bow', 'Amen.', 1.6)],
  )),
  // Clark Kent: glasses and a grey suit; opens his shirt to show the S beneath.
  e('clark', 'town', 'superheroes', () => act(W('clark', { h: 1.8, skin: 'skin1', hair: '#1d1d1d', style: 'short', top: 'blue', long: true, bottom: 'gray', shoes: 'black', acc: [patch('yellow', 0.3, 0.24, 0.68), chest('S', 'red', 0.2, 0.16, 0.68), X((d) => [1, -1].flatMap((s) => [
    ['torso', 'box', [d.tw * 0.27, d.torsoH * 0.62, d.td * 0.06], [s * d.tw * 0.27, d.torsoH * 0.66, d.td * 0.6], 'white', { name: s > 0 ? 'shirtL' : 'shirtR', off: [-s * d.tw * 0.135, 0, 0], layer: 7 }],
    [s > 0 ? 'shirtL' : 'shirtR', 'box', [d.tw * 0.05, d.torsoH * 0.5, d.td * 0.03], [-s * d.tw * 0.25, -d.torsoH * 0.04, d.td * 0.03], s > 0 ? 'navy' : 'white', { layer: 8 }],
  ] as XP[])), openJacket('gray'), face('glasses', 'black'), held('briefcase', 'brown', 'L')] }),
    [A.par(A.pose('shirtL', { rot: [0, -70, 0], dur: 0.4 }), A.pose('shirtR', { rot: [0, 70, 0], dur: 0.4 }), A.pose('armR', { rot: [-40, 0, -20], dur: 0.4 }), A.say('This looks like a job for...', 2.2)), A.wait(1.8), A.par(A.pose('shirtL', { rot: [0, 0, 0], dur: 0.4 }), A.pose('shirtR', { rot: [0, 0, 0], dur: 0.4 }), A.pose('armR', { rot: [0, 0, 0], dur: 0.4 }))],
    hold({ armR: [-30, 0, -30], foreR: [-122, 0, 22] }, 'Just a mild-mannered reporter.', 1.8),
  )),
  // Queen of the Nile: black bob with a gold band and cobra, a broad jewelled collar and a gold sceptre.
  e('cleopatra', 'town', 'history', () => act(W('cleopatra', { skin: 'skin3', hair: '#1d1d1d', style: 'long', top: 'white', skirt: 'white', legs: 'white', shoes: 'gold', acc: [hat('headband', 'gold'), X((d) => [['head', 'capsule', [d.headW * 0.1, d.headH * 0.25, d.headW * 0.1], [0, d.headY + d.headH * 0.3, d.headD * 0.55], 'gold', { layer: 6 }], ['head', 'ball', [d.headW * 0.14, d.headW * 0.12, d.headW * 0.1], [0, d.headY + d.headH * 0.45, d.headD * 0.56], 'gold', { layer: 6 }], ['torso', 'torus', [d.tw * 1.05, d.td * 1.6, d.torsoH * 0.06], [0, d.torsoH * 0.95, 0], 'teal', { srot: [80, 0, 0], tube: 0.35, layer: 4 }], ['torso', 'torus', [d.tw * 0.9, d.td * 1.4, d.torsoH * 0.05], [0, d.torsoH * 0.88, 0.01], 'gold', { srot: [80, 0, 0], tube: 0.25, layer: 4 }]]), gown('white', 0.8), wear('belt', 'gold'), rings('gold', 'armL', [0.3]), rings('gold', 'armR', [0.3]), held('cane', 'gold')] }),
    [G('hands_on_hips', 'Bow before the Queen of the Nile!', 2.4)],
    [G('wave', 'Welcome to Egypt!')],
  )),
  // A priest in a black cassock and white collar, a cross and a book: blesses you.
  e('cleric', 'town', 'religion', () => act(W('cleric', { top: 'black', long: true, bottom: 'black', skirt: 'black', legs: 'black', shoes: 'black', hair: 'gray', style: 'short', acc: [X((d) => [['torso', 'box', [d.tw * 0.14, d.torsoH * 0.07, d.td * 0.08], [0, d.torsoH * 0.95, d.td * 0.53], 'white', { layer: 5 }], ['torso', 'box', [d.tw * 0.05, d.torsoH * 0.22, d.td * 0.04], [0, d.torsoH * 0.6, d.td * 0.58], 'gold', { layer: 6 }], ['torso', 'box', [d.tw * 0.16, d.torsoH * 0.05, d.td * 0.04], [0, d.torsoH * 0.65, d.td * 0.58], 'gold', { layer: 6 }]]), gown('black', 0.8), rest({ armL: [-20, 0, 10], foreL: [-62, 0, -10] }), onPalm('L', (a) => [['box', [a * 2.4, a * 0.5, a * 3.0], [0, a * 0.6, a * 1.3], 'black', { srot: [-25, 0, 0], edge: 'sharp' }], ['box', [a * 2.2, a * 0.42, a * 2.9], [a * 0.12, a * 0.6, a * 1.3], 'cream', { srot: [-25, 0, 0], edge: 'sharp' }], ['box', [a * 0.15, a * 0.05, a * 1.2], [0, a * 0.9, a * 1.0], 'gold', { srot: [-25, 0, 0] }]])] }),
    hold({ armR: [-75, 0, -10], foreR: [-30, 0, 0] }, 'Bless you, my child.', 1.6, [A.effect('sparkle', { dur: 1.2 })]),
    [G('bow', 'Go in peace.')],
  )),
  // A shop clerk in a red vest and name badge at a counter with a cash register whose drawer pops out.
  e('clerk', 'town', 'shops', () => act(topOf(W('clerk', { top: 'white', bottom: 'black', shoes: 'black', acc: [wear('vest', 'red'), wear('badge', 'white'), X((d) => {
    const k = d.H / 1.7, x0 = -0.72 * k, z0 = 0.2, top = 0.92 * k;
    return [
      ['', 'box', [0.6, top - 0.04, 1.2], [x0, (top - 0.04) / 2, z0], '#8a5a35', { edge: 'sharp', round: 0.06 }],
      ['', 'box', [0.66, 0.04, 1.26], [x0, top - 0.02, z0], '#e8e2d4', { edge: 'sharp', round: 0.2, name: 'counter' }],
      ['', 'box', [0.62, 0.08, 1.22], [x0, 0.04, z0], '#3a2a20', { edge: 'sharp' }],
      ['', 'box', [0.34, 0.12, 0.36], [x0, top + 0.06, z0 + 0.25], '#3a3633', { edge: 'sharp', round: 0.15 }],
      ['', 'box', [0.3, 0.06, 0.3], [x0 + 0.01, top + 0.03, z0 + 0.25], '#2a2726', { edge: 'sharp', name: 'drawer', mover: { kind: 'slide', axis: 'x', amount: 0.2 } }],
      ['', 'box', [0.3, 0.06, 0.24], [x0 - 0.03, top + 0.15, z0 + 0.22], '#5c6166', { edge: 'sharp', srot: [0, 0, -18] }],
      ...[-0.08, 0, 0.08].flatMap((dz) => [-0.06, 0.02].map((dx) => ['', 'box', [0.04, 0.02, 0.05], [x0 + dx - 0.02, top + 0.19 + dx * 0.3, z0 + 0.22 + dz], 'lightgray', { edge: 'sharp', srot: [0, 0, -18] }] as XP)),
      ['', 'box', [0.04, 0.14, 0.24], [x0 + 0.12, top + 0.22, z0 + 0.25], '#2a2726', { edge: 'sharp' }],
      ['', 'box', [0.012, 0.09, 0.2], [x0 + 0.14, top + 0.23, z0 + 0.25], '#7cf08a', { glow: true, text: '$2.00' }],
      ['', 'box', [0.2, 0.18, 0.02], [x0 + 0.05, top + 0.1, z0 - 0.3], 'lime', { edge: 'sharp', srot: [0, 90, 0], text: 'SALE' }],
    ];
  })] }), 'counter'),
    [A.par(A.operate('drawer', 'out'), A.anim('nod'), A.say('Ka-ching! That\'s two dollars.', 2)), A.wait(1.4), A.operate('drawer', 'in')],
    [G('wave', 'Thanks! Come again!')],
  )),
  // Two identical people in grey, numbered 01 and 02: they wave together, then eye each other.
  e('clone', 'fantasy', 'sci-fi', () => act(together('clone', [[W('clone', { top: 'lightgray', long: true, bottom: 'lightgray', shoes: 'white', hair: 'darkbrown', style: 'short', acc: [chest('01', 'white', 0.4, 0.2), wear('belt', 'darkgray')] }), -0.32], [W('clone', { top: 'lightgray', long: true, bottom: 'lightgray', shoes: 'white', hair: 'darkbrown', style: 'short', acc: [chest('02', 'white', 0.4, 0.2), wear('belt', 'darkgray')] }), 0.32]]),
    hold({ armR: [-15, 0, -144], b_armR: [-15, 0, -144] }, 'Hello! ...Hello!', 1.6),
    hold({ head: [0, 40, 0], b_head: [0, -40, 0] }, 'Which of us is the real one?', 2),
  )),
  // Orange wig, red nose, polka dots, giant shoes and a squirting flower in the lapel.
  e('clown', 'town', 'entertainment', () => act(W('clown', { skin: 'skin1', top: 'yellow', bottom: 'red', shoes: 'red', acc: [mop('orange', 1.3), face('clownnose'), hat('party', 'blue'), nameHat(), wear('bowtie', 'blue'), buttons('red', 3), patch('blue', 0.12, 0.08, 0.3, 0.3), patch('green', 0.12, 0.08, 0.5, -0.3), rings('white', 'foreR', [0.85], 1.6), rings('white', 'foreL', [0.85], 1.6), boots('red', 1.6), held('balloon', 'blue', 'L'), X((d) => [['torso', 'ball', [d.tw * 0.18, d.tw * 0.18, d.tw * 0.1], [d.tw * 0.28, d.torsoH * 0.82, d.td * 0.56], 'pink', { name: 'flower', layer: 6 }], ['flower', 'ball', [d.tw * 0.07, d.tw * 0.07, d.tw * 0.05], [0, 0, d.tw * 0.05], 'yellow', { layer: 7 }]])] }),
    [A.par(A.pose('flower', { scale: 1.4, dur: 0.2 }), A.effect('water_spray', { dur: 1.2 }), A.anim('laugh'), A.say('Squirt! Hee hee!', 2)), A.pose('flower', { scale: 1, dur: 0.3 })],
    hold({ armR: [-40, 0, -22], foreR: [-122, 0, 30] }, 'Honk honk!', 1.2),
  )),
  // An army colonel: olive uniform, peaked cap, mustache, medals and a swagger stick.
  e('colonel', 'town', 'military', () => act(W('colonel', { pose: 'hips', top: 'olive', long: true, bottom: 'olive', shoes: 'black', hair: 'gray', style: 'short', acc: [hat('police', '#6b6f3a'), nameHat(), face('mustache', 'gray'), epaul('gold'), wear('medal'), patch('red', 0.16, 0.06, 0.72, 0.25), patch('blue', 0.16, 0.06, 0.66, 0.25), buttons('gold', 3), wear('belt', 'brown'), held('baton', 'darkwood')] }),
    [G('point', 'Forward, march!')],
    [G('nod', 'Carry on, soldier.')],
  )),
  // The explorer in a velvet cap and cape with a brass spyglass and a chart.
  e('columbus', 'town', 'history', () => act(W('columbus', { skin: 'skin1', hair: 'white', style: 'long', top: 'darkred', long: true, bottom: 'black', shoes: 'black', acc: [hat('beret', 'black'), nameHat(), wear('cape', 'black'), wear('belt', 'gold'), ruff('white'), spyglass(), held('map', 'paper')] }),
    hold({ armL: [-40, 0, 28], foreL: [-112, 0, -30] }, 'Land ho!', 1.8),
    [G('point', 'Sail west!')],
  )),
  // A stand-up comedian with a mic, beside his bar stool: tells a joke and laughs at it.
  e('comedian', 'town', 'entertainment', () => act(topOf(W('comedian', { top: 'white', long: true, bottom: 'black', shoes: 'black', acc: [suitX('purple', null), held('mic'), beside((d) => {
    const k = d.H / 1.7, x0 = 0.62 * k, z0 = 0.1;
    return [
      ['cyl', [0.36, 0.06, 0.36], [x0, 0.74 * k, z0], 'red', { edge: 'sharp', name: 'stool' }],
      ['cyl', [0.3, 0.02, 0.3], [x0, 0.3 * k, z0], 'silver', { edge: 'sharp' }],
      ...[[0.12, 0.12], [-0.12, 0.12], [0.12, -0.12], [-0.12, -0.12]].map(([xx, zz]) => ['capsule', [0.03, 0.74 * k, 0.03], [x0 + xx, 0.36 * k, z0 + zz], 'silver', { srot: [zz * 40, 0, -xx * 40] }] as HP),
    ];
  })] }), 'stool', 'seat', 'seat'),
    [G('shrug', 'So a duck walks into a bar...', 2.4)],
    [G('laugh', 'Ba-dum, tss!')],
  )),
  // In an ushanka with a red star and a greatcoat, waving a red flag.
  e('communist (person)', 'town', 'politics', () => act(W('communist (person)', { top: 'olive', long: true, bottom: 'darkgray', shoes: 'black', acc: [ushanka('#5a3a22', 'red'), wear('coat', 'olive'), wear('belt', 'black'), boots('black'), held('flag', 'red', 'L')] }),
    hold(FIST, 'Workers, unite!', 1.4),
    [G('clap', 'Well done, comrades!')],
  )),
  // A flashy suit, white fedora and pencil mustache, fanning three cards.
  e('con artist', 'town', 'crime', () => act(W('con artist', { top: 'white', long: true, bottom: 'black', shoes: 'white', acc: [suitX('#4a4a6a', 'pink'), fedora('white'), face('mustache', '#1d1d1d'), inHand('L', (a) => [-25, 0, 25].map((r, i) => ['box', [a * 1.4, a * 2, a * 0.1], [0, a * 0.6, a * (1.1 + i * 0.05)], i === 1 ? 'red' : 'white', { srot: [0, 0, r], round: 0.1, edge: 'sharp' }] as HP))] }),
    [G('wink', 'Find the lady!')],
    hold(OFFER, 'Trust me, it\'s a bargain!', 1.6),
  )),
  // A congressman in a navy suit with a flag pin, the bill under his arm.
  e('congressman', 'town', 'politics', () => act(W('congressman', { hair: 'gray', style: 'short', top: 'white', long: true, bottom: 'navy', shoes: 'black', acc: [suitX('navy', 'blue'), patch('red', 0.08, 0.06, 0.82, 0.3), card('BILL', 'paper', 'L', 3, 4), held('briefcase', 'black')] }),
    [G('point', 'Vote for me!')],
    [G('wave', 'Thank you, thank you all!')],
  )),
  // Twins joined at the side, in matching teal: they wave their outer hands and look at each other.
  e('conjoined twins', 'town', 'family', () => act(together('conjoined twins', [[W('conjoined twins', { h: 1.6, top: 'teal', bottom: 'denim', shoes: 'white', style: 'short', acc: [] }), -0.17], [W('conjoined twins', { h: 1.6, top: 'teal', bottom: 'denim', shoes: 'white', style: 'short', acc: [] }), 0.17]]),
    hold({ armR: [-15, 0, -144], b_armL: [-15, 0, 144] }, 'Hello from both of us!', 1.6),
    hold({ head: [0, 35, 0], b_head: [0, -35, 0] }, 'We do everything together!', 2),
  )),
  // A grey suit, bowler hat, umbrella-cane and his newspaper.
  e('conservative', 'town', 'politics', () => act(W('conservative', { hair: 'gray', style: 'short', top: 'white', long: true, bottom: 'gray', shoes: 'black', acc: [suitX('#4a5a4a', 'navy'), hat('bowler', 'black'), nameHat(), held('cane', 'black'), held('letter', 'paper', 'L')] }),
    tipHat('Good day to you.'),
    [G('shake_head', 'Taxes? Far too high, I say.', 2.2)],
  )),
  // Hard hat, hi-vis vest with reflective bands, work boots and a shovel: digs.
  e('construction worker', 'town', 'trades', () => act(W('construction worker', { top: 'gray', bottom: 'denim', shoes: 'brown', acc: [hat('hard'), nameHat(), wear('vest', 'orange'), bands('silver', [0.35, 0.6]), wear('tool belt'), gloves('#c8955a'), boots('brown'), held('shovel')] }),
    [to({ armR: [-45, 0, 0], torso: [20, 0, 0] }, 'Dig, dig, dig!', 0.35), A.par(A.pose('armR', { rot: [10, 0, 0], dur: 0.3 }), A.pose('torso', { rot: [0, 0, 0], dur: 0.3 }), A.effect('dust', { dur: 0.8 })), A.pose('armR', { rot: [-45, 0, 0], dur: 0.35 }), A.par(A.pose('armR', { rot: [0, 0, 0], dur: 0.35 }), A.effect('dust', { dur: 0.8 }))],
    [G('wave', 'Morning! Watch your step!')],
  )),
  // An army corporal: helmet, two gold stripes on each sleeve, backpack and rifle.
  e('corporal', 'town', 'military', () => act(W('corporal', { top: 'olive', long: true, bottom: 'olive', shoes: 'black', acc: [hat('military'), nameHat(), X((d) => [1, -1].flatMap((s) => [0, 1].map((i) => [`arm${s > 0 ? 'L' : 'R'}`, 'box', [d.aw * 0.3, d.aw * 0.18, d.aw * 0.9], [s * d.aw * 0.5, -d.upper * (0.3 + i * 0.14), 0], 'gold', { srot: [0, 0, s * 6] }] as XP))), wear('belt', 'black'), wear('backpack', 'olive'), boots('black'), held('blaster', 'darkgreen')] }),
    hold(SALUTE, 'Yes, sir!', 1.4),
    [G('thumbs_up', 'All clear!')],
  )),
  // A cowboy in a ten-gallon hat, vest and neckerchief: twirls his lasso, tips his hat.
  e('cowboy', 'town', 'western', () => act(W('cowboy', { top: 'red', long: true, bottom: 'denim', shoes: 'brown', acc: [hat('cowboy'), nameHat(), wear('vest', 'brown'), wear('scarf', 'yellow'), wear('belt', 'darkbrown'), boots('brown'), lasso('tan')] }),
    [to({ armR: [0, 0, -150] }, 'Yee-haw!', 0.35), A.pose('lasso', { spin: [0, 540, 0], dur: 0 }), A.wait(1.6), A.pose('lasso', { spin: [0, 0, 0], rot: [0, 0, 0], dur: 0 }), A.pose('armR', { rot: [0, 0, 0], dur: 0.4 })],
    tipHat('Howdy, partner!'),
  )),
  // A cowgirl in a tan hat, fringed vest and pigtails, a rope at her hip.
  e('cowgirl', 'town', 'western', () => act(W('cowgirl', { top: 'pink', skirt: 'brown', legs: 'brown', shoes: 'brown', hair: 'gold', style: 'pigtails', acc: [hat('cowboy', 'tan'), nameHat(), wear('vest', '#c8955a'), wear('scarf', 'red'), boots('#8a5a35'), coil('tan', 'R')] }),
    tipHat('Howdy, y\'all!'),
    [A.par(A.anim('hop', 2), A.say('Giddy-up!', 1.6))],
  )),
  // A yellow crash test dummy with target marks on head and chest: jolts as if in a crash.
  e('crash test dummy', 'tech', 'robots', () => act(W('crash test dummy', { skin: 'yellow', eyes: '#1d1d1d', style: 'none', top: 'yellow', long: true, bottom: 'yellow', shoes: 'black', acc: [X((d) => [1, -1].flatMap((s) => [['head', 'cyl', [d.headW * 0.36, d.headW * 0.06, d.headW * 0.36], [s * d.headW * 0.48, d.headY, 0], 'black', { srot: [0, 0, 90] }], ['head', 'box', [d.headW * 0.08, d.headW * 0.18, d.headW * 0.18], [s * d.headW * 0.52, d.headY + d.headW * 0.09, d.headW * 0.09], 'yellow']] as XP[])), patch('black', 0.25, 0.2, 0.7), wear('belt', 'black'), wristbands('black'), rings('black', 'shinL', [0.1], 1.2), rings('black', 'shinR', [0.1], 1.2)] }),
    [A.par(A.pose('torso', { rot: [38, 0, 0], dur: 0.12 }), A.pose('head', { rot: [30, 0, 0], dur: 0.12 }), A.pose('armR', { rot: [-70, 0, 0], dur: 0.12 }), A.pose('armL', { rot: [-70, 0, 0], dur: 0.12 }), A.say('CRUNCH!', 1.4)), A.par(A.pose('torso', { rot: [-10, 0, 0], dur: 0.2 }), A.pose('head', { rot: [-20, 0, 0], dur: 0.2 })), A.par(A.pose('torso', { rot: [0, 0, 0], dur: 0.5 }), A.pose('head', { rot: [0, 0, 0], dur: 0.5 }), A.pose('armR', { rot: [0, 0, 0], dur: 0.5 }), A.pose('armL', { rot: [0, 0, 0], dur: 0.5 }))],
    [A.par(A.anim('shake'), A.say('Bzzt... test complete.', 2))],
  )),
  // A lollipop lady in a hi-vis vest and cap with a round STOP sign on its pole and a whistle.
  e('crossing guard', 'town', 'law and order', () => act(W('crossing guard', { top: 'darkgray', long: true, bottom: 'navy', shoes: 'black', acc: [hat('cap', 'navy'), nameHat(), wear('vest', 'yellow'), bands('silver', [0.4]), wear('whistle'), poleSign('STOP', 'red', 'L', true)] }),
    hold(TO_MOUTH, 'Tweeet! Stop, cars!', 1.4),
    [G('wave', 'Okay, kids, cross now!')],
  )),
  // A crusader knight: white surcoat with a red cross, great helm, sword and cross shield.
  e('crusader', 'town', 'warriors', () => act(W('crusader', { top: 'gray', long: true, bottom: 'gray', shoes: 'gray', acc: [tabard('white', 'red'), greathelm('steel'), wear('belt', 'brown'), gloves('steel'), held('sword'), crossShield()] }),
    hold({ armR: [0, 0, -155] }, 'For the kingdom!', 1.4),
    [G('bow', 'My sword is yours.')],
  )),
  // Cupid: a winged cherub with a golden bow and a heart-tipped arrow; flutters up and fires hearts.
  e('cupid', 'fantasy', 'myths', () => act(W('cupid', { h: 'kid', build: 1.2, skin: 'skin1', hair: 'gold', style: 'short', top: 'skin1', bottom: 'white', legs: 'skin1', shorts: true, shoes: 'skin1', blush: 'pink', acc: [X((d) => [1, -1].map((s) => ['torso', 'ball', [d.tw * 1.2, d.torsoH * 1.0, d.td * 0.14], [s * d.tw * 0.25, d.torsoH * 0.8, -d.td * 0.62], 'white', { name: s > 0 ? 'wingL' : 'wingR', off: [s * d.tw * 0.55, 0, 0], srot: [0, s * 18, -s * 22], layer: -3 }] as XP)), wear('sash', 'white'), held('bow', 'gold', 'L'), inHand('R', (a) => [['capsule', [a * 0.2, a * 5, a * 0.2], [0, a * 0.5, a * 0.8], 'wood', { srot: [0, 0, 70] }], ['ball', [a * 0.7, a * 0.7, a * 0.5], [-a * 2.5, a * 1.4, a * 0.8], 'red'], ['ball', [a * 0.7, a * 0.7, a * 0.5], [-a * 2.6, a * 1.0, a * 0.8], 'red']])] }),
    [to({ armL: [-5, 0, 85], armR: [-5, 0, -80], foreR: [0, 0, -100] }, undefined, 0.4), A.par(A.effect('hearts', { dur: 1.6 }), A.say('Fall in love!', 2)), A.wait(1), A.par(A.pose('armL', { rot: [0, 0, 0], dur: 0.4 }), A.pose('armR', { rot: [0, 0, 0], dur: 0.4 }), A.pose('foreR', { rot: [0, 0, 0], dur: 0.4 }))],
    [A.par(A.pose('hips', { move: [0, 0.35, 0], dur: 0.8 }), A.pose('wingL', { rot: [0, -25, 15], dur: 0.4 }), A.pose('wingR', { rot: [0, 25, -15], dur: 0.4 }), A.anim('laugh'), A.say('Tee-hee!', 1.6)), A.par(A.pose('hips', { move: [0, 0, 0], dur: 0.8 }), A.pose('wingL', { rot: [0, 0, 0], dur: 0.4 }), A.pose('wingR', { rot: [0, 0, 0], dur: 0.4 }))],
  )),
  // A road cyclist in helmet and shades beside a full-size road bike: spoked wheels that spin, a bell.
  e('cyclist', 'sports', 'athletes', () => act(W('cyclist', { skin: 'skin2', top: 'yellow', bottom: 'black', legs: 'skin2', shorts: true, shoes: 'white', acc: [hat('helmet', 'red'), nameHat(), face('sunglasses'), gloves('black', 0.9), X((d) => {
    const k = d.H / 1.7, x = 0.7 * k;
    const R = 0.33, rz = -0.52, fz = 0.52;
    const tube = (y1: number, z1: number, y2: number, z2: number, t: number, c: string, dx = 0): XP => ['', ...rodYZ(x + dx, y1, z1, y2, z2, t, c)] as XP;
    const wheel = (n: string, z: number): XP[] => [
      ['', 'torus', [2 * R, 2 * R, 0.05], [x, R, z], 'rubber', { srot: [0, 90, 0], tube: 0.09, name: n, edge: 'soft' }],
      [n, 'torus', [2 * R - 0.06, 2 * R - 0.06, 0.03], [0, 0, 0], 'silver', { srot: [0, 90, 0], tube: 0.06 }],
      [n, 'cyl', [0.05, 0.1, 0.05], [0, 0, 0], 'silver', { srot: [0, 0, 90] }],
      ...[0, 45, 90, 135].map((r) => [n, 'capsule', [0.008, 2 * R - 0.06, 0.008], [0, 0, 0], 'lightgray', { srot: [r, 0, 0], noInk: true }] as XP),
    ];
    return [
      ...wheel('wheel1', rz), ...wheel('wheel2', fz),
      tube(0.3, -0.06, 0.86, -0.22, 0.035, 'blue'),
      tube(0.83, -0.2, 0.88, 0.36, 0.032, 'blue'),
      tube(0.3, -0.06, 0.72, 0.41, 0.04, 'blue'),
      tube(0.3, -0.06, R, rz, 0.022, 'blue', 0.04), tube(0.3, -0.06, R, rz, 0.022, 'blue', -0.04),
      tube(0.82, -0.2, R, rz, 0.02, 'blue', 0.03), tube(0.82, -0.2, R, rz, 0.02, 'blue', -0.03),
      tube(0.92, 0.35, 0.7, 0.42, 0.05, 'blue'),
      tube(0.72, 0.42, R, fz, 0.022, 'silver', 0.035), tube(0.72, 0.42, R, fz, 0.022, 'silver', -0.035),
      tube(0.86, -0.22, 0.96, -0.25, 0.022, 'silver'),
      ['', 'box', [0.11, 0.045, 0.26], [x, 0.98, -0.27], 'black', { round: 0.6 }],
      tube(0.92, 0.35, 0.98, 0.42, 0.03, 'silver'),
      ['', 'capsule', [0.026, 0.44, 0.026], [x, 0.98, 0.43], 'silver', { srot: [0, 0, 90] }],
      ...[1, -1].map((s) => ['', 'capsule', [0.035, 0.1, 0.035], [x + s * 0.2, 0.98, 0.43], 'black', { srot: [0, 0, 90] }] as XP),
      ['', 'cyl', [0.045, 0.03, 0.045], [x + 0.12, 1.0, 0.43], 'gold', { name: 'bell' }],
      ['', 'cyl', [0.19, 0.015, 0.19], [x - 0.05, 0.3, -0.06], 'silver', { srot: [0, 0, 90], name: 'crank' }],
      ['crank', 'box', [0.02, 0.17, 0.02], [-0.01, -0.08, 0], 'silver'],
      ['crank', 'box', [0.08, 0.02, 0.05], [-0.04, -0.16, 0], 'black'],
      ['', 'box', [0.006, 0.03, 0.55], [x - 0.05, 0.3, -0.29], '#3a3633', { noInk: true }],
    ];
  })] }),
    [A.par(A.pose('wheel1', { spin: [600, 0, 0], dur: 0 }), A.pose('wheel2', { spin: [600, 0, 0], dur: 0 }), A.pose('crank', { spin: [300, 0, 0], dur: 0 }), A.pose('bell', { scale: 1.4, dur: 0.15 }), A.say('Ring ring! On your left!', 2)), A.pose('bell', { scale: 1, dur: 0.15 }), A.wait(1.6), A.par(A.pose('wheel1', { spin: [0, 0, 0], rot: [0, 0, 0], dur: 0 }), A.pose('wheel2', { spin: [0, 0, 0], rot: [0, 0, 0], dur: 0 }), A.pose('crank', { spin: [0, 0, 0], rot: [0, 0, 0], dur: 0 }))],
    [G('thumbs_up', 'Helmet on, safety first!')],
  )),
  // A one-eyed giant, 3 m tall, in a hide tunic with a big club: stomps the ground.
  e('cyclops', 'fantasy', 'monsters', () => act(W('cyclops', { h: 3.0, build: 1.45, skin: '#b8b06a', eyes: '#b8b06a', style: 'bald', top: '#b8b06a', bottom: '#8a6a3a', legs: '#b8b06a', shorts: true, shoes: '#8a6a3a', acc: [bigEye(), X((d) => [['head', 'ball', [d.headW * 0.5, d.headH * 0.1, d.headW * 0.1], [0, d.headY + d.headH * 0.24, d.headD * 0.46], '#6b6a3a', { layer: 6 }]]), X((d) => [['torso', 'box', [d.tw * 1.08, d.torsoH * 0.7, d.td * 1.1], [0, d.torsoH * 0.38, 0], '#8a6a3a', { round: 0.5, layer: 1 }]]), wear('sash', '#6b4a2e'), wear('belt', 'brown'), held('club')] }),
    [G('hands_on_hips', 'Who dares wake me?')],
    [A.par(A.anim('shake'), A.effect('dust', { dur: 1.2 }), A.say('STOMP! STOMP!', 2))],
  )),
  // A chipmunk cartoon character with a red nose, buck tooth and striped back; giggles, finds an acorn.
  e('dale', 'town', 'cartoon characters', () => act(shrink(W('dale', { pose: 'hold', h: 'kid', skin: '#b5814e', hair: '#8c5a2b', style: 'none', top: 'red', bottom: '#b5814e', shoes: '#b5814e', acc: [X((d) => [1, -1].map((s) => ['head', 'ball', [d.headW * 0.3, d.headW * 0.3, d.headW * 0.12], [s * d.headW * 0.4, d.headY + d.headH * 0.42, 0], '#8c5a2b'] as XP)), nose('red', 0.24), X((d) => [['head', 'box', [d.headW * 0.16, d.headH * 0.12, d.headW * 0.05], [0, d.headY - d.headH * 0.25, d.headD * 0.48], 'white', { layer: 6 }], ['head', 'ball', [d.headW * 0.6, d.headH * 0.32, d.headD * 0.2], [0, d.headY - d.headH * 0.15, d.headD * 0.4], '#e8c8a0', { layer: 5 }], ['hips', 'capsule', [d.tw * 0.55, d.H * 0.4, d.tw * 0.55], [0, d.H * 0.1, -d.td * 1.0], '#8c5a2b', { srot: [-15, 0, 0], layer: -3 }], ['torso', 'box', [d.tw * 0.12, d.torsoH * 0.9, d.td * 0.1], [0, d.torsoH * 0.5, -d.td * 0.52], '#3a2414', { layer: -2 }]]), patch('yellow', 0.12, 0.1, 0.4, 0.2), patch('yellow', 0.12, 0.1, 0.7, -0.25)] }), 0.6),
    [G('laugh', 'Hee hee hee!')],
    show('acorn', 'An acorn! All mine!', 'point'),
  )),
  // A ballerina in a pink tutu, arms curved overhead: a pirouette, then a curtsy.
  e('dancer', 'town', 'arts', () => act(W('dancer', { skin: 'skin1', top: 'pink', bottom: 'pink', legs: 'pink', shoes: 'pink', hair: '#3b2a1e', style: 'bun', build: 0.85, acc: [wear('tutu', 'pink'), rest({ armR: [0, 0, -150], foreR: [0, 0, -45], armL: [0, 0, 150], foreL: [0, 0, 45] })] }),
    [A.par(A.pose('hips', { rot: [0, 720, 0], dur: 1.3 }), A.say('♪ And... twirl! ♪', 1.8)), A.pose('hips', { rot: [0, 0, 0], dur: 0 })],
    [G('bow', 'Merci beaucoup!')],
  )),
  // A stunt rider in a white star-spangled jumpsuit, cape and helmet: thumbs up, then a somersault.
  e('daredevil', 'town', 'entertainment', () => act(W('daredevil', { pose: 'hips', top: 'white', long: true, bottom: 'white', shoes: 'white', acc: [hat('helmet', 'white'), nameHat(), bands('blue', [0.5]), bands('red', [0.38]), wear('cape', 'white'), wear('belt', 'gold'), boots('white'), X((d) => [['torso', 'cyl', [d.tw * 0.25, d.td * 0.08, d.tw * 0.25], [0, d.torsoH * 0.75, d.td * 0.55], 'blue', { segs: 5, srot: [90, 0, 0] }]])] }),
    [G('thumbs_up', 'Watch this jump!')],
    [...flip('Hup!', 1.2), G('arms_up', 'Ta-daaa!')],
  )),
  // The armoured dark knight: black plate, a long split cape that sweeps open, a bat on the chest.
  e('dark knight', 'town', 'superheroes', () => act(W('dark knight', { h: 1.85, build: 1.25, skin: 'skin1', top: '#2a2726', long: true, bottom: '#2a2726', shoes: 'black', style: 'none', acc: [cowl('#1d1d1d'), X((d) => [1, -1].map((s) => ['torso', 'box', [d.tw * 0.62, d.torsoH + d.legLen * 0.8, d.td * 0.14], [s * d.tw * 0.22, d.torsoH * 0.98, -d.td * 0.62], '#1d1d1d', { name: s > 0 ? 'capeL' : 'capeR', off: [s * d.tw * 0.1, -(d.torsoH + d.legLen * 0.8) / 2 + d.torsoH * 0.02, 0], layer: -3 }] as XP)), wear('armor', '#3a3a3a'), wear('belt', '#5c6166'), X((d) => [['torso', 'wedge', [d.tw * 0.5, d.torsoH * 0.14, d.td * 0.05], [0, d.torsoH * 0.72, d.td * 0.66], '#1d1d1d', { srot: [0, 0, 180], layer: 6 }]]), gloves('#1d1d1d'), boots('#1d1d1d')] }),
    hold({ capeL: [0, 0, 55], capeR: [0, 0, -55], armL: [0, 0, 60], armR: [0, 0, -60] }, 'I am the night.', 1.6),
    [A.par(A.effect('smoke', { dur: 1.6 }), A.anim('look_around'), A.say('Gotham needs me.', 2))],
  )),
  // A hard-hat diver: brass helmet with portholes, canvas suit, lead boots and weight belt; bubbles rise.
  e('deep sea diver', 'town', 'sailors', () => act(W('deep sea diver', { build: 1.3, top: '#c8b88a', long: true, bottom: '#c8b88a', shoes: 'iron', style: 'none', acc: [divingHelmet(), X((d) => [['torso', 'capsule', [d.tw * 0.12, d.torsoH * 0.9, d.tw * 0.12], [-d.tw * 0.3, d.torsoH * 0.9, -d.td * 0.7], '#3a3633', { srot: [-30, 0, 20] }]]), boots('iron', 1.3), gloves('#5a3a22'), wear('belt', 'iron'), X((d) => [-0.3, 0, 0.3].map((xx) => ['hips', 'box', [d.tw * 0.22, d.lw * 0.7, d.td * 0.2], [d.tw * xx, d.lw * 0.1, d.td * 0.56], '#3a3633', { edge: 'sharp' }] as XP))] }),
    [A.spawn('b', 'bubble', { rel: 'near', of: 'self', dist: 'close', height: 'high' }), A.par(A.move('b', { rel: 'above', of: 'self', dist: 'far' }, { speed: 'slow', style: 'fly' }), A.say('Blub, blub!', 1.6)), A.remove('b', 'pop')],
    [G('thumbs_up', 'Thumbs up means going up!')],
  )),
  // In an orange jumpsuit with a number, hands cuffed in front.
  e('defendant', 'town', 'law and order', () => act(W('defendant', { top: 'orange', long: true, bottom: 'orange', shoes: 'white', acc: [reach(35, 20), cuffs(), X((d) => [['foreR', 'capsule', [d.aw * 0.15, d.tw * 0.35, d.aw * 0.15], [d.aw * 0.8, -d.lower * 0.8, d.aw * 0.4], 'silver', { srot: [0, 0, 90] }]]), chest('7031', 'white', 0.5, 0.14, 0.82)] }),
    [G('shake_head', 'I didn\'t do it!')],
    [G('shrug', 'I want my lawyer.')],
  )),
  // A courier in brown with a parcel in both arms: hands it over.
  e('delivery man', 'town', 'drivers', () => act(W('delivery man', { top: '#6b4a2e', bottom: '#6b4a2e', shoes: 'black', acc: [hat('cap', '#6b4a2e'), nameHat(), rest({ armR: [-25, 0, -14], foreR: [-60, 0, 20], armL: [-25, 0, 14], foreL: [-60, 0, -20] }), X((d) => [['torso', 'box', [d.tw * 1.2, d.tw * 0.85, d.tw * 0.85], [0, d.torsoH * 0.42, d.td * 0.5 + d.tw * 0.5], '#c8955a', { round: 0.08, layer: 7, edge: 'sharp', name: 'box' }], ['box', 'box', [d.tw * 1.22, d.tw * 0.1, d.tw * 0.25], [0, d.tw * 0.38, 0], '#e8d29a', { layer: 8 }], ['box', 'box', [d.tw * 0.3, d.tw * 0.2, d.tw * 0.02], [d.tw * 0.3, -d.tw * 0.1, d.tw * 0.43], 'white', { layer: 8, text: '↑' }]])] }),
    [G('nod', 'Package for you! Sign here.', 2.2)],
    [A.pose('box', { scale: 0, dur: 0.2 }), A.spawn('p', 'parcel', { rel: 'front', of: 'self', dist: 'close' }), G('thumbs_up', 'Delivered!'), A.wait(1), A.remove('p', 'fade'), A.pose('box', { scale: 1, dur: 0.3 })],
  )),
  // A dentist in a white coat, mask and head mirror, with a big tooth and a toothbrush.
  e('dentist', 'town', 'medical', () => act(W('dentist', { top: 'white', bottom: 'skyblue', shoes: 'white', acc: [wear('labcoat'), face('mask', 'skyblue'), headMirror(), toothH(), inHand('R', (a) => [['capsule', [a * 0.3, a * 3, a * 0.3], [0, a * 0.6, a * 1.0], 'cyan', { srot: [30, 0, 0] }], ['box', [a * 0.5, a * 0.6, a * 0.8], [0, a * 1.9, a * 1.8], 'white']])] }),
    [G('nod', 'Open wide and say "ahh"!')],
    hold(LIFT_L, 'Sparkling clean!', 1.6, [A.effect('sparkle', { dur: 1.2 })]),
  )),
  // Deerstalker, Inverness cape and pipe: peers through his magnifier, then names the culprit.
  e('detective', 'town', 'law and order', () => act(W('detective', { top: 'tan', long: true, bottom: 'darkbrown', shoes: 'black', acc: [deerstalker('#a08a5a'), wear('cloak', '#a08a5a'), X((d) => [['torso', 'box', [d.tw * 1.25, d.torsoH * 0.5, d.td * 1.25], [0, d.torsoH * 0.78, 0], '#a08a5a', { round: 0.5, layer: 2 }]]), pipe(), held('magnifier', 'gold')] }),
    hold({ armR: [-40, 0, -28], foreR: [-112, 0, 30] }, 'Elementary, my dear friend.', 1.8),
    [G('look_around', 'The clues point to... the butler!', 2.4)],
  )),
  // A tinpot general: peaked cap, shades, mustache, sash and a chest full of medals.
  e('dictator', 'town', 'politics', () => act(W('dictator', { pose: 'cross', top: '#8a8f6a', long: true, bottom: '#8a8f6a', shoes: 'black', hair: '#1d1d1d', style: 'short', acc: [hat('police', '#6b6f4a'), nameHat(), face('sunglasses'), face('mustache', '#1d1d1d'), epaul('gold'), wear('sash', 'red'), boots('black'), ...[-0.3, -0.18, -0.06].map((xx) => patch('gold', 0.08, 0.06, 0.7, xx))] }),
    [G('hands_on_hips', 'I am in charge here!')],
    [G('point', 'Bring me more medals!')],
  )),
  // A film director in a beret and shades with a megaphone and a clapperboard that snaps shut.
  e('director', 'town', 'media', () => act(W('director', { top: 'black', bottom: 'tan', shoes: 'black', acc: [hat('beret', 'black'), nameHat(), face('sunglasses'), wear('scarf', 'red'), megaphone(), X((d) => {
    const a = d.aw;
    return [
      ['handR', 'box', [a * 3.2, a * 2.4, a * 0.3], [0, a * 0.2, a * 1.2], 'black', { text: 'TAKE 1', round: 0.05, edge: 'sharp' }],
      ['handR', 'box', [a * 3.3, a * 0.6, a * 0.35], [-a * 1.6, a * 1.7, a * 1.2], 'white', { name: 'clap', off: [a * 1.6, 0, 0], round: 0.05, edge: 'sharp', mover: { kind: 'swing', axis: 'z', amount: 25 } }],
    ];
  })] }),
    [A.operate('clap', 'open'), A.wait(0.5), A.par(A.operate('clap', 'close'), A.say('Lights, camera... action!', 2))],
    [G('point', 'Cut! Print it!')],
  )),
  // A DJ in cap, headphones and shades behind his decks: two turntables that spin and a glowing mixer.
  e('dj', 'music', 'musicians', () => act(topOf(W('dj', { top: 'black', bottom: 'denim', shoes: 'white', acc: [capBack('black'), hat('headphones', 'red'), face('sunglasses'), X((d) => {
    const k = d.H / 1.7, z0 = 0.5, top = 0.95 * k;
    const r: XP[] = [
      ['', 'box', [1.3, top - 0.05, 0.55], [0, (top - 0.05) / 2, z0], '#2a2726', { edge: 'sharp', round: 0.05 }],
      ['', 'box', [1.32, 0.05, 0.6], [0, top - 0.025, z0], '#3a3633', { edge: 'sharp', name: 'decks' }],
      ['', 'box', [0.5, 0.08, 0.02], [0, top * 0.6, z0 + 0.28], '#e0473b', { text: 'DJ', glow: true }],
      ['', 'box', [0.2, 0.06, 0.3], [0, top + 0.03, z0], '#1d1d1d', { edge: 'sharp' }],
      ...[-0.06, 0, 0.06].map((xx, i) => ['', 'cyl', [0.03, 0.03, 0.03], [xx, top + 0.07, z0 + 0.05], ['lime', 'cyan', 'magenta'][i], { glow: true }] as XP),
    ];
    for (const [i, s] of [[1, 1], [2, -1]] as const) {
      const x = s * 0.4;
      r.push(['', 'box', [0.42, 0.07, 0.36], [x, top + 0.035, z0], 'silver', { edge: 'sharp', round: 0.1 }]);
      r.push(['', 'cyl', [0.3, 0.02, 0.3], [x, top + 0.08, z0], '#1d1d1d', { name: `platter${i}`, mover: { kind: 'spin', axis: 'y', amount: 200 }, edge: 'sharp' }]);
      r.push([`platter${i}`, 'cyl', [0.1, 0.005, 0.1], [0.04, 0.012, 0], 'red', { noInk: true }]);
      r.push(['', 'capsule', [0.015, 0.22, 0.015], [x + 0.15, top + 0.1, z0 - 0.05], 'lightgray', { srot: [90, 30, 0] }]);
    }
    return r;
  })] }), 'decks'),
    [A.operate('platter', 'on'), G('dance', 'Everybody dance now!')],
    [to({ armR: [-70, 0, -25], foreR: [-30, 0, 0] }, 'Wikka-wikka!', 0.2), to({ armR: [-70, 0, -10], foreR: [-30, 0, 0] }, undefined, 0.15), to({ armR: [-70, 0, -25], foreR: [-30, 0, 0] }, undefined, 0.15), to({ armR: [0, 0, 0], foreR: [0, 0, 0] }, undefined, 0.3), A.operate('platter', 'off')],
  )),
  // A doctor in a white coat with stethoscope, head mirror and clipboard.
  e('doctor', 'town', 'medical', () => act(W('doctor', { top: 'skyblue', bottom: 'navy', shoes: 'black', acc: [wear('labcoat'), wear('stethoscope'), headMirror(), face('glasses'), held('clipboard', 'wood', 'L')] }),
    [G('nod', 'Say "ahh"!')],
    hold({ armR: [-65, 0, -8], foreR: [-30, 0, 0] }, 'Deep breath in...', 1.6),
  )),
  // Dr Jekyll in top hat and black suit with a glowing green potion: drinks it, and Hyde comes out.
  e('doctor jekyll', 'town', 'storybook', () => act(W('doctor jekyll', { hair: '#3b2a1e', style: 'short', top: 'white', long: true, bottom: 'black', shoes: 'black', acc: [suitX('#2a2726', 'black', true), tophat('#2a2726'), flask('lime'), held('cane', 'black', 'L')] }),
    hold(TO_MOUTH, 'Just one little sip...', 1.4),
    [A.par(A.effect('smoke', { dur: 1.6 }), A.anim('shake'), A.expr('angry'), A.say('Grrr! I am Mister Hyde!', 2)), A.wait(1.2), A.expr('neutral')],
  )),
  // A dog warden in uniform with a net on a pole: searches, then brings in a puppy.
  e('dog catcher', 'town', 'law and order', () => act(W('dog catcher', { top: 'tan', bottom: 'olive', shoes: 'black', acc: [hat('cap', 'olive'), nameHat(), wear('badge'), wear('belt', 'black'), held('net')] }),
    [G('look_around', 'Hmm... where did that pup go?')],
    show('puppy', 'Gotcha! Off to a nice home.', 'thumbs_up', 'fade'),
  )),
  // A trainer with a whistle and a leash, and her dog, who jumps when told to speak.
  e('dog trainer', 'town', 'pets and animals', () => act(together('dog trainer', [[W('dog trainer', { top: 'red', bottom: 'tan', shoes: 'brown', style: 'ponytail', acc: [hat('cap', 'red'), wear('whistle'), wear('belt', 'brown'), held('leash', 'red', 'L')] }), -0.15], [beast('dog trainer dog', { color: '#c8955a', body: [0.6, 0.3, 0.26], legL: 0.28, legW: 0.08, neckL: 0.12, neckLean: 30, head: [0.22, 0.2, 0.17], snout: { len: 0.1, h: 0.09, w: 0.1 }, ears: 'floppy', earSize: 0.11, earColor: '#8c5a2b', tail: 'long', tailAngle: 40 }), 0.55, 0.2]]),
    [A.par(A.anim('point'), A.pose('b_head', { rot: [25, 0, 0], dur: 0.3 }), A.say('Good dog! Sit!', 1.8)), A.pose('b_head', { rot: [0, 0, 0], dur: 0.3 })],
    [A.par(A.pose('b_body', { move: [0, 0.3, 0], dur: 0.25 }), A.say('Speak! ... Woof!', 1.6)), A.pose('b_body', { move: [0, 0, 0], dur: 0.25 }), A.par(A.pose('b_tail', { rot: [0, 30, 0], dur: 0.2 })), A.pose('b_tail', { rot: [0, -30, 0], dur: 0.2 }), A.pose('b_tail', { rot: [0, 0, 0], dur: 0.2 })],
  )),
  // A 30 cm play doll with pigtails and a bow: says "Mama", and closes her eyes when laid back.
  e('dolly', 'toys', 'dolls and figures', () => act(shrink(W('dolly', { h: 'kid', skin: 'skin1', hair: 'gold', style: 'pigtails', top: 'pink', skirt: 'pink', legs: 'white', shoes: 'black', blush: 'red', acc: [hat('bow', 'red'), wear('apron', 'white'), X((d) => [['hips', 'cyl', [d.tw * 1.9, d.legLen * 0.15, d.td * 2.2], [0, -d.legLen * 0.33, 0], 'white', { taper: 1.05, layer: 1 }]])] }), 0.3 / 1.35),
    [A.par(A.anim('hop'), A.say('Mama!', 1.4))],
    [A.par(A.set({ tilt: -70, dur: 0.6 }), A.expr('sleepy'), A.say('Night-night...', 1.6)), A.wait(1.2), A.par(A.set({ tilt: 0, dur: 0.6 }), A.expr('neutral'))],
  )),
  // The thin knight of La Mancha: a barber's basin for a helmet, patched armour, lance and shield.
  e('don quixote', 'town', 'storybook', () => act(W('don quixote', { h: 1.85, build: 0.8, skin: 'skin2', hair: 'gray', style: 'short', top: 'tan', long: true, bottom: 'brown', shoes: 'brown', acc: [wear('armor', '#a08a6a'), X((d) => [['head', 'cyl', [d.headW * 1.15, d.headH * 0.22, d.headD * 1.1], [0, d.headY + d.headH * 0.45, 0], 'brass', { taper: 0.7, name: 'hat', piece: true, edge: 'sharp' }], ['hat', 'cyl', [d.headW * 1.5, d.headH * 0.04, d.headD * 1.4], [0, -d.headH * 0.1, 0], 'brass', { edge: 'sharp' }]]), face('beard', 'gray'), face('mustache', 'gray'), boots('brown'), held('spear'), held('shield', 'bronze', 'L')] }),
    [G('point', 'Giants! Charge!')],
    [G('bow', 'For my lady Dulcinea!')],
  )),
  // A seamstress with tape measure, scissors and a pincushion on her wrist, beside a dress form.
  e('dressmaker', 'town', 'trades', () => act(W('dressmaker', { top: 'purple', long: true, bottom: 'gray', shoes: 'black', style: 'bun', acc: [X((d) => [['torso', 'box', [d.tw * 0.1, d.torsoH * 0.9, d.td * 1.15], [d.tw * 0.25, d.torsoH * 0.55, 0], 'yellow', { srot: [0, 0, -10], layer: 4 }]]), face('glasses'), held('scissors'), X((d) => [['foreL', 'ball', [d.aw * 1.4, d.aw * 0.9, d.aw * 1.4], [0, -d.lower * 0.6, 0], 'red'], ...[0, 1, 2].map((i) => ['foreL', 'capsule', [d.aw * 0.1, d.aw * 0.6, d.aw * 0.1], [d.aw * (i - 1) * 0.3, -d.lower * 0.6 + d.aw * 0.5, d.aw * 0.3], 'silver', { srot: [20 - i * 20, 0, 0] }] as XP)]), beside((d) => {
    const k = d.H / 1.7, x0 = 0.65 * k;
    return [
      ['box', [0.32 * k, 0.5 * k, 0.22 * k], [x0, 1.25 * k, 0], 'cream', { round: 0.7 }],
      ['ball', [0.36 * k, 0.16 * k, 0.24 * k], [x0, 1.48 * k, 0], 'cream'],
      ['cyl', [0.08 * k, 0.08 * k, 0.08 * k], [x0, 1.58 * k, 0], 'cream'],
      ['ball', [0.07 * k, 0.07 * k, 0.07 * k], [x0, 1.65 * k, 0], 'darkwood'],
      ['cyl', [0.36 * k, 0.32 * k, 0.26 * k], [x0, 1.25 * k, 0], 'pink', { taper: 0.75 }],
      ['cyl', [0.62 * k, 0.5 * k, 0.48 * k], [x0, 0.86 * k, 0], 'pink', { taper: 0.55 }],
      ['torus', [0.38 * k, 0.28 * k, 0.04], [x0, 1.1 * k, 0], 'magenta', { srot: [90, 0, 0], tube: 0.2 }],
      ['cyl', [0.035, 0.62 * k, 0.035], [x0, 0.31 * k, 0], 'darkwood', { edge: 'sharp' }],
      ...[0, 120, 240].map((r) => ['box', [0.04, 0.03, 0.3 * k], [x0 + Math.sin((r * Math.PI) / 180) * 0.13 * k, 0.015, Math.cos((r * Math.PI) / 180) * 0.13 * k], 'darkwood', { srot: [0, r, 0], edge: 'sharp' }] as HP),
    ];
  })] }),
    hold(LIFT_R, 'Snip, snip! Nearly done.', 1.4),
    [G('clap', 'A perfect fit!')],
  )),
  // Campaign hat, whistle and clipboard, a bullhorn in hand: barks orders.
  e('drill sergeant', 'town', 'military', () => act(W('drill sergeant', { top: 'olive', bottom: 'olive', shoes: 'black', build: 1.2, acc: [hat('cowboy', '#6b5a3a'), nameHat(), wear('belt', 'black'), wear('whistle'), boots('black'), held('clipboard', 'wood', 'L'), megaphone('R')] }),
    [G('hands_on_hips', 'Drop and give me twenty!')],
    hold(TO_MOUTH, 'Left, right, left, right!', 1.6),
  )),
  // A driving instructor with clipboard and an L-plate: calm, then not.
  e('driving instructor', 'town', 'drivers', () => act(W('driving instructor', { top: 'skyblue', bottom: 'gray', shoes: 'black', acc: [face('glasses'), held('clipboard'), card('L', 'white', 'L', 3, 3)] }),
    [G('nod', 'Mirror, signal, manoeuvre.')],
    [G('cover_eyes', 'Brake! BRAKE!')],
  )),
  // A rock drummer in a headband with sticks, at a snare drum and hi-hat on their stands.
  e('drummer', 'music', 'musicians', () => act(W('drummer', { top: 'black', bottom: 'denim', shoes: 'black', style: 'long', acc: [hat('headband', 'red'), held('drumsticks'), held('drumsticks', 'wood', 'L'), rest({ armR: [-30, 0, -12], foreR: [-50, 0, 18], armL: [-30, 0, 12], foreL: [-50, 0, -18] }), X((d) => {
    const k = d.H / 1.7, z0 = 0.42 * k, top = 0.72 * k;
    return [
      ['', 'cyl', [0.36 * k, 0.14 * k, 0.36 * k], [0, top, z0], 'red', { edge: 'sharp', name: 'snare' }],
      ['snare', 'cyl', [0.37 * k, 0.012, 0.37 * k], [0, 0.07 * k, 0], 'white', { edge: 'sharp' }],
      ['snare', 'torus', [0.37 * k, 0.37 * k, 0.015], [0, 0.065 * k, 0], 'silver', { srot: [90, 0, 0], tube: 0.06 }],
      ['snare', 'torus', [0.37 * k, 0.37 * k, 0.015], [0, -0.065 * k, 0], 'silver', { srot: [90, 0, 0], tube: 0.06 }],
      ...[0, 120, 240].map((r) => ['', 'capsule', [0.02, top * 1.02, 0.02], [Math.sin((r * Math.PI) / 180) * 0.1 * k, top / 2, z0 + Math.cos((r * Math.PI) / 180) * 0.1 * k], 'silver', { srot: [Math.cos((r * Math.PI) / 180) * 12, 0, -Math.sin((r * Math.PI) / 180) * 12] }] as XP),
      ['', 'cyl', [0.025, 1.0 * k, 0.025], [-0.45 * k, 0.5 * k, z0 - 0.05], 'silver'],
      ['', 'cyl', [0.36 * k, 0.015, 0.36 * k], [-0.45 * k, 1.0 * k, z0 - 0.05], 'gold', { name: 'hihat', taper: 0.3, edge: 'sharp' }],
      ['', 'cyl', [0.36 * k, 0.015, 0.36 * k], [-0.45 * k, 0.985 * k, z0 - 0.05], 'gold', { taper: 0.3, srot: [180, 0, 0], edge: 'sharp' }],
      ...[0, 120, 240].map((r) => ['', 'capsule', [0.02, 0.3 * k, 0.02], [-0.45 * k + Math.sin((r * Math.PI) / 180) * 0.08, 0.13 * k, z0 - 0.05 + Math.cos((r * Math.PI) / 180) * 0.08], 'silver', { srot: [Math.cos((r * Math.PI) / 180) * 25, 0, -Math.sin((r * Math.PI) / 180) * 25] }] as XP),
    ];
  })] }),
    [to({ foreR: [-40, 0, 0], foreL: [20, 0, 0] }, 'Ba-dum-dum, tsss!', 0.12), to({ foreR: [20, 0, 0], foreL: [-40, 0, 0] }, undefined, 0.12), to({ foreR: [-40, 0, 0], foreL: [20, 0, 0] }, undefined, 0.12), to({ foreR: [20, 0, 0], foreL: [-40, 0, 0] }, undefined, 0.12), A.par(A.pose('armR', { rot: [-40, 0, -30], dur: 0.15 }), A.pose('hihat', { rot: [0, 0, 12], dur: 0.1 })), A.par(A.pose('hihat', { rot: [0, 0, 0], dur: 0.3 }), A.pose('armR', { rot: [0, 0, 0], dur: 0.3 }), A.pose('foreR', { rot: [0, 0, 0], dur: 0.3 }), A.pose('foreL', { rot: [0, 0, 0], dur: 0.3 }))],
    [G('nod', 'One, two, three, four!')],
  )),
  // A ventriloquist's dummy in a red blazer and bow tie, with a hinged jaw that clacks as it talks.
  e('dummy (doll)', 'toys', 'dolls and figures', () => act(shrink(W('dummy (doll)', { h: 'kid', skin: 'skin1', hair: '#3b2a1e', style: 'short', top: 'white', long: true, bottom: 'black', shoes: 'black', blush: 'red', acc: [suitX('red', 'black', true), X((d) => [1, -1].map((s) => ['head', 'box', [d.headW * 0.03, d.headH * 0.22, d.headW * 0.03], [s * d.headW * 0.16, d.headY - d.headH * 0.3, d.headD * 0.47], 'black', { layer: 6, noInk: true }] as XP)), X((d) => [['head', 'box', [d.headW * 0.3, d.headH * 0.16, d.headD * 0.3], [0, d.headY - d.headH * 0.36, d.headD * 0.33], 'skin1', { name: 'jaw', round: 0.5, edge: 'sharp', mover: { kind: 'slide', axis: 'y', amount: -0.03 } }]])] }), 0.62 / 1.35),
    [A.par(A.operate('jaw', 'open'), A.say('Gottle o\' geer! Gottle o\' geer!', 2.2)), A.operate('jaw', 'close'), A.operate('jaw', 'open'), A.operate('jaw', 'close'), A.operate('jaw', 'open'), A.operate('jaw', 'close')],
    [A.par(A.pose('head', { rot: [0, 80, 0], dur: 0.5 }), A.operate('jaw', 'open'), A.say('Who, me?', 1.6)), A.operate('jaw', 'close'), A.wait(0.6), A.pose('head', { rot: [0, 0, 0], dur: 0.5 })],
  )),
  // A kid in the corner in a tall paper cone hat marked D.
  e('dunce', 'town', 'school', () => act(W('dunce', { h: 'kid', top: 'gray', bottom: 'denim', shoes: 'brown', style: 'short', acc: [pointyCap('white', 1.3), X((d) => [['hat', 'box', [d.headW * 0.3, d.headW * 0.3, d.headW * 0.05], [0, d.headH * 0.25, d.headD * 0.38], 'white', { text: 'D', layer: 6, srot: [-10, 0, 0] }]])] }),
    [G('shrug', 'Oops... I forgot my homework.', 2.2)],
    [G('cry', 'I\'ll study harder, I promise!', 2.2)],
  )),
  // A dwarf miner, 1.25 m: green pointed cap, long white beard, pickaxe and a lantern.
  e('dwarf', 'fantasy', 'fairy tale', () => act(W('dwarf', { h: 1.25, build: 1.35, skin: 'skin1', top: 'red', long: true, bottom: 'brown', shoes: 'darkbrown', hair: 'white', style: 'short', acc: [pointyCap('#3f7a3a'), face('longbeard', 'white'), nose('#f0a090', 0.22), wear('belt', 'black'), boots('darkbrown'), held('pickaxe'), held('lantern', 'flame', 'L')] }),
    [to({ armR: [-150, 0, 0] }, 'Heigh-ho! Off to work!', 0.3), A.par(A.pose('armR', { rot: [-50, 0, 0], dur: 0.15 }), A.effect('sparkle', { dur: 0.8 })), A.pose('armR', { rot: [-150, 0, 0], dur: 0.3 }), A.par(A.pose('armR', { rot: [-50, 0, 0], dur: 0.15 }), A.effect('sparkle', { dur: 0.8 })), A.pose('armR', { rot: [0, 0, 0], dur: 0.4 })],
    hold(LIFT_L, 'Gold! I see gold!', 1.6, [A.effect('sparkle', { dur: 1.2 })]),
  )),
  // The Easter Bunny: white fur, long ears, a bow tie, a basket of painted eggs; hides one for you.
  e('easter bunny', 'fantasy', 'holiday', () => act(W('easter bunny', { skin: 'white', eyes: '#1d1d1d', blush: 'pink', style: 'none', top: 'white', long: true, bottom: 'white', shoes: 'white', acc: [hat('bunnyears', 'white'), X((d) => [1, -1].map((s) => ['head', 'ball', [d.headW * 0.12, d.headH * 0.5, d.headW * 0.04], [s * d.headW * 0.18, d.headY + d.headH * 0.85, d.headD * 0.04], 'pink', { srot: [0, 0, -s * 8], layer: 5 }] as XP)), nose('pink', 0.14), X((d) => [['hips', 'ball', [d.tw * 0.45, d.tw * 0.45, d.tw * 0.45], [0, 0, -d.td * 0.6], 'white'], ['head', 'box', [d.headW * 0.14, d.headH * 0.1, d.headW * 0.04], [0, d.headY - d.headH * 0.2, d.headD * 0.49], 'white', { layer: 7 }], ['torso', 'ball', [d.tw * 0.7, d.torsoH * 0.6, d.td * 0.3], [0, d.torsoH * 0.45, d.td * 0.38], '#fde8ee', { layer: 2 }]]), wear('vest', '#c9a0dc'), wear('bowtie', 'yellow'), held('basket', 'tan', 'L'), inHand('L', (a) => (['pink', 'cyan', 'yellow'] as const).map((c, i) => ['ball', [a * 0.9, a * 1.15, a * 0.9], [(i - 1) * a * 0.8, -a * 0.8, a * 0.5], c] as HP))] }),
    [A.spawn('egg', 'easter egg', { rel: 'front', of: 'self', dist: 'near' }), G('wink', 'Can you find my egg?'), A.wait(1.6), A.remove('egg', 'pop')],
    [A.par(A.anim('hop', 3), A.say('Hop, hop, hop!', 1.8))],
  )),
  // Edgar Allan Poe: black suit and bow, a mustache, the raven on his shoulder: it speaks.
  e('edgar', 'town', 'arts', () => act(W('edgar', { skin: 'skin1', hair: '#1d1d1d', style: 'short', top: 'white', long: true, bottom: 'black', shoes: 'black', acc: [suitX('black', 'black', true), face('mustache', '#1d1d1d'), raven(), held('book', 'darkred', 'L')] }),
    [A.par(A.pose('raven', { rot: [25, 0, 0], dur: 0.2 }), A.say('Caw! Nevermore!', 1.8)), A.pose('raven', { rot: [0, 0, 0], dur: 0.3 }), G('gasp', 'Ah! Grim and ghastly bird!')],
    [G('nod', 'Once upon a midnight dreary...', 2.4)],
  )),
  // An ordinary young man: waistcoat, bow tie, round glasses, a good book.
  e('edwin', 'town', 'everyday people', () => act(W('edwin', { top: 'white', long: true, bottom: 'tan', shoes: 'brown', hair: '#a0522d', style: 'short', acc: [wear('vest', 'darkgreen'), wear('bowtie', 'red'), face('glasses', 'black'), held('book', 'navy')] }),
    [G('wave', 'Hi, I\'m Edwin!')],
    hold(LIFT_R, 'This book is so good!', 1.6),
  )),
  // Wild white hair and mustache by a blackboard on its easel: E=mc², then the famous tongue.
  e('einstein', 'town', 'science', () => act(W('einstein', { skin: 'skin1', hair: 'white', style: 'short', top: 'gray', long: true, bottom: 'darkgray', shoes: 'black', acc: [mop('white', 1.25), face('mustache', 'white'), X((d) => [['head', 'ball', [d.headW * 0.16, d.headH * 0.14, d.headW * 0.12], [0, d.headY - d.headH * 0.3, d.headD * 0.47], 'pink', { name: 'tongue', scale: 0, layer: 7 }]]), held('pointer', 'white'), easelBoard('E=mc²', -0.62)] }),
    [G('point', 'E equals m c squared!')],
    [A.par(A.pose('tongue', { scale: 1, dur: 0.2 }), A.anim('laugh'), A.say('Bleh! Imagination is everything!', 2.2)), A.wait(1), A.pose('tongue', { scale: 0, dur: 0.2 })],
  )),
  // One of Santa's elves: green tunic, red collar, pointed ears and a curly green hat, a present in hand.
  e('elf (holiday)', 'fantasy', 'holiday', () => act(W('elf (holiday)', { h: 'kid', skin: 'skin1', hair: '#a0522d', style: 'short', top: 'green', long: true, bottom: 'red', shoes: 'green', blush: 'red', acc: [hat('santa', 'green'), nameHat(), elfEars('skin1'), collar('red'), wear('belt', 'black'), rings('red', 'shinL', [0.3, 0.6], 1.05), rings('red', 'shinR', [0.3, 0.6], 1.05), held('gift', 'red')] }),
    hold(OFFER, 'A present, just for you!', 1.6, [A.effect('sparkle', { dur: 1.2 })]),
    [G('dance', 'Jingle all the way!')],
  )),
  // An empress in a gold crown, ermine collar and crimson robes, with orb and sceptre.
  e('empress', 'town', 'royalty', () => act(W('empress', { skin: 'skin1', hair: '#1d1d1d', style: 'bun', top: 'gold', long: true, skirt: 'darkred', legs: 'darkred', shoes: 'gold', acc: [hat('crown', 'gold'), nameHat(), wear('cloak', 'darkred'), collar('white'), gown('darkred', 0.9), wear('necklace', 'gold'), inHand('L', (a, d) => [['capsule', [a * 0.35, d.H * 0.28, a * 0.35], [0, a * 0.8, a * 0.6], 'gold'], ['ball', [a * 1.1, a * 1.1, a * 1.1], [0, a * 0.8 + d.H * 0.14, a * 0.6], 'red']]), inHand('R', (a) => [['ball', [a * 1.6, a * 1.6, a * 1.6], [0, -a * 1.0, a * 0.9], 'gold'], ['box', [a * 0.2, a * 0.8, a * 0.2], [0, -a * 0.0, a * 0.9], 'gold']])] }),
    [G('wave', 'Greetings, my loyal subjects!', 2.2)],
    [G('nod', 'You may rise.')],
  )),
  // An engineer in a blue hard hat with a wrench and plans: tightens a bolt.
  e('engineer', 'town', 'trades', () => act(W('engineer', { top: 'skyblue', bottom: 'navy', shoes: 'black', acc: [hat('hard', 'blue'), nameHat(), face('glasses'), patch('white', 0.12, 0.14, 0.72, 0.25), wear('tool belt'), held('wrench'), held('clipboard', 'wood', 'L')] }),
    [to({ armR: [-75, 0, -8], foreR: [-20, 0, 0] }, 'Just a quarter turn...', 0.35), A.pose('foreR', { rot: [-20, 70, 0], dur: 0.4 }), A.pose('foreR', { rot: [-20, 0, 0], dur: 0.3 }), A.pose('foreR', { rot: [-20, 70, 0], dur: 0.4 }), A.par(A.pose('armR', { rot: [0, 0, 0], dur: 0.4 }), A.pose('foreR', { rot: [0, 0, 0], dur: 0.4 }))],
    [G('thumbs_up', 'Built to last!')],
  )),
  // A pest controller in a gas mask with the spray tank on his back: sprays, then meets a big spider.
  e('exterminator', 'town', 'trades', () => act(W('exterminator', { top: 'gray', long: true, bottom: 'gray', shoes: 'black', acc: [hat('cap', 'red'), nameHat(), gasMask(), boots('black'), gloves('black'), X((d) => [['torso', 'cyl', [d.tw * 0.55, d.torsoH * 0.75, d.tw * 0.55], [0, d.torsoH * 0.5, -d.td * 0.95], 'yellow', { layer: -3, edge: 'sharp' }], ['torso', 'dome', [d.tw * 0.55, d.tw * 0.25, d.tw * 0.55], [0, d.torsoH * 0.88 + d.tw * 0.12, -d.td * 0.95], 'yellow', { layer: -3 }], ['torso', 'capsule', [d.tw * 0.08, d.torsoH * 0.9, d.tw * 0.08], [-d.tw * 0.45, d.torsoH * 0.3, -d.td * 0.5], 'black', { srot: [20, 0, 30] }]]), inHand('R', (a) => [['capsule', [a * 0.3, a * 6, a * 0.3], [0, -a * 0.4, a * 2.6], 'black', { srot: [80, 0, 0] }], ['cyl', [a * 0.6, a * 0.8, a * 0.6], [0, -a * 0.1, a * 5.6], 'silver', { srot: [80, 0, 0] }]])] }),
    hold({ armR: [-60, 0, -10], foreR: [-20, 0, 0] }, 'Psssh! Bugs, be gone!', 1.6, [A.effect('smoke', { dur: 1.5 })]),
    [A.spawn('bug', 'spider', { rel: 'front', of: 'self', dist: 'close' }), G('gasp', 'Eek! A big one!'), A.wait(1), A.remove('bug', 'fade')],
  )),
  // A 22 cm fairy with gauzy wings and a star wand: flutters up in a shower of sparkles.
  e('fairy', 'fantasy', 'fairy tale', () => act(shrink(W('fairy', { h: 'kid', skin: 'skin1', hair: 'gold', style: 'bun', top: 'pink', skirt: 'pink', legs: 'skin1', shoes: 'pink', acc: [X((d) => [1, -1].flatMap((s) => [['torso', 'ball', [d.tw * 1.3, d.torsoH * 1.1, d.td * 0.1], [s * d.tw * 0.25, d.torsoH * 0.85, -d.td * 0.6], '#cdeefb', { name: s > 0 ? 'wingL' : 'wingR', off: [s * d.tw * 0.6, d.torsoH * 0.2, 0], srot: [0, s * 15, -s * 25], layer: -3 }], [s > 0 ? 'wingL' : 'wingR', 'ball', [d.tw * 0.8, d.torsoH * 0.7, d.td * 0.08], [s * d.tw * 0.35, -d.torsoH * 0.55, 0], '#e8d0f8', { srot: [0, 0, s * 30], layer: -3 }]] as XP[])), hat('flower', 'pink'), held('wand')] }), 0.22 / 1.35),
    [A.par(A.pose('hips', { move: [0, 0.08, 0], dur: 0.6 }), A.pose('wingL', { rot: [0, -35, 0], dur: 0.15 }), A.pose('wingR', { rot: [0, 35, 0], dur: 0.15 }), A.effect('sparkle', { dur: 1.6 }), A.say('Sprinkle, sparkle!', 1.8)), A.par(A.pose('wingL', { rot: [0, 0, 0], dur: 0.15 }), A.pose('wingR', { rot: [0, 0, 0], dur: 0.15 })), A.par(A.pose('wingL', { rot: [0, -35, 0], dur: 0.15 }), A.pose('wingR', { rot: [0, 35, 0], dur: 0.15 })), A.par(A.pose('hips', { move: [0, 0, 0], dur: 0.6 }), A.pose('wingL', { rot: [0, 0, 0], dur: 0.2 }), A.pose('wingR', { rot: [0, 0, 0], dur: 0.2 }))],
    [A.par(A.anim('hop'), A.anim('laugh'), A.say('Tee-hee-hee!', 1.6))],
  )),
  // A plump fairy godmother in a blue hooded cloak with a wand: turns a pumpkin into a carriage.
  e('fairy godmother', 'fantasy', 'fairy tale', () => act(W('fairy godmother', { h: 1.6, build: 1.25, skin: 'skin1', hair: 'white', style: 'bun', top: 'skyblue', long: true, skirt: 'skyblue', legs: 'skyblue', shoes: 'skyblue', acc: [hat('hood', 'blue'), wear('cloak', 'blue'), gown('skyblue', 0.85), wear('bowtie', 'pink'), held('wand')] }),
    [A.spawn('p', 'pumpkin', { rel: 'front', of: 'self', dist: 'near' }), A.par(A.pose('armR', { rot: [-60, 0, -40], dur: 0.4 }), A.effect('sparkle', { id: 'p', dur: 1.6 }), A.say('Abracadabra!', 1.8)), A.morph('carriage', 'p'), A.pose('armR', { rot: [0, 0, 0], dur: 0.4 }), A.wait(2), A.remove('p', 'fade')],
    [G('laugh', 'Be home by midnight, dear!')],
  )),
  // A farmer: straw hat, plaid shirt, denim overalls, a stalk of straw, a pitchfork.
  e('farmer', 'town', 'farming', () => act(W('farmer', { top: 'red', long: true, bottom: 'denim', shoes: 'brown', acc: [hat('straw'), nameHat(), bands('darkred', [0.3, 0.6, 0.85]), wear('overalls', 'denim'), X((d) => [1, -1].map((s) => ['torso', 'box', [d.tw * 0.1, d.torsoH * 0.5, d.td * 0.06], [s * d.tw * 0.28, d.torsoH * 0.72, d.td * 0.55], 'denim', { layer: 4 }] as XP)), X((d) => [['head', 'capsule', [d.headW * 0.04, d.headW * 0.4, d.headW * 0.04], [d.headW * 0.2, d.headY - d.headH * 0.22, d.headD * 0.55], '#e8cf7a', { srot: [0, 0, 70], layer: 6 }]]), boots('brown'), rest({ armL: [-6, 0, 38], foreL: [-10, 0, -110] }), held('pitchfork')] }),
    tipHat('Howdy, neighbour!'),
    show('carrot', 'Fresh from the field!', 'thumbs_up'),
  )),
  // Dad in his BBQ apron with a spatula, at a kettle grill whose lid lifts in a puff of smoke.
  e('father', 'town', 'family', () => act(topOf(W('father', { top: 'navy', bottom: 'tan', shoes: 'brown', hair: 'darkbrown', style: 'short', acc: [face('mustache', 'darkbrown'), wear('apron', 'red'), chest('DAD', 'white', 0.4, 0.14, 0.45), held('spatula', 'silver'), X((d) => {
    const k = d.H / 1.7, x0 = -0.68 * k, z0 = 0.3, y0 = 0.72;
    return [
      ['', 'dome', [0.55, 0.3, 0.55], [x0, y0 - 0.15, z0], '#1d1d1d', { srot: [180, 0, 0], edge: 'sharp' }],
      ['', 'cyl', [0.53, 0.02, 0.53], [x0, y0 + 0.005, z0], 'silver', { edge: 'sharp', name: 'grill' }],
      ...[0.1, 0, -0.1].map((dz, i) => ['', 'capsule', [0.04, 0.2, 0.04], [x0 + (i - 1) * 0.08, y0 + 0.035, z0 + dz * 0.5], '#8a3f2e', { srot: [90, 0, 0] }] as XP),
      ['', 'dome', [0.56, 0.3, 0.56], [x0, y0 + 0.02, z0 - 0.28], '#1d1d1d', { name: 'lid', off: [0, 0.15, 0.28], edge: 'sharp', mover: { kind: 'swing', axis: 'x', amount: -100 } }],
      ['lid', 'cyl', [0.08, 0.04, 0.08], [0, 0.31, 0.28], 'silver'],
      ...[0, 120, 240].map((r) => ['', 'capsule', [0.03, y0, 0.03], [x0 + Math.sin((r * Math.PI) / 180) * 0.2, y0 / 2 - 0.05, z0 + Math.cos((r * Math.PI) / 180) * 0.2], 'silver', { srot: [Math.cos((r * Math.PI) / 180) * -10, 0, Math.sin((r * Math.PI) / 180) * 10] }] as XP),
      ...[0.15, -0.15].map((dx) => ['', 'cyl', [0.1, 0.04, 0.1], [x0 + dx, 0.05, z0 - 0.15], 'rubber', { srot: [0, 0, 90] }] as XP),
    ];
  })] }), 'grill', 'top', 'top', 0.3),
    [A.par(A.operate('lid', 'open'), A.effect('smoke', { dur: 1.8 }), A.say('Who\'s hungry?', 2)), A.wait(1.6), A.operate('lid', 'close')],
    [G('laugh', 'Hi Hungry, I\'m Dad!')],
  )),
  // Old Father Time: robe, long white beard, scythe and an hourglass he turns over.
  e('father time', 'fantasy', 'myths', () => act(W('father time', { h: 1.9, skin: 'skin1', hair: 'white', style: 'bald', top: '#c9ccd1', long: true, skirt: '#c9ccd1', legs: '#c9ccd1', shoes: 'tan', acc: [sideHair('white'), wear('robe', '#c9ccd1'), face('longbeard', 'white'), wear('belt', 'gold'), scythe(), X((d) => {
    const a = d.aw;
    return [
      ['handL', 'cyl', [a * 2, a * 0.3, a * 2], [0, a * 0.2, a * 1.3], 'wood', { name: 'glass', edge: 'sharp' }],
      ['glass', 'cyl', [a * 1.6, a * 1.2, a * 1.6], [0, a * 0.75, 0], 'glass', { taper: 0.15 }],
      ['glass', 'cyl', [a * 1.2, a * 0.6, a * 1.2], [0, a * 0.5, 0], 'sand', { taper: 0.3 }],
      ['glass', 'cyl', [a * 1.6, a * 1.2, a * 1.6], [0, a * 1.95, 0], 'glass', { taper: 0.15, srot: [180, 0, 0] }],
      ['glass', 'cyl', [a * 2, a * 0.3, a * 2], [0, a * 2.7, 0], 'wood', { edge: 'sharp' }],
      ...[1, -1].map((s) => ['glass', 'capsule', [a * 0.2, a * 2.5, a * 0.2], [s * a * 0.85, a * 1.35, 0], 'wood'] as XP),
    ];
  })] }),
    [A.par(A.pose('glass', { rot: [0, 0, 180], dur: 0.8 }), A.say('Time flies...', 2)), A.wait(1), A.pose('glass', { rot: [0, 0, 0], dur: 0 })],
    [G('shake_head', 'Tick tock... you\'re late!')],
  )),
  // A fencer in whites and a mesh mask with a foil: en garde, lunge, touché.
  e('fencer', 'sports', 'athletes', () => act(W('fencer', { top: 'white', long: true, bottom: 'white', legs: 'white', shoes: 'white', acc: [fencingMask(), gloves('white'), inHand('R', (a, d) => [['capsule', [a * 0.12, d.H * 0.5, a * 0.12], [0, -a * 0.8 - d.H * 0.25 * 0.906, a * 0.4 + d.H * 0.25 * 0.42], 'silver', { srot: [-25, 0, 0] }], ['cyl', [a * 1.6, a * 0.5, a * 1.6], [0, -a * 1.0, a * 0.5], 'silver', { srot: [-25, 0, 0], taper: 0.6, edge: 'sharp' }]])] }),
    [to({ armR: [-80, 0, 0], armL: [-20, 0, 110], foreL: [0, 0, 60] }, 'En garde!', 0.4), A.wait(0.4), A.par(A.pose('legR', { rot: [-55, 0, 0], dur: 0.2 }), A.pose('shinR', { rot: [50, 0, 0], dur: 0.2 }), A.pose('legL', { rot: [30, 0, 0], dur: 0.2 }), A.pose('hips', { move: [0, -0.1, 0.2], dur: 0.2 }), A.say('Touché!', 1.6)), A.wait(0.8), A.par(...['legR', 'shinR', 'legL', 'armR', 'armL', 'foreL'].map((p) => A.pose(p, { rot: [0, 0, 0], dur: 0.4 })), A.pose('hips', { move: [0, 0, 0], dur: 0.4 }))],
    [G('bow', 'Merci. A good bout.')],
  )),
  // A fighter pilot in a flight suit and survival vest, white helmet with dark visor and an oxygen mask.
  e('fighter pilot', 'town', 'military', () => act(W('fighter pilot', { top: 'olive', long: true, bottom: 'olive', shoes: 'black', acc: [hat('helmet', 'white'), nameHat(), X((d) => [['hat', 'ball', [d.headW * 0.95, d.headH * 0.3, d.headD * 0.35], [0, -d.headH * 0.28, d.headD * 0.42], '#2b3f66', { layer: 6 }]]), face('mask', 'olive'), X((d) => [['head', 'capsule', [d.headW * 0.08, d.headH * 0.6, d.headW * 0.08], [d.headW * 0.25, d.headY - d.headH * 0.55, d.headD * 0.3], 'darkgray', { srot: [20, 0, -20] }]]), wear('vest', '#5a5f2a'), patch('red', 0.12, 0.1, 0.8, 0.3), patch('white', 0.14, 0.08, 0.8, -0.28), gloves('#5a3a22'), boots('black')] }),
    [G('thumbs_up', 'Ready for take-off!')],
    hold(SALUTE, 'Roger that!', 1.4),
  )),
  // A figure skater in a purple dress on silver blades: spins, then curtsies.
  e('figure skater', 'sports', 'athletes', () => act(W('figure skater', { skin: 'skin1', top: 'purple', long: true, skirt: 'purple', legs: 'peach', shoes: 'white', hair: '#3b2a1e', style: 'bun', acc: [lift(0.03), X((d) => [1, -1].map((s) => [`foot${s > 0 ? 'L' : 'R'}`, 'box', [d.lw * 0.15, d.H * 0.025, d.lw * 2.2], [0, -d.H * 0.045 - d.H * 0.012, d.lw * 0.32], 'silver', { round: 0.3, edge: 'sharp' }] as XP)), patch('white', 0.1, 0.07, 0.7, 0.2), patch('white', 0.1, 0.07, 0.5, -0.2), arms(75)] }),
    [A.par(A.pose('hips', { rot: [0, 1080, 0], dur: 1.6 }), A.pose('armL', { rot: [0, 0, -60], dur: 0.3 }), A.pose('armR', { rot: [0, 0, 60], dur: 0.3 }), A.say('Wheeee!', 1.8)), A.par(A.pose('hips', { rot: [0, 0, 0], dur: 0 }), A.pose('armL', { rot: [0, 0, 0], dur: 0.4 }), A.pose('armR', { rot: [0, 0, 0], dur: 0.4 }))],
    [G('bow', 'Thank you!')],
  )),
  // A firefighter in turnout gear, helmet and air tank with a hose: sprays, then the fire's out.
  e('fireman', 'town', 'law and order', () => act(W('fireman', { top: '#c8a24a', long: true, bottom: '#c8a24a', shoes: 'black', acc: [fireHelmet(), bands('yellow', [0.3, 0.55]), rings('yellow', 'shinL', [0.4]), rings('yellow', 'shinR', [0.4]), boots('black'), gloves('#5a3a22'), wear('backpack', 'silver'), held('axe', 'red', 'L'), inHand('R', (a) => [['capsule', [a * 0.7, a * 3, a * 0.7], [0, -a * 0.8, a * 1.6], 'brass', { srot: [80, 0, 0] }], ['capsule', [a * 0.6, a * 6, a * 0.6], [0, -a * 3.2, -a * 0.6], 'red', { srot: [10, 0, 0] }]])] }),
    hold({ armR: [-80, 0, 0], foreR: [-10, 0, 0] }, 'Stand back!', 1.6, [A.effect('water_spray', { dur: 1.6 })]),
    [G('thumbs_up', 'Fire\'s out! Everyone\'s safe.')],
  )),
  // A first lady in a pink suit, pillbox hat, pearls, white gloves and handbag.
  e('first lady', 'town', 'politics', () => act(W('first lady', { skin: 'skin1', top: 'pink', long: true, skirt: 'pink', legs: 'skin1', shoes: 'pink', hair: '#3b2a1e', style: 'short', acc: [mop('#3b2a1e', 0.85), pillbox('pink'), wear('necklace', 'white'), buttons('pink', 3), gloves('white', 0.8), held('bag', 'pink', 'L')] }),
    [G('wave', 'How lovely to see you!')],
    hold(SHAKE, 'Thank you for coming.', 1.6),
  )),
  // A fisherman in yellow oilskins and sou'wester, with a net and his catch: a fish tale.
  e('fisherman', 'town', 'sailors', () => act(W('fisherman', { top: 'yellow', long: true, bottom: 'yellow', shoes: 'black', acc: [bucket('yellow'), face('beard', 'gray'), pipe(), boots('black'), held('net'), fishH('silver')] }),
    hold(LIFT_L, 'Look at the size of this one!', 1.6),
    hold({ armR: [0, 0, -80], armL: [0, 0, 80] }, 'It was THIS big, I tell ya!', 1.8),
  )),
  // A flamenco dancer in a red ruffled dress, a rose in her hair and a black fan: twirls, fans herself.
  e('flamenco dancer', 'town', 'arts', () => act(W('flamenco dancer', { skin: 'skin2', top: 'red', long: true, skirt: 'red', legs: 'red', shoes: 'black', hair: '#1d1d1d', style: 'bun', acc: [hat('flower', 'red'), gown('red', 0.95), X((d) => [0.55, 0.8].map((kk) => ['hips', 'torus', [d.tw * 2.0 * (0.6 + kk * 0.5), d.td * 2.6 * (0.6 + kk * 0.5), d.legLen * 0.1], [0, -d.legLen * kk, 0], kk > 0.7 ? 'black' : 'white', { srot: [90, 0, 0], tube: 0.25, layer: 3 }] as XP)), rest({ armR: [0, 0, -130], foreR: [0, 0, -40], armL: [-6, 0, 38], foreL: [-10, 0, -110] }), X((d) => [['handR', 'ball', [d.aw * 3.6, d.aw * 2.4, d.aw * 0.2], [0, d.aw * 1.0, d.aw * 1.2], 'black', { name: 'fan' }]])] }),
    [A.par(A.pose('hips', { rot: [0, 360, 0], dur: 0.9 }), A.say('¡Olé!', 1.6)), A.pose('hips', { rot: [0, 0, 0], dur: 0 })],
    [A.par(A.pose('fan', { rot: [0, 0, 25], dur: 0.15 }), A.say('¡Ay, qué calor!', 1.8)), A.pose('fan', { rot: [0, 0, -25], dur: 0.15 }), A.pose('fan', { rot: [0, 0, 25], dur: 0.15 }), A.pose('fan', { rot: [0, 0, -25], dur: 0.15 }), A.pose('fan', { rot: [0, 0, 0], dur: 0.15 })],
  )),
  // The Flash: red suit, lightning ear wings, the bolt emblem: whirls round in a blur.
  e('flash', 'town', 'superheroes', () => act(W('flash', { skin: 'skin1', style: 'none', top: 'red', long: true, bottom: 'red', shoes: 'yellow', acc: [cowl('red', false), X((d) => [1, -1].map((s) => ['head', 'wedge', [d.headW * 0.35, d.headH * 0.22, d.headW * 0.06], [s * d.headW * 0.56, d.headY + d.headH * 0.1, 0], 'yellow', { srot: [0, s * 90, s * 60] }] as XP)), patch('white', 0.36, 0.28, 0.7), X((d) => [['torso', 'box', [d.tw * 0.06, d.torsoH * 0.24, d.td * 0.06], [0, d.torsoH * 0.7, d.td * 0.6], 'yellow', { srot: [0, 0, 30], layer: 6 }]]), wear('belt', 'yellow'), boots('yellow')] }),
    [A.par(A.pose('hips', { rot: [0, 1440, 0], dur: 1.0 }), A.effect('dust', { dur: 1.2 }), A.say('Zoom!', 1.4)), A.pose('hips', { rot: [0, 0, 0], dur: 0 })],
    [G('thumbs_up', 'Fastest man alive!')],
  )),
  // A flight attendant in a navy uniform and pillbox hat with a tray of drinks and a wheeled case.
  e('flight attendant', 'town', 'travel', () => act(W('flight attendant', { skin: 'skin1', top: 'navy', long: true, skirt: 'navy', legs: 'skin1', shoes: 'navy', hair: '#a0522d', style: 'bun', acc: [pillbox('navy'), wear('scarf', 'red'), wear('badge', 'gold'), trayCups('R'), inHand('L', (a) => [['capsule', [a * 0.25, a * 4, a * 0.25], [0, -a * 1.0, a * 0.5], 'silver'], ['box', [a * 3, a * 4, a * 1.6], [0, -a * 4.6, a * 0.8], 'red', { round: 0.2, edge: 'sharp' }], ...[1, -1].map((s) => ['cyl', [a * 0.6, a * 0.3, a * 0.6], [s * a * 1.1, -a * 6.7, a * 0.8], 'rubber', { srot: [0, 0, 90] }] as HP)])] }),
    hold({ armR: [-10, 0, -85], armL: [-10, 0, 85] }, 'The exits are here... and here.', 2),
    hold(OFFER, 'Coffee, tea or juice?', 1.6),
  )),
  // A florist in a green apron with a bouquet and a potted plant.
  e('florist', 'town', 'shops', () => act(W('florist', { top: 'white', bottom: 'tan', shoes: 'brown', style: 'ponytail', acc: [wear('apron', 'darkgreen'), held('bouquet'), potplant('L', 'red')] }),
    hold(OFFER, 'Fresh roses, just for you!', 1.6, [A.effect('hearts', { dur: 1.2 })]),
    show('sunflower', 'Sunflowers are in season!', 'point'),
  )),
  // A little flower girl in white with a flower crown, scattering petals from her basket.
  e('flower girl', 'town', 'wedding', () => act(W('flower girl', { h: 'kid', skin: 'skin1', hair: 'gold', style: 'long', top: 'white', skirt: 'white', legs: 'white', shoes: 'white', acc: [flowerCrown(), wear('sash', 'pink'), gown('white', 0.7), held('basket', 'tan', 'L'), inHand('L', (a) => [0, 1, 2].map((i) => ['ball', [a * 0.7, a * 0.4, a * 0.7], [(i - 1) * a * 0.8, -a * 0.9, a * 0.5], 'pink'] as HP))] }),
    hold({ armR: [-60, 0, -45], foreR: [-10, 0, 0] }, 'Petals for the bride!', 1.4, [A.effect('hearts', { dur: 1.4 })]),
    [G('dance', 'I love weddings!')],
  )),
  // A waiter in a black waistcoat and bow tie, a white cloth over his arm and a tray of drinks.
  e('food service worker', 'town', 'food service', () => act(W('food service worker', { top: 'white', long: true, bottom: 'black', shoes: 'black', style: 'short', acc: [wear('vest', 'black'), wear('bowtie', 'black'), X((d) => [['foreR', 'box', [d.aw * 1.3, d.lower * 0.6, d.aw * 0.4], [0, -d.lower * 0.45, d.aw * 0.55], 'white']]), rest({ armL: [-20, 0, 12], foreL: [-75, 0, -12] }), onPalm('L', (a) => [['cyl', [a * 4.6, a * 0.25, a * 4.6], [0, a * 0.4, a * 1.6], 'silver', { edge: 'sharp' }], ...[[-1, 0], [1, 0], [0, 1.2]].flatMap(([dx, dz]) => [['cyl', [a * 0.9, a * 1.2, a * 0.9], [dx * a * 1.1, a * 1.7, a * (1.6 + dz)], 'glass', { taper: 1.3 }], ['capsule', [a * 0.15, a * 0.8, a * 0.15], [dx * a * 1.1, a * 0.9, a * (1.6 + dz)], 'glass'], ['cyl', [a * 0.75, a * 0.5, a * 0.75], [dx * a * 1.1, a * 1.55, a * (1.6 + dz)], dz ? 'tomato' : 'gold', { taper: 1.2 }]] as HP[])])] }),
    [G('bow', 'Your table is ready.')],
    hold(OFFER, 'Something to drink?', 1.4),
  )),
];
