import { z } from 'zod';
import type { Kind, SpriteRef } from './types';

/* ----- primitives the model emits ----- */

export const REL = ['at', 'near', 'front', 'behind', 'left', 'right', 'on', 'above', 'away', 'offscreen', 'far', 'random'] as const;
export const DIST = ['touch', 'close', 'near', 'far'] as const;
export const HEIGHT = ['ground', 'low', 'high', 'sky'] as const;
export const SPEED = ['slow', 'walk', 'run', 'fly', 'instant'] as const;
export const STYLE = ['walk', 'hop', 'slide', 'fly'] as const;
export const ANIM = ['hop', 'wobble', 'shake', 'spin', 'bounce', 'nod', 'fall_over', 'pulse'] as const;
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

export const ActionSchema = z.discriminatedUnion('op', [
  SpawnSchema,
  MoveSchema,
  SetSchema,
  AnimSchema,
  AttachSchema,
  DropSchema,
  RemoveSchema,
  SaySchema,
  EffectSchema,
  WaitSchema,
]);
export const ParSchema = z.object({ op: z.literal('par'), do: z.array(ActionSchema).min(1).max(MAX_PAR) });
export const StepSchema = z.union([ActionSchema, ParSchema]);

export type SpawnAction = z.infer<typeof SpawnSchema>;
export type MoveAction = z.infer<typeof MoveSchema>;
export type SetAction = z.infer<typeof SetSchema>;
export type AnimAction = z.infer<typeof AnimSchema>;
export type AttachAction = z.infer<typeof AttachSchema>;
export type DropAction = z.infer<typeof DropSchema>;
export type RemoveAction = z.infer<typeof RemoveSchema>;
export type SayAction = z.infer<typeof SaySchema>;
export type EffectAction = z.infer<typeof EffectSchema>;
export type WaitAction = z.infer<typeof WaitSchema>;
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
export type ResolvedSet = SetAction & { res?: WordResolution };
export type ResolvedAction = Exclude<Action, SpawnAction | SetAction> | ResolvedSpawn | ResolvedSet;
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
