import { figureFor } from '../../shared/figure/items';
import { FACE_KINDS, type Rig } from '../../shared/rig';
import type { CompactWorld, StreamEvent } from '../../shared/schema';
import type { WorldModel } from '../../shared/engine/world';
import { renderHeight } from '../../shared/engine/sizing';
import { describeParts } from '../../shared/structure/joints';
import type { Entity } from '../../shared/types';

export interface ClientConfig {
  spriteVersion: string;
  llm: string;
  needsPasscode: boolean;
  authed: boolean;
  /** The player's own cutout for third person; absent offline. */
  avatar?: { word: string; sprite: { file: string | null; w: number; h: number }; heightM: number };
}

export async function fetchConfig(): Promise<ClientConfig> {
  const r = await fetch('/api/config');
  if (!r.ok) throw new Error(`config ${r.status}`);
  return (await r.json()) as ClientConfig;
}

/** POST a JSON body and consume an NDJSON response line by line. */
export async function streamNdjson(url: string, body: unknown, onEvent: (ev: StreamEvent) => void, signal?: AbortSignal): Promise<void> {
  const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), signal });
  if (!res.ok || !res.body) {
    let msg = `${res.status}`;
    try {
      const j = (await res.json()) as { error?: string; detail?: string };
      msg = j.error ?? msg;
      if (j.detail) msg += `: ${j.detail}`;
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = '';
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let nl: number;
    while ((nl = buf.indexOf('\n')) >= 0) {
      const line = buf.slice(0, nl).trim();
      buf = buf.slice(nl + 1);
      if (!line) continue;
      try {
        onEvent(JSON.parse(line) as StreamEvent);
      } catch {
        /* skip malformed line */
      }
    }
  }
  if (buf.trim()) {
    try {
      onEvent(JSON.parse(buf) as StreamEvent);
    } catch {
      /* ignore */
    }
  }
}

/** The pieces of a rigged drawing a command can name: limbs, head, hat, tail, wheels... (not the face marks). */
function partsOf(rig: Rig | undefined): string[] | undefined {
  if (!rig) return undefined;
  const parts = rig.pieces.filter((p) => p.parent && !FACE_KINDS.includes(p.kind)).map((p) => p.id);
  return parts.length ? parts.slice(0, 32) : undefined;
}

/** A built thing's moving pieces with their states, and what can come off it: "door (closed)", "roof". */
function structureParts(e: Entity): string[] | undefined {
  const parts = describeParts(e).map((p) => p.slice(0, 32));
  return parts.length ? parts.slice(0, 32) : undefined;
}

/** What the model gets to see: the nearest entities with rounded positions, no coordinates for the model to copy. */
export function compactWorld(model: WorldModel, target?: string, limit = 40, rigOf: (file: string) => Rig | undefined = () => undefined): CompactWorld {
  const p = model.player.pos;
  const r1 = (v: number) => Math.round(v * 10) / 10;
  const entities = model
    .list()
    .map((e) => ({ e, pos: model.worldPos(e) }))
    .sort((a, b) => Math.hypot(a.pos[0] - p[0], a.pos[2] - p[2]) - Math.hypot(b.pos[0] - p[0], b.pos[2] - p[2]))
    .slice(0, limit)
    .map(({ e, pos }) => ({
      id: e.id,
      word: e.word,
      kind: e.kind,
      // height above the ground under it, so things on a hill are not reported as floating
      pos: [r1(pos[0]), r1(e.parent ? pos[1] : pos[1] - model.ground(pos[0], pos[2])), r1(pos[2])] as [number, number, number],
      h: r1(renderHeight(e)),
      parent: e.parent,
      state: Object.keys(e.state).length ? e.state : undefined,
      effects: e.effects.length ? e.effects : undefined,
      structure: e.structure ? { gen: e.structure.gen, params: e.structure.params } : undefined,
      parts: e.structure ? structureParts(e) : (figureBits(e)?.parts ?? partsOf(e.sprite.file ? rigOf(e.sprite.file) : undefined)),
      movers: figureBits(e)?.movers,
      sockets: figureBits(e)?.sockets,
    }));
  return { player: { pos: [r1(p[0]), r1(p[1] - model.ground(p[0], p[2])), r1(p[2])], yaw: Math.round(model.player.yaw * 100) / 100 }, target, entities };
}

/** A code-drawn thing's pieces that come off, moving parts with their kind and state, and sockets with their kind. */
function figureBits(e: Entity): { parts?: string[]; movers?: string[]; sockets?: string[] } | null {
  if (e.structure || e.look === 'sprite') return null;
  const fig = figureFor(e.word);
  if (!fig) return null;
  const parts = fig.parts.filter((p) => p.piece && p.parent).map((p) => p.name).slice(0, 32);
  const movers = fig.parts
    .filter((p) => p.mover)
    .map((p) => {
      const st = e.state[`op_${p.name}`];
      const on = typeof st === 'boolean' ? st : !!p.mover!.on;
      const words: Record<string, [string, string]> = { swing: ['open', 'closed'], spin: ['on', 'off'], slide: ['out', 'in'], light: ['on', 'off'] };
      return `${p.name} (${on ? words[p.mover!.kind][0] : words[p.mover!.kind][1]})`.slice(0, 32);
    })
    .slice(0, 16);
  const sockets = (fig.sockets ?? []).map((k) => `${k.name} (${k.kind})`.slice(0, 32)).slice(0, 12);
  return { ...(parts.length ? { parts } : {}), ...(movers.length ? { movers } : {}), ...(sockets.length ? { sockets } : {}) };
}
