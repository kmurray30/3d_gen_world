/**
 * Rigs: how a drawing comes apart into paper pieces. Each rigged sprite ships a small JSON (this shape) made
 * offline by words_and_images/rig/, with every piece's exact pixel mask. Coordinates are fractions of the
 * drawing's width and height, origin top-left, as in the image; masks are in the drawing's pixels. The game
 * stamps the original picture through the masks at load time (it never reads pixels back), so the drawing
 * itself is unchanged.
 */
import { z } from 'zod';

export const PIECE_KINDS = [
  'body', 'head', 'hair', 'hat', 'arm', 'hand', 'leg', 'foot', 'tail', 'ear', 'wing', 'eye', 'pupil', 'brow',
  'mouth', 'accessory', 'held', 'wheel', 'clock_hand', 'door', 'lid', 'blade', 'other',
] as const;
export type PieceKind = (typeof PIECE_KINDS)[number];

/** Face marks: drawn over the head; when they move or change, the paint under them shows `fill`. */
export const FACE_KINDS: readonly PieceKind[] = ['eye', 'pupil', 'brow', 'mouth'];

const pt = z.tuple([z.number(), z.number()]);

export const RigPieceSchema = z.object({
  id: z.string().min(1).max(32),
  kind: z.enum(PIECE_KINDS),
  parent: z.string().max(32).optional(),
  /** The joint the piece turns about. */
  pivot: pt,
  /** Draw order relative to the parent: negative tucks behind it (limbs hide their cut ends behind the body). */
  z: z.number(),
  /** x0, y0, x1, y1. */
  bbox: z.tuple([z.number(), z.number(), z.number(), z.number()]),
  /** Image-left or image-right one of a pair (arms, legs, eyes). */
  side: z.enum(['l', 'r']).optional(),
  /** What the piece becomes when it comes off (a hat lies on the ground as "hat"). */
  detach: z.string().max(40).optional(),
  /** Face marks: the colour under them. */
  fill: z.string().max(9).optional(),
  /** Turns on its own: radians per second (windmill blades, clock hands). */
  spin: z.number().optional(),
  /** Doors and lids: how far they swing open, degrees (sign gives the direction). */
  open: z.number().optional(),
  /** The pixels the piece's card shows: their rectangle x0, y0, x1, y1 (exclusive) and `encodeMask` runs. */
  rect: z.tuple([z.number().int(), z.number().int(), z.number().int(), z.number().int()]),
  mask: z.string(),
});
export type RigPiece = z.infer<typeof RigPieceSchema>;

export const RigSchema = z.object({
  v: z.literal(2),
  file: z.string(),
  /** Size of the drawing in pixels, the masks' frame. */
  w: z.number().int().positive(),
  h: z.number().int().positive(),
  /** front: people facing out; side: animals in profile (they face image-left as drawn). */
  view: z.enum(['front', 'side', 'three-quarter']),
  pieces: z.array(RigPieceSchema).min(1).max(64),
  /** Where a mouth goes when the drawing has none of its own: x, y, width (fractions). */
  mouth_at: z.tuple([z.number(), z.number(), z.number()]).optional(),
});
export type Rig = z.infer<typeof RigSchema>;

/**
 * A piece's mask as a w x h grid over its rect (1 = shown). The encoding is base64 of 7-bit varints: per row
 * the number of runs, then each run's gap from the last run's end (or the rect's left edge) and its length.
 */
export function decodeMask(mask: string, rect: readonly [number, number, number, number]): Uint8Array {
  const w = Math.max(1, rect[2] - rect[0]);
  const h = Math.max(1, rect[3] - rect[1]);
  const out = new Uint8Array(w * h);
  const bin = atob(mask);
  let at = 0;
  const next = (): number => {
    let v = 0;
    let shift = 0;
    for (;;) {
      const b = bin.charCodeAt(at++);
      if (Number.isNaN(b)) return 0;
      v |= (b & 0x7f) << shift;
      if (b < 0x80) return v;
      shift += 7;
    }
  };
  for (let y = 0; y < h && at < bin.length; y++) {
    const runs = next();
    let x = 0;
    for (let r = 0; r < runs; r++) {
      x += next();
      const len = next();
      out.fill(1, y * w + Math.min(w, x), y * w + Math.min(w, x + len));
      x += len;
    }
  }
  return out;
}

/** The order pieces must be built in: every parent before its children. Unknown parents hang from the root. */
export function rigOrder(rig: Rig): RigPiece[] {
  const byId = new Map(rig.pieces.map((p) => [p.id, p]));
  const out: RigPiece[] = [];
  const seen = new Set<string>();
  const visit = (p: RigPiece, depth = 0) => {
    if (seen.has(p.id) || depth > 64) return;
    const parent = p.parent ? byId.get(p.parent) : undefined;
    if (parent && parent !== p) visit(parent, depth + 1);
    seen.add(p.id);
    out.push(p);
  };
  for (const p of rig.pieces) visit(p);
  return out;
}

/** Pieces that can come off, by the word they become (and the piece id). */
export function detachables(rig: Rig): Array<{ id: string; word: string }> {
  return rig.pieces.filter((p) => p.detach).map((p) => ({ id: p.id, word: p.detach! }));
}

/**
 * The piece a part name means: an exact id ("arm_r"), a kind ("hat", "tail"), or a kind with a side word.
 * "Left" and "right" are the character's own: someone drawn facing out has their left hand on the image's right.
 */
export function findPiece(rig: Rig, part: string): RigPiece | undefined {
  const name = part.toLowerCase().trim().replace(/\s+/g, '_');
  const exact = rig.pieces.find((p) => p.id === name);
  if (exact) return exact;
  const own = /(^|_)left(_|$)/.test(name) ? 'left' : /(^|_)right(_|$)/.test(name) ? 'right' : undefined;
  const mirrored = rig.view === 'front';
  const side = own === 'left' ? (mirrored ? 'r' : 'l') : own === 'right' ? (mirrored ? 'l' : 'r') : undefined;
  const bare = name.replace(/(^|_)(left|right)(_|$)/g, '').replace(/^_+|_+$/g, '').replace(/s$/, '');
  const kinds = rig.pieces.filter((p) => p.kind === bare || p.detach === bare || p.id.startsWith(bare));
  return kinds.find((p) => !side || p.side === side) ?? kinds[0];
}
