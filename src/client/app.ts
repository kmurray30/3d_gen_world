import type { World } from '../shared/types';
import { Engine } from '../shared/engine/index';
import { resolveStepsLocally } from '../shared/engine/resolve-local';
import { DevConsole } from './ui/dev-console';
import { compactWorld, fetchConfig, streamNdjson, type ClientConfig } from './net/api';
import { WorldStore, openWorld } from './app/state';
import type { Step } from '../shared/schema';
import { starterWorld } from '../shared/engine/presets';
import { defaultSprite } from '../shared/engine/sizing';
import { SceneView } from './render/scene';
import { DesktopInput } from './input/desktop';
import { TouchInput } from './input/touch';
import { PlayerController } from './app/player';
import { ANGLES, CameraRig, loadViewSettings, saveViewSettings, type ViewMode } from './app/camera';
import { Hud } from './ui/hud';
import { WorldsPanel } from './ui/worlds-panel';
import { createWorld, goToWorld, recordVisit, takeFreshFlag } from './app/worlds';

declare global {
  interface Window {
    __game?: { world: World; engine: Engine; scene: SceneView; player: PlayerController; store: WorldStore; camera: CameraRig };
  }
}

const VIEW_NAMES: Record<ViewMode, string> = { first: '1st person', third: '3rd person', free: 'free cam' };

