/**
 * What a puppet does from moment to moment: breathing, blinking and glancing when idle; legs, arms and tails
 * swinging as it walks; mouths moving while it talks; faces for expressions (brows only appear for these); the
 * scripted gestures (wave, clap, shrug...); and objects' own parts (wheels roll, clock hands and blades turn,
 * doors and lids swing). Each frame it builds a Pose for Puppet.apply.
 */
import type { Rig, RigPiece } from '../../shared/rig';
import { EXPRESSIONS, GESTURE_SECONDS, isGesture, type Expression } from '../../shared/gestures';
import type { MouthShape } from './face-ink';
import { restJoint, type FacePose, type JointPose, type Pose } from './puppet';

export interface MotionInput {
  dt: number;
  time: number;
  /** Horizontal speed, metres per second. */
  speed: number;
  /** Off the ground (flying, falling). */
  airborne: boolean;
  /** A speech bubble is up. */
  talking: boolean;
  expression?: string;
  gesture?: { name: string; t: number; dur: number };
  /** Where something worth looking at is, -1..1 across and up the drawing; null = nothing. */
  look: [number, number] | null;
  /** The drawing's height in metres (wheels roll by distance). */
  metres: number;
  state: Record<string, boolean | number | string>;
}

interface FaceSet {
  eyes: number;
  mouth: MouthShape | null;
  brows: { raise: number; tilt: number; alpha: number };
  lid: FacePose['lid'];
}

const FACES: Record<Expression, FaceSet> = {
  neutral: { eyes: 1, mouth: null, brows: { raise: 0, tilt: 0, alpha: 0 }, lid: null },
  happy: { eyes: 0.85, mouth: 'smile', brows: { raise: 0.25, tilt: 0, alpha: 0 }, lid: 'lid' },
  sad: { eyes: 0.75, mouth: 'frown', brows: { raise: 0.15, tilt: 0.7, alpha: 1 }, lid: 'lid_up' },
  angry: { eyes: 0.8, mouth: 'flat', brows: { raise: -0.25, tilt: -0.8, alpha: 1 }, lid: null },
  surprised: { eyes: 1.25, mouth: 'o', brows: { raise: 0.8, tilt: 0.1, alpha: 1 }, lid: null },
  scared: { eyes: 1.2, mouth: 'wavy', brows: { raise: 0.5, tilt: 0.6, alpha: 1 }, lid: null },
  sleepy: { eyes: 0.3, mouth: 'flat', brows: { raise: -0.1, tilt: 0.1, alpha: 0 }, lid: 'lid_up' },
  laughing: { eyes: 0.05, mouth: 'laugh', brows: { raise: 0.3, tilt: 0.2, alpha: 0 }, lid: 'lid' },
  confused: { eyes: 0.95, mouth: 'wavy', brows: { raise: 0.3, tilt: -0.3, alpha: 1 }, lid: null },
};

/** A gesture's repeating beats: sin of this, with `cycles` beats in one gesture's length. */
function beat(name: string, seconds: number, cycles: number): number {
  const one = isGesture(name) ? GESTURE_SECONDS[name] : 1;
  return Math.sin((seconds / one) * Math.PI * cycles);
}

