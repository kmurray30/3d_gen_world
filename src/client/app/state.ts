import type { World } from '../../shared/types';
import type { Engine } from '../../shared/engine/index';

const UNDO_MAX = 20;
const UNDO_SESSION_MAX = 8;
const SETTLE_MS = 1000;
const MAX_INTERVAL_MS = 10000;

export interface StoreEvents {
  onSaved?: () => void;
  onConflict?: () => void;
  onError?: (msg: string) => void;
}

/** Which world to open: the slug from /w/<slug>, or a new one. */
export async function openWorld(): Promise<{ world: World; created: boolean }> {
  const m = /^\/w\/([a-z0-9][a-z0-9-]{2,63})$/i.exec(location.pathname);
  if (m) {
    const r = await fetch(`/api/worlds/${m[1].toLowerCase()}`);
    if (r.ok) return { world: ((await r.json()) as { world: World }).world, created: false };
    if (r.status !== 404) throw new Error(`could not load the world (${r.status})`);
  }
  const r = await fetch('/api/worlds', { method: 'POST' });
  if (!r.ok) throw new Error(`could not create a world (${r.status})`);
  const { slug, world } = (await r.json()) as { slug: string; world: World };
  history.replaceState(null, '', `/w/${slug}${location.search}`);
  return { world, created: true };
}

/** Saves the engine's world to the server when it changes, with undo and reset. */
export class WorldStore {
  private rev: number;
  private dirtyAt = 0;
  private lastSave = Date.now();
  private saving = false;
  private undoStack: World[] = [];
  private lastPlayerPos: [number, number, number];
  readonly slug: string;

  constructor(
    private readonly engine: Engine,
    world: World,
    private readonly events: StoreEvents = {},
  ) {
    this.slug = world.slug;
    this.rev = world.rev;
    this.lastPlayerPos = [...world.player.pos];
    try {
      const raw = sessionStorage.getItem(`undo:${this.slug}`);
      if (raw) this.undoStack = JSON.parse(raw) as World[];
    } catch {
      /* ignore */
    }
    engine.on((ev) => {
      if (['spawn', 'remove', 'morph', 'attach', 'stateChange', 'arrive', 'land', 'scriptDone'].includes(ev.type)) this.markDirty();
    });
    window.addEventListener('pagehide', () => void this.save(true, true));
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) void this.save(false, true);
    });
  }

  markDirty(): void {
    if (!this.dirtyAt) this.dirtyAt = Date.now();
  }

  get canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  /** Call once per frame. */
  tick(now = Date.now()): void {
    const p = this.engine.world.player.pos;
    if (Math.hypot(p[0] - this.lastPlayerPos[0], p[2] - this.lastPlayerPos[2]) > 0.5 && now - this.lastSave > MAX_INTERVAL_MS) this.markDirty();
    if (!this.dirtyAt || this.saving) return;
    const settled = !this.engine.busy && now - this.dirtyAt > SETTLE_MS;
    if (settled || now - this.lastSave > MAX_INTERVAL_MS) void this.save();
  }

  /** Snapshot before a command so it can be undone. */
  pushUndo(): void {
    this.undoStack.push(this.engine.snapshot());
    if (this.undoStack.length > UNDO_MAX) this.undoStack.shift();
    try {
      sessionStorage.setItem(`undo:${this.slug}`, JSON.stringify(this.undoStack.slice(-UNDO_SESSION_MAX)));
    } catch {
      /* quota */
    }
  }

  async undo(): Promise<boolean> {
    const snap = this.undoStack.pop();
    if (!snap) return false;
    this.engine.cancelAll();
    this.engine.world.load(snap);
    try {
      sessionStorage.setItem(`undo:${this.slug}`, JSON.stringify(this.undoStack.slice(-UNDO_SESSION_MAX)));
    } catch {
      /* quota */
    }
    await this.save(true);
    return true;
  }

  async reset(): Promise<void> {
    this.pushUndo();
    const r = await fetch(`/api/worlds/${this.slug}/reset`, { method: 'POST' });
    if (!r.ok) {
      this.events.onError?.(`could not reset (${r.status})`);
      return;
    }
    const { world } = (await r.json()) as { world: World };
    this.engine.cancelAll();
    this.engine.world.load(world);
    this.rev = world.rev;
    this.dirtyAt = 0;
    this.lastSave = Date.now();
  }

  async save(force = false, keepalive = false): Promise<void> {
    if (this.saving || (!force && !this.dirtyAt)) return;
    this.saving = true;
    const world = this.engine.snapshot();
    world.rev = this.rev + 1;
    this.dirtyAt = 0;
    try {
      const r = await fetch(`/api/worlds/${this.slug}`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ world }),
        keepalive,
      });
      if (r.status === 409) {
        const { world: theirs } = (await r.json()) as { world: World };
        this.engine.cancelAll();
        this.engine.world.load(theirs);
        this.rev = theirs.rev;
        this.events.onConflict?.();
      } else if (!r.ok) {
        this.events.onError?.(`save failed (${r.status})`);
        this.markDirty();
      } else {
        this.rev = world.rev;
        this.engine.world.rev = world.rev;
        this.lastPlayerPos = [...world.player.pos];
        this.events.onSaved?.();
      }
      this.lastSave = Date.now();
    } catch {
      this.markDirty();
    } finally {
      this.saving = false;
    }
  }
}
