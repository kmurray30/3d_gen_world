import type { World } from '../shared/types';
import { Engine } from '../shared/engine/index';
import { resolveStepsLocally } from '../shared/engine/resolve-local';
import { DevConsole } from './ui/dev-console';
import { starterWorld } from '../shared/engine/presets';
import { defaultSprite } from '../shared/engine/sizing';
import { SceneView } from './render/scene';
import { DesktopInput } from './input/desktop';
import { TouchInput } from './input/touch';
import { PlayerController } from './app/player';
import { Hud } from './ui/hud';

declare global {
  interface Window {
    __game?: { world: World; engine: Engine; scene: SceneView; player: PlayerController };
  }
}

export function startApp(canvas: HTMLCanvasElement, hudRoot: HTMLElement): void {
  const coarse = isTouchFirst();
  const world = starterWorld('local', (_word, kind) => defaultSprite(kind));
  const engine = new Engine(world, Date.now() & 0xffff);
  const scene = new SceneView(canvas);
  const player = new PlayerController(engine.world.player);
  const hud = new Hud(hudRoot, {
    onCommand: (text) => hud.toast(`"${text}" (commands arrive in the next milestone)`),
  });
  engine.on((ev) => {
    if (ev.type === 'say') hud.toast(ev.id ? `${engine.world.get(ev.id)?.label ?? ev.id}: ${ev.text}` : ev.text, 'say', ev.dur * 1000);
    if (ev.type === 'warn') hud.toast(ev.msg, 'error');
  });
  if (new URLSearchParams(location.search).get('dev') === '1') {
    new DevConsole(hudRoot, (steps) => engine.run(resolveStepsLocally(steps)));
  }

  const desktop = new DesktopInput(canvas);
  const touch = coarse ? new TouchInput(canvas, hudRoot) : null;
  if (!coarse) {
    hud.showLockOverlay(true);
    hud.setHint('WASD to walk, Shift to run, Space to jump, / to type');
    desktop.onLockChange = (locked) => hud.showLockOverlay(!locked && !document.activeElement?.matches('input'));
    desktop.onLockError = () => hud.toast('Could not capture the mouse. Click the scene again.', 'error');
    desktop.onRequestCommand = () => {
      hud.showLockOverlay(false);
      hud.focusInput();
    };
    hud.input.addEventListener('blur', () => hud.showLockOverlay(!desktop.locked));
  } else {
    hud.setHint('Left thumb: walk. Right thumb: look. Tap a thing to name it.');
  }

  if (touch) {
    touch.onTap = (x, y) => {
      const id = scene.pick((x / window.innerWidth) * 2 - 1, -(y / window.innerHeight) * 2 + 1);
      const e = id ? engine.world.get(id) : undefined;
      hud.setTarget(e ? e.label : null);
    };
  }

  let last = performance.now();
  let paused = false;
  document.addEventListener('visibilitychange', () => {
    paused = document.hidden;
    last = performance.now();
  });

  const loop = (now: number) => {
    requestAnimationFrame(loop);
    if (paused) return;
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    const move = touch ? touch.moveAxis() : desktop.moveAxis();
    const look = touch ? touch.consumeLook() : desktop.consumeLook();
    player.update(dt, move, look, touch ? 0.005 : 0.0022, desktop.sprint, desktop.consumeJump());
    if (!coarse) {
      const id = desktop.locked ? scene.pick(0, 0) : null;
      const e = id ? engine.world.get(id) : undefined;
      hud.setTarget(e ? e.label : null);
    }
    engine.update(dt);
    scene.sync(engine.world);
    scene.render(engine.world.player);
  };
  requestAnimationFrame(loop);
  window.__game = { world, engine, scene, player };
}

/** Phones and tablets: coarse pointer, or touch points without hover. Touch laptops keep desktop controls. */
function isTouchFirst(): boolean {
  if (matchMedia('(pointer: coarse)').matches) return true;
  return navigator.maxTouchPoints > 0 && !matchMedia('(hover: hover)').matches;
}
