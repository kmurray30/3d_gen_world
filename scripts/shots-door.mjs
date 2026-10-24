// Door toggle shots against the village preset: node scripts/shots-door.mjs http://localhost:8793 out-dir
import { chromium } from 'playwright';
import fs from 'node:fs';
const base = process.argv[2];
const out = process.argv[3];
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await (await browser.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
await page.goto(`${base}/?preset=village`);
if (await page.locator('input[name=passcode]').count()) {
  await page.fill('input[name=passcode]', 'test-pass');
  await page.press('input[name=passcode]', 'Enter');
}
await page.waitForURL(/\/w\//);
await page.waitForFunction(() => !!window.__game);
await page.waitForTimeout(1500);
const shot = async (name) => { await page.waitForTimeout(600); await page.screenshot({ path: `${out}/${name}.png` }); console.log('saved', name); };
const look = (pos, yaw, pitch) => page.evaluate(([p, y, pt]) => { const g = window.__game; g.camera.teleport(p, y, pt, g.engine.world.player); }, [pos, yaw, pitch]);
for (const id of ['house_1', 'witch_hut_1']) {
  const h = await page.evaluate((id) => { const e = window.__game.engine.world.get(id); return e ? { id: e.id, pos: e.pos, yaw: e.yaw ?? 0, b: e.structure.bounds, hasDoor: e.structure.parts.some((p) => p.t === 'decal' && p.role === 'door') } : null; }, id);
  console.log(JSON.stringify(h));
  if (!h) continue;
  const yawRad = (h.yaw * Math.PI) / 180;
  const d = h.b.d / 2 + 3;
  const cam = [h.pos[0] + Math.sin(yawRad) * d + 1.2, 1.5, h.pos[2] + Math.cos(yawRad) * d];
  const yaw = Math.atan2(-(h.pos[0] - cam[0]), -(h.pos[2] - cam[2]));
  await look(cam, yaw, -0.02);
  await shot(`${id}-closed`);
  console.log('poke', await page.evaluate((id) => window.__game.engine.poke(id), h.id));
  await page.waitForTimeout(1000);
  await shot(`${id}-open`);
  console.log('picked', await page.evaluate(() => window.__game.scene.pick(0, 0)));
  await page.waitForTimeout(700);
  await page.evaluate((id) => window.__game.engine.poke(id), h.id);
}
console.log('errors', errors);
await browser.close();
