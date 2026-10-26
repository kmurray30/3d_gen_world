import { EXPRESSIONS, GESTURES, type Gesture } from './gestures';
import { z } from 'zod';
import type { Kind, SpriteRef } from './types';
import type { Structure } from './structure/types';
import { CUSTOM_AT, CUSTOM_SHAPES, MAX_CUSTOM_PARTS } from './structure/gen/custom';

/* ----- primitives the model emits ----- */

export const REL = ['at', 'near', 'front', 'behind', 'left', 'right', 'on', 'above', 'away', 'offscreen', 'far', 'random'] as const;
export const DIST = ['touch', 'close', 'near', 'far'] as const;
export const HEIGHT = ['ground', 'low', 'high', 'sky'] as const;
export const SPEED = ['slow', 'walk', 'run', 'fly', 'instant'] as const;
export const STYLE = ['walk', 'hop', 'slide', 'fly'] as const;
/** Whole-body moves, then gestures (rigged drawings act these out with their own pieces). */
export const ANIM = ['hop', 'wobble', 'shake', 'spin', 'bounce', 'fall_over', 'pulse', ...(GESTURES as [Gesture, ...Gesture[]])] as const;
export const REMOVE_HOW = ['pop', 'fade', 'sink', 'fly_away', 'explode'] as const;
export const EFFECTS = ['fire', 'smoke', 'steam', 'rain', 'water_spray', 'sparkle', 'explosion', 'snow', 'hearts', 'dust'] as const;

export const MAX_STEPS = 40;
export const MAX_PAR = 10;

const num = (lo: number, hi: number, def?: number) => {
  const base = z.coerce.number().transform((v) => (Number.isFinite(v) ? Math.max(lo, Math.min(hi, v)) : (def ?? lo)));
  return base;
};
const delay = num(0, 20).optional();
const dur = num(0, 20).optional();
const id = z.string().trim().min(1).max(64);
const text = z.string().trim().min(1).max(120);

const PlaceObject = z.object({
  rel: z.enum(REL).catch('near'),
  of: z.string().trim().min(1).max(64).catch('player'),
  dist: z.enum(DIST).optional().catch(undefined),
  height: z.enum(HEIGHT).catch('ground'),
});
/** A place; a bare string is read as a relation name ("front") or as a target id ("house_1" -> near house_1). */
export const PlaceSchema = z.preprocess((v) => {
  if (typeof v === 'string') {
    const t = v.trim();
    if ((REL as readonly string[]).includes(t)) return { rel: t };
    if (t === 'player' || t === 'me') return { rel: 'near', of: 'player' };
    return { rel: 'near', of: t };
  }
  if (v && typeof v === 'object' && 'of' in v && (v as { of: unknown }).of === 'me') return { ...(v as object), of: 'player' };
  return v;
}, PlaceObject);
export type Place = z.infer<typeof PlaceSchema>;
export const DEFAULT_PLACE: Place = { rel: 'near', of: 'player', height: 'ground' };