const smooth = (a: number, b: number, x: number) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export class PuppetMotion {
  private readonly byKind = new Map<string, RigPiece[]>();
  private readonly root: RigPiece | undefined;
  private readonly frontLegs: RigPiece[] = [];
  private readonly backLegs: RigPiece[] = [];
  private blinkIn = 1.5 + Math.random() * 3;
  private blinkT = -1;
  private lookNow: [number, number] = [0, 0];
  private glance: [number, number] = [0, 0];
  private glanceIn = 2;
  private walk = 0;
  private wheel = 0;
  private spin = new Map<string, number>();
  private open = new Map<string, number>();
  private twitch = new Map<string, number>();
  private talkShape: MouthShape | null = null;
  private talkIn = 0;
  private faceMix = new Map<Expression, number>();
  private readonly seed = Math.random() * 10;
  private readonly side: boolean;

  constructor(readonly rig: Rig) {
    for (const p of rig.pieces) {
      const list = this.byKind.get(p.kind) ?? [];
      list.push(p);
      this.byKind.set(p.kind, list);
    }
    this.root = rig.pieces.find((p) => !p.parent);
    this.side = rig.view === 'side';
    // side view: legs nearer the head (image-left, as drawn) are the front ones
    const legs = this.kind('leg');
    if (legs.length) {
      const cx = this.root ? (this.root.bbox[0] + this.root.bbox[2]) / 2 : 0.5;
      for (const l of legs) (l.pivot[0] < cx ? this.frontLegs : this.backLegs).push(l);
    }
  }

  private kind(k: string): RigPiece[] {
    return this.byKind.get(k) ?? [];
  }

  /** The arm on one side (image-left/right), else any. */
  private arm(side: 'l' | 'r'): RigPiece | undefined {
    const arms = this.kind('arm');
    return arms.find((a) => a.side === side) ?? (side === 'r' ? arms[arms.length - 1] : arms[0]);
  }

  update(i: MotionInput): Pose {
    const joints = new Map<string, JointPose>();
    const J = (id: string | undefined): JointPose | null => {
      if (!id) return null;
      let j = joints.get(id);
      if (!j) {
        j = restJoint();
        joints.set(id, j);
      }
      return j;
    };
    const t = i.time + this.seed;
    const g = i.gesture;
    const gk = g ? Math.min(1, g.t / Math.max(0.01, g.dur)) : 0;
    const env = g ? smooth(0, 0.15, gk) * (1 - smooth(0.85, 1, gk)) : 0;

    // expression: blend toward the asked face; gestures can bring their own
    let expr = (EXPRESSIONS as readonly string[]).includes(i.expression ?? '') ? (i.expression as Expression) : 'neutral';
    if (g && env > 0.2) {
      const own: Partial<Record<string, Expression>> = { laugh: 'laughing', cry: 'sad', gasp: 'surprised', wave: 'happy', arms_up: 'happy', thumbs_up: 'happy', dance: 'happy', shrug: 'confused', cover_eyes: 'scared' };
      expr = own[g.name] ?? expr;
    }
    for (const e of Object.keys(FACES) as Expression[]) {
      const cur = this.faceMix.get(e) ?? (e === 'neutral' ? 1 : 0);
      this.faceMix.set(e, cur + ((e === expr ? 1 : 0) - cur) * Math.min(1, i.dt * 8));
    }
    const target = FACES[expr];
    const mix = (f: (s: FaceSet) => number) => {
      let v = 0;
      for (const [e, w] of this.faceMix) v += f(FACES[e]) * w;
      return v;
    };

    // idle: breathe, sway, blink, glance
    const root = J(this.root?.id)!;
    if (this.root) {
      root.sy = 1 + Math.sin(t * 2.1) * 0.012;
      root.rot = Math.sin(t * 0.6) * 0.012;
    }
    this.blinkIn -= i.dt;
    if (this.blinkIn <= 0) {
      this.blinkT = 0;
      this.blinkIn = 2 + Math.random() * 4 + (Math.random() < 0.15 ? -1.8 : 0);
    }
    let blink = 1;
    if (this.blinkT >= 0) {
      this.blinkT += i.dt;
      blink = this.blinkT < 0.07 ? 1 - this.blinkT / 0.07 : this.blinkT < 0.16 ? (this.blinkT - 0.07) / 0.09 : 1;
      if (this.blinkT >= 0.16) this.blinkT = -1;
    }
    this.glanceIn -= i.dt;
    if (this.glanceIn <= 0) {
      this.glance = Math.random() < 0.4 ? [0, 0] : [Math.random() * 2 - 1, Math.random() * 0.8 - 0.3];
      this.glanceIn = 1.5 + Math.random() * 3.5;
    }
    const want = i.look ?? this.glance;
    this.lookNow = [this.lookNow[0] + (want[0] - this.lookNow[0]) * Math.min(1, i.dt * 10), this.lookNow[1] + (want[1] - this.lookNow[1]) * Math.min(1, i.dt * 10)];

    // walking: swing limbs with the stride
    const stride = Math.min(1, i.speed / 1.4);
    this.walk += i.dt * (3 + i.speed * 3.2) * (stride > 0.05 ? 1 : 0);
    const w = this.walk;
    if (stride > 0.05) {
      if (this.side) {
        this.frontLegs.forEach((l, k) => (J(l.id)!.rot = Math.sin(w + k * Math.PI) * 0.45 * stride));
        this.backLegs.forEach((l, k) => (J(l.id)!.rot = Math.sin(w + Math.PI + k * Math.PI) * 0.45 * stride));
        if (this.root) root.y += Math.abs(Math.sin(w)) * 0.01 * stride;
      } else {
        for (const l of this.kind('leg')) {
          const ph = l.side === 'r' ? Math.PI : 0;
          J(l.id)!.y = Math.max(0, Math.sin(w + ph)) * 0.025 * stride;
          J(l.id)!.rot = Math.sin(w + ph) * 0.05 * stride;
        }
        for (const a of this.kind('arm')) J(a.id)!.rot = Math.sin(w + (a.side === 'r' ? 0 : Math.PI)) * 0.22 * stride;
        if (this.root) root.y += Math.abs(Math.sin(w)) * 0.012 * stride;
      }
    } else {
      for (const a of this.kind('arm')) J(a.id)!.rot = Math.sin(t * 0.9 + (a.side === 'r' ? 1 : 0)) * 0.025;
    }
    // tails wag, ears twitch, wings flap in the air
    const happy = (this.faceMix.get('happy') ?? 0) + (this.faceMix.get('laughing') ?? 0);
    for (const tail of this.kind('tail')) J(tail.id)!.rot = Math.sin(t * (3 + happy * 9)) * (0.12 + happy * 0.25);
    for (const ear of this.kind('ear')) {
      let k = this.twitch.get(ear.id) ?? Math.random() * 6;
      k -= i.dt;
      if (k < -0.25) k = 3 + Math.random() * 6;
      this.twitch.set(ear.id, k);
      J(ear.id)!.rot = k < 0 ? Math.sin(-k * 40) * 0.2 : 0;
    }
    for (const wing of this.kind('wing')) J(wing.id)!.rot = i.airborne ? Math.sin(t * 16) * 0.6 : Math.sin(t * 1.3) * 0.04;
    // objects' own parts
    this.wheel -= (i.speed * i.dt) / Math.max(0.05, i.metres * 0.12);
    for (const wh of this.kind('wheel')) J(wh.id)!.rot = this.wheel;
    const hands = this.kind('clock_hand').sort((a, b) => area(b) - area(a));
    hands.forEach((h, k) => {
      const v = (this.spin.get(h.id) ?? 0) + i.dt * (h.spin ?? (k === 0 ? -0.105 : -0.009));
      this.spin.set(h.id, v);
      J(h.id)!.rot = v;
    });
    for (const b of [...this.kind('blade'), ...this.rig.pieces.filter((p) => p.spin && p.kind !== 'clock_hand')]) {
      const v = (this.spin.get(b.id) ?? 0) + i.dt * (b.spin ?? 1.2);
      this.spin.set(b.id, v);
      J(b.id)!.rot = v;
    }
    for (const d of [...this.kind('door'), ...this.kind('lid')]) {
      const want = i.state[`open_${d.id}`] === true || i.state.open === true ? 1 : 0;
      const k = (this.open.get(d.id) ?? 0) + (want - (this.open.get(d.id) ?? 0)) * Math.min(1, i.dt * 6);
      this.open.set(d.id, k);
      J(d.id)!.rot = (((d.open ?? (d.kind === 'lid' ? 100 : 75)) * Math.PI) / 180) * k;
    }

    // talking: the mouth moves, the head bobs a little
    let mouth: MouthShape | null = target.mouth;
    if (i.talking) {
      this.talkIn -= i.dt;
      if (this.talkIn <= 0) {
        const shapes: MouthShape[] = expr === 'happy' || expr === 'laughing' ? ['grin', 'talk', 'open', 'smile'] : expr === 'sad' ? ['frown', 'talk', 'o'] : ['talk', 'open', 'flat', 'talk', 'o'];
        this.talkShape = shapes[Math.floor(Math.random() * shapes.length)];
        this.talkIn = 0.07 + Math.random() * 0.1;
      }
      mouth = this.talkShape;
      const head = this.kind('head')[0];
      if (head) J(head.id)!.rot += Math.sin(t * 9) * 0.03;
    }

    const face: FacePose = {
      eyeOpen: [blink * mix((s) => s.eyes), blink * mix((s) => s.eyes)],
      lid: target.lid,
      look: this.lookNow,
      eyeScale: 1 + Math.max(0, mix((s) => s.eyes) - 1),
      mouth,
      brows: { raise: mix((s) => s.brows.raise), tilt: mix((s) => s.brows.tilt), alpha: mix((s) => s.brows.alpha) },
    };
    // eyes never grow when they are scaled shut
    face.eyeOpen = [Math.min(1, face.eyeOpen[0]), Math.min(1, face.eyeOpen[1])];

    if (g) this.gesture(g.name, gk, env, g.t, t, J, face);
    // pieces that came off stay off
    for (const p of this.rig.pieces) if (i.state[`off_${p.id}`] === true) J(p.id)!.hidden = true;
    return { joints, face };
  }

  /** The scripted moves. k runs 0..1 over the gesture; env eases in and out. */
  private gesture(name: string, k: number, env: number, secs: number, t: number, J: (id: string | undefined) => JointPose | null, face: FacePose): void {
    const one = isGesture(name) ? GESTURE_SECONDS[name] : 1;
    const b = (cycles: number, phase = 0) => Math.sin((secs / one) * Math.PI * cycles + phase);
    const armR = this.arm('r');
    const armL = this.arm('l');
    const out = (a: RigPiece | undefined) => (a?.side === 'l' ? -1 : 1);
    const raise = (a: RigPiece | undefined, angle: number, front = false) => {
      const j = J(a?.id);
      if (!j) return;
      j.rot = j.rot * (1 - env) + out(a) * angle * env;
      if (front && env > 0.3) j.front = true;
    };
    const handOf = (a: RigPiece | undefined) => this.kind('hand').find((h) => h.parent === a?.id);
    const head = this.kind('head')[0];
    const root = this.root;
    const animalLeg = this.frontLegs[0];
    switch (name) {
      case 'wave': {
        if (!armR && animalLeg) {
          J(animalLeg.id)!.rot = (-1.1 + b(8) * 0.25) * env;
          break;
        }
        raise(armR, 2.5 + b(8) * 0.25);
        const h = J(handOf(armR)?.id);
        if (h) h.rot = b(8) * 0.5 * env;
        break;
      }
      case 'point':
        raise(armR, 1.6);
        if (head) J(head.id)!.rot += 0.06 * env;
        face.look = [1, 0];
        break;
      case 'clap': {
        const hit = Math.abs(b(7));
        raise(armR, -(0.75 - hit * 0.25), true);
        raise(armL, -(0.75 - hit * 0.25), true);
        break;
      }
      case 'shrug':
        raise(armR, 0.55);
        raise(armL, 0.55);
        for (const a of [armR, armL]) {
          const h = J(handOf(a)?.id);
          if (h) h.rot = out(a) * 0.9 * env;
        }
        if (head) J(head.id)!.rot += 0.12 * env;
        break;
      case 'thumbs_up':
        raise(armR, 1.1 + b(4) * 0.1);
        break;
      case 'cover_eyes':
        raise(armR, -2.6, true);
        raise(armL, -2.6, true);
        // the head ducks into the hands, and the arms reach a little: paper stretches
        if (head) J(head.id)!.y -= 0.035 * env;
        for (const a of [armR, armL]) if (a) J(a.id)!.sy = 1 + 0.18 * env;
        face.eyeOpen = [0.1, 0.1];
        break;
      case 'hands_on_hips':
        raise(armR, 0.5);
        raise(armL, 0.5);
        for (const a of [armR, armL]) {
          const h = J(handOf(a)?.id);
          if (h) h.rot = -out(a) * 1.1 * env;
        }
        break;
      case 'arms_up':
        raise(armR, 2.7 + b(6) * 0.1);
        raise(armL, 2.7 + b(6, 1) * 0.1);
        if (root) J(root.id)!.y += Math.abs(b(3)) * 0.04 * env;
        break;
      case 'dance': {
        const d = b(8);
        raise(armR, 1.4 + d * 1.1);
        raise(armL, 1.4 - d * 1.1);
        if (root) {
          J(root.id)!.rot += d * 0.12 * env;
          J(root.id)!.y += Math.abs(d) * 0.03 * env;
        }
        for (const l of this.kind('leg')) J(l.id)!.y += Math.max(0, l.side === 'r' ? -d : d) * 0.03 * env;
        break;
      }
      case 'bow':
        if (head) {
          J(head.id)!.y -= 0.03 * env;
          J(head.id)!.sy *= 1 - 0.08 * env;
        }
        if (root) J(root.id)!.sy *= 1 - 0.05 * env;
        raise(armR, -0.25);
        raise(armL, -0.25);
        break;
      case 'shake_head':
        if (head) {
          J(head.id)!.x += b(8) * 0.018 * env;
          J(head.id)!.rot += b(8) * 0.06 * env;
        }
        face.look = [b(8, Math.PI) * env, 0];
        break;
      case 'nod':
        if (head) J(head.id)!.y -= Math.abs(b(3)) * 0.02 * env;
        break;
      case 'wink':
        face.eyeOpen = [face.eyeOpen[0], env > 0.3 ? 0.05 : face.eyeOpen[1]];
        face.lid = 'lid';
        face.mouth = 'smile';
        break;
      case 'laugh':
        if (root) J(root.id)!.y += Math.abs(b(9)) * 0.02 * env;
        if (head) J(head.id)!.rot += b(9) * 0.05 * env;
        break;
      case 'cry':
        if (root) J(root.id)!.x += b(22) * 0.004 * env;
        face.eyeOpen = [0.2, 0.2];
        face.lid = 'lid_up';
        raise(armR, -2.4, true);
        raise(armL, -2.4, true);
        break;
      case 'gasp':
        if (root) J(root.id)!.y += Math.sin(Math.min(1, k * 3) * Math.PI) * 0.04 * env;
        raise(armR, 0.9);
        raise(armL, 0.9);
        break;
      case 'look_around':
        face.look = [b(2) * env, 0.1];
        if (head) J(head.id)!.rot += b(2) * 0.08 * env;
        break;
      case 'wag':
        for (const tail of this.kind('tail')) J(tail.id)!.rot = Math.sin(t * 22) * 0.4 * env;
        if (!this.kind('tail').length && root) J(root.id)!.rot += Math.sin(t * 16) * 0.06 * env;
        break;
      case 'flap': {
        const f = Math.sin(t * 18) * 0.7 * env;
        for (const wing of this.kind('wing')) J(wing.id)!.rot = f;
        if (!this.kind('wing').length) {
          raise(armR, 1.2 + f);
          raise(armL, 1.2 + f);
        }
        break;
      }
      case 'apart': {
        // every piece pops out from the middle, turns a little, and snaps back
        const pop = Math.sin(Math.min(1, k * 1.2) * Math.PI) * env;
        const cx = 0.5;
        const cy = 0.5;
        this.rig.pieces.forEach((p, n) => {
          if (p === root) return;
          const j = J(p.id)!;
          const px = (p.bbox[0] + p.bbox[2]) / 2 - cx;
          const py = cy - (p.bbox[1] + p.bbox[3]) / 2;
          const len = Math.hypot(px, py) || 1;
          j.x += (px / len) * 0.22 * pop;
          j.y += (py / len) * 0.22 * pop + 0.05 * pop;
          j.rot += Math.sin(n * 2.3) * 0.6 * pop;
        });
        break;
      }
    }
  }
}

