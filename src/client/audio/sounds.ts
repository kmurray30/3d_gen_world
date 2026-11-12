/**
 * The game's sounds: what the engine does (speech, pokes, landings, doors and lids, effects, things arriving
 * and leaving, moves and gestures) and what moves every frame (your footsteps and those of people and animals
 * nearby, on whatever is underfoot) turned into cues, plus the place's music and ambience. People babble their
 * lines in their own voices; animals make their calls.
 */
import type { Engine, EngineEvent } from '../../shared/engine/index';
import type { Entity, Vec3 } from '../../shared/types';
import { renderHeight } from '../../shared/engine/sizing';
import { partSpan, structureLocal } from '../../shared/structure/collide';
import { groundSurface, materialSurface, type Surface } from '../../shared/terrain/surface';
import { AudioMixer } from './mixer';
import { Soundscape, type PlaceSource } from './soundscape';
import { planBabble, planNoise, speak, voiceFor, type Mood } from './babble';
import { animCue, animNoise, animalCue, effectCue, effectLoop, landCue, moverCue, removeCue, stepCue } from './cues';

const LIVING = new Set(['human', 'humanoid', 'animal']);
const STEPS_M = 16;
const MAX_WALKERS = 8;
const MOODS: Mood[] = ['neutral', 'happy', 'sad', 'angry', 'surprised', 'scared', 'sleepy', 'laughing', 'confused'];

export interface FrameEars {
  dt: number;
  ears: Vec3;
  yaw: number;
  /** The player's feet, whether they are on the ground, and this frame's jump or landing. */
  feet: Vec3;
  grounded: boolean;
  jumped: boolean;
  landed: boolean;
  /** Height the player stands on (terrain or a structure). */
  standing: number;
  /** In the free camera the player does not walk. */
  walking: boolean;
  /** 0 by day, 1 at night. */
  glow: number;
}

export class GameSounds {
  readonly mixer = new AudioMixer();
  private readonly scape = new Soundscape(this.mixer);
  private readonly walkers = new Map<string, { last: Vec3; dist: number }>();
  private readonly lastPos = new Map<string, Vec3>();
  private readonly budget = new Map<string, { t: number; n: number }>();
  private stride = 0;
  private lastFeet: Vec3 | null = null;
  private clock = 0;

  constructor(private readonly engine: Engine) {
    void this.mixer.load();
    engine.on((ev) => this.onEvent(ev));
    // browsers only start sound from a tap or a key
    const unlock = () => this.mixer.unlock();
    for (const type of ['pointerdown', 'keydown', 'touchstart'] as const) window.addEventListener(type, unlock, { passive: true });
  }

  /** No more than n of a kind of sound a second (a forest springing up should not be a wall of noise). */
  private allow(kind: string, n: number): boolean {
    const b = this.budget.get(kind);
    if (!b || this.clock - b.t > 1) {
      this.budget.set(kind, { t: this.clock, n: 1 });
      return true;
    }
    if (b.n >= n) return false;
    b.n++;
    return true;
  }

  private posOf(id: string, up = 0.5): Vec3 | undefined {
    const w = this.engine.world;
    const e = w.get(id);
    if (!e) {
      const p = this.lastPos.get(id);
      return p ? [p[0], p[1] + up, p[2]] : undefined;
    }
    const p = w.worldPos(e);
    return [p[0], p[1] + renderHeight(e) * up, p[2]];
  }

  /** What an entity (not the player) stands on: a floor or bridge above the terrain reads as wood. */
  private surfaceUnder(e: Entity, at: Vec3): Surface {
    const w = this.engine.world;
    if (e.parent) return 'wood';
    const ground = w.ground(at[0], at[2]);
    if (at[1] - ground > 0.08) return 'wood';
    return groundSurface(w.terrain, at[0], at[2]);
  }

  /** What the player stands on: the structure part under the feet at the height they stand at, or the ground. */
  private surfaceUnderPlayer(feet: Vec3, standing: number): Surface {
    const w = this.engine.world;
    const ground = w.ground(feet[0], feet[2]);
    if (standing - ground > 0.04) {
      for (const e of w.list()) {
        if (!e.structure || e.hidden) continue;
        const origin = w.worldPos(e);
        const reach = Math.max(e.structure.bounds.w, e.structure.bounds.d) * (e.scale || 1);
        if (Math.hypot(origin[0] - feet[0], origin[2] - feet[2]) > reach) continue;
        const l = structureLocal(e, origin, feet);
        for (const part of e.structure.parts) {
          if (part.ghost || part.t === 'decal') continue;
          const span = partSpan(part, l[0], l[2]);
          if (span && Math.abs(origin[1] + span.top * (e.scale || 1) - standing) < 0.05) return materialSurface(part.mat);
        }
      }
      return 'wood';
    }
    return groundSurface(w.terrain, feet[0], feet[2]);
  }

