import type { Entity, Vec3, World } from '../types';
import { StepSchema, type Action, type ResolvedAction, type ResolvedBuild, type ResolvedSpawn, type ResolvedStep, type Step, type WordResolution } from '../schema';
import { figureOfEntity } from './transform';
import { getFigure } from '../figure/items';
import { pieceFigure, restFacing } from '../figure/pose';
import { reactionFor } from '../figure/anim';
import type { Figure } from '../figure/types';
import { apply as applyM, solve as solveFigure } from '../figure/math';
import { makeRng } from './math';
import { footprintRadius, massClassFor, renderHeight } from './sizing';
import { findPiece, type Rig } from '../rig';
import { DEG, rotateY } from './math';
import { resolvePlace } from './place';
import { Scheduler, type Script } from './scheduler';
import { FallTask, makeTasks } from './tasks';
import { WorldModel } from './world';
import { Rules } from './rules';
import { Idle } from './idle';
import { yawFacing } from './facing';
import { YawTask } from './tasks';
import { resolvePlayerCollisions, resolvePlayerVsStructures, type Bump } from './collide';
import { structureRadius } from '../structure/collide';
import { seatOnTerrain, structureEntity, yawToward } from '../structure/entity';
import { isPropGen } from '../structure/index';
import { Parts, round } from '../structure/build';
import { findMovers, findPieceName, moverState, movers, pieceParts, wantedState, type Mover } from '../structure/joints';
import type { Structure } from '../structure/types';

export type EngineEvent =
  | { type: 'spawn'; id: string }
  | { type: 'remove'; id: string; how?: string }
  | { type: 'morph'; id: string; word: string }
  | { type: 'attach'; id: string; to: string }
  | { type: 'say'; id?: string; text: string; dur: number }
  | { type: 'effect'; key: string; name: string; id?: string; pos?: Vec3; dur?: number; loop?: boolean }
  | { type: 'effectStop'; key: string }
  | { type: 'land'; id: string; on?: string; height: number }
  | { type: 'arrive'; id: string; target?: string }
  | { type: 'stateChange'; id: string; key: string; value: boolean | number | string }
  | { type: 'scriptDone'; id: string }
  | { type: 'sky'; time: string }
  /** A click or tap. `clip` is the reaction a code-drawn figure plays (none when it runs its own act). */
  | { type: 'poke'; id: string; part?: string; clip?: string }
  /** A part of a code-drawn thing starts moving to a new pose. */
  | { type: 'pose'; id: string; part: string }
  /** A whole-body move or gesture starting (for its sound). */
  | { type: 'anim'; id: string; name: string; times: number }
  | { type: 'warn'; msg: string };

/**
 * Headless simulation: world model + scheduler + events. No rendering, no DOM; the client renders `world` every
 * frame and the server can run it for tests.
 */
export class Engine {
  readonly world: WorldModel;
  readonly scheduler: Scheduler;
  readonly rules: Rules;
  readonly idle: Idle;
  rng: () => number;
  time = 0;
  private listeners: Array<(e: EngineEvent) => void> = [];
  private keySeq = 0;
  private idSeq = 0;
  private readonly pokeUntil = new Map<string, number>();
  /** How a drawing comes apart, when its rig is loaded (the client supplies it; pieces need it). */
  rigs: (file: string) => Rig | undefined = () => undefined;
  /** What a word spawned by an act looks like and how big it is. By default from its code-drawn figure; the
   *  server can supply the vocabulary's. */
  resolveWord: (word: string) => WordResolution | null = (word) => resolveFromFigure(word);

  constructor(world: World, seed = 1) {
    this.world = new WorldModel(world);
    this.rng = makeRng(seed);
    this.scheduler = new Scheduler((action, script) => {
      // remember what commands touched so idle life leaves it alone for a while
      if (!script.id.startsWith('idle_') && !script.id.startsWith('rule_')) {
        const target = (action as { id?: string }).id;
        if (target) this.idle.lastScripted.set(target, this.time);
      }
      return makeTasks(action, script, this);
    });
    this.rules = new Rules(this);
    this.idle = new Idle(this);
  }

  /** Turn an entity's paper to a yaw (degrees) over a moment, optionally hopping while it turns. */
  turn(id: string, yaw: number, flip: boolean | undefined, hop: 'hop' | undefined, scriptId?: string): void {
    const s = this.scheduler.start(scriptId);
    s.running.push(new YawTask(id, yaw, 0.35, this, flip));
    this.scheduler.seal(s);
    if (hop) this.run([{ op: 'anim', id, name: 'hop', times: 1 }], `${scriptId ?? 'turn'}_hop`);
  }

