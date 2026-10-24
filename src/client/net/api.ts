import type { CompactWorld, StreamEvent } from '../../shared/schema';
import type { WorldModel } from '../../shared/engine/world';
import { renderHeight } from '../../shared/engine/sizing';

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

/** What the model gets to see: the nearest entities with rounded positions, no coordinates for the model to copy. */
export function compactWorld(model: WorldModel, target?: string, limit = 40): CompactWorld {
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
    }));
  return { player: { pos: [r1(p[0]), r1(p[1] - model.ground(p[0], p[2])), r1(p[2])], yaw: Math.round(model.player.yaw * 100) / 100 }, target, entities };
}