  /** Babble a line in a character's voice, or an animal's call. */
  private voice(e: Entity, text: string | null, noise: ReturnType<typeof animNoise> = null, maxSecs = 2.2): void {
    if (!this.mixer.ready) return;
    const at = this.posOf(e.id, 0.85)!;
    if (e.kind === 'animal') {
      const cue = animalCue(e.word);
      if (cue && this.allow(`animal:${e.id}`, 2)) {
        const h = renderHeight(e);
        // small animals squeak higher, big ones lower
        this.mixer.play(cue, { at, bus: 'voice', rate: h < 0.4 ? 1.15 : h > 1.6 ? 0.9 : 1 });
      }
      return;
    }
    if (this.mixer.distance(at) > 40) return;
    const v = voiceFor(e.word, e.id, e.kind);
    const expr = typeof e.state.expression === 'string' && MOODS.includes(e.state.expression as Mood) ? (e.state.expression as Mood) : 'neutral';
    const plan = noise ? planNoise(noise, v, Math.floor(Math.random() * 1e6)) : planBabble(text ?? '', v, expr, maxSecs, Math.floor(Math.random() * 1e6));
    if (!plan.length) return;
    const ctx = this.mixer.ctx!;
    const panner = this.mixer.makePanner(at, 2.5);
    panner.connect(this.mixer.bus('voice'));
    const end = speak(ctx, panner, plan, v);
    setTimeout(() => panner.disconnect(), (end - ctx.currentTime + 0.6) * 1000);
    this.mixer.log.push(noise ? `voice.${noise}` : 'voice');
  }

  private onEvent(ev: EngineEvent): void {
    const w = this.engine.world;
    switch (ev.type) {
      case 'say': {
        const e = ev.id ? w.get(ev.id) : undefined;
        if (e && (LIVING.has(e.kind) || e.kind === 'object' || e.kind === 'other')) this.voice(e, ev.text, null, Math.min(2.4, ev.dur * 0.8));
        break;
      }
      case 'poke': {
        const e = w.get(ev.id);
        if (e && !LIVING.has(e.kind)) this.mixer.play('poke', { at: this.posOf(ev.id) });
        break;
      }
      case 'anim': {
        const e = w.get(ev.id);
        if (!e) break;
        const noise = animNoise(ev.name);
        if (noise && LIVING.has(e.kind)) {
          if (e.kind === 'animal') this.voice(e, null);
          else this.voice(e, null, noise);
        }
        const a = animCue(ev.name);
        if (!a) break;
        const at = this.posOf(ev.id);
        const n = a.every ? Math.min(6, ev.times * 3) : 1;
        for (let i = 0; i < n; i++) this.mixer.play(a.cue, { at, delay: (a.delay ?? 0) + i * (a.every ?? 0) });
        break;
      }
      case 'stateChange': {
        const e = w.get(ev.id);
        if (!e || typeof ev.value !== 'boolean') break;
        if (e.structure) {
          // "open the windows" opens a dozen at once: a few creaks, not a dozen in unison
          const cue = moverCue(e.structure.gen, ev.key, ev.value);
          if (cue && this.allow(`mover:${ev.id}:${cue}`, 3)) this.mixer.play(cue, { at: this.posOf(ev.id, 0.3), delay: Math.random() * 0.15 });
        } else if (ev.key.startsWith('off_')) this.mixer.play('paper', { at: this.posOf(ev.id, 0.7) });
        break;
      }
      case 'land': {
        const e = w.get(ev.id);
        if (!e || !this.allow('land', 6)) break;
        const at = w.worldPos(e);
        this.mixer.play(landCue(e.structure ? 'heavy' : e.massClass, this.surfaceUnder(e, at)), { at });
        break;
      }
      case 'spawn':
        if (this.allow('spawn', 4)) this.mixer.play('paper', { at: this.posOf(ev.id), gain: 0.8 });
        break;
      case 'remove': {
        const cue = removeCue(ev.how);
        if (cue && this.allow('remove', 5)) this.mixer.play(cue, { at: this.posOf(ev.id) });
        break;
      }
      case 'effect': {
        if (ev.loop) break; // lasting effects are loops at their source (see sources())
        const cue = effectCue(ev.name);
        const at = ev.pos ?? (ev.id ? this.posOf(ev.id) : undefined);
        if (cue && this.allow(`fx:${ev.name}`, ev.name === 'dust' ? 2 : 4)) this.mixer.play(cue, { at, gain: ev.name === 'dust' ? 0.6 : 1 });
        break;
      }
    }
  }