  /**
   * The player clicked or tapped a thing: a small reaction by kind; buildings with a door open or close it. On a
   * paper puppet, `part` is the piece that was hit and the reaction fits it: a hat gets knocked off, a hand waves,
   * a tail wags, a lid opens; a piece lying on its own jumps back onto its owner.
   */
  poke(id: string, part?: string): boolean {
    const e = this.world.get(id);
    if (!e || e.hidden) return false;
    const key = `poke:${id}`;
    if ((this.pokeUntil.get(key) ?? -1) > this.time) return false;
    this.pokeUntil.set(key, this.time + 0.6);
    const sid = `rule_poke_${this.nextKey()}`;
    const toward = yawFacing(this.world.worldPos(e), this.world.player.pos);
    const pick = (arr: string[]) => arr[Math.floor(this.rng() * arr.length)];
    if (typeof e.state.piece_of === 'string' && this.world.has(e.state.piece_of)) {
      this.reattachPiece(id);
      this.emit({ type: 'poke', id });
      return true;
    }
    const rig = e.sprite.file ? this.rigs(e.sprite.file) : undefined;
    const piece = rig && part ? rig.pieces.find((p) => p.id === part) : undefined;
    if (piece && this.pokePiece(e, piece.id, piece.kind, !!piece.detach, toward, sid)) {
      this.emit({ type: 'poke', id, part });
      return true;
    }
    // a code-drawn thing does its act (the next one in its cycle); without one, a reaction that fits it, with
    // words that fit the reaction
    const fig = figureOfEntity(e);
    if (fig) {
      if (this.act(id)) {
        this.emit({ type: 'poke', id });
        return true;
      }
      const r = reactionFor(fig, this.rng);
      const living = e.kind === 'animal' || e.kind === 'human' || e.kind === 'humanoid';
      if (living) this.faceFor(id, 'player', 3.5, sid);
      if (r.line) this.run([{ op: 'say', id, text: r.line, dur: 1.8 }], `${sid}_say`);
      this.emit({ type: 'poke', id, clip: r.clip });
      return true;
    }
    if (e.structure) {
      // the moving piece clicked works (a joint that follows another moves that one); a click on a small prop's
      // body works its main piece (the mailbox door, the lamp, the bin lid); a building's walls do nothing
      const s = e.structure;
      const all = movers(s);
      const lead = part ? (s.joints?.find((j) => j.id === part)?.follow ?? part) : undefined;
      const m = (lead ? all.find((x) => x.name === lead) : undefined) ?? (isPropGen(s.gen) ? all[0] : undefined);
      if (m) this.operate(id, m.name, 'toggle');
      this.emit({ type: 'poke', id, ...(m ? { part: m.name } : {}) });
      return true;
    } else if (e.kind === 'animal') {
      this.turn(id, toward, undefined, undefined, `${sid}_t`);
      this.run([{ op: 'par', do: [{ op: 'anim', id, name: 'hop', times: 1 }, { op: 'say', id, text: pick(['!', '?', '!!']), dur: 1 }] }], sid);
    } else if (e.kind === 'human' || e.kind === 'humanoid') {
      this.turn(id, toward, undefined, undefined, `${sid}_t`);
      this.run([{ op: 'par', do: [{ op: 'anim', id, name: 'nod', times: 1 }, { op: 'say', id, text: pick(['Hello!', 'Yes?', 'Oh, hi.', 'Hm?', 'Nice day.', 'Can I help you?']), dur: 1.8 }] }], sid);
    } else {
      this.run([{ op: 'anim', id, name: e.massClass === 'heavy' ? 'shake' : 'wobble', times: 1 }], sid);
    }
    this.emit({ type: 'poke', id });
    return true;
  }