export const SpawnSchema = z.object({
  op: z.literal('spawn'),
  ref: id,
  word: z.string().trim().min(1).max(60),
  alt: z.array(z.string().trim().min(1).max(60)).max(5).optional(),
  at: PlaceSchema.catch(DEFAULT_PLACE),
  face: z.string().trim().max(64).optional(),
  scale: num(0.2, 5, 1).optional(),
  delay,
});
const dim = num(0.1, 30).optional();
export const CustomPartSchema = z.object({
  name: z.string().trim().max(24).optional(),
  shape: z.enum(CUSTOM_SHAPES).catch('box'),
  w: dim,
  d: dim,
  h: dim,
  r: dim,
  sides: num(3, 24).optional(),
  mat: z.string().trim().max(24).optional(),
  color: z.string().trim().max(24).optional(),
  on: z.string().trim().max(24).optional(),
  at: z.enum(CUSTOM_AT).optional().catch(undefined),
  dx: num(-30, 30).optional(),
  dz: num(-30, 30).optional(),
  rot: num(-360, 360).optional(),
  lean: z.tuple([num(-5, 5), num(-5, 5)]).optional().catch(undefined),
  noInk: z.boolean().optional(),
});
/** Build a structure: a generator with parameters, or a custom parts list laid out by relation. */
export const BuildSchema = z.object({
  op: z.literal('build'),
  ref: id,
  word: z.string().trim().min(1).max(60),
  at: PlaceSchema.catch(DEFAULT_PLACE),
  gen: z.string().trim().max(24).optional(),
  params: z.record(z.string().max(32), z.unknown()).optional(),
  parts: z.array(CustomPartSchema).max(MAX_CUSTOM_PARTS).optional(),
  delay,
});
export const MoveSchema = z.object({
  op: z.literal('move'),
  id,
  to: PlaceSchema.catch(DEFAULT_PLACE),
  speed: z.enum(SPEED).optional().catch(undefined),
  style: z.enum(STYLE).optional().catch(undefined),
  face: z.string().trim().max(64).optional(),
  delay,
});
export const SetSchema = z.object({
  op: z.literal('set'),
  id,
  word: z.string().trim().min(1).max(60).optional(),
  alt: z.array(z.string().trim().min(1).max(60)).max(5).optional(),
  scale: num(0.2, 5, 1).optional(),
  tilt: num(-180, 180, 0).optional(),
  face: z.string().trim().max(64).optional(),
  state: z.record(z.string().max(32), z.union([z.boolean(), z.number(), z.string().max(40)])).optional(),
  /** A face (eyebrows appear for the ones that need them); neutral is the drawing as drawn. */
  expression: z.enum(EXPRESSIONS).optional().catch(undefined),
  /** Buildings only: regenerate with these generator parameters changed (stories, roof, color, wallMat, w, d...). */
  params: z.record(z.string().max(32), z.unknown()).optional(),
  dur,
  delay,
});
export const AnimSchema = z.object({
  op: z.literal('anim'),
  id,
  name: z.enum(ANIM),
  times: num(1, 10, 1).optional(),
  delay,
});
export const AttachSchema = z.object({ op: z.literal('attach'), id, to: id, where: z.enum(['top', 'held']).optional().catch(undefined), delay });
export const DropSchema = z.object({ op: z.literal('drop'), id, delay });
/** A piece comes off and becomes its own thing (a hat knocked off, a wheel falling off); ref names the piece. */
export const DetachSchema = z.object({ op: z.literal('detach'), id, part: z.string().trim().min(1).max(32), ref: z.string().trim().min(1).max(32).optional(), delay });
/** A piece that came off goes back (id is the piece, or its owner with part). */
export const ReattachSchema = z.object({ op: z.literal('reattach'), id, part: z.string().trim().max(32).optional(), delay });
export const RemoveSchema = z.object({ op: z.literal('remove'), id, how: z.enum(REMOVE_HOW).optional().catch(undefined), delay });
export const SaySchema = z.object({ op: z.literal('say'), text, id: id.optional(), dur, delay });
export const EffectSchema = z.object({
  op: z.literal('effect'),
  name: z.enum(EFFECTS),
  id: id.optional(),
  at: PlaceSchema.optional(),
  dur,
  loop: z.boolean().optional(),
  delay,
});
export const WaitSchema = z.object({ op: z.literal('wait'), dur: num(0, 20, 1) });
export const SKY_TIMES = ['dawn', 'day', 'sunset', 'night'] as const;
/** Change the time of day. */
export const SkySchema = z.object({ op: z.literal('sky'), time: z.enum(SKY_TIMES).catch('day'), delay });

export const ActionSchema = z.discriminatedUnion('op', [
  SpawnSchema,
  BuildSchema,
  MoveSchema,
  SetSchema,
  AnimSchema,
  AttachSchema,
  DropSchema,
  DetachSchema,
  ReattachSchema,
  RemoveSchema,
  SaySchema,
  EffectSchema,
  WaitSchema,
  SkySchema,
]);
export const ParSchema = z.object({ op: z.literal('par'), do: z.array(ActionSchema).min(1).max(MAX_PAR) });
export const StepSchema = z.union([ActionSchema, ParSchema]);