export async function startApp(canvas: HTMLCanvasElement, hudRoot: HTMLElement): Promise<void> {
  const coarse = isTouchFirst();
  const hud = new Hud(hudRoot, {
    onCommand: (text) => void onCommand(text),
    onUndo: () => void onUndo(),
    onReset: () => void onReset(),
    onShare: () => void onShare(),
    onWorlds: () => worldsPanel?.open(),
    onView: () => cycleView(),
    onAngle: () => cycleAngle(),
    onWalls: () => toggleWalls(),
  });
  let worldsPanel: WorldsPanel | undefined;
  const config: ClientConfig = await fetchConfig().catch(() => ({ spriteVersion: 'dev', llm: 'offline', needsPasscode: false, authed: true }));
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
    onSaved: () => recordVisit(slug, engine.world.size),
    onConflict: () => hud.toast('This world changed somewhere else, so it was reloaded.', 'info', 5000),
    onError: (msg) => hud.toast(msg, 'error'),
  });
  const scene = new SceneView(canvas, config.spriteVersion, hudRoot);
  const player = new PlayerController(engine.world.player);
  player.resolveCollisions = (pos) => {
    engine.collidePlayer(pos);
    return engine.playerGround;
  };
  scene.setAvatar(config.avatar ?? { word: 'you', sprite: defaultSprite('human'), heightM: 1.5 });
  recordVisit(slug, engine.world.size);
  if (created || takeFreshFlag(slug)) {
    hud.toast(engine.world.list().some((e) => e.structure) ? 'Welcome to the village. Walk into the houses, climb the bunker. V switches the view.' : 'New world. The menu has Worlds to switch, and Copy link to share this one.', 'info', 6000);
  }
  const leave = async (): Promise<void> => {
    if (busy) throw new Error('Wait for the current command to finish first.');
    await store.save(true).catch(() => undefined);
  };
  worldsPanel = new WorldsPanel(hudRoot, slug, {
    onNew: async (preset) => {
      await leave();
      goToWorld(await createWorld(preset), true);
    },
    onOpen: async (target) => {
      await leave();
      goToWorld(target);
    },
  });

  /* ----- view: camera modes, angles, wall fading ----- */
  const rig = new CameraRig();
  const settings = loadViewSettings();
  rig.setAngle(settings.angle, engine.world.player);
  rig.setMode(settings.mode, engine.world.player);
  scene.fadeWalls = settings.fade;
  const refreshViewLabels = () => {
    hud.setViewLabels({ view: VIEW_NAMES[rig.mode], angle: rig.mode === 'third' ? ANGLES[rig.angle].name : '-', walls: scene.fadeWalls ? 'fade' : 'solid' });
    saveViewSettings({ mode: rig.mode, angle: rig.angle, fade: scene.fadeWalls });
  };
  const cycleView = () => {
    const mode = rig.cycleMode(engine.world.player);
    hud.toast(mode === 'first' ? 'First person.' : mode === 'third' ? 'Third person. R cycles the angle.' : 'Free camera: fly with WASD, Space up, C down. V to return.', 'info', 2500);
    refreshViewLabels();
  };
  const cycleAngle = () => {
    const a = rig.cycleAngle(engine.world.player);
    hud.toast(`Camera: ${a.name}.`, 'info', 1500);
    refreshViewLabels();
  };
  const toggleWalls = () => {
    scene.fadeWalls = !scene.fadeWalls;
    hud.toast(scene.fadeWalls ? 'Walls in the way fade out.' : 'Walls stay solid.', 'info', 1500);
    refreshViewLabels();
  };
  refreshViewLabels();

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
    hud.toast(engine.world.list().some((e) => e.structure) ? 'Back to the village as it was.' : 'Back to the starter meadow.', 'info', 2000);
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
    if (ev.type === 'say') {
      if (ev.id && engine.world.has(ev.id)) scene.bubbles.say(ev.id, ev.text, ev.dur);
      else hud.toast(ev.text, 'say', ev.dur * 1000);
    } else if (ev.type === 'warn') hud.toast(ev.msg, 'error');
    else if (ev.type === 'effect') scene.effects.start(ev.key, ev.name, { entityId: ev.id, pos: ev.pos, dur: ev.dur, loop: ev.loop });
    else if (ev.type === 'effectStop') scene.effects.stop(ev.key);
    else if (ev.type === 'remove') scene.effects.stopEntity(ev.id);
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
    hud.setHint('WASD to walk, Shift to run, Space to jump, / to type. V view, R angle, B walls');
    desktop.onLockChange = (locked) => hud.showLockOverlay(!locked && !document.activeElement?.matches('input'));
    desktop.onLockError = () => hud.toast('Could not capture the mouse. Click the scene again.', 'error');
    desktop.onRequestCommand = () => {
      hud.showLockOverlay(false);
      hud.focusInput();
    };
    desktop.onHotkey = (code) => {
      if (code === 'KeyV') cycleView();
      else if (code === 'KeyR') cycleAngle();
      else if (code === 'KeyB') toggleWalls();
    };
    hud.input.addEventListener('blur', () => hud.showLockOverlay(!desktop.locked));
  } else {
    hud.setHint('Left thumb: walk, push further to run. Right thumb: look. Tap a thing to name it.');
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
  let faceDir: [number, number] | null = null;
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
    const sens = touch ? 0.005 : 0.0022;
    const p = engine.world.player;
    const [lo, hi] = rig.pitchLimits;
    player.pitchLimits = [lo, hi];
    let moving = false;
    if (rig.drivesPlayer) {
      const before: [number, number] = [p.pos[0], p.pos[2]];
      player.update(dt, move, look, sens, desktop.sprint, desktop.consumeJump());
      const dx = p.pos[0] - before[0];
      const dz = p.pos[2] - before[1];
      if (Math.hypot(dx, dz) > 1e-4) {
        moving = true;
        faceDir = [dx, dz];
      }
    } else {
      desktop.consumeJump();
      engine.collidePlayer();
    }
    const cam = rig.update(dt, p, rig.drivesPlayer ? [0, 0] : look, sens, { move, up: desktop.upAxis, fast: desktop.sprint });
    if (!coarse) {
      const id = desktop.locked ? scene.pick(0, 0) : null;
      const e = id ? engine.world.get(id) : undefined;
      targetId = e?.id;
      hud.setTarget(e ? e.label : null);
    }
    engine.update(dt);
    store.tick();
    scene.sync(engine.world, dt, cam);
    scene.updateAvatar(p, rig.showsAvatar, moving, faceDir, cam, dt);
    scene.updateFades(cam, p, rig.mode !== 'first');
    scene.render(cam);
  };
  requestAnimationFrame(loop);
  window.__game = { world, engine, scene, player, store, camera: rig };
}

/** Phones and tablets: coarse pointer, or touch points without hover. Touch laptops keep desktop controls. */
function isTouchFirst(): boolean {
  if (matchMedia('(pointer: coarse)').matches) return true;
  return navigator.maxTouchPoints > 0 && !matchMedia('(hover: hover)').matches;
}
