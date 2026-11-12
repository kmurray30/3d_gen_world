/**
 * The moving pieces of a structure as the world talks about them: its joints (a mailbox door, a bin lid, a
 * well's bucket), a house's door, its windows and shutters. Each has two states and the entity's state says
 * which one it is in: `open_<name>` is true in the second one (a building's first door keeps its old `door_open`).
 */
import type { Entity } from '../types';
import type { Joint, Part, Structure } from './types';

export interface Mover {
  /** What it is called: door, flag, lid, bucket, window_2, shutters_1. */
  name: string;
  /** The state key, true in its second state. */
  key: string;
  states: [string, string];
  /** A name that reaches several at once ("windows", "shutters"). */
  group?: string;
}

/** Windows on a structure, as part indices in part order: decals with the window role (or the window drawing). */
export function windowParts(s: Structure): number[] {
  const out: number[] = [];
  s.parts.forEach((p, i) => {
    if (p.t === 'decal' && (p.role === 'window' || (!p.role && /(^|\/)window\.webp$/.test(p.sprite.file ?? '')))) out.push(i);
  });
  return out;
}

/** Doors drawn on a structure (a house's, a tower's), as part indices in part order. */
export function doorParts(s: Structure): number[] {
  const out: number[] = [];
  s.parts.forEach((p, i) => {
    if (p.t === 'decal' && p.role === 'door') out.push(i);
  });
  return out;
}

/** A drawn door's name and state key: the first is "door" (with the old `door_open`), then door_1, door_2... */
export function doorMover(n: number, count: number): Mover {
  const name = n === 0 ? 'door' : `door_${n}`;
  return { name, key: n === 0 ? 'door_open' : stateKey(name), states: ['closed', 'open'], ...(count > 1 ? { group: 'doors' } : {}) };
}

export function movers(s: Structure): Mover[] {
  const out: Mover[] = [];
  for (const j of s.joints ?? []) if (!j.follow) out.push({ name: j.id, key: stateKey(j.id), states: j.states, ...(j.group ? { group: j.group } : {}) });
  // each drawn door opens on its own (a lighthouse's tower door and its cottage door are two)
  if (!out.some((m) => m.name === 'door')) {
    const doors = doorParts(s);
    doors.forEach((_, n) => out.push(doorMover(n, doors.length)));
  }
  windowParts(s).forEach((_, n) => out.push({ name: `window_${n}`, key: stateKey(`window_${n}`), states: ['closed', 'open'], group: 'windows' }));
  return out;
}

export function stateKey(name: string): string {
  return `open_${name}`;
}

/** Whether a joint is in its second state (followers take their leader's). */
export function jointOn(e: Pick<Entity, 'state'>, j: Joint): boolean {
  return e.state[stateKey(j.follow ?? j.id)] === true;
}

