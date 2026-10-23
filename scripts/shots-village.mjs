// Screenshots of the village preset from several cameras, for eyeballing the structure kit:
//   node scripts/shots-village.mjs http://localhost:8791 test-results/village
// Each structure is framed from its front, plus an overview, a third-person view and an indoor first-person view.
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
await page.waitForTimeout(1500);

const shot = async (name) => {
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${out}/${name}.png` });
  console.log(`saved ${name}`);
};
const look = (pos, yaw, pitch) => page.evaluate(([p, y, pt]) => {
  const g = window.__game;
  g.camera.teleport(p, y, pt, g.engine.world.player);
}, [pos, yaw, pitch]);

// overview from above the start, looking toward -z
await look([0, 26, 34], 0, -0.65);
await shot('00-overview');

const structures = await page.evaluate(() => window.__game.engine.world.list().filter((e) => e.structure).map((e) => ({ id: e.id, pos: e.pos, yaw: e.yaw ?? 0, b: e.structure.bounds })));
for (const s of structures) {
  const size = Math.max(s.b.w, s.b.d, s.b.h);
  const d = size * 1.25 + 4;
  const yawRad = (s.yaw * Math.PI) / 180;
  // the front faces +z local; stand in front of it, a bit to the right, and look back
  const fx = Math.sin(yawRad);
  const fz = Math.cos(yawRad);
  const rx = Math.cos(yawRad);
  const rz = -Math.sin(yawRad);
  const camPos = [s.pos[0] + fx * d + rx * d * 0.45, s.b.h * 0.55 + 2.5, s.pos[2] + fz * d + rz * d * 0.45];
  const dx = s.pos[0] - camPos[0];
  const dz = s.pos[2] - camPos[2];
  const yaw = Math.atan2(-dx, -dz);
  const pitch = Math.atan2(s.b.h * 0.45 - camPos[1], Math.hypot(dx, dz));
  await look(camPos, yaw, pitch);
  await shot(`10-${s.id}`);
}

// third person from the start, high angle
await page.evaluate(() => {
  const g = window.__game;
  g.camera.setMode('third', g.engine.world.player);
  g.camera.setAngle(1, g.engine.world.player);
});
await shot('20-third-person');
await page.evaluate(() => {
  const g = window.__game;
  g.camera.setAngle(3, g.engine.world.player);
});
await shot('21-top-down');

// walk into house_1 in third person: fade test, then first person inside
const house = structures.find((s) => s.id === 'house_1');
await page.evaluate(([h]) => {
  const g = window.__game;
  const p = g.engine.world.player;
  const yawRad = (h.yaw * Math.PI) / 180;
  // just outside the door, facing the house
  p.pos = [h.pos[0] + Math.sin(yawRad) * (h.b.d / 2 + 1.2), 0, h.pos[2] + Math.cos(yawRad) * (h.b.d / 2 + 1.2)];
  p.yaw = Math.atan2(-(h.pos[0] - p.pos[0]), -(h.pos[2] - p.pos[2]));
  g.camera.setMode('third', p);
  g.camera.setAngle(1, p);
}, [house]);
await shot('30-house-door-third');
await page.evaluate(([h]) => {
  const g = window.__game;
  const p = g.engine.world.player;
  p.pos = [h.pos[0], 0, h.pos[2]];
}, [house]);
await page.waitForTimeout(600);
await shot('31-inside-third-fade');
await page.evaluate(() => {
  const g = window.__game;
  const p = g.engine.world.player;
  g.camera.setMode('first', p);
  p.pitch = 0.05;
});
await shot('32-inside-first');
// stand on the bunker's first patio
const bunker = structures.find((s) => s.id === 'bunker_1');
await page.evaluate(([b]) => {
  const g = window.__game;
  const p = g.engine.world.player;
  p.pos = [b.pos[0], 3.4, b.pos[2]];
  p.yaw = Math.PI * 0.75;
  p.pitch = -0.2;
  g.camera.setMode('third', p);
  g.camera.setAngle(0, p);
}, [bunker]);
await page.waitForTimeout(800);
const onBunker = await page.evaluate(() => window.__game.engine.world.player.pos);
await shot('40-bunker-patio');
console.log('player on bunker at', onBunker.map((v) => v.toFixed(2)).join(', '));
console.log(`console errors: ${errors.length ? errors.join(' | ') : 'none'}`);
await browser.close();
