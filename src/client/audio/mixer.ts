/**
 * The sound system's plumbing: one WebAudio context (started on the first tap or key, as browsers require),
 * buses for effects, voices, ambience and music under a master level, the cue manifest made by
 * words_and_images/audio/fetch_audio.py, decoded buffers, positional one-shots heard from the camera, and loops
 * that cross-fade into themselves. A cue the manifest lacks plays nothing.
 */
import type { Vec3 } from '../../shared/types';

export interface CueSpec {
  files: string[];
  gain: number;
  loop?: boolean;
  kind?: 'sfx' | 'ambience' | 'music';
}

export type Bus = 'sfx' | 'voice' | 'ambience' | 'music';

export interface PlayOptions {
  /** World position: heard from the camera, fading with distance. */
  at?: Vec3;
  gain?: number;
  /** Playback rate (pitch); a small random spread is added unless `exact`. */
  rate?: number;
  exact?: boolean;
  delay?: number;
  bus?: Bus;
}

/** Sound: everything, effects without music, or nothing. */
export type SoundMode = 'all' | 'no_music' | 'off';
export const SOUND_MODES: SoundMode[] = ['all', 'no_music', 'off'];

const KEY = 'pw.audio';
/** Beyond this, one-shots are not played at all. */
const HEAR_M = 45;
const LOOP_FADE_S = 2;

export function loadSoundMode(): SoundMode {
  try {
    const v = localStorage.getItem(KEY);
    return SOUND_MODES.includes(v as SoundMode) ? (v as SoundMode) : 'all';
  } catch {
    return 'all';
  }
}

function saveSoundMode(m: SoundMode): void {
  try {
    localStorage.setItem(KEY, m);
  } catch {
    /* private mode */
  }
}

/** A loop that plays until stopped, its level eased toward a target. */
export class LoopHandle {
  private target = 0;
  private sources: Array<{ src: AudioBufferSourceNode; gain: GainNode; end: number }> = [];
  private nextAt = 0;
  private stopped = false;
  readonly out: GainNode;
  readonly panner: PannerNode | null;

  constructor(
    private readonly mixer: AudioMixer,
    readonly cue: string,
    private readonly buffer: AudioBuffer,
    dest: AudioNode,
    at?: Vec3,
  ) {
    const ctx = mixer.ctx!;
    this.out = ctx.createGain();
    this.out.gain.value = 0;
    this.panner = at ? mixer.makePanner(at, 3) : null;
    if (this.panner) this.out.connect(this.panner).connect(dest);
    else this.out.connect(dest);
  }

  /** Ease toward a level (0..1 of the cue's own gain) over `secs`. */
  set(level: number, secs = 1.5): void {
    const ctx = this.mixer.ctx!;
    const v = Math.max(0, level);
    if (Math.abs(v - this.target) < 1e-3) return;
    this.target = v;
    this.out.gain.cancelScheduledValues(ctx.currentTime);
    this.out.gain.setValueAtTime(this.out.gain.value, ctx.currentTime);
    this.out.gain.linearRampToValueAtTime(v, ctx.currentTime + Math.max(0.05, secs));
  }

  get level(): number {
    return this.target;
  }

  move(at: Vec3): void {
    if (this.panner) this.mixer.placePanner(this.panner, at);
  }

  /** Keep the loop going: start the next pass a cross-fade before this one ends. */
  tick(): void {
    if (this.stopped) return;
    const ctx = this.mixer.ctx!;
    const now = ctx.currentTime;
    this.sources = this.sources.filter((s) => s.end > now);
    if (this.target <= 0.001 && this.out.gain.value <= 0.001) {
      // silent: let it lapse, and start fresh when wanted again
      this.nextAt = 0;
      return;
    }
    if (this.nextAt && now < this.nextAt - 0.25) return;
    const start = Math.max(now + 0.02, this.nextAt || now + 0.02);
    const d = this.buffer.duration;
    const fade = Math.min(LOOP_FADE_S, d / 4);
    const src = ctx.createBufferSource();
    src.buffer = this.buffer;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, start);
    g.gain.linearRampToValueAtTime(1, start + fade);
    g.gain.setValueAtTime(1, start + d - fade);
    g.gain.linearRampToValueAtTime(0, start + d);
    src.connect(g).connect(this.out);
    // music and ambience start at a random point the first time, so two loops of one cue never line up
    const offset = this.sources.length || this.nextAt ? 0 : Math.random() * Math.max(0, d - fade * 2);
    src.start(start, offset);
    const end = start + d - offset;
    this.sources.push({ src, gain: g, end });
    this.nextAt = end - fade;
  }

  stop(secs = 1): void {
    if (this.stopped) return;
    this.stopped = true;
    const ctx = this.mixer.ctx!;
    this.out.gain.cancelScheduledValues(ctx.currentTime);
    this.out.gain.setValueAtTime(this.out.gain.value, ctx.currentTime);
    this.out.gain.linearRampToValueAtTime(0, ctx.currentTime + secs);
    for (const s of this.sources) s.src.stop(ctx.currentTime + secs + 0.05);
    setTimeout(() => this.out.disconnect(), (secs + 0.2) * 1000);
  }
}