  /** The part-by-part pokes. Returns false when the part has nothing special (the whole-thing poke runs). */
  private pokePiece(e: Entity, piece: string, kind: string, detachable: boolean, toward: number, sid: string): boolean {
    const living = e.kind === 'human' || e.kind === 'humanoid' || e.kind === 'animal';
    const say = (text: string, dur = 1.4) => ({ op: 'say' as const, id: e.id, text, dur });
    const face = (expression: 'happy' | 'surprised' | 'angry' | 'laughing') => ({ op: 'set' as const, id: e.id, expression });
    const calm = { op: 'set' as const, id: e.id, expression: 'neutral' as const };
    if (detachable) {
      const newId = this.uniqueId(`${e.id}_${piece}`);
      this.run([{ op: 'par', do: [{ op: 'detach', id: e.id, part: piece, newId }, ...(living ? [face('surprised'), say('Hey!')] : [])] }, { op: 'wait', dur: 1.2 }, ...(living ? [calm] : [])], sid);
      return true;
    }
    if (kind === 'door' || kind === 'lid') {
      const open = e.state[`open_${piece}`] !== true;
      e.state[`open_${piece}`] = open;
      this.emit({ type: 'stateChange', id: e.id, key: `open_${piece}`, value: open });
      return true;
    }
    if (!living) return kind === 'wheel' || kind === 'blade' || kind === 'clock_hand' ? (this.run([{ op: 'anim', id: e.id, name: 'wobble', times: 1 }], sid), true) : false;
    this.turn(e.id, toward, undefined, undefined, `${sid}_t`);
    switch (kind) {
      case 'hand':
      case 'arm':
        this.run([{ op: 'par', do: [{ op: 'anim', id: e.id, name: 'wave', times: 1 }, say(e.kind === 'animal' ? '!' : 'Hi!')] }], sid);
        return true;
      case 'tail':
        this.run([{ op: 'par', do: [{ op: 'anim', id: e.id, name: 'wag', times: 2 }, face('happy')] }, { op: 'wait', dur: 1.5 }, calm], sid);
        return true;
      case 'wing':
        this.run([{ op: 'anim', id: e.id, name: 'flap', times: 2 }], sid);
        return true;
      case 'leg':
      case 'foot':
        this.run([{ op: 'par', do: [{ op: 'anim', id: e.id, name: 'hop', times: 1 }, say(e.kind === 'animal' ? '!?' : 'Ow!', 1)] }], sid);
        return true;
      case 'body':
        this.run([{ op: 'par', do: [{ op: 'anim', id: e.id, name: 'laugh', times: 1 }, say(e.kind === 'animal' ? '!!' : 'Hehe!', 1.2)] }], sid);
        return true;
      case 'eye':
      case 'pupil':
      case 'brow':
        this.run([{ op: 'par', do: [face('angry'), say(e.kind === 'animal' ? '!' : 'Hey, my eye!', 1.2)] }, { op: 'wait', dur: 1.2 }, calm], sid);
        return true;
      case 'head':
      case 'hair':
      case 'mouth':
      case 'ear': {
        const greet = e.kind === 'animal' ? pick(['!', '?', '!!']) : pick(['Hello!', 'Yes?', 'Oh, hi.', 'Hm?', 'Nice day.']);
        this.run([{ op: 'par', do: [{ op: 'anim', id: e.id, name: 'nod', times: 1 }, face('happy'), say(greet, 1.6)] }, { op: 'wait', dur: 1.2 }, calm], sid);
        return true;
      }
      default:
        return false;
    }
    function pick(arr: string[]): string {
      return arr[Math.floor(Math.random() * arr.length)];
    }
  }

  /**
   * Move a structure's moving pieces to a state: "open" a door, "up" a flag, "off" a lamp, "down" a bucket, or
   * "toggle" (or nothing) for the other state. A name can reach several ("windows", "shutters"). Opening a window
   * opens its shutters too, and closing shutters closes the window behind them. False when nothing matched.
   */
  operate(id: string, part: string, to?: string): boolean {
    const e = this.world.get(id);
    if (e && !e.structure) return this.operateFigure(e, part, to);
    const s = e?.structure;
    if (!e || !s) return false;
    const found = findMovers(s, part);
    if (!found.length) return false;
    const current = found.every((m) => moverState(e, m) === 1) ? 1 : 0;
    const all = movers(s);
    const set = (m: Mover, v: 0 | 1) => {
      if (moverState(e, m) === v) return;
      e.state[m.key] = v === 1;
      this.emit({ type: 'stateChange', id, key: m.key, value: v === 1 });
    };
    let any = false;
    for (const m of found) {
      const want = wantedState(m, to, found.length > 1 ? current : moverState(e, m));
      if (want === null) continue;
      any = true;
      const n = /^(window|shutters)_(\d+)$/.exec(m.name);
      if (n) {
        // a window and its shutters can't both be shut over each other
        const other = all.find((x) => x.name === (n[1] === 'window' ? `shutters_${n[2]}` : `window_${n[2]}`));
        if (other && n[1] === 'window' && want === 1) set(other, 0);
        if (other && n[1] === 'shutters' && want === 1) set(other, 0);
      }
      set(m, want);
    }
    return any;
  }

