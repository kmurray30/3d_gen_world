import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import type { World } from '../shared/types';

export interface CommandLog {
  slug: string;
  text: string;
  steps: number;
  ms: number;
  model: string;
  errors: string[];
}

/** SQLite via node:sqlite (no native build step). One file, WAL mode, opened at startup. */
export class Db {
  private readonly db: DatabaseSync;

  constructor(file: string) {
    if (file !== ':memory:') fs.mkdirSync(path.dirname(file), { recursive: true });
    this.db = new DatabaseSync(file);
    this.db.exec(`
      PRAGMA journal_mode = WAL;
      PRAGMA synchronous = NORMAL;
      CREATE TABLE IF NOT EXISTS worlds (
        slug TEXT PRIMARY KEY,
        json TEXT NOT NULL,
        rev INTEGER NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS usage (day TEXT PRIMARY KEY, count INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS commands (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        slug TEXT NOT NULL,
        text TEXT NOT NULL,
        steps INTEGER NOT NULL,
        ms INTEGER NOT NULL,
        model TEXT NOT NULL,
        errors TEXT NOT NULL,
        created_at INTEGER NOT NULL
      );
    `);
  }

  getWorld(slug: string): World | null {
    const row = this.db.prepare('SELECT json FROM worlds WHERE slug = ?').get(slug) as { json: string } | undefined;
    return row ? (JSON.parse(row.json) as World) : null;
  }

  hasWorld(slug: string): boolean {
    return !!this.db.prepare('SELECT 1 FROM worlds WHERE slug = ?').get(slug);
  }

  createWorld(world: World): void {
    const now = Date.now();
    this.db
      .prepare('INSERT INTO worlds (slug, json, rev, created_at, updated_at) VALUES (?, ?, ?, ?, ?)')
      .run(world.slug, JSON.stringify(world), world.rev, now, now);
  }

  /** Store a newer revision. Returns the stored world on a conflict (incoming rev not newer), null on success. */
  saveWorld(world: World): World | null {
    const row = this.db.prepare('SELECT rev, json FROM worlds WHERE slug = ?').get(world.slug) as { rev: number; json: string } | undefined;
    if (!row) {
      this.createWorld(world);
      return null;
    }
    if (world.rev <= row.rev) return JSON.parse(row.json) as World;
    this.db.prepare('UPDATE worlds SET json = ?, rev = ?, updated_at = ? WHERE slug = ?').run(JSON.stringify(world), world.rev, Date.now(), world.slug);
    return null;
  }

  /** Overwrite regardless of revision (reset). */
  replaceWorld(world: World): void {
    this.db
      .prepare('INSERT INTO worlds (slug, json, rev, created_at, updated_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT(slug) DO UPDATE SET json = excluded.json, rev = excluded.rev, updated_at = excluded.updated_at')
      .run(world.slug, JSON.stringify(world), world.rev, world.createdAt, Date.now());
  }

  /** Increment today's command counter and return the new count. */
  bumpUsage(day = today()): number {
    this.db.prepare('INSERT INTO usage (day, count) VALUES (?, 1) ON CONFLICT(day) DO UPDATE SET count = count + 1').run(day);
    const row = this.db.prepare('SELECT count FROM usage WHERE day = ?').get(day) as { count: number };
    return row.count;
  }

  usage(day = today()): number {
    const row = this.db.prepare('SELECT count FROM usage WHERE day = ?').get(day) as { count: number } | undefined;
    return row?.count ?? 0;
  }

  logCommand(c: CommandLog): void {
    this.db
      .prepare('INSERT INTO commands (slug, text, steps, ms, model, errors, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(c.slug, c.text, c.steps, c.ms, c.model, JSON.stringify(c.errors), Date.now());
  }

  close(): void {
    this.db.close();
  }
}

export function today(): string {
  return new Date().toISOString().slice(0, 10);
}