function area(p: RigPiece): number {
  return (p.bbox[2] - p.bbox[0]) * (p.bbox[3] - p.bbox[1]);
}

/**
 * The same gestures for drawings with no rig: the whole card moves (a lean for a wave, a bounce for a clap, a
 * squash for a bow). Returns tilt (degrees), vertical squash and offsets in sprite heights.
 */
export function wholeCardGesture(name: string, k: number, seconds = k * (isGesture(name) ? GESTURE_SECONDS[name] : 1)): { tilt: number; sq: number; x: number; y: number } {
  const env = smooth(0, 0.15, k) * (1 - smooth(0.85, 1, k));
  const s = (f: number) => beat(name, seconds, f);
  switch (name) {
    case 'wave':
    case 'dance':
    case 'look_around':
    case 'wag':
    case 'shake_head':
      return { tilt: s(name === 'dance' ? 8 : 6) * 7 * env, sq: 1, x: 0, y: name === 'dance' ? Math.abs(s(8)) * 0.03 * env : 0 };
    case 'clap':
    case 'laugh':
    case 'arms_up':
    case 'thumbs_up':
    case 'flap':
      return { tilt: 0, sq: 1 - Math.abs(s(7)) * 0.08 * env, x: 0, y: Math.abs(s(7)) * 0.03 * env };
    case 'nod':
      return { tilt: s(2) * 8, sq: 1, x: 0, y: 0 };
    case 'bow':
      return { tilt: 0, sq: 1 - 0.12 * env, x: 0, y: 0 };
    case 'gasp':
      return { tilt: 0, sq: 1 + 0.06 * env, x: 0, y: Math.sin(Math.min(1, k * 3) * Math.PI) * 0.05 * env };
    case 'cry':
    case 'shrug':
    case 'cover_eyes':
    case 'hands_on_hips':
    case 'point':
    case 'wink':
      return { tilt: s(10) * 2 * env, sq: 1 - 0.04 * env, x: 0, y: 0 };
    case 'apart':
      return { tilt: s(12) * 10 * env, sq: 1 + Math.sin(k * Math.PI) * 0.15 * env, x: 0, y: 0 };
    default:
      return { tilt: 0, sq: 1, x: 0, y: 0 };
  }
}