  /**
   * Work a code-drawn thing's movers: "open" the fridge door, "on" the propeller, "out" the drawer, "toggle" the
   * lamp. A name reaches every mover it starts (door -> doorL, doorR; wheels -> wheel1..4) or one of its kind
   * (light, propeller); "all" reaches them all. False when nothing matched.
   */
  private operateFigure(e: Entity, part: string, to?: string): boolean {
    const fig = figureOfEntity(e);
    if (!fig) return false;
    const want = part.toLowerCase().replace(/[^a-z0-9]+/g, '');
    const stem = want.replace(/s$/, '');
    const all = fig.parts.filter((p) => p.mover);
    let found = all.filter((p) => p.name.toLowerCase() === want);
    if (!found.length) found = all.filter((p) => p.name.toLowerCase().startsWith(stem));
    if (!found.length) found = all.filter((p) => p.mover!.kind === stem || (stem === 'propeller' || stem === 'fan' || stem === 'rotor' || stem === 'engine' || stem === 'motor' ? p.mover!.kind === 'spin' : stem === 'lamp' || stem === 'lights' ? p.mover!.kind === 'light' : false));
    if (!found.length && (stem === 'all' || stem === 'it' || stem === 'everything')) found = all;
    if (!found.length) return false;
    const stateOf = (p: (typeof all)[number]) => (typeof e.state[`op_${p.name}`] === 'boolean' ? (e.state[`op_${p.name}`] as boolean) : !!p.mover!.on);
    const current = found.every(stateOf);
    const t = (to ?? 'toggle').toLowerCase();
    const ON = ['open', 'on', 'start', 'go', 'run', 'spin', 'out', 'lit', 'light', 'extend', 'pull', 'unlock'];
    const OFF = ['close', 'closed', 'shut', 'off', 'stop', 'in', 'dark', 'retract', 'push', 'lock'];
    // up and down follow which way the part moves: a lever that slides down is "on" when down
    const goesDown = found.every((p) => (p.mover!.amount ?? 1) < 0);
    const UP = ['up', 'raise', 'lift'], DOWN = ['down', 'lower'];
    const v = ON.includes(t) ? true : OFF.includes(t) ? false : UP.includes(t) ? !goesDown : DOWN.includes(t) ? goesDown : !current;
    const steps: ResolvedAction[] = [];
    for (const p of found) {
      if (stateOf(p) === v) continue;
      e.state[`op_${p.name}`] = v;
      this.emit({ type: 'stateChange', id: e.id, key: `op_${p.name}`, value: v });
      const m = p.mover!;
      const ax = m.axis ?? (m.kind === 'slide' ? 'z' : m.kind === 'spin' ? 'z' : 'x');
      const vec = (k: number): Vec3 => [ax === 'x' ? k : 0, ax === 'y' ? k : 0, ax === 'z' ? k : 0];
      const amount = m.amount ?? (m.kind === 'swing' ? 100 : m.kind === 'spin' ? 720 : m.kind === 'slide' ? 0.3 : 0);
      if (m.kind === 'swing') steps.push({ op: 'pose', id: e.id, part: p.name, rot: vec(v ? amount : 0), dur: 0.5 });
      else if (m.kind === 'slide') steps.push({ op: 'pose', id: e.id, part: p.name, move: vec(v ? amount : 0), dur: 0.4 });
      else if (m.kind === 'spin') steps.push({ op: 'pose', id: e.id, part: p.name, spin: vec(v ? amount : 0), dur: 0 });
    }
    // every part moves at once (a Ferris wheel's cabins), in scripts of ten side by side
    for (let i = 0; i < Math.min(steps.length, 40); i += 10) this.run([{ op: 'par', do: steps.slice(i, i + 10) }], `rule_operate_${this.nextKey()}`);
    return true;
  }

  /**
   * Run a code-drawn thing's act for a click: the next entry of its click cycle. False when it has none.
   */
  act(id: string): boolean {
    const e = this.world.get(id);
    const fig = e ? figureOfEntity(e) : null;
    const cycle = fig?.act?.click;
    if (!e || !cycle?.length) return false;
    const n = typeof e.state.act_n === 'number' ? e.state.act_n : 0;
    e.state.act_n = (n + 1) % cycle.length;
    let steps = this.prepareAct(e, cycle[n % cycle.length]);
    // a living thing looks at you while it acts and then goes back to what it was doing: an act's own
    // "face the player" becomes that look instead of turning it toward you for good
    if (e.kind === 'animal' || e.kind === 'human' || e.kind === 'humanoid') {
      const keep = (st: ResolvedStep): ResolvedStep | null => {
        if (st.op === 'par') {
          const inner = st.do.map((x) => keep(x as ResolvedStep)).filter((x): x is ResolvedStep => !!x);
          return inner.length ? ({ ...st, do: inner } as ResolvedStep) : null;
        }
        if (st.op !== 'set' || st.id !== id || st.face !== 'player') return st;
        const { face: _face, ...rest } = st;
        return Object.keys(rest).some((k) => !['op', 'id', 'delay', 'dur'].includes(k)) ? (rest as ResolvedStep) : null;
      };
      steps = steps.map(keep).filter((x): x is ResolvedStep => !!x);
      this.faceFor(id, 'player', 4.5, `act_face_${id}_${this.nextKey()}`);
    }
    this.run(steps, `act_${id}_${this.nextKey()}`);
    return true;
  }

  /** Run a code-drawn thing's act setup (once): what a demo world shows it with (bread in the toaster). */
  setupAct(id: string): boolean {
    const e = this.world.get(id);
    const fig = e ? figureOfEntity(e) : null;
    const setup = fig?.act?.setup;
    if (!e || !setup?.length || e.state.act_setup === true) return false;
    e.state.act_setup = true;
    this.run(this.prepareAct(e, setup), `act_setup_${id}_${this.nextKey()}`);
    return true;
  }