  /** Where lasting sounds come from: running fountains, and things that are on fire, raining or steaming. */
  private sources(): PlaceSource[] {
    const out: PlaceSource[] = [];
    const w = this.engine.world;
    for (const e of w.list()) {
      if (e.hidden) continue;
      if (e.structure?.gen === 'fountain' && e.state.open_water !== true) out.push({ key: `${e.id}:fountain`, cue: 'amb.fountain', at: w.worldPos(e) });
      for (const name of e.effects ?? []) {
        const cue = effectLoop(name);
        if (cue) out.push({ key: `${e.id}:${name}`, cue, at: this.posOf(e.id, 0.6)! });
      }
    }
    return out;
  }

  update(f: FrameEars): void {
    this.clock += f.dt;
    this.mixer.setListener(f.ears, f.yaw);
    const w = this.engine.world;
    for (const e of w.list()) this.lastPos.set(e.id, w.worldPos(e));
    if (!this.mixer.ready) return;
    this.footsteps(f);
    this.scape.update({ time: w.sky, glow: f.glow, ears: f.ears, field: w.terrain, sources: this.sources() }, f.dt);
  }

  private footsteps(f: FrameEars): void {
    // the player's: a step every stride while walking on the ground; a jump; a landing (two quick steps)
    const feet = f.feet;
    const moved = this.lastFeet ? Math.hypot(feet[0] - this.lastFeet[0], feet[2] - this.lastFeet[2]) : 0;
    this.lastFeet = [feet[0], feet[1], feet[2]];
    if (f.walking && moved < 2) {
      const surface = () => this.surfaceUnderPlayer(feet, f.standing);
      if (f.jumped) this.mixer.play('jump');
      if (f.landed) {
        const cue = stepCue(surface());
        this.mixer.play(cue, { gain: 1.2 });
        this.mixer.play(cue, { gain: 0.9, delay: 0.07 });
        this.stride = 0;
      }
      if (f.grounded && moved > 0.001) {
        this.stride += moved;
        // longer strides when running
        const stride = moved / Math.max(1e-3, f.dt) > 4.5 ? 1.25 : 0.85;
        if (this.stride >= stride) {
          this.stride = 0;
          this.mixer.play(stepCue(surface()), { gain: 0.9 });
        }
      } else if (!f.grounded) this.stride = 0.5;
    }
    // people and animals walking nearby
    const w = this.engine.world;
    const near: Array<{ e: Entity; at: Vec3; d: number }> = [];
    for (const e of w.list()) {
      if (!LIVING.has(e.kind) || e.hidden || e.parent) continue;
      const at = w.worldPos(e);
      const d = Math.hypot(at[0] - f.ears[0], at[2] - f.ears[2]);
      if (d < STEPS_M) near.push({ e, at, d });
    }
    near.sort((a, b) => a.d - b.d);
    const seen = new Set<string>();
    for (const { e, at } of near.slice(0, MAX_WALKERS)) {
      seen.add(e.id);
      const wk = this.walkers.get(e.id);
      if (!wk) {
        this.walkers.set(e.id, { last: at, dist: 0 });
        continue;
      }
      const step = Math.hypot(at[0] - wk.last[0], at[2] - wk.last[2]);
      wk.last = at;
      // only walking: not falling, flying or being thrown
      if (step > 1 || step < 1e-4 || at[1] - w.ground(at[0], at[2]) > 0.3) continue;
      wk.dist += step;
      const h = renderHeight(e);
      const stride = Math.max(0.25, Math.min(1.2, h * 0.45));
      if (wk.dist < stride) continue;
      wk.dist = 0;
      const small = h < 0.5;
      this.mixer.play(stepCue(this.surfaceUnder(e, at)), { at, gain: small ? 0.35 : h > 1.8 ? 0.9 : 0.6, rate: small ? 1.35 : h > 2.5 ? 0.8 : 1 });
    }
    for (const id of this.walkers.keys()) if (!seen.has(id)) this.walkers.delete(id);
  }

  /** The command box and menus. */
  ui(kind: 'send' | 'done' | 'error' | 'click'): void {
    this.mixer.play(`ui.${kind}`, { exact: kind === 'done' });
  }
}