export type SpawnAction = z.infer<typeof SpawnSchema>;
export type BuildAction = z.infer<typeof BuildSchema>;
export type CustomPart = z.infer<typeof CustomPartSchema>;
export type MoveAction = z.infer<typeof MoveSchema> & { /** engine-internal: exact destination (idle wandering) */ dest?: [number, number, number] };
export type SetAction = z.infer<typeof SetSchema>;
export type AnimAction = z.infer<typeof AnimSchema>;
export type DetachAction = z.infer<typeof DetachSchema>;
export type ReattachAction = z.infer<typeof ReattachSchema>;
export type AttachAction = z.infer<typeof AttachSchema>;
export type DropAction = z.infer<typeof DropSchema>;
export type RemoveAction = z.infer<typeof RemoveSchema>;
export type SayAction = z.infer<typeof SaySchema>;
export type EffectAction = z.infer<typeof EffectSchema>;
export type WaitAction = z.infer<typeof WaitSchema>;
export type SkyAction = z.infer<typeof SkySchema>;
export type Action = z.infer<typeof ActionSchema>;
export type ParStep = z.infer<typeof ParSchema>;
export type Step = z.infer<typeof StepSchema>;

/* ----- what the engine consumes: steps after the server allocated ids and resolved words ----- */

export interface WordResolution {
  word: string;
  sprite: SpriteRef;
  kind: Kind;
  heightM: number;
  solid: boolean;
  huge: boolean;
  /** true when the word was not in the vocabulary and the placeholder card is shown */
  placeholder: boolean;
}
export type ResolvedSpawn = Omit<SpawnAction, 'ref'> & { ref: string; id: string; res: WordResolution };
/** A build after the server ran the generator: the parts travel with the step, so the client never generates. */
export type ResolvedBuild = Pick<BuildAction, 'op' | 'word' | 'at' | 'delay'> & { ref: string; id: string; structure: Structure; label: string };
export type ResolvedSet = SetAction & { res?: WordResolution; structure?: Structure };
/** A detach after validation: `newId` is the id the piece will have in the world. */
export type ResolvedDetach = DetachAction & { newId: string };
export type ResolvedAction = Exclude<Action, SpawnAction | BuildAction | SetAction | MoveAction | DetachAction> | MoveAction | ResolvedSpawn | ResolvedBuild | ResolvedSet | ResolvedDetach;
export type ResolvedStep = ResolvedAction | { op: 'par'; do: ResolvedAction[] };

/* ----- stream protocol (server -> client), one JSON object per line ----- */
export type StreamEvent =
  | { t: 'meta'; commandId: string; model: string }
  | { t: 'step'; step: ResolvedStep }
  | { t: 'error'; msg: string }
  | { t: 'ping' }
  | { t: 'done'; steps: number; reason?: string };

/* ----- client -> server command request ----- */

export const CompactEntitySchema = z.object({
  id: z.string().max(64),
  word: z.string().max(60),
  kind: z.enum(['object', 'human', 'humanoid', 'animal', 'other']).catch('object'),
  /** metres, rounded */
  pos: z.tuple([z.number(), z.number(), z.number()]),
  h: z.number(),
  parent: z.string().max(64).optional(),
  state: z.record(z.string().max(32), z.union([z.boolean(), z.number(), z.string().max(40)])).optional(),
  effects: z.array(z.string().max(32)).max(8).optional(),
  /** Buildings: how they were generated, so a set with params can regenerate them. */
  structure: z.object({ gen: z.string().max(24), params: z.record(z.string().max(32), z.unknown()) }).optional(),
  /** Pieces it is made of that a command can name (hat, arm_r, tail...), and which have come off. */
  parts: z.array(z.string().max(32)).max(32).optional(),
  off: z.array(z.string().max(32)).max(32).optional(),
});
export const CompactWorldSchema = z.object({
  player: z.object({ pos: z.tuple([z.number(), z.number(), z.number()]), yaw: z.number() }),
  target: z.string().max(64).optional(),
  entities: z.array(CompactEntitySchema).max(200),
});
export type CompactEntity = z.infer<typeof CompactEntitySchema>;
export type CompactWorld = z.infer<typeof CompactWorldSchema>;

export const CommandRequestSchema = z.object({
  command: z.string().trim().min(1).max(200),
  context: CompactWorldSchema,
});
export type CommandRequest = z.infer<typeof CommandRequestSchema>;

export const ScriptRequestSchema = z.object({
  steps: z.array(z.unknown()).max(MAX_STEPS),
  context: CompactWorldSchema,
});