  /**
   * An act's steps made runnable for one thing: `self` becomes its id, `self.<socket>` whatever sits in that
   * socket (a step on it repeats for each), refs of things it spawns or takes off get fresh ids, and spawned
   * words are resolved. Steps naming something that is not there are dropped.
   */
  prepareAct(e: Entity, steps: Step[]): ResolvedStep[] {
    const refs = new Map<string, string>();
    const ids = (v: string): string[] => {
      if (v === 'self') return [e.id];
      if (v === 'player' || v === 'me') return ['player'];
      if (v.startsWith('self.')) return this.world.children(e.id).filter((c) => c.anchor === `@${v.slice(5)}`).map((c) => c.id);
      const r = refs.get(v);
      if (r) return [r];
      return this.world.has(v) ? [v] : [];
    };
    const place = <P extends { of?: string }>(p: P): P => {
      if (!p || typeof p !== 'object' || typeof p.of !== 'string') return p;
      const to = ids(p.of)[0];
      return { ...p, of: to ?? 'player' };
    };
    const one = (a: Action): ResolvedAction[] => {
      const x = structuredClone(a) as Record<string, unknown> & { op: string };
      if (x.op === 'spawn') {
        const res = this.resolveWord(String(x.word));
        if (!res) return [];
        const id = this.uniqueId(`${e.id}_${String(x.ref)}`);
        refs.set(String(x.ref), id);
        return [{ ...(x as object), at: place((x.at ?? { rel: 'near', of: 'self' }) as { of?: string }), ref: String(x.ref), id, res } as ResolvedAction];
      }
      if (x.op === 'detach') {
        const owner = ids(String(x.id))[0];
        if (!owner) return [];
        const newId = this.uniqueId(`${owner}_${String(x.part)}`);
        if (typeof x.ref === 'string') refs.set(x.ref, newId);
        return [{ ...(x as object), id: owner, newId } as ResolvedAction];
      }
      if (x.at && typeof x.at === 'object') x.at = place(x.at as { of?: string });
      if (x.to && typeof x.to === 'object') x.to = place(x.to as { of?: string });
      if (typeof x.face === 'string' && x.face !== 'player') x.face = ids(x.face)[0] ?? 'player';
      if (x.op === 'attach' && typeof x.to === 'string') {
        const t = ids(x.to)[0];
        if (!t) return [];
        x.to = t;
      }
      if (x.op === 'set' && typeof x.word === 'string') {
        // turning into another thing: resolve the word now, like the server does for scripts
        const res = this.resolveWord(x.word);
        if (res) x.res = res;
        else delete x.word;
      }
      if (typeof x.id !== 'string') return [x as unknown as ResolvedAction];
      return ids(x.id).map((id) => ({ ...(x as object), id }) as ResolvedAction);
    };
    const out: ResolvedStep[] = [];
    for (const raw of steps) {
      // the same parsing scripts from the model get: defaults filled in, numbers clamped, nonsense dropped
      const parsed = StepSchema.safeParse(raw);
      if (!parsed.success) {
        this.emit({ type: 'warn', msg: `skipped a step of ${e.word}'s act: ${parsed.error.issues[0]?.message ?? 'invalid'}` });
        continue;
      }
      const s = parsed.data;
      if (s.op === 'par') {
        const all = s.do.flatMap(one).slice(0, 10);
        if (all.length) out.push({ op: 'par', do: all });
      } else {
        const all = one(s);
        if (all.length === 1) out.push(all[0]);
        else if (all.length > 1) out.push({ op: 'par', do: all.slice(0, 10) });
      }
    }
    return out;
  }

  /** Turn a living thing to look at someone for a while, then let it go back to how it stood. */
  private faceFor(id: string, who: string, seconds: number, sid: string): void {
    const e = this.world.get(id);
    if (!e) return;
    const before = e.facing;
    e.facing = who;
    this.run([{ op: 'wait', dur: seconds }], `${sid}_face`);
    const until = this.time + seconds;
    const off = this.on((ev) => {
      if (ev.type !== 'scriptDone' || ev.id !== `${sid}_face`) return;
      const now = this.world.get(id);
      if (now && now.facing === who && this.time >= until - 0.05) {
        if (before) now.facing = before;
        else delete now.facing;
      }
      off();
    });
  }

