export interface HudHandlers {
  onCommand: (text: string) => void;
  onUndo?: () => void;
  onReset?: () => void;
  onShare?: () => void;
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

  constructor(root: HTMLElement, handlers: HudHandlers) {
    this.root = root;
    root.innerHTML = `
      <div class="topbar">
        <div class="brand">Paper World</div>
        <div class="status" aria-live="polite"></div>
        <button class="menu-btn" type="button" aria-label="Menu">&#8943;</button>
        <div class="menu" hidden>
          <button type="button" data-act="undo">Undo last command</button>
          <button type="button" data-act="reset">Reset world</button>
          <button type="button" data-act="share">Copy share link</button>
        </div>
      </div>
      <div class="target-label" hidden></div>
      <div class="toasts"></div>
      <div class="lock-overlay" hidden><div class="card">Click to look around<br><small>WASD to walk, / to type</small></div></div>
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
    root.querySelector('.menu-btn')!.addEventListener('click', () => {
      this.menu.hidden = !this.menu.hidden;
    });
    this.menu.addEventListener('click', (e) => {
      const act = (e.target as HTMLElement).dataset.act;
      this.menu.hidden = true;
      if (act === 'undo') handlers.onUndo?.();
      if (act === 'reset') handlers.onReset?.();
      if (act === 'share') handlers.onShare?.();
    });
    document.addEventListener('pointerdown', (e) => {
      if (!this.menu.hidden && !(e.target as HTMLElement).closest('.topbar')) this.menu.hidden = true;
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
