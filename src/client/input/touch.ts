/**
 * Touch controls: a virtual joystick appears where the left-side finger lands; dragging on the right side looks around.
 * Both pointers are tracked by pointerId so they work simultaneously. A short tap on the right side is a "tap" (targeting).
 */
export class TouchInput {
  private joyId: number | null = null;
  private joyOrigin = { x: 0, y: 0 };
  private axis: [number, number] = [0, 0];
  private lookId: number | null = null;
  private last = { x: 0, y: 0 };
  private start = { x: 0, y: 0, t: 0 };
  private dx = 0;
  private dy = 0;
  private readonly base: HTMLDivElement;
  private readonly knob: HTMLDivElement;
  readonly radius = 56;
  onTap?: (x: number, y: number) => void;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    hud: HTMLElement,
  ) {
    this.base = document.createElement('div');
    this.base.className = 'joy';
    this.knob = document.createElement('div');
    this.knob.className = 'joy-knob';
    this.base.appendChild(this.knob);
    this.base.style.display = 'none';
    hud.appendChild(this.base);

    canvas.addEventListener('pointerdown', (e) => this.down(e));
    canvas.addEventListener('pointermove', (e) => this.move(e));
    canvas.addEventListener('pointerup', (e) => this.up(e));
    canvas.addEventListener('pointercancel', (e) => this.up(e));
    canvas.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  private down(e: PointerEvent): void {
    if (e.pointerType === 'mouse') return;
    this.canvas.setPointerCapture?.(e.pointerId);
    const leftSide = e.clientX < window.innerWidth * 0.45;
    if (leftSide && this.joyId === null) {
      this.joyId = e.pointerId;
      this.joyOrigin = { x: e.clientX, y: e.clientY };
      this.axis = [0, 0];
      this.base.style.display = 'block';
      this.base.style.left = `${e.clientX - 60}px`;
      this.base.style.top = `${e.clientY - 60}px`;
      this.knob.style.transform = 'translate(0px, 0px)';
    } else if (this.lookId === null) {
      this.lookId = e.pointerId;
      this.last = { x: e.clientX, y: e.clientY };
      this.start = { x: e.clientX, y: e.clientY, t: performance.now() };
    }
  }

  private move(e: PointerEvent): void {
    if (e.pointerId === this.joyId) {
      let vx = e.clientX - this.joyOrigin.x;
      let vy = e.clientY - this.joyOrigin.y;
      const len = Math.hypot(vx, vy);
      if (len > this.radius) {
        vx = (vx / len) * this.radius;
        vy = (vy / len) * this.radius;
      }
      this.knob.style.transform = `translate(${vx}px, ${vy}px)`;
      const dead = 6;
      const mag = Math.max(0, len - dead) / (this.radius - dead);
      const n = len > 0 ? Math.min(1, mag) / len : 0;
      this.axis = [vx * n, -vy * n];
    } else if (e.pointerId === this.lookId) {
      this.dx += e.clientX - this.last.x;
      this.dy += e.clientY - this.last.y;
      this.last = { x: e.clientX, y: e.clientY };
    }
  }

  private up(e: PointerEvent): void {
    if (e.pointerId === this.joyId) {
      this.joyId = null;
      this.axis = [0, 0];
      this.base.style.display = 'none';
    } else if (e.pointerId === this.lookId) {
      const moved = Math.hypot(e.clientX - this.start.x, e.clientY - this.start.y);
      if (moved < 10 && performance.now() - this.start.t < 300) this.onTap?.(e.clientX, e.clientY);
      this.lookId = null;
    }
  }

  moveAxis(): [number, number] {
    return this.axis;
  }

  consumeLook(): [number, number] {
    const r: [number, number] = [this.dx, this.dy];
    this.dx = 0;
    this.dy = 0;
    return r;
  }
}
