/**
 * Speech as babble, the way Animal Crossing characters talk: each syllable of a speech bubble is a short sung
 * vowel with its own pitch, so a line sounds like talking without being words. Every character has its own
 * voice (pitch and timbre from its drawing's word and id), and the mood shapes the tune: a happy line lifts, a
 * sad one sinks and slows, an angry one is low and gruff, a question rises at the end, and laughs, sobs,
 * gasps, grumbles and hums have patterns of their own. `planBabble` is pure (and tested); `speak` sings a plan.
 */

export type Vowel = 'a' | 'e' | 'i' | 'o' | 'u';

export interface Syllable {
  /** Start, seconds from the beginning. */
  t: number;
  dur: number;
  /** Pitch, Hz. */
  f: number;
  vowel: Vowel;
  gain: number;
}

export interface Voice {
  /** Base pitch, Hz. */
  pitch: number;
  /** 0 smooth (a triangle wave) to 1 buzzy (a sawtooth), for gruff, robotic or monstrous voices. */
  buzz: number;
  /** Syllables a second. */
  rate: number;
  /** Robots: square wave. */
  robot?: boolean;
}

export type Mood = 'neutral' | 'happy' | 'sad' | 'angry' | 'surprised' | 'scared' | 'sleepy' | 'laughing' | 'confused';
/** Sounds that are not words. */
export type Noise = 'laugh' | 'sob' | 'gasp' | 'grumble' | 'hum_yes' | 'hum_no' | 'huh';

const VOWELS: Vowel[] = ['a', 'e', 'i', 'o', 'u'];
/** First two formants of each vowel, Hz. */
export const FORMANTS: Record<Vowel, [number, number]> = { a: [800, 1250], e: [500, 1850], i: [320, 2300], o: [500, 900], u: [350, 800] };
/** Semitones each vowel sits above or below the voice's pitch. */
const VOWEL_STEP: Record<Vowel, number> = { a: 0, e: 2, i: 4, o: -2, u: -3 };

const semis = (n: number) => 2 ** (n / 12);

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

