/** Keyboard + pointer-lock mouse look for desktop. */
export class DesktopInput {
  private keys = new Set<string>();
  private dx = 0;
  private dy = 0;
  private skipNextMove = false;
  private jumpQueued = false;
  locked = false;
  onLockChange?: (locked: boolean) => void;
  onLockError?: () => void;
  onRequestCommand?: () => void;
  /** Click while the pointer is free: return true to consume it (an interaction) instead of locking the pointer. */
  onFreeClick?: (x: number, y: number) => boolean;
  /** Click while the pointer is locked: interact with whatever the crosshair is on. */
  onLockedClick?: () => void;
  /** Single-press hotkeys (view, angle, walls...) by key code. */
  onHotkey?: (code: string) => void;

  constructor(private readonly canvas: HTMLCanvasElement) {
    window.addEventListener('keydown', (e) => {
      if (isTyping()) return;
      if (e.code === 'Slash' || e.code === 'Enter') {
        e.preventDefault();
        if (this.locked) document.exitPointerLock();
        this.onRequestCommand?.();
        return;
      }
      if (e.code === 'Tab' || e.code === 'AltLeft' || e.code === 'AltRight') {
        // give the mouse back without Esc (which some browsers also use to leave fullscreen)
        if (this.locked) {
          e.preventDefault();
          document.exitPointerLock();
        }
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        if (!this.keys.has('Space')) this.jumpQueued = true;
      }
      if (!e.repeat && !e.metaKey && !e.ctrlKey && !e.altKey) this.onHotkey?.(e.code);
      this.keys.add(e.code);
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
    window.addEventListener('blur', () => this.keys.clear());
    canvas.addEventListener('click', (e) => {
      if (isTyping()) return;
      if (this.locked) {
        this.onLockedClick?.();
        return;
      }
      if (matchMedia('(pointer: coarse)').matches) return;
      if (this.onFreeClick?.(e.clientX, e.clientY)) return;
      canvas.requestPointerLock?.();
    });
    document.addEventListener('pointerlockchange', () => {
      this.locked = document.pointerLockElement === canvas;
      this.skipNextMove = true;
      this.onLockChange?.(this.locked);
    });
    document.addEventListener('pointerlockerror', () => this.onLockError?.());
    window.addEventListener('mousemove', (e) => {
      if (!this.locked) return;
      if (this.skipNextMove) {
        this.skipNextMove = false;
        return;
      }
      this.dx += clamp(e.movementX, -200, 200);
      this.dy += clamp(e.movementY, -200, 200);
    });
  }

  /** [strafe, forward] in -1..1 */
  moveAxis(): [number, number] {
    if (isTyping()) return [0, 0];
    const k = this.keys;
    const x = (k.has('KeyD') || k.has('ArrowRight') ? 1 : 0) - (k.has('KeyA') || k.has('ArrowLeft') ? 1 : 0);
    const y = (k.has('KeyW') || k.has('ArrowUp') ? 1 : 0) - (k.has('KeyS') || k.has('ArrowDown') ? 1 : 0);
    return [x, y];
  }

  /** Free camera: Space rises, C (or Ctrl) sinks. */
  get upAxis(): number {
    if (isTyping()) return 0;
    return (this.keys.has('Space') ? 1 : 0) - (this.keys.has('KeyC') || this.keys.has('ControlLeft') ? 1 : 0);
  }

  get sprint(): boolean {
    return this.keys.has('ShiftLeft') || this.keys.has('ShiftRight');
  }

  consumeJump(): boolean {
    const j = this.jumpQueued;
    this.jumpQueued = false;
    return j && !isTyping();
  }

  consumeLook(): [number, number] {
    const r: [number, number] = [this.dx, this.dy];
    this.dx = 0;
    this.dy = 0;
    return r;
  }
}

export function isTyping(): boolean {
  const el = document.activeElement as HTMLElement | null;
  return !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}