  /**
   * Take a piece off a rigged drawing or a structure: it becomes its own entity (drawn from the same picture, or
   * built from the same parts) at the spot it was, and its owner shows without it. Returns the new id, or null
   * when there is no such piece.
   */
  detachPiece(id: string, part: string, newId = `${id}_${part}`): string | null {
    const e = this.world.get(id);
    if (e?.structure) return this.detachStructurePiece(e, e.structure, part, newId);
    const fig = e ? figureOfEntity(e) : null;
    if (e && fig) return this.detachFigurePiece(e, fig, part, newId);
    if (!e?.sprite.file) return null;
    const rig = this.rigs(e.sprite.file);
    const piece = rig ? findPiece(rig, part) : undefined;
    if (!rig || !piece || !piece.parent || e.state[`off_${piece.id}`] === true) return null;
    const tall = renderHeight(e);
    const [x0, y0, x1, y1] = piece.bbox;
    // where the piece sits on its owner's paper: across its right axis, up from its feet
    let across = ((x0 + x1) / 2 - 0.5) * (rig.w / rig.h) * tall;
    if (e.flip) across = -across;
    const yaw = (e.yaw ?? 0) * DEG;
    const at = this.world.worldPos(e);
    const pos: Vec3 = [at[0] + Math.cos(yaw) * across, at[1] + (1 - y1) * tall, at[2] - Math.sin(yaw) * across];
    const word = piece.detach ?? piece.kind;
    const heightM = Math.max(0.05, (y1 - y0) * tall);
    const sprite = { file: e.sprite.file, w: Math.max(1, Math.round((x1 - x0) * rig.w)), h: Math.max(1, Math.round((y1 - y0) * rig.h)), piece: piece.id };
    const pieceEntity: Entity = {
      id: this.world.has(newId) ? this.uniqueId(newId) : newId,
      word,
      label: word,
      sprite,
      pos,
      flip: e.flip,
      scale: 1,
      heightM,
      tilt: 0,
      state: { piece_of: e.id, piece: piece.id },
      effects: [],
      kind: 'object',
      solid: false,
      massClass: massClassFor('object', heightM),
      huge: false,
      createdAt: this.time,
      ...(e.yaw !== undefined ? { yaw: e.yaw } : {}),
    };
    if (!this.world.add(pieceEntity)) return null;
    e.state[`off_${piece.id}`] = true;
    this.emit({ type: 'stateChange', id: e.id, key: `off_${piece.id}`, value: true });
    this.emit({ type: 'spawn', id: pieceEntity.id });
    return pieceEntity.id;
  }

  /** A code-drawn thing's piece (the slice of a yam, a cork, a hat) comes off as a figure of its own, where it was. */
  private detachFigurePiece(e: Entity, fig: Figure, part: string, newId: string): string | null {
    const p = fig.parts.find((q) => q.name === part) ?? fig.parts.find((q) => q.name.toLowerCase().startsWith(part.toLowerCase()));
    if (!p || e.state[`off_${p.name}`] === true || !p.parent) return null;
    const piece = pieceFigure(fig, p.name);
    if (!piece) return null;
    // the piece's origin in the owner's figure space, posed as the owner is now, then into the world
    const o = solveFigure(fig).get(p.name)!;
    const lift = piece.origin[1] - o.T[1];
    const at = this.world.worldPos(e);
    const a = restFacing(e, fig) * DEG;
    const k = e.scale;
    const lx = piece.origin[0], lz = piece.origin[2];
    const pos: Vec3 = [at[0] + (lx * Math.cos(a) + lz * Math.sin(a)) * k, at[1] + (o.T[1] + lift) * k, at[2] + (-lx * Math.sin(a) + lz * Math.cos(a)) * k];
    void applyM;
    const word = piece.fig.key;
    const pe: Entity = {
      id: this.world.has(newId) ? this.uniqueId(newId) : newId,
      word,
      label: p.name,
      sprite: { file: null, w: 1, h: 1 },
      pos,
      flip: e.flip,
      scale: e.scale,
      heightM: piece.fig.heightM,
      tilt: 0,
      state: { piece_of: e.id, piece: p.name },
      effects: [],
      kind: 'object',
      solid: false,
      massClass: massClassFor('object', piece.fig.heightM),
      huge: false,
      createdAt: this.time,
      ...(e.yaw !== undefined ? { yaw: e.yaw } : {}),
    };
    if (!this.world.add(pe)) return null;
    e.state[`off_${p.name}`] = true;
    this.emit({ type: 'stateChange', id: e.id, key: `off_${p.name}`, value: true });
    this.emit({ type: 'spawn', id: pe.id });
    return pe.id;
  }

