/**
 * The sound of the place, every frame: music cross-fading with the time of day; birds by day and crickets at
 * night; a stream or lake shore when water is near (judged by sampling the terrain around the listener); wind
 * on high ground; and loops at their sources (fountains running, fires burning, rain falling) for the nearest
 * few within earshot.
 */
import type { TimeOfDay, Vec3 } from '../../shared/types';
import type { TerrainField } from '../../shared/terrain/field';
import type { AudioMixer, Bus, LoopHandle } from './mixer';

export interface PlaceSource {
  key: string;
  cue: string;
  at: Vec3;
}

export interface PlaceInfo {
  time: TimeOfDay;
  /** 0 by day, 1 at night. */
  glow: number;
  ears: Vec3;
  field: TerrainField | null;
  sources: PlaceSource[];
}

const TIMES: TimeOfDay[] = ['dawn', 'day', 'sunset', 'night'];
const SOURCE_M = 35;
const MAX_SOURCES = 6;

type Slot = LoopHandle | 'loading' | 'missing';

export class Soundscape {
  private readonly loops = new Map<string, Slot>();
  private waterNear = 0;
  private lakeShare = 0;
  private sampledAt = -1;
  private clock = 0;

  constructor(private readonly mixer: AudioMixer) {}

  /** A loop by key, made on first use (or null while it loads, or when the cue does not exist). */
  private slot(key: string, cue: string, bus: Bus, at?: Vec3): LoopHandle | null {
    const s = this.loops.get(key);
    if (s === 'loading' || s === 'missing') return null;
    if (s) return s;
    this.loops.set(key, 'loading');
    void this.mixer.loop(cue, bus, at).then((h) => this.loops.set(key, h ?? 'missing'));
    return null;
  }

  /** Ease a loop toward a level; a level of zero for one never made makes nothing. */
  private level(key: string, cue: string, bus: Bus, v: number, secs: number, at?: Vec3): void {
    const existing = this.loops.get(key);
    if (v <= 0.001 && (existing === undefined || typeof existing === 'string')) return;
    const h = this.slot(key, cue, bus, at);
    if (!h) return;
    if (at) h.move(at);
    h.set(v, secs);
  }

  update(info: PlaceInfo, dt: number): void {
    if (!this.mixer.ready) return;
    this.clock += dt;
    // music: the time of day's track up, the others down
    for (const t of TIMES) this.level(`music.${t}`, `music.${t}`, 'music', t === info.time ? 1 : 0, 5);
    // water near: sample rings of terrain round the ears now and then
    if (this.clock - this.sampledAt > 0.6) {
      this.sampledAt = this.clock;
      this.sampleWater(info.ears, info.field);
    }
    const night = info.glow;
    const raining = info.sources.some((s) => s.cue === 'amb.rain');
    this.level('amb.birds', 'amb.birds', 'ambience', (1 - night) * (info.time === 'sunset' ? 0.5 : 1) * (raining ? 0.2 : 1), 3);
    this.level('amb.crickets', 'amb.crickets', 'ambience', night * (raining ? 0.3 : 1), 3);
    this.level('amb.water', 'amb.water', 'ambience', this.waterNear * (1 - this.lakeShare), 1.5);
    this.level('amb.waves', 'amb.waves', 'ambience', this.waterNear * this.lakeShare, 1.5);
    const high = info.field ? Math.max(0, Math.min(1, (info.ears[1] - info.field.waterLevel - 6) / 10)) : 0;
    this.level('amb.wind', 'amb.wind', 'ambience', 0.15 + high * 0.85, 3);
    // loops at their sources: the nearest few
    const near = info.sources
      .map((s) => ({ s, d: Math.hypot(s.at[0] - info.ears[0], s.at[2] - info.ears[2]) }))
      .filter((x) => x.d < SOURCE_M)
      .sort((a, b) => a.d - b.d)
      .slice(0, MAX_SOURCES);
    const keep = new Set(near.map((x) => `src:${x.s.key}`));
    for (const { s } of near) this.level(`src:${s.key}`, s.cue, 'ambience', 1, 1, s.at);
    for (const [key, slot] of this.loops) {
      if (!key.startsWith('src:') || keep.has(key)) continue;
      if (typeof slot !== 'string') slot.stop(1.2);
      this.loops.delete(key);
    }
    for (const slot of this.loops.values()) if (typeof slot !== 'string') slot.tick();
  }

  private sampleWater(at: Vec3, field: TerrainField | null): void {
    if (!field) {
      this.waterNear = 0;
      return;
    }
    let nearest = Infinity;
    let wet = 0;
    let total = 0;
    for (const r of [0, 3, 7, 12, 18]) {
      const n = r === 0 ? 1 : 10;
      for (let k = 0; k < n; k++) {
        const a = (k / n) * Math.PI * 2;
        const w = field.isWater(at[0] + Math.cos(a) * r, at[2] + Math.sin(a) * r, 0.02);
        if (w) nearest = Math.min(nearest, r);
        if (r >= 7) {
          total++;
          if (w) wet++;
        }
      }
    }
    this.waterNear = Number.isFinite(nearest) ? Math.max(0, 1 - nearest / 20) : 0;
    // a lot of water all round is a lake shore; a little is a stream
    this.lakeShare = total ? Math.max(0, Math.min(1, (wet / total - 0.2) / 0.3)) : 0;
  }

  stopAll(): void {
    for (const slot of this.loops.values()) if (typeof slot !== 'string') slot.stop(0.5);
    this.loops.clear();
  }
}
