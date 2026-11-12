// Screenshots of a generated village for eyeballing terrain, water, structures and the sky:
//   node scripts/shots-village.mjs http://localhost:8787 test-results/village [seed]
// An overview, each special structure from its front, the bridge, third person and top-down, and the same
// overview at sunset and at night.
import { chromium } from 'playwright';
import fs from 'node:fs';

const base = process.argv[2] ?? 'http://localhost:8787';
const out = process.argv[3] ?? 'test-results/village';
fs.mkdirSync(out, { recursive: true });
const executablePath = process.env.PW_CHROMIUM ?? (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const browser = await chromium.launch({ executablePath, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
const page = await context.newPage();
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push(String(e)));
await page.goto(`${base}/?preset=village`, { waitUntil: 'networkidle' });
await page.waitForFunction(() => !!window.__game);
await page.addStyleTag({ content: '.lock-overlay, .toasts { display: none !important; }' });
await page.waitForTimeout(2000);

const shot = async (name, wait = 600) => {
  await page.waitForTimeout(wait);
  await page.screenshot({ path: `${out}/${name}.png` });
  console.log(`saved ${name}`);
};
const look = (pos, yaw, pitch) =>
  page.evaluate(([p, y, pt]) => {
    const g = window.__game;
    g.camera.teleport(p, y, pt, g.engine.world.player);
  }, [pos, yaw, pitch]);
// headless frame rates are low, so skip the slow fade between times of day
const sky = (t) => page.evaluate((time) => { const g = window.__game; g.engine.world.sky = time; g.scene.sky.set(time, true); }, t);
const lookAt = async (target, from) => {
  const dx = target[0] - from[0];
  const dy = target[1] - from[1];
  const dz = target[2] - from[2];
  await look(from, Math.atan2(-dx, -dz), Math.atan2(dy, Math.hypot(dx, dz)));
};

await lookAt([0, 0, 0], [0, 48, 62]);
await shot('00-overview');
const ents = await page.evaluate(() => window.__game.engine.world.list().filter((e) => e.structure).map((e) => ({ id: e.id, pos: e.pos, yaw: e.yaw ?? 0, b: e.structure.bounds })));
for (const s of ents.filter((e) => !/^house_[2-9]/.test(e.id))) {
  const size = Math.max(s.b.w, s.b.d, s.b.h);
  const d = size * 1.2 + 5;
  const a = (s.yaw * Math.PI) / 180;
  const from = [s.pos[0] + Math.sin(a) * d + Math.cos(a) * d * 0.4, s.pos[1] + s.b.h * 0.5 + 3, s.pos[2] + Math.cos(a) * d - Math.sin(a) * d * 0.4];
  await lookAt([s.pos[0], s.pos[1] + s.b.h * 0.35, s.pos[2]], from);
  await shot(`10-${s.id}`);
}
// third person on the plaza, then top-down
await page.evaluate(() => {
  const g = window.__game;
  g.camera.setMode('third', g.engine.world.player);
  g.camera.setAngle(1, g.engine.world.player);
});
await shot('20-third-person', 1200);
await page.evaluate(() => window.__game.camera.setAngle(3, window.__game.engine.world.player));
await shot('21-top-down', 1200);
// sunset and night over the village
await lookAt([0, 0, -8], [0, 30, 45]);
await sky('sunset');
await shot('30-sunset', 3500);
await sky('night');
await shot('31-night', 3500);
const lh = ents.find((e) => e.id.startsWith('lighthouse'));
if (lh) {
  const a = (lh.yaw * Math.PI) / 180;
  await lookAt([lh.pos[0], lh.pos[1] + 6, lh.pos[2]], [lh.pos[0] + Math.sin(a) * 26, lh.pos[1] + 9, lh.pos[2] + Math.cos(a) * 26]);
  await shot('32-night-lighthouse', 1500);
}
await page.evaluate(() => {
  const g = window.__game;
  g.engine.world.sky = 'day';
  g.scene.sky.set('day', true);
  g.camera.setMode('first', g.engine.world.player);
  g.engine.world.player.yaw = 0;
  g.engine.world.player.pitch = -0.05;
});
await shot('40-first-person-day', 3500);
console.log(`console errors: ${errors.length ? errors.join(' | ') : 'none'}`);
await browser.close();