export class AudioMixer {
  ctx: AudioContext | null = null;
  private master!: GainNode;
  private readonly buses = new Map<Bus, GainNode>();
  private manifest: Record<string, CueSpec> = {};
  private readonly buffers = new Map<string, Promise<AudioBuffer | null>>();
  private readonly lastPick = new Map<string, number>();
  private listener: Vec3 = [0, 0, 0];
  private mode: SoundMode = loadSoundMode();
  /** Cues played, newest last (tests and the dev console read it). */
  readonly log: string[] = [];
  private loaded: Promise<void> | null = null;

  constructor(private readonly base = '/audio') {}

  get soundMode(): SoundMode {
    return this.mode;
  }

  setSoundMode(m: SoundMode): void {
    this.mode = m;
    saveSoundMode(m);
    this.applyLevels();
  }

  /** Fetch the cue list (once). Without one, only generated voices play. */
  load(): Promise<void> {
    this.loaded ??= fetch(`${this.base}/manifest.json`)
      .then((r) => (r.ok ? r.json() : { cues: {} }))
      .then((j: { cues?: Record<string, CueSpec> }) => {
        this.manifest = j.cues ?? {};
      })
      .catch(() => {
        this.manifest = {};
      });
    return this.loaded;
  }

  has(cue: string): boolean {
    return !!this.manifest[cue]?.files.length;
  }

