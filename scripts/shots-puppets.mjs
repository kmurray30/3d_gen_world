// Screenshots of rigged drawings acting: idle, each gesture frozen mid-move, each expression, talking, popped
// apart, and with a piece taken off.
//   cd scripts && node shots-puppets.mjs http://localhost:8787 ../test-results/puppets boy girl
import { chromium } from 'playwright';
import fs from 'node:fs';

const base = process.argv[2] ?? 'http://localhost:8787';
const out = process.argv[3] ?? '../test-results/puppets';
const words = process.argv.slice(4).length ? process.argv.slice(4) : ['boy'];
const only = process.env.ONLY ? process.env.ONLY.split(',') : null;
fs.mkdirSync(out, { recursive: true });
const executablePath = process.env.PW_CHROMIUM ?? (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const browser = await chromium.launch({ executablePath, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await (await browser.newContext({ viewport: { width: 900, height: 700 } })).newPage();
const errors = [];
page.on('console', (m) => { if (m.type() === 'error' || m.text().startsWith('[rig]')) errors.push(m.text()); });
page.on('pageerror', (e) => errors.push(String(e)));
await page.goto(base, { waitUntil: 'networkidle' });
await page.waitForFunction(() => !!window.__game);
await page.addStyleTag({ content: '.hud, .toasts, .cmdbar, .viewbar, .topbar { display: none !important; }' });
const manifest = await (await fetch(`${base}/manifest.json`)).json();

for (const word of words) {
  const m = manifest.words[word];
  if (!m) { console.log('no word', word); continue; }
  await page.evaluate(([w, m]) => {
    const g = window.__game;
    for (const e of g.engine.world.list()) g.engine.world.remove(e.id);
    g.engine.world.add({ id: 'it', word: w, label: w, sprite: { file: m.f, w: m.w, h: m.h }, pos: [0, 0, -4], flip: false, scale: 1, heightM: m.hm, tilt: 0, state: {}, effects: [], kind: m.t, solid: true, massClass: 'medium', huge: false, createdAt: 0, yaw: 0 });
    g.engine.world.player.pos = [0, 0, 0];
    // hold still for the camera: idle life leaves things alone that a script touched recently
    g.engine.idle.lastScripted.set('it', 1e12);
    g.camera.teleport([0, m.hm * 0.55, -4 + Math.max(1.6, m.hm * 1.25)], 0, -0.05, g.engine.world.player);
  }, [word, m]);
  await page.waitForTimeout(2500);
  const shot = async (name, wait = 500) => {
    await page.waitForTimeout(wait);
    await page.screenshot({ path: `${out}/${word}-${name}.png` });
  };
  const set = (fn, arg) => page.evaluate(fn, arg);
  await shot('idle');
  const gestures = ['wave', 'point', 'clap', 'shrug', 'thumbs_up', 'cover_eyes', 'hands_on_hips', 'arms_up', 'dance', 'bow', 'shake_head', 'wink', 'laugh', 'cry', 'gasp', 'wag', 'flap', 'apart'];
  for (const name of gestures) {
    if (only && !only.includes(name)) continue;
    await set((n) => { const tr = window.__game.engine.world.trans('it'); tr.gesture = { name: n, t: 0.42 * 1.8, dur: 1.8 }; }, name);
    await shot(`g-${name}`, 400);
  }
  await set(() => { delete window.__game.engine.world.trans('it').gesture; });
  // walking: slide it along and let its legs swing
  await set(() => {
    const g = window.__game;
    window.__walk = setInterval(() => { const e = g.engine.world.get('it'); if (e) { e.pos[0] += 0.012; if (e.pos[0] > 0.6) e.pos[0] = -0.6; } }, 16);
  });
  await shot('walk', 900);
  await set(() => { clearInterval(window.__walk); const e = window.__game.engine.world.get('it'); e.pos[0] = 0; });
  // faces up close: the camera at head height, nearer
  await set((m) => {
    const g = window.__game;
    const head = m.t === 'animal' ? 0.7 : 0.85;
    g.camera.teleport([0, m.hm * head, -4 + Math.max(0.7, m.hm * 0.55)], 0, -0.02, g.engine.world.player);
  }, m);
  for (const ex of ['happy', 'sad', 'angry', 'surprised', 'scared', 'sleepy', 'laughing', 'confused']) {
    if (only && !only.includes(ex)) continue;
    await set((x) => { window.__game.engine.world.get('it').state.expression = x; }, ex);
    await shot(`e-${ex}`, 600);
  }
  await set(() => { delete window.__game.engine.world.get('it').state.expression; window.__game.scene.bubbles.say('it', 'Hello there, how are you?', 4); });
  await shot('talk', 300);
  // take a piece off: a hat if it has one, else a tail, a wheel, or an arm
  const part = await set(() => {
    const g = window.__game;
    const rig = g.scene.rigs.rigOf(g.engine.world.get('it').sprite.file);
    const p = rig && (rig.pieces.find((q) => q.detach) ?? rig.pieces.find((q) => q.kind === 'tail') ?? rig.pieces.find((q) => q.kind === 'wheel') ?? rig.pieces.find((q) => q.id === 'arm_r'));
    return p ? (g.engine.detachPiece('it', p.id, 'piece') ? p.id : null) : null;
  });
  await shot(`detached-${part}`, 1200);
}
console.log(errors.length ? `errors:\n${errors.join('\n')}` : 'no errors');
await browser.close();
