import { displayName, forgetWorld, listWorlds, parseWorldRef, prettySlug, renameWorld, timeAgo, worldExists } from '../app/worlds';

export interface WorldsPanelHandlers {
  onNew: () => Promise<void>;
  onOpen: (slug: string) => Promise<void>;
}

/** Modal listing the worlds this device has opened, with New world and Open-by-link. */
export class WorldsPanel {
  private el: HTMLDivElement | null = null;

  constructor(
    private readonly root: HTMLElement,
    private readonly currentSlug: string,
    private readonly handlers: WorldsPanelHandlers,
  ) {}

  get isOpen(): boolean {
    return !!this.el;
  }

  close(): void {
    this.el?.remove();
    this.el = null;
  }

  open(): void {
    if (this.el) return;
    if (document.pointerLockElement) document.exitPointerLock();
    const el = document.createElement('div');
    el.className = 'modal';
    el.innerHTML = `<div class="card worlds">
      <div class="worlds-head"><h2>Worlds</h2><button type="button" class="x" aria-label="Close">&times;</button></div>
      <button type="button" class="primary new-world">+ New world</button>
      <div class="world-list"></div>
      <form class="open-form" autocomplete="off">
        <input type="text" name="ref" placeholder="Open a world: paste a link or name" autocapitalize="off" autocorrect="off" spellcheck="false" />
        <button type="submit">Open</button>
      </form>
      <div class="worlds-msg" aria-live="polite"></div>
      <p class="worlds-note">Worlds you open are remembered on this device. Anyone with a world's link can open it, so share links carefully.</p>
    </div>`;
    this.root.appendChild(el);
    this.el = el;
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.close();
      e.stopPropagation();
    });
    el.addEventListener('pointerdown', (e) => {
      if (e.target === el) this.close();
    });
    el.querySelector('.x')!.addEventListener('click', () => this.close());
    const msg = el.querySelector('.worlds-msg') as HTMLDivElement;
    const say = (t: string) => (msg.textContent = t);

    const busy = async (label: string, fn: () => Promise<void>) => {
      say(label);
      try {
        await fn();
      } catch (e) {
        say((e as Error).message);
      }
    };

    el.querySelector('.new-world')!.addEventListener('click', () => void busy('Creating a world...', () => this.handlers.onNew()));
    el.querySelector('.open-form')!.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = (e.target as HTMLFormElement).elements.namedItem('ref') as HTMLInputElement;
      const slug = parseWorldRef(input.value);
      if (!slug) return say('That does not look like a world link or name.');
      if (slug === this.currentSlug) return say('You are already in that world.');
      void busy('Looking for it...', async () => {
        if (!(await worldExists(slug))) throw new Error('No world with that link. Check it and try again.');
        await this.handlers.onOpen(slug);
      });
    });
    this.renderList(el.querySelector('.world-list')!, say, busy);
  }

  private renderList(list: Element, say: (t: string) => void, busy: (label: string, fn: () => Promise<void>) => Promise<void>): void {
    list.innerHTML = '';
    const worlds = listWorlds();
    if (!worlds.some((w) => w.slug === this.currentSlug)) worlds.unshift({ slug: this.currentSlug, visited: Date.now() });
    for (const w of worlds) {
      const current = w.slug === this.currentSlug;
      const row = document.createElement('div');
      row.className = `world-row${current ? ' current' : ''}`;
      const pretty = prettySlug(w.slug);
      row.innerHTML = `<button type="button" class="world-open" ${current ? 'disabled' : ''}>
          <span class="world-name"></span>
          <span class="world-meta"></span>
        </button>
        <button type="button" class="icon copy" title="Copy link" aria-label="Copy link">&#128279;</button>
        <button type="button" class="icon rename" title="Rename" aria-label="Rename">&#9998;</button>
        ${current ? '' : '<button type="button" class="icon forget" title="Forget" aria-label="Forget">&times;</button>'}`;
      (row.querySelector('.world-name') as HTMLElement).textContent = displayName(w);
      const bits = [current ? 'you are here' : timeAgo(w.visited)];
      if (pretty.tag && !w.name) bits.push(`#${pretty.tag}`);
      else if (w.name) bits.push(w.slug);
      if (w.entities !== undefined) bits.push(`${w.entities} things`);
      (row.querySelector('.world-meta') as HTMLElement).textContent = bits.join(' - ');
      row.querySelector('.world-open')!.addEventListener('click', () => void busy('Opening...', () => this.handlers.onOpen(w.slug)));
      row.querySelector('.copy')!.addEventListener('click', async () => {
        const url = `${location.origin}/w/${w.slug}`;
        try {
          await navigator.clipboard.writeText(url);
          say('Link copied.');
        } catch {
          say(url);
        }
      });
      row.querySelector('.rename')!.addEventListener('click', () => {
        const next = window.prompt('Name this world (only you see the name):', w.name ?? displayName(w));
        if (next === null) return;
        renameWorld(w.slug, next);
        this.renderList(list, say, busy);
      });
      row.querySelector('.forget')?.addEventListener('click', () => {
        forgetWorld(w.slug);
        this.renderList(list, say, busy);
        say('Removed from this list. The world itself is not deleted.');
      });
      list.appendChild(row);
    }
  }
}
