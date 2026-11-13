/**
 * Every word as a thing to place in the town: its real size and footprint (from its code-drawn figure), the
 * venue it goes to and how it is shown there (its spot), after the tags are checked against what it really is
 * (a "shelf" thing two metres tall stands on the floor; a person is staff; a fish swims).
 */
import type { Kind } from '../types';
import type { Figure } from '../figure/types';
import { getFigure } from '../figure/items';
import { catalog } from '../figure/catalog/registry';
import { PLACES, type PlaceId, type Spot } from './places';

export interface TownWord {
  word: string;
  kind: Kind;
  /** Vocabulary height in metres (used when there is no figure). */
  hm: number;
}

export interface Tag {
  p: PlaceId[];
  s: Spot;
}

export interface TownItem {
  word: string;
  kind: Kind;
  venue: PlaceId;
  alts: PlaceId[];
  spot: Spot;
  fig: Figure | null;
  /** Shown size in metres: height, and the footprint along x and z when standing at yaw 0. */
  h: number;
  fx: number;
  fz: number;
  /** Display scale (1 = real size; less for things too big for a town, more for specks). */
  scale: number;
}

/** Anything bigger than this (a liner, a mountain) is shown as a smaller model of itself. */
export const MAX_SIZE_M = 80;
/** Specks (an ant, a grain of rice) are shown at least this big, or nobody would see them. */
export const MIN_SIZE_M = 0.03;
/** Models of huge things in the planetarium and the miniature park. */
const MODEL_SIZE_M: Partial<Record<PlaceId, number>> = { observatory: 2.4, miniature_park: 9, museum: 12, gallery: 4 };

const SMALL_SPOTS: Spot[] = ['shelf', 'table', 'case', 'rack', 'wall'];

function figureKind(f: Figure): Kind {
  return f.rig === 'biped' ? (f.group === 'fantasy' ? 'humanoid' : 'human') : f.rig === 'prop' ? 'object' : 'animal';
}

export function townItem(w: TownWord, tag: Tag | undefined): TownItem {
  const fig = getFigure(w.word);
  const kind = fig && w.kind === 'other' ? figureKind(fig) : w.kind;
  let h = fig ? fig.heightM : Math.max(0.05, w.hm || 0.5);
  let fx = fig ? 2 * (fig.view === 'side' ? fig.halfD : fig.halfW) : h * 0.7;
  let fz = fig ? 2 * (fig.view === 'side' ? fig.halfW : fig.halfD) : h * 0.5;
  fx = Math.max(0.03, fx);
  fz = Math.max(0.03, fz);
  const p = (tag?.p?.length ? tag.p : fallbackPlaces(kind, fig)).filter((x) => x in PLACES);
  const venue = p[0] ?? 'antique_shop';
  let spot: Spot = tag?.s ?? 'floor';
  // what it really is wins over its tag
  const big = Math.max(h, fx, fz);
  if (fig?.rig === 'biped' || kind === 'human' || kind === 'humanoid') spot = spot === 'pedestal' || spot === 'building' ? spot : 'person';
  else if (fig?.rig === 'fish' && spot !== 'sky' && spot !== 'shelf' && spot !== 'table' && spot !== 'case') spot = 'tank';
  if (SMALL_SPOTS.includes(spot) && (h > 1.25 || Math.max(fx, fz) > 1.7)) spot = 'floor';
  if (spot === 'pen' && kind !== 'animal') spot = 'floor';
  if (spot === 'parked' && big < 1) spot = 'table';
  if (spot === 'person' && kind === 'object') spot = 'floor';
  let scale = 1;
  const model = MODEL_SIZE_M[venue];
  if (model && big > model * 1.5 && (spot === 'pedestal' || venue === 'observatory' || venue === 'miniature_park')) scale = model / big;
  else if (big > MAX_SIZE_M) scale = MAX_SIZE_M / big;
  else if (big < MIN_SIZE_M) scale = MIN_SIZE_M / big;
  h *= scale;
  fx *= scale;
  fz *= scale;
  return { word: w.word, kind, venue, alts: p.slice(1), spot, fig, h, fx, fz, scale };
}

/**
 * The catalog's act-only props (the slices of bread a toaster starts with) as words of their own, so each also
 * stands alone somewhere in town: every thing at least once by itself.
 */
export function extraWords(vocab: Set<string>): TownWord[] {
  const out: TownWord[] = [];
  for (const [key, en] of catalog()) {
    if (!en.extra || vocab.has(key)) continue;
    const f = getFigure(key);
    if (f) out.push({ word: key, kind: figureKind(f), hm: f.heightM });
  }
  return out.sort((a, b) => a.word.localeCompare(b.word));
}

/** A word nobody tagged still goes somewhere sensible. */
function fallbackPlaces(kind: Kind, fig: Figure | null): PlaceId[] {
  if (kind === 'human' || kind === 'humanoid') return ['street'];
  if (kind === 'animal') return fig?.rig === 'fish' ? ['aquarium'] : fig?.rig === 'bird' ? ['zoo'] : ['zoo'];
  if (kind === 'other') return ['gallery'];
  return ['antique_shop'];
}

/** How many things one venue holds before the town gets a second one of it. */
export function venueCapacity(place: PlaceId): number {
  const k = PLACES[place].kind;
  return k === 'shop' ? 150 : k === 'hall' ? 220 : k === 'house' ? 1e9 : k === 'street' || k === 'sky' ? 1e9 : 260;
}

/**
 * Every item's final venue: its first choice, unless that venue is full, in which case the first of its other
 * choices with room; a venue with more than it can hold even then becomes several (two grocery stores).
 * Returns items grouped by venue instance id ("grocery", "grocery#2").
 */
export function assignVenues(items: TownItem[]): Map<string, { place: PlaceId; items: TownItem[] }> {
  const count = new Map<PlaceId, number>();
  for (const it of items) count.set(it.venue, (count.get(it.venue) ?? 0) + 1);
  // move overflow to a fallback that has room, biggest overflows first
  const order = [...items].sort((a, b) => a.word.localeCompare(b.word));
  for (const it of order) {
    const cap = venueCapacity(it.venue);
    if ((count.get(it.venue) ?? 0) <= cap) continue;
    // only to another real venue: rooms, backyards, the street and the sky are laid out elsewhere
    const alt = it.alts.find((a) => ['shop', 'hall', 'lot', 'open'].includes(PLACES[a].kind) && (count.get(a) ?? 0) < venueCapacity(a) * 0.9);
    if (!alt) continue;
    count.set(it.venue, count.get(it.venue)! - 1);
    count.set(alt, (count.get(alt) ?? 0) + 1);
    it.venue = alt;
  }
  const out = new Map<string, { place: PlaceId; items: TownItem[] }>();
  const byPlace = new Map<PlaceId, TownItem[]>();
  for (const it of order) byPlace.set(it.venue, [...(byPlace.get(it.venue) ?? []), it]);
  for (const [place, list] of byPlace) {
    const cap = venueCapacity(place);
    const n = Math.max(1, Math.ceil(list.length / cap));
    // keep similar things together across branches: sort by spot then word
    const sorted = [...list].sort((a, b) => a.spot.localeCompare(b.spot) || a.word.localeCompare(b.word));
    for (let i = 0; i < n; i++) {
      const part = sorted.filter((_, k) => k % n === i);
      out.set(i === 0 ? place : `${place}#${i + 1}`, { place, items: part });
    }
  }
  return out;
}
