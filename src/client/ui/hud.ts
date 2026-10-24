export interface HudHandlers {
  onCommand: (text: string) => void;
  onUndo?: () => void;
  onReset?: () => void;
  onShare?: () => void;
  onWorlds?: () => void;
  /** View toolbar: cycle first/third/free, cycle the camera angle, toggle wall fading. */
  onView?: () => void;
  onAngle?: () => void;
  onWalls?: () => void;
  onTime?: () => void;
}

export interface ViewLabels {
  view: string;
  angle: string;
  walls: string;
  time: string;
}

/** DOM overlay: command bar, hint, top bar with menu, target label, toasts, desktop pointer-lock overlay. */
export class Hud {
  readonly root: HTMLElement;
  readonly input: HTMLInputElement;
  private readonly form: HTMLFormElement;
  private readonly button: HTMLButtonElement;
  private readonly hint: HTMLDivElement;
  private readonly target: HTMLDivElement;
  private readonly toasts: HTMLDivElement;
  private readonly lockOverlay: HTMLDivElement;
  private readonly menu: HTMLDivElement;
  private readonly status: HTMLDivElement;
  private readonly viewbar: HTMLDivElement;

  constructor(root: HTMLElement, handlers: HudHandlers) {
    this.root = root;
    root.innerHTML = `
      <div class="topbar">
        <div class="brand" title="Worlds">Paper World</div>
        <div class="status" aria-live="polite"></div>
        <button class="menu-btn" type="button" aria-label="Menu">&#8943;</button>
        <div class="menu" hidden>
          <button type="button" data-act="worlds">Worlds...</button>
          <button type="button" data-act="undo">Undo last command</button>
          <button type="button" data-act="reset">Reset world</button>
          <button type="button" data-act="share">Copy share link</button>
        </div>
      </div>
      <div class="viewbar">
        <button type="button" data-view="view" title="Switch between first person, third person and a free camera (V)"><span class="k">View</span><span class="v"></span></button>
        <button type="button" data-view="angle" title="Cycle the camera angle: behind, high, bird, top (R)"><span class="k">Angle</span><span class="v"></span></button>
        <button type="button" data-view="walls" title="Fade walls that hide you (B)"><span class="k">Walls</span><span class="v"></span></button>
        <button type="button" data-view="time" title="Time of day: dawn, day, sunset, night (T)"><span class="k">Time</span><span class="v"></span></button>
      </div>
      <div class="target-label" hidden></div>
      <div class="toasts"></div>
      <div class="lock-overlay" hidden><div class="card">Click to look around<br><small>WASD to walk, / to type, Tab frees the mouse</small></div></div>
      <div class="cmdbar">
        <div class="hint"></div>
        <form class="cmd" autocomplete="off">
          <input type="text" name="command" maxlength="200" placeholder="Say what happens... (e.g. a dog walks up to me)"
                 autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="send" />
          <button type="submit">Go</button>
        </form>
      </div>`;
    this.form = root.querySelector('form.cmd')!;
    this.input = this.form.querySelector('input')!;
    this.button = this.form.querySelector('button')!;
    this.hint = root.querySelector('.hint')!;
    this.target = root.querySelector('.target-label')!;
    this.toasts = root.querySelector('.toasts')!;
    this.lockOverlay = root.querySelector('.lock-overlay')!;
    this.menu = root.querySelector('.menu')!;
    this.status = root.querySelector('.status')!;

    this.form.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = this.input.value.trim();
      if (!text) return;
      this.input.value = '';
      this.input.blur();
      handlers.onCommand(text);
    });
    this.input.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.input.blur();
      e.stopPropagation();
    });
    const brand = root.querySelector('.brand') as HTMLElement;
    brand.setAttribute('role', 'button');
    brand.addEventListener('click', () => handlers.onWorlds?.());
    root.querySelector('.menu-btn')!.addEventListener('click', () => {
      this.menu.hidden = !this.menu.hidden;
    });
    this.menu.addEventListener('click', (e) => {
      const act = (e.target as HTMLElement).dataset.act;
      this.menu.hidden = true;
      if (act === 'undo') handlers.onUndo?.();
      if (act === 'reset') handlers.onReset?.();
      if (act === 'share') handlers.onShare?.();
      if (act === 'worlds') handlers.onWorlds?.();
    });
    document.addEventListener('pointerdown', (e) => {
      if (!this.menu.hidden && !(e.target as HTMLElement).closest('.topbar')) this.menu.hidden = true;
    });
    this.viewbar = root.querySelector('.viewbar')!;
    this.viewbar.addEventListener('click', (e) => {
      const act = (e.target as HTMLElement).closest('button')?.dataset.view;
      if (act === 'view') handlers.onView?.();
      if (act === 'angle') handlers.onAngle?.();
      if (act === 'walls') handlers.onWalls?.();
      if (act === 'time') handlers.onTime?.();
      (e.target as HTMLElement).closest('button')?.blur();
    });
    // Keep the command bar above the on-screen keyboard.
    const vv = window.visualViewport;
    if (vv) {
      const place = () => {
        const bottomGap = window.innerHeight - (vv.height + vv.offsetTop);
        (root.querySelector('.cmdbar') as HTMLElement).style.bottom = `${Math.max(0, bottomGap)}px`;
      };
      vv.addEventListener('resize', place);
      vv.addEventListener('scroll', place);
    }
  }

  focusInput(): void {
    this.input.focus();
  }

  setHint(text: string): void {
    this.hint.textContent = text;
  }

  setStatus(text: string): void {
    this.status.textContent = text;
  }

  setViewLabels(labels: ViewLabels): void {
    for (const [key, value] of Object.entries(labels)) {
      const el = this.viewbar.querySelector(`button[data-view="${key}"] .v`);
      if (el) el.textContent = value;
    }
  }

  setBusy(busy: boolean): void {
    this.button.disabled = busy;
    this.button.textContent = busy ? '...' : 'Go';
  }

  showLockOverlay(show: boolean): void {
    this.lockOverlay.hidden = !show;
  }

  setTarget(label: string | null): void {
    if (!label) {
      this.target.hidden = true;
      return;
    }
    this.target.textContent = label;
    this.target.hidden = false;
  }

  /** Modal passcode prompt; resolves once `verify` accepts a code. */
  askPasscode(verify: (code: string) => Promise<boolean>): Promise<void> {
    return new Promise((resolve) => {
      const modal = document.createElement('div');
      modal.className = 'modal';
      modal.innerHTML = `<form class="card passform"><h2>Paper World</h2><p>This world is private. Enter the passcode to play.</p>
        <input type="password" name="passcode" autocomplete="current-password" placeholder="passcode" />
        <button type="submit">Enter</button><div class="passerr"></div></form>`;
      this.root.appendChild(modal);
      const form = modal.querySelector('form')!;
      const input = modal.querySelector('input')!;
      const err = modal.querySelector('.passerr')!;
      input.addEventListener('keydown', (e) => e.stopPropagation());
      setTimeout(() => input.focus(), 50);
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        err.textContent = '';
        const ok = await verify(input.value).catch(() => false);
        if (ok) {
          modal.remove();
          resolve();
        } else {
          err.textContent = 'That is not it. Try again.';
          input.select();
        }
      });
    });
  }

  toast(text: string, kind: 'info' | 'error' | 'say' = 'info', ms = 3500): void {
    const el = document.createElement('div');
    el.className = `toast ${kind}`;
    el.textContent = text;
    this.toasts.appendChild(el);
    requestAnimationFrame(() => el.classList.add('show'));
    setTimeout(() => {
      el.classList.remove('show');
      setTimeout(() => el.remove(), 300);
    }, ms);
  }
}