function rng(seed: number): () => number {
  let a = seed || 1;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const CHILD = /\b(boy|girl|kid|child|baby|toddler|student|elf|fairy|pixie|gnome|kitten|puppy)\b/;
const HIGH = /\b(woman|girl|lady|queen|princess|mother|mom|grandma|granny|aunt|witch|nurse|bride|mermaid|fairy|ballerina|actress|waitress)\b/;
const LOW = /\b(man|king|prince|father|dad|grandpa|uncle|giant|ogre|troll|viking|pirate|soldier|knight|wizard|farmer|sailor|monk)\b/;
const OLD = /\b(grandma|granny|grandpa|old|elder|wizard)\b/;
const GRUFF = /\b(ogre|troll|giant|monster|zombie|dragon|orc|yeti|bear)\b/;
const ROBOT = /\b(robot|android|cyborg|computer|machine)\b/;

/** A character's voice from its word and id (the id varies it, so two farmers do not sound the same). */
export function voiceFor(word: string, id: string, kind: string): Voice {
  const w = word.toLowerCase();
  const r = rng(hash(id));
  const spread = semis((r() - 0.5) * 4);
  let pitch = 210;
  if (CHILD.test(w)) pitch = 330;
  else if (HIGH.test(w)) pitch = 270;
  else if (LOW.test(w)) pitch = 165;
  if (kind === 'object' || kind === 'other') pitch = 300;
  if (GRUFF.test(w)) pitch = 110;
  const old = OLD.test(w);
  return {
    pitch: pitch * spread * (old ? 0.92 : 1),
    buzz: GRUFF.test(w) ? 0.8 : ROBOT.test(w) ? 0.5 : 0.25 + r() * 0.15,
    rate: (old ? 7.5 : CHILD.test(w) ? 11 : 9.5) * (0.92 + r() * 0.16),
    ...(ROBOT.test(w) ? { robot: true } : {}),
  };
}

/** Syllables of a line: vowel groups in each word, at most a few per word. */
function syllables(text: string): Array<{ vowel: Vowel; stress: boolean; end: boolean }> {
  const out: Array<{ vowel: Vowel; stress: boolean; end: boolean }> = [];
  const words = text.toLowerCase().match(/[a-z']+|[0-9]+/g) ?? [];
  for (const word of words) {
    const groups = word.match(/[aeiouy]+/g) ?? [word[0] ?? 'a'];
    const n = Math.min(3, Math.max(1, groups.length));
    for (let k = 0; k < n; k++) {
      const g = groups[k] ?? 'a';
      const ch = g[0] === 'y' ? 'i' : g[0];
      out.push({ vowel: (VOWELS.includes(ch as Vowel) ? ch : VOWELS[hash(word) % 5]) as Vowel, stress: k === 0, end: k === n - 1 });
    }
  }
  return out;
}

/** The tune of a line, as semitones over its length (0..1), by mood and its last punctuation. */
function contour(mood: Mood, k: number, question: boolean, shout: boolean): number {
  let s = -1.5 * k; // a statement sinks a little
  switch (mood) {
    case 'happy':
    case 'laughing':
      s = 3 + 1.5 * Math.sin(k * Math.PI);
      break;
    case 'sad':
      s = -2 - 3 * k;
      break;
    case 'angry':
      s = -4 + 1 * Math.sin(k * 9);
      break;
    case 'surprised':
      s = 2 + 5 * k * k;
      break;
    case 'scared':
      s = 4 + 1.2 * Math.sin(k * 30);
      break;
    case 'sleepy':
      s = -3 - 2 * k;
      break;
    case 'confused':
      s = 1 + 3 * k * k;
      break;
  }
  if (question && k > 0.75) s += 4 * ((k - 0.75) / 0.25);
  if (shout) s += 2;
  return s;
}

/**
 * Plan a line of babble: up to `maxSecs` long (most of the bubble's time, never long enough to bore), the
 * voice's pitch and speed shaped by the mood.
 */
export function planBabble(text: string, voice: Voice, mood: Mood = 'neutral', maxSecs = 2.2, seed = 1): Syllable[] {
  const noise = noiseOf(text);
  if (noise) return planNoise(noise, voice, seed);
  const r = rng(seed ^ hash(text));
  const syl = syllables(text);
  if (!syl.length) return [];
  const question = /\?\s*$/.test(text);
  const shout = /!\s*$/.test(text) || (text.length > 2 && text === text.toUpperCase() && /[A-Z]/.test(text));
  const speed = voice.rate * (mood === 'sad' || mood === 'sleepy' ? 0.75 : mood === 'angry' || mood === 'scared' || mood === 'surprised' ? 1.15 : 1);
  const step = 1 / speed;
  const n = Math.min(syl.length, Math.max(1, Math.floor(maxSecs / step)));
  const out: Syllable[] = [];
  let t = 0;
  for (let i = 0; i < n; i++) {
    const s = syl[i];
    const k = n === 1 ? 0.5 : i / (n - 1);
    const jitter = (r() - 0.5) * 1.6;
    const f = voice.pitch * semis(VOWEL_STEP[s.vowel] * 0.6 + contour(mood, k, question, shout) + jitter + (s.stress ? 0.8 : 0));
    const dur = step * (s.end ? 0.78 : 0.62) * (0.9 + r() * 0.2);
    const gain = (s.stress ? 1 : 0.8) * (shout ? 1.15 : mood === 'sleepy' || mood === 'sad' ? 0.75 : 1);
    out.push({ t, dur, f, vowel: s.vowel, gain });
    // a short breath between words
    t += step * (s.end ? 1.12 : 0.92);
  }
  return out;
}

/** Lines that are a sound rather than words: "hahaha", "hmph", "huh?", "oh!", "mm-hm". */
export function noiseOf(text: string): Noise | null {
  const t = text.toLowerCase().trim();
  if (/^(ha|he|hi|ho|hee|tee)(\s*-?\s*(ha|he|hi|ho|hee|tee))+[!.]*$/.test(t) || /^(lol|haha\w*|hehe\w*|hihi\w*)[!.]*$/.test(t)) return 'laugh';
  if (/^(boo\s*hoo|waah?|sniff|\*sob\*|sob)/.test(t)) return 'sob';
  if (/^(hmph|harrumph|humph|ugh|grr+|hmf)[!.]*$/.test(t)) return 'grumble';
  if (/^(oh|ah|whoa|wow|eek|gasp)!+$/.test(t)) return 'gasp';
  if (/^(huh|eh|hm+)\?+$/.test(t)) return 'huh';
  if (/^(mm-?hm+|uh-?huh)[!.]*$/.test(t)) return 'hum_yes';
  if (/^(mm-?mm|nuh-?uh|uh-?uh)[!.]*$/.test(t)) return 'hum_no';
  return null;
}

/** The sounds that are not words, as syllable patterns. */
export function planNoise(noise: Noise, voice: Voice, seed = 1): Syllable[] {
  const r = rng(seed);
  const p = voice.pitch;
  const seq = (n: number, gap: number, f: (i: number) => number, vowel: Vowel, dur: number, gain = 1): Syllable[] =>
    Array.from({ length: n }, (_, i) => ({ t: i * gap, dur, f: f(i), vowel, gain: gain * (1 - i * 0.04) }));
  switch (noise) {
    case 'laugh':
      return seq(4 + Math.floor(r() * 2), 0.13, (i) => p * semis(6 - i * 0.8), 'a', 0.08);
    case 'sob':
      return seq(3, 0.32, (i) => p * semis(1 - i * 1.5), 'u', 0.24, 0.7);
    case 'gasp':
      return [{ t: 0, dur: 0.28, f: p * semis(7), vowel: 'a', gain: 1 }];
    case 'grumble':
      return seq(3, 0.11, (i) => p * semis(-6 + (i === 1 ? -1 : 0)), 'u', 0.1, 0.9);
    case 'huh':
      return [{ t: 0, dur: 0.3, f: p * semis(1), vowel: 'a', gain: 0.9 }, { t: 0.22, dur: 0.12, f: p * semis(5), vowel: 'a', gain: 0.6 }];
    case 'hum_yes':
      return [{ t: 0, dur: 0.16, f: p * semis(-1), vowel: 'u', gain: 0.6 }, { t: 0.2, dur: 0.2, f: p * semis(2), vowel: 'u', gain: 0.6 }];
    case 'hum_no':
      return [{ t: 0, dur: 0.16, f: p * semis(2), vowel: 'u', gain: 0.6 }, { t: 0.2, dur: 0.2, f: p * semis(-1), vowel: 'u', gain: 0.6 }];
  }
}

/** Sing a plan into `dest` (a bus, or a panner on one). Returns when it ends, in context seconds. */
export function speak(ctx: AudioContext, dest: AudioNode, plan: Syllable[], voice: Voice, level = 0.22, delay = 0): number {
  const t0 = ctx.currentTime + 0.02 + delay;
  const out = ctx.createGain();
  out.gain.value = level;
  out.connect(dest);
  let end = t0;
  for (const s of plan) {
    const start = t0 + s.t;
    const stop = start + s.dur;
    end = Math.max(end, stop);
    // a smooth tone and a buzzy one, mixed by the voice's buzz, through the vowel's two formants
    const mix = ctx.createGain();
    const tones: OscillatorNode[] = [];
    for (const [type, amount] of voice.robot ? ([['square', 0.6]] as const) : ([['triangle', 1 - voice.buzz], ['sawtooth', voice.buzz * 0.6]] as const)) {
      if (amount <= 0.01) continue;
      const o = ctx.createOscillator();
      o.type = type;
      o.frequency.setValueAtTime(s.f, start);
      // syllables glide a touch toward the next pitch, like speech
      o.frequency.linearRampToValueAtTime(s.f * (voice.robot ? 1 : 0.97), stop);
      const g = ctx.createGain();
      g.gain.value = amount;
      o.connect(g).connect(mix);
      o.start(start);
      o.stop(stop + 0.03);
      tones.push(o);
    }
    const env = ctx.createGain();
    env.gain.setValueAtTime(0, start);
    env.gain.linearRampToValueAtTime(s.gain, start + Math.min(0.018, s.dur * 0.3));
    env.gain.setTargetAtTime(0, start + s.dur * 0.55, s.dur * 0.22);
    const [f1, f2] = FORMANTS[s.vowel];
    for (const [freq, q, g] of [
      [f1, 5, 1],
      [f2, 7, 0.55],
    ] as const) {
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = freq;
      bp.Q.value = q;
      const fg = ctx.createGain();
      fg.gain.value = g * 2.2;
      mix.connect(bp).connect(fg).connect(env);
    }
    // a little of the plain tone, so low voices are not lost in the filters
    const dry = ctx.createGain();
    dry.gain.value = 0.25;
    mix.connect(dry).connect(env);
    env.connect(out);
    tones[tones.length - 1]?.addEventListener('ended', () => {
      mix.disconnect();
      env.disconnect();
    });
  }
  setTimeout(() => out.disconnect(), (end - ctx.currentTime + 0.5) * 1000);
  return end;
}
