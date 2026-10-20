/**
 * Worlds this device has opened. There are no accounts, so the list lives in localStorage; the link (/w/<slug>)
 * is the real key and works anywhere. Pure helpers here are unit tested; the network helpers are thin.
 */
export interface KnownWorld {
  slug: string;
  /** Local nickname; the slug is used when unset. */
  name?: string;
  /** ms since epoch of the last visit. */
  visited: number;
  entities?: number;
}

const KEY = 'pw.worlds';
const MAX_KNOWN = 50;
export const SLUG_RE = /^[a-z0-9][a-z0-9-]{2,63}$/;

let memory: KnownWorld[] = [];

function read(): KnownWorld[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return memory;
    const arr = JSON.parse(raw) as KnownWorld[];
    return Array.isArray(arr) ? arr.filter((w) => w && SLUG_RE.test(w.slug)) : [];
  } catch {
    return memory;
  }
}

function write(list: KnownWorld[]): void {
  memory = list;
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* private mode or quota: the in-memory copy still works for this page */
  }
}

/** Most recently visited first. */
export function listWorlds(): KnownWorld[] {
  return [...read()].sort((a, b) => b.visited - a.visited);
}

export function lastWorld(): string | null {
  return listWorlds()[0]?.slug ?? null;
}

export function recordVisit(slug: string, entities?: number, now = Date.now()): void {
  if (!SLUG_RE.test(slug)) return;
  const list = read().filter((w) => w.slug !== slug);
  const prev = read().find((w) => w.slug === slug);
  list.push({ ...prev, slug, visited: now, entities: entities ?? prev?.entities });
  list.sort((a, b) => b.visited - a.visited);
  write(list.slice(0, MAX_KNOWN));
}

export function renameWorld(slug: string, name: string): void {
  const clean = name.trim().slice(0, 40);
  write(read().map((w) => (w.slug === slug ? { ...w, name: clean || undefined } : w)));
}

export function forgetWorld(slug: string): void {
  write(read().filter((w) => w.slug !== slug));
}

/** Accepts a full link, a /w/ path or a bare slug. Returns the slug or null. */
export function parseWorldRef(input: string): string | null {
  const t = input.trim();
  if (!t) return null;
  const fromPath = /\/w\/([a-z0-9][a-z0-9-]{2,63})(?:[/?#]|$)/i.exec(t);
  const slug = (fromPath ? fromPath[1] : t).toLowerCase();
  return SLUG_RE.test(slug) ? slug : null;
}

/** "sunny-meadow-1234" -> { title: "Sunny meadow", tag: "1234" } */
export function prettySlug(slug: string): { title: string; tag: string } {
  const m = /^(.*?)-(\d{3,5})$/.exec(slug);
  const words = (m ? m[1] : slug).replace(/-/g, ' ');
  return { title: words.charAt(0).toUpperCase() + words.slice(1), tag: m ? m[2] : '' };
}

export function displayName(w: Pick<KnownWorld, 'slug' | 'name'>): string {
  return w.name || prettySlug(w.slug).title;
}

export function timeAgo(ms: number, now = Date.now()): string {
  const s = Math.max(0, Math.round((now - ms) / 1000));
  if (s < 45) return 'just now';
  if (s < 3600) return `${Math.round(s / 60)} min ago`;
  if (s < 86400) return `${Math.round(s / 3600)} h ago`;
  return `${Math.round(s / 86400)} d ago`;
}

/* ---- network ---- */

export async function worldExists(slug: string): Promise<boolean> {
  const r = await fetch(`/api/worlds/${slug}`);
  if (r.status === 404) return false;
  if (!r.ok) throw new Error(`could not check that world (${r.status})`);
  return true;
}

export async function createWorld(): Promise<string> {
  const r = await fetch('/api/worlds', { method: 'POST' });
  if (!r.ok) throw new Error(`could not create a world (${r.status})`);
  return ((await r.json()) as { slug: string }).slug;
}

/** Full page navigation: the cleanest way to swap worlds (fresh engine, scene and undo history). */
export function goToWorld(slug: string, fresh = false): void {
  if (fresh) {
    try {
      sessionStorage.setItem('pw.fresh', slug);
    } catch {
      /* ignore */
    }
  }
  const params = new URLSearchParams(location.search);
  params.delete('new');
  const qs = params.toString();
  location.assign(`/w/${slug}${qs ? `?${qs}` : ''}`);
}

export function takeFreshFlag(slug: string): boolean {
  try {
    const hit = sessionStorage.getItem('pw.fresh') === slug;
    if (hit) sessionStorage.removeItem('pw.fresh');
    return hit;
  } catch {
    return false;
  }
}