function words(name: string): string[] {
  return name
    .toLowerCase()
    .replace(/\b(the|a|an|its|his|her|their)\b/g, ' ')
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

/** The movers a name reaches: one by its name, every one in a group ("windows", "the shutters"), or by a word in it ("front door"). */
export function findMovers(s: Structure, name: string): Mover[] {
  const all = movers(s);
  const w = words(name);
  if (!w.length) return [];
  const joined = w.join('_');
  const exact = all.filter((m) => m.name === joined);
  if (exact.length) return exact;
  const singular = (x: string) => x.replace(/s$/, '');
  for (const word of [joined, ...[...w].reverse()]) {
    // "windows" reaches every window, "window" the first one
    const plural = /s$/.test(word);
    const group = all.filter((m) => m.group && singular(m.group) === singular(word));
    if (group.length && plural) return group;
    const named = all.filter((m) => singular(m.name) === singular(word) || singular(m.name.replace(/_\d+$/, '')) === singular(word));
    if (named.length) return named.length > 1 && !plural ? [named[0]] : named;
    if (group.length) return [group[0]];
  }
  // a lamp's light, a fountain's water, a mailbox's flag: some words name what a joint does
  const alias: Record<string, string[]> = { lamp: ['light', 'lantern', 'bulb'], water: ['fountain', 'spray', 'jet', 'jets'], lid: ['top', 'cover'], bucket: ['rope', 'winch', 'crank'] };
  for (const m of all) if (w.some((x) => alias[m.name]?.includes(x))) return [m];
  return [];
}

export function moverState(e: Pick<Entity, 'state'>, m: Mover): 0 | 1 {
  return e.state[m.key] === true ? 1 : 0;
}

const SYNONYMS: string[][] = [
  ['open', 'opened', 'ajar', 'unshut'],
  ['closed', 'close', 'shut', 'shuts', 'closes'],
  ['up', 'raise', 'raised', 'lift', 'lifted', 'hoist', 'pull up'],
  ['down', 'lower', 'lowered', 'drop', 'dropped', 'let down'],
  ['on', 'start', 'started', 'lit', 'light', 'running', 'run', 'flow', 'flowing', 'turn on', 'switch on'],
  ['off', 'stop', 'stopped', 'out', 'dark', 'turn off', 'switch off', 'put out'],
];

function sameWord(a: string, b: string): boolean {
  if (a === b) return true;
  return SYNONYMS.some((g) => g.includes(a) && g.includes(b));
}

/**
 * The state a word asks a mover for: one of its own state names or a word meaning one, "toggle" (or nothing)
 * for the other one. Null when it means neither ("open" asked of a lamp).
 */
export function wantedState(m: Mover, to: string | undefined, current: 0 | 1): 0 | 1 | null {
  const t = (to ?? 'toggle').trim().toLowerCase();
  if (!t || t === 'toggle' || t === 'switch' || t === 'flip') return current ? 0 : 1;
  for (const i of [0, 1] as const) if (sameWord(t, m.states[i])) return i;
  return null;
}

/** What comes off a structure on its own: its named parts ("roof", "chimney", "door", "lantern"). */
export function pieceNames(s: Structure): string[] {
  return [...new Set(s.parts.flatMap((p) => (p.name ? [p.name] : [])))];
}

/** The piece name a phrase asks for ("the roof", "his chimney", "front door"), if the structure has it. */
export function findPieceName(s: Structure, name: string): string | undefined {
  const w = words(name);
  const names = new Set(pieceNames(s));
  const joined = w.join('_');
  if (names.has(joined)) return joined;
  for (const x of [...w].reverse()) {
    if (names.has(x)) return x;
    if (names.has(x.replace(/s$/, ''))) return x.replace(/s$/, '');
  }
  return undefined;
}

/** The parts a piece takes off with it, by part index. */
export function pieceParts(s: Structure, name: string): number[] {
  const want = findPieceName(s, name);
  if (!want) return [];
  const out: number[] = [];
  s.parts.forEach((p: Part, i) => {
    if (p.name === want) out.push(i);
  });
  return out;
}

/** One line about a structure's parts for the model: "door (closed), windows (2 of 6 open), roof, chimney". */
export function describeParts(e: Pick<Entity, 'state'> & { structure?: Structure }): string[] {
  const s = e.structure;
  if (!s) return [];
  const out: string[] = [];
  const groups = new Map<string, Mover[]>();
  for (const m of movers(s)) {
    if (m.group) groups.set(m.group, [...(groups.get(m.group) ?? []), m]);
    else out.push(`${m.name} (${m.states[moverState(e, m)]})`);
  }
  for (const [g, ms] of groups) {
    const on = ms.filter((m) => moverState(e, m) === 1).length;
    const [a, b] = ms[0].states;
    out.push(on === 0 ? `${g} (${a})` : on === ms.length ? `${g} (${b})` : `${g} (${on} of ${ms.length} ${b})`);
  }
  const moving = new Set(out.map((x) => x.split(' ')[0]));
  for (const n of pieceNames(s)) if (!moving.has(n)) out.push(n);
  for (const k of Object.keys(e.state)) if (k.startsWith('off_') && e.state[k] === true) out.push(`${k.slice(4)} (off)`);
  return out;
}
