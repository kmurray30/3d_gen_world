/**
 * The act lab: run a catalog figure's act in the real engine, headless, and look at it. Shared by the checker
 * (does every act run, and does it do something) and the preview tools (frames of the act, people for scale).
 */
import fs from 'node:fs';
import path from 'node:path';
import { addEntries } from '../../src/shared/figure/catalog/registry';
import type { CatalogEntry } from '../../src/shared/figure/catalog/types';
import { registerFigure } from '../../src/shared/figure/items';
import type { Figure } from '../../src/shared/figure/types';
import { Engine } from '../../src/shared/engine/index';
import { figureOfEntity } from '../../src/shared/engine/transform';
import { partOverrides, restFacing } from '../../src/shared/figure/pose';
import { sculpt, type Sculpt } from '../../src/shared/figure/sculpt';
import type { Entity, World } from '../../src/shared/types';
import type { Step } from '../../src/shared/schema';

const DIR = path.resolve('src/shared/figure/catalog');

/** Load one chunk (its entries come back), then every other chunk that loads right now (spawned words resolve
 *  through them; a chunk another author is halfway through editing is skipped). */
export async function loadChunks(target: string): Promise<CatalogEntry[]> {
  const mine = ((await import(path.join(DIR, `${target}.ts`))) as { ENTRIES?: CatalogEntry[]; EXAMPLES?: CatalogEntry[] });
  const list = mine.ENTRIES ?? mine.EXAMPLES ?? [];
  addEntries(list);
  for (const f of fs.readdirSync(DIR)) {
    if (!f.endsWith('.ts') || ['types.ts', 'index.ts', 'registry.ts', 'examples.ts', `${target}.ts`].includes(f)) continue;
    try {
      addEntries(((await import(path.join(DIR, f))) as { ENTRIES?: CatalogEntry[] }).ENTRIES ?? []);
    } catch {
      // someone is mid-edit; their words just won't resolve for spawns this run
    }
  }
  return list;
}

export const LAB_ID = 'it';

function entityFor(fig: Figure): Entity {
  return {
    id: LAB_ID,
    word: fig.key,
    label: fig.key,
    sprite: { file: null, w: 1, h: 1 },
    pos: [0, 0, 0],
    flip: false,
    scale: 1,
    heightM: fig.heightM,
    tilt: 0,
    state: {},
    effects: [],
    kind: fig.rig === 'biped' ? 'human' : fig.rig === 'prop' ? 'object' : 'animal',
    solid: false,
    massClass: 'light',
    huge: false,
    createdAt: 0,
    yaw: 0,
  };
}

export interface ActRun {
  engine: Engine;
  /** What happened, as short lines ("say: Ding!", "spawn bread", "pose lever"). */
  events: string[];
  /** Per click entry: how many things happened, and how long it ran in seconds. */
  clicks: Array<{ events: number; seconds: number }>;
  setupEvents: number;
}

/**
 * Run the setup, then every click entry in turn, each to the end (up to 15 s). `frame(engine, label, t)` is
 * called at `perClick` evenly spaced moments of each click (and once after setup).
 */
export function runAct(fig: Figure, perClick = 0, frame?: (engine: Engine, label: string) => void): ActRun {
  registerFigure(fig);
  const world: World = { slug: 'lab', rev: 1, player: { pos: [0, 0, Math.max(4, fig.halfD * 3 + 3)], yaw: 0, pitch: 0 }, entities: [entityFor(fig)], createdAt: 0 };
  const engine = new Engine(world, 7);
  engine.idle.enabled = false;
  const events: string[] = [];
  engine.on((ev) => {
    if (ev.type === 'say') events.push(`say: ${ev.text}`);
    else if (ev.type === 'stateChange' && /^(op|lit|off)_/.test(ev.key)) events.push(`state ${ev.key}=${ev.value}`);
    else if (ev.type === 'spawn' || ev.type === 'remove' || ev.type === 'morph' || ev.type === 'attach' || ev.type === 'pose' || ev.type === 'anim' || ev.type === 'effect')
      events.push(`${ev.type} ${'part' in ev ? ev.part : 'word' in ev ? ev.word : 'name' in ev ? ev.name : ev.id}`);
  });
  const until = (id: string, max: number): number => {
    let t = 0;
    let done = false;
    const off = engine.on((ev) => {
      if (ev.type === 'scriptDone' && ev.id === id) done = true;
    });
    while (!done && t < max) {
      engine.update(0.05);
      t += 0.05;
    }
    // let things it set going (a door swinging, a piece falling) settle
    for (let k = 0; k < 16; k++) engine.update(0.05);
    off();
    return t;
  };
  const e = () => engine.world.get(LAB_ID)!;
  let setupEvents = 0;
  if (fig.act?.setup?.length) {
    const n0 = events.length;
    engine.run(engine.prepareAct(e(), fig.act.setup), 'lab_setup');
    until('lab_setup', 15);
    setupEvents = events.length - n0;
    e().state.act_setup = true;
  }
  if (frame) frame(engine, 'start');
  const clicks: ActRun['clicks'] = [];
  (fig.act?.click ?? []).forEach((steps: Step[], i) => {
    const n0 = events.length;
    const id = `lab_click_${i}`;
    engine.run(engine.prepareAct(e(), steps), id);
    if (frame && perClick > 0) {
      // sample the click at even moments: first find its length on a copy of time, then replay is not possible,
      // so take frames as it runs, every `gap` seconds
      let t = 0;
      let done = false;
      const off = engine.on((ev) => {
        if (ev.type === 'scriptDone' && ev.id === id) done = true;
      });
      const gap = 0.6;
      let next = gap;
      let taken = 0;
      while (!done && t < 15) {
        engine.update(0.05);
        t += 0.05;
        if (t >= next && taken < perClick - 1) {
          frame(engine, `${i + 1}.${++taken}`);
          next += gap;
        }
      }
      for (let k = 0; k < 16; k++) engine.update(0.05);
      off();
      frame(engine, `${i + 1} end`);
      clicks.push({ events: events.length - n0, seconds: t });
    } else {
      const secs = until(id, 15);
      clicks.push({ events: events.length - n0, seconds: secs });
    }
  });
  return { engine, events, clicks, setupEvents };
}

