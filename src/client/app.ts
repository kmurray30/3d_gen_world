import type { World } from '../shared/types';
import { Engine } from '../shared/engine/index';
import { resolveStepsLocally } from '../shared/engine/resolve-local';
import { DevConsole } from './ui/dev-console';
import { compactWorld, fetchConfig, streamNdjson } from './net/api';
import { WorldStore, openWorld } from './app/state';
import type { Step } from '../shared/schema';
import { starterWorld } from '../shared/engine/presets';
import { defaultSprite } from '../shared/engine/sizing';
import { SceneView } from './render/scene';
import { DesktopInput } from './input/desktop';
import { TouchInput } from './input/touch';
import { PlayerController } from './app/player';
import { Hud } from './ui/hud';

declare global {
  interface Window {
    __game?: { world: World; engine: Engine; scene: SceneView; player: PlayerController; store: WorldStore };
  }
}

export async function startApp(canvas: HTMLCanvasElement, hudRoot: HTMLElement): Promise<void> {
  const coarse = isTouchFirst();
  const hud = new Hud(hudRoot, {
    onCommand: (text) => void onCommand(text),
    onUndo: () => void onUndo(),
    onReset: () => void onReset(),
    onShare: () => void onShare(),
  });
  const config = await fetchConfig().catch(() => ({ spriteVersion: 'dev', llm: 'offline', needsPasscode: false, authed: true }));
  if (config.needsPasscode && !config.authed) {
    await hud.askPasscode(async (code) => {
      const r = await fetch('/api/auth', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ passcode: code }) });
      return r.ok;
    });
  }
  let world: World;
  let created = false;
  try {
    ({ world, created } = await openWorld());
  } catch (e) {
    hud.toast(`${(e as Error).message}. Playing offline.`, 'error', 6000);
    world = starterWorld('local', (_word, kind) => defaultSprite(kind));
  }
  const slug = world.slug;
  let targetId: string | undefined;
  let busy = false;
  const engine = new Engine(world, Date.now() & 0xffff);
  const store = new WorldStore(engine, world, {
    onConflict: () => hud.toast('This world changed somewhere else, so it was reloaded.', 'info', 5000),
    onError: (msg) => hud.toast(msg, 'error'),
  });
  const scene = new SceneView(canvas, config.spriteVersion);
  const player = new PlayerController(engine.world.player);
  if (created) hud.toast('New world. Share the link to come back to it from anywhere.', 'info', 5000);

  const onCommand = (text: string) => {
    store.pushUndo();
    return runStream(`/api/worlds/${slug}/command`, { command: text, context: compactWorld(engine.world, targetId) }, 'thinking...');
  };
  const onUndo = async () => {
    if (busy) {
      hud.toast('Wait for the current command to finish.', 'info', 1500);
      return;
    }
    hud.toast((await store.undo()) ? 'Undid the last command.' : 'Nothing to undo.', 'info', 1500);
  };
  const onReset = async () => {
    if (busy) return;
    await store.reset();
    hud.toast('Back to the starter meadow.', 'info', 2000);
  };
  const onShare = async () => {
    try {
      await navigator.clipboard.writeText(location.href);
      hud.toast('Link copied. Open it anywhere to continue this world.', 'info', 3000);
    } catch {
      hud.toast(location.href, 'info', 6000);
    }
  };
  const runStream = async (url: string, body: unknown, label: string) => {
    if (busy) {
      hud.toast('Still working on the last one...', 'info', 1500);
      return;
    }
    busy = true;
    hud.setBusy(true);
    hud.setStatus(label);
    const script = engine.open();
    let count = 0;
    try {
      await streamNdjson(url, body, (ev) => {
        if (ev.t === 'step') {
          engine.append(script, ev.step);
          count++;
          hud.setStatus(`${label} (${count})`);
        } else if (ev.t === 'error') {
          console.warn('[command]', ev.msg);
        } else if (ev.t === 'done') {
          if (ev.steps === 0) hud.toast(ev.reason === 'no json' ? 'The model did not answer with actions. Try again.' : 'Nothing happened. Try rephrasing.', 'error');
        }
      });
    } catch (e) {
      hud.toast(`Could not run that: ${(e as Error).message}`, 'error');
    } finally {
      engine.seal(script);
      busy = false;
      hud.setBusy(false);
      hud.setStatus('');
    }
  };
  engine.on((ev) => {
    if (ev.type === 'say') hud.toast(ev.id ? `${engine.world.get(ev.id)?.label ?? ev.id}: ${ev.text}` : ev.text, 'say', ev.dur * 1000);
    if (ev.type === 'warn') hud.toast(ev.msg, 'error');
  });
  if (new URLSearchParams(location.search).get('dev') === '1') {
    new DevConsole(hudRoot, (steps: Step[]) =>
      void runStream(`/api/worlds/${slug}/script`, { steps, context: compactWorld(engine.world, targetId) }, 'script...').catch(() => engine.run(resolveStepsLocally(steps))),
    );
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
      targetId = e?.id;
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
      targetId = e?.id;
      hud.setTarget(e ? e.label : null);
    }
    engine.update(dt);
    store.tick();
    scene.sync(engine.world);
    scene.render(engine.world.player);
  };
  requestAnimationFrame(loop);
  window.__game = { world, engine, scene, player, store };
}

/** Phones and tablets: coarse pointer, or touch points without hover. Touch laptops keep desktop controls. */
function isTouchFirst(): boolean {
  if (matchMedia('(pointer: coarse)').matches) return true;
  return navigator.maxTouchPoints > 0 && !matchMedia('(hover: hover)').matches;
}