  /** A structure's named piece (roof, chimney, door, lantern) comes off as a structure of its own. */
  private detachStructurePiece(e: Entity, s: Structure, part: string, newId: string): string | null {
    const name = findPieceName(s, part);
    const idx = name ? pieceParts(s, name) : [];
    if (!name || !idx.length || idx.length === s.parts.length) return null;
    const take = new Set(idx);
    const moved = idx.map((i) => structuredClone(s.parts[i]));
    // the piece's own frame: centred on its footprint, standing on its lowest point
    const ext = new Parts();
    for (const p of moved) ext.add(structuredClone(p));
    const { minX, maxX, minZ, maxZ, maxY } = ext.extent;
    const cx = round((minX + maxX) / 2);
    const cz = round((minZ + maxZ) / 2);
    const cy = round(Math.min(...moved.map((p) => p.pos[1])));
    for (const p of moved) p.pos = [round(p.pos[0] - cx), round(p.pos[1] - cy), round(p.pos[2] - cz)];
    const piece: Structure = { gen: 'piece', params: { of: e.id, name }, parts: moved, bounds: { w: round(maxX - minX), h: round(Math.max(0.05, maxY - cy)), d: round(Math.max(0.05, maxZ - minZ)) }, ...(s.ink ? { ink: s.ink } : {}) };
    const yaw = e.yaw ?? 0;
    const at = this.world.worldPos(e);
    const off = rotateY([cx * e.scale, cy * e.scale, cz * e.scale], yaw * DEG);
    const pe = structureEntity(this.world.has(newId) ? this.uniqueId(newId) : newId, name, piece, [at[0] + off[0], at[1] + off[1], at[2] + off[2]], yaw, this.time, name);
    pe.scale = e.scale;
    pe.massClass = massClassFor('object', piece.bounds.h);
    pe.solid = Math.max(piece.bounds.w, piece.bounds.d) > 0.6;
    pe.state = { piece_of: e.id, piece: name, piece_x: cx, piece_y: cy, piece_z: cz };
    if (!this.world.add(pe)) return null;
    e.structure = { ...s, parts: s.parts.filter((_, i) => !take.has(i)) };
    e.state[`off_${name}`] = true;
    this.emit({ type: 'stateChange', id: e.id, key: `off_${name}`, value: true });
    this.emit({ type: 'spawn', id: pe.id });
    return pe.id;
  }

  /** Put a piece back on its owner (id is the piece, or its owner with a part name). */
  reattachPiece(id: string, part?: string): boolean {
    let piece = this.world.get(id);
    if (piece && typeof piece.state.piece_of !== 'string' && part) {
      const owner = piece;
      const rig = owner.sprite.file ? this.rigs(owner.sprite.file) : undefined;
      const words = part.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
      const want = rig ? findPiece(rig, part)?.id : owner.structure ? undefined : part;
      piece = this.world
        .list()
        .find((x) => x.state.piece_of === owner.id && (want ? x.state.piece === want : !owner.structure || words.some((w) => w === x.state.piece || `${w}`.replace(/s$/, '') === x.state.piece)));
    }
    if (!piece || typeof piece.state.piece_of !== 'string') return false;
    const owner = this.world.get(piece.state.piece_of);
    const pid = String(piece.state.piece);
    if (owner?.structure && piece.structure) {
      const [ox, oy, oz] = [Number(piece.state.piece_x) || 0, Number(piece.state.piece_y) || 0, Number(piece.state.piece_z) || 0];
      const back = piece.structure.parts.map((p) => ({ ...structuredClone(p), pos: [round(p.pos[0] + ox), round(p.pos[1] + oy), round(p.pos[2] + oz)] as [number, number, number] }));
      owner.structure = { ...owner.structure, parts: [...owner.structure.parts, ...back] };
    }
    this.removeEntity(piece.id, 'pop');
    if (owner) {
      delete owner.state[`off_${pid}`];
      this.emit({ type: 'stateChange', id: owner.id, key: `off_${pid}`, value: false });
      this.run([{ op: 'anim', id: owner.id, name: 'bounce', times: 1 }], `rule_reattach_${this.nextKey()}`);
    }
    return true;
  }

  /** Height of whatever the player stood on after the last `collidePlayer` (0 = the meadow). */
  playerGround = 0;

  /**
   * Move the player out of big solid things and structure walls, and let the rules react to whatever was touched.
   * Also records the height the player can stand on where they ended up in `playerGround`.
   */
  collidePlayer(pos: Vec3 = this.world.player.pos): Bump[] {
    const bumps = resolvePlayerCollisions(this.world, pos);
    if (bumps.length) this.rules.bumps(bumps);
    this.playerGround = resolvePlayerVsStructures(this.world, pos, this.world.ground(pos[0], pos[2])).support;
    return bumps;
  }