  /** Start (or resume) sound; call from a user gesture. */
  unlock(): void {
    if (!this.ctx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return;
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.connect(this.ctx.destination);
      for (const b of ['sfx', 'voice', 'ambience', 'music'] as Bus[]) {
        const g = this.ctx.createGain();
        g.connect(this.master);
        this.buses.set(b, g);
      }
      this.applyLevels();
      // decode the cues heard most right away
      for (const cue of Object.keys(this.manifest)) if (/^(step|ui|poke|paper|door|land)\./.test(cue) || cue === 'poke' || cue === 'paper') this.prefetch(cue);
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
  }

  get ready(): boolean {
    return !!this.ctx && this.ctx.state === 'running';
  }

  private applyLevels(): void {
    if (!this.ctx) return;
    const off = this.mode === 'off';
    const t = this.ctx.currentTime;
    this.master.gain.setTargetAtTime(off ? 0 : 0.9, t, 0.1);
    this.buses.get('music')!.gain.setTargetAtTime(this.mode === 'all' ? 0.55 : 0, t, 0.3);
    this.buses.get('ambience')!.gain.setTargetAtTime(0.8, t, 0.1);
    this.buses.get('sfx')!.gain.setTargetAtTime(1, t, 0.1);
    this.buses.get('voice')!.gain.setTargetAtTime(0.9, t, 0.1);
  }

  bus(b: Bus): AudioNode {
    return this.buses.get(b)!;
  }

  /** Where the ears are: the camera, facing along its yaw (0 looks toward -z). */
  setListener(pos: Vec3, yaw: number): void {
    this.listener = pos;
    const ctx = this.ctx;
    if (!ctx) return;
    const l = ctx.listener;
    const fx = -Math.sin(yaw);
    const fz = -Math.cos(yaw);
    if (l.positionX) {
      const t = ctx.currentTime;
      l.positionX.setTargetAtTime(pos[0], t, 0.03);
      l.positionY.setTargetAtTime(pos[1], t, 0.03);
      l.positionZ.setTargetAtTime(pos[2], t, 0.03);
      l.forwardX.setTargetAtTime(fx, t, 0.03);
      l.forwardY.setTargetAtTime(0, t, 0.03);
      l.forwardZ.setTargetAtTime(fz, t, 0.03);
      l.upX.value = 0;
      l.upY.value = 1;
      l.upZ.value = 0;
    } else {
      l.setPosition(pos[0], pos[1], pos[2]);
      l.setOrientation(fx, 0, fz, 0, 1, 0);
    }
  }

  distance(at: Vec3): number {
    return Math.hypot(at[0] - this.listener[0], at[1] - this.listener[1], at[2] - this.listener[2]);
  }

  makePanner(at: Vec3, ref = 2): PannerNode {
    const p = this.ctx!.createPanner();
    p.panningModel = 'equalpower';
    p.distanceModel = 'inverse';
    p.refDistance = ref;
    p.maxDistance = 60;
    p.rolloffFactor = 1.1;
    this.placePanner(p, at);
    return p;
  }

  placePanner(p: PannerNode, at: Vec3): void {
    if (!at.every(Number.isFinite)) return;
    if (p.positionX) {
      p.positionX.value = at[0];
      p.positionY.value = at[1];
      p.positionZ.value = at[2];
    } else p.setPosition(at[0], at[1], at[2]);
  }

  private buffer(file: string): Promise<AudioBuffer | null> {
    let b = this.buffers.get(file);
    if (!b) {
      const ctx = this.ctx!;
      b = fetch(`${this.base}/${file}`)
        .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(String(r.status)))))
        .then((data) => ctx.decodeAudioData(data))
        .catch((e) => {
          console.warn(`[audio] ${file}: ${(e as Error).message}`);
          return null;
        });
      this.buffers.set(file, b);
    }
    return b;
  }

  prefetch(cue: string): void {
    if (!this.ctx) return;
    for (const f of this.manifest[cue]?.files ?? []) void this.buffer(f);
  }

  /** A random variant of a cue, never the same one twice running when there are others. */
  private pick(cue: string): string | null {
    const files = this.manifest[cue]?.files;
    if (!files?.length) return null;
    let i = Math.floor(Math.random() * files.length);
    if (files.length > 1 && i === this.lastPick.get(cue)) i = (i + 1) % files.length;
    this.lastPick.set(cue, i);
    return files[i];
  }

  /** Play a one-shot. Returns false when it is not available (no manifest entry, no sound yet, too far). */
  play(cue: string, o: PlayOptions = {}): boolean {
    if (!this.ctx || this.mode === 'off') return false;
    if (o.at && !o.at.every(Number.isFinite)) o = { ...o, at: undefined };
    if (o.at && this.distance(o.at) > HEAR_M) return false;
    const spec = this.manifest[cue];
    const file = this.pick(cue);
    if (!spec || !file) return false;
    this.log.push(cue);
    if (this.log.length > 200) this.log.splice(0, 100);
    const ctx = this.ctx;
    const when = ctx.currentTime + (o.delay ?? 0);
    void this.buffer(file).then((buf) => {
      if (!buf || !this.ctx) return;
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.playbackRate.value = (o.rate ?? 1) * (o.exact ? 1 : 1 + (Math.random() - 0.5) * 0.12);
      const g = ctx.createGain();
      g.gain.value = spec.gain * (o.gain ?? 1);
      let node: AudioNode = src.connect(g);
      if (o.at) node = node.connect(this.makePanner(o.at));
      node.connect(this.bus(o.bus ?? 'sfx'));
      src.start(Math.max(ctx.currentTime, when));
    });
    return true;
  }

  /** A loop of a cue at a level (0 until set), positional when `at` is given. Null when the cue is missing. */
  async loop(cue: string, bus: Bus, at?: Vec3): Promise<LoopHandle | null> {
    if (!this.ctx) return null;
    const spec = this.manifest[cue];
    const file = this.pick(cue);
    if (!spec || !file) return null;
    const buf = await this.buffer(file);
    if (!buf || !this.ctx) return null;
    const g = this.ctx.createGain();
    g.gain.value = spec.gain;
    g.connect(this.bus(bus));
    return new LoopHandle(this, cue, buf, g, at);
  }
}