/** Everything near the lab thing right now as one model (the thing posed, plus what it spawned, holds or dropped),
 *  in the thing's frame: for preview frames. */
export function sceneSculpt(engine: Engine, detail = 0.55): Sculpt | null {
  const focus = engine.world.get(LAB_ID);
  if (!focus) return null;
  const fp = engine.world.worldPos(focus);
  const parts: Array<{ s: Sculpt; pos: [number, number, number]; yaw: number; k: number }> = [];
  for (const ent of engine.world.list()) {
    if (ent.hidden) continue;
    const fig = figureOfEntity(ent);
    if (!fig) continue;
    const p = engine.world.renderPos(ent);
    if (Math.hypot(p[0] - fp[0], p[2] - fp[2]) > 12) continue;
    const o = partOverrides(ent, engine.time, fig);
    try {
      const s = sculpt(fig, { preview: true, detail, pose: { j: o.j, t: o.t, sc: o.sc } });
      parts.push({ s, pos: [p[0] - fp[0], p[1] - fp[1], p[2] - fp[2]], yaw: restFacing(ent, fig), k: ent.scale });
    } catch (err) {
      // a figure that does not sculpt is reported by the checker
      if (process.env.LAB_DEBUG) console.error('sceneSculpt', ent.id, ent.word, (err as Error).message);
    }
  }
  return parts.length ? merge(parts) : null;
}

/** A figure with a person beside it for scale (1.7 m), as one model. */
export function withPerson(model: Sculpt, fig: Figure, person: Sculpt): Sculpt {
  const gap = Math.max(0.3, fig.halfW + 0.45);
  return merge([
    { s: model, pos: [0, 0, 0], yaw: 0, k: 1 },
    { s: person, pos: [gap + 0.25, 0, 0], yaw: 0, k: 1 },
  ]);
}

function merge(list: Array<{ s: Sculpt; pos: [number, number, number]; yaw: number; k: number }>): Sculpt {
  const nv = list.reduce((n, x) => n + x.s.positions.length / 3, 0);
  const ni = list.reduce((n, x) => n + x.s.indices.length, 0);
  const positions = new Float32Array(nv * 3), normals = new Float32Array(nv * 3), colors = new Float32Array(nv * 3);
  const indices = new Uint32Array(ni);
  let v0 = 0, i0 = 0;
  for (const { s, pos, yaw, k } of list) {
    const a = (yaw * Math.PI) / 180, c = Math.cos(a), sn = Math.sin(a);
    const n = s.positions.length / 3;
    for (let v = 0; v < n; v++) {
      const x = s.positions[v * 3] * k, y = s.positions[v * 3 + 1] * k, z = s.positions[v * 3 + 2] * k;
      positions[(v0 + v) * 3] = x * c + z * sn + pos[0];
      positions[(v0 + v) * 3 + 1] = y + pos[1];
      positions[(v0 + v) * 3 + 2] = -x * sn + z * c + pos[2];
      const nx = s.normals[v * 3], ny = s.normals[v * 3 + 1], nz = s.normals[v * 3 + 2];
      normals[(v0 + v) * 3] = nx * c + nz * sn;
      normals[(v0 + v) * 3 + 1] = ny;
      normals[(v0 + v) * 3 + 2] = -nx * sn + nz * c;
    }
    colors.set(s.colors, v0 * 3);
    for (let i = 0; i < s.indices.length; i++) indices[i0 + i] = s.indices[i] + v0;
    v0 += n;
    i0 += s.indices.length;
  }
  return { positions, normals, colors, indices, skinIndex: new Uint16Array(nv * 4), skinWeight: new Float32Array(nv * 4), bones: [], separate: [], cell: list[0].s.cell };
}