  on(fn: (e: EngineEvent) => void): () => void {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== fn);
    };
  }

  emit(e: EngineEvent): void {
    for (const l of this.listeners) l(e);
  }

  nextKey(): string {
    return `${++this.keySeq}`;
  }

  get busy(): boolean {
    return this.scheduler.busy;
  }

  update(dt: number): void {
    this.time += dt;
    for (const id of this.scheduler.update(dt)) this.emit({ type: 'scriptDone', id });
    this.idle.tick();
    for (const e of this.world.list()) {
      if (e.ttl !== undefined && this.time - e.createdAt > e.ttl) this.removeEntity(e.id, 'fade');
    }
  }

  /** Run a fully known script. */
  run(steps: ResolvedStep[], id?: string): Script {
    return this.scheduler.run(steps, id);
  }

  /** Streaming entry points: open, append steps as they arrive, seal when the stream ends. */
  open(id?: string): Script {
    return this.scheduler.start(id);
  }
  append(script: Script, step: ResolvedStep): void {
    this.scheduler.append(script, step);
  }
  seal(script: Script): void {
    this.scheduler.seal(script);
  }

  cancelAll(): void {
    this.scheduler.cancelAll();
    for (const t of this.world.transient.values()) {
      t.ofs = [0, 0, 0];
      t.sq = 1;
    }
  }

  uniqueId(base: string): string {
    if (!this.world.has(base)) return base;
    const stem = base.replace(/_\d+$/, '');
    for (let n = 2; n < 10000; n++) {
      const cand = `${stem}_${n}`;
      if (!this.world.has(cand)) return cand;
    }
    return `${stem}_${++this.idSeq}`;
  }

  /** Create and place an entity from a resolved spawn action. Returns null when the world is full. */
  spawn(action: ResolvedSpawn): Entity | null {
    const res = action.res;
    const scale = action.scale ?? 1;
    const id = this.uniqueId(action.id);
    const proto = { heightM: res.heightM, scale, sprite: res.sprite };
    const placement = resolvePlace(action.at, this.world, { id, radius: footprintRadius(proto), heightM: res.heightM * scale }, this.rng);
    const e: Entity = {
      id,
      word: res.word,
      label: res.placeholder ? action.word : res.word,
      sprite: { ...res.sprite },
      pos: placement.pos,
      flip: false,
      facing: action.face,
      scale,
      heightM: res.heightM,
      tilt: 0,
      state: {},
      effects: [],
      kind: res.kind,
      solid: res.solid,
      massClass: massClassFor(res.kind, res.heightM),
      huge: res.huge,
      createdAt: this.time,
      yaw: Math.round(yawFacing(placement.pos, this.world.player.pos)),
    };
    if (placement.parent) {
      e.parent = placement.parent;
      e.anchor = placement.anchor ?? 'top';
    }
    if (!this.world.add(e)) {
      this.emit({ type: 'warn', msg: `world is full (${this.world.size})` });
      return null;
    }
    this.emit({ type: 'spawn', id: e.id });
    return e;
  }

  /** Create and place a structure from a resolved build action, facing the player. Null when the world is full. */
  build(action: ResolvedBuild): Entity | null {
    const s = action.structure;
    const id = this.uniqueId(action.id);
    const radius = structureRadius(s);
    let placement = resolvePlace(action.at, this.world, { id, radius, heightM: s.bounds.h }, this.rng);
    if (placement.parent || placement.pos[1] - this.world.ground(placement.pos[0], placement.pos[2]) > 0.05) {
      // structures stand on the ground; "on the house" means next to it
      placement = resolvePlace({ ...action.at, rel: 'near', height: 'ground' }, this.world, { id, radius, heightM: s.bounds.h }, this.rng);
    }
    const pos: Vec3 = [placement.pos[0], 0, placement.pos[2]];
    const yaw = Math.round(yawToward(pos, this.world.player.pos));
    const seated = seatOnTerrain(s, pos, yaw, (x, z) => this.world.ground(x, z));
    pos[1] = seated.base;
    const e = structureEntity(id, action.word, seated.structure, pos, yaw, this.time, action.label);
    if (!this.world.add(e)) {
      this.emit({ type: 'warn', msg: `world is full (${this.world.size})` });
      return null;
    }
    this.emit({ type: 'spawn', id: e.id });
    return e;
  }

  /** Remove an entity now; anything attached to it falls. */
  removeEntity(id: string, how?: string): void {
    const orphans = this.world.remove(id);
    if (!orphans.length && !this.world.has(id)) {
      // removed (or never existed)
    }
    this.emit({ type: 'remove', id, how });
    for (const o of orphans) {
      const s = this.scheduler.start();
      s.running.push(new FallTask(o.id, this));
      this.scheduler.seal(s);
    }
  }

  descendants(id: string): string[] {
    const out: string[] = [];
    const walk = (pid: string, depth: number) => {
      if (depth > 6) return;
      for (const c of this.world.children(pid)) {
        out.push(c.id);
        walk(c.id, depth + 1);
      }
    };
    walk(id, 0);
    return out;
  }

  /** Saveable snapshot. */
  snapshot(): World {
    return this.world.toWorld();
  }
}

export { WorldModel } from './world';
export type { Script } from './scheduler';
export type { Bump } from './collide';

/** A word's look and size from its code-drawn figure (for things an act spawns). */
export function resolveFromFigure(word: string): WordResolution | null {
  const fig = getFigure(word);
  if (!fig) return null;
  const kind = fig.rig === 'biped' ? (fig.group === 'fantasy' ? 'humanoid' : 'human') : fig.rig === 'prop' ? 'object' : 'animal';
  return { word, sprite: { file: null, w: 1, h: 1 }, kind, heightM: fig.heightM, solid: kind !== 'object' || fig.heightM > 0.9, huge: fig.heightM >= 12, placeholder: false };
}
