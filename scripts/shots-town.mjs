// Everytown from a few places: the plaza, a map, inside shops, the zoo, the airport, the harbour, a house.
//   node scripts/shots-town.mjs http://localhost:8793 out-dir [DPR=1]
import { chromium } from 'playwright';
import fs from 'node:fs';
const [base = 'http://localhost:8787', out = 'test-results/town'] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const executablePath = process.env.PW_CHROMIUM ?? (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const browser = await chromium.launch({ executablePath, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await (await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: Number(process.env.DPR ?? 1) })).newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
await page.goto(`${base}/town`);
if (await page.locator('input[name=passcode]').count()) {
  await page.fill('input[name=passcode]', 'test-pass');
  await page.press('input[name=passcode]', 'Enter');
}
await page.waitForFunction(() => !!window.__game, null, { timeout: 120000 });
await page.addStyleTag({ content: '.hint, .toast { display: none !important; }' });
const lots = await page.evaluate(async () => (await (await fetch('/api/town')).json()).world.town.lots);
const settle = async () => {
  await page.waitForFunction(() => [...window.__game.scene.figures.values()].every((v) => !v.celPending), null, { timeout: 60000 }).catch(() => undefined);
  await page.waitForTimeout(700);
};
const shot = async (name) => { await settle(); await page.screenshot({ path: `${out}/${name}.png`, timeout: 120000 }); console.log('shot', name); };
// where you arrive
await page.waitForTimeout(3000);
await shot('plaza');
const go = async (pos, yaw, pitch = -0.15) => page.evaluate(([p, y, pt]) => { const g = window.__game; g.camera.teleport(p, y, pt, g.engine.world.player); }, [pos, yaw, pitch]);
// a lot seen from its street, standing in its doorway looking in (indoors) or from the gate
const visit = async (title, name, inside = true) => {
  const l = lots.find((x) => x.title === title && !x.minor);
  if (!l) return console.log('no lot', title);
  const r = (l.yaw * Math.PI) / 180;
  const fx = Math.sin(r), fz = Math.cos(r);
  const back = inside ? l.d / 2 - 2.5 : l.d / 2 + 6;
  const p = [l.x + fx * back, inside ? 1.6 : 3.2, l.z + fz * back];
  // look back into the lot: the camera's yaw faces -z at 0, so face along -front
  const yaw = Math.atan2(fx, fz);
  await go(p, yaw, inside ? -0.12 : -0.2);
  await shot(name);
};
await visit('Grocery Store', 'grocery');
await visit('Pharmacy', 'pharmacy');
await visit('Toy Store', 'toy-store');
await visit('Zoo', 'zoo', false);
await visit('Airport', 'airport', false);
await visit('Car Dealership & Auto Shop', 'garage', false);
await visit('Military Base', 'military-base', false);
await visit('House', 'house');
await visit('Museum', 'museum');
await visit('School', 'school');
await visit('Harbor & Marina', 'harbor', false);
// the map at the plaza, close up
const map = await page.evaluate(() => window.__game.engine.world.list().find((e) => e.word === 'map' && e.structure)?.pos);
const post = await page.evaluate(() => window.__game.engine.world.list().find((e) => e.word === 'signpost' && e.structure)?.pos);
if (post) { await go([post[0] + 0.5, 2.4, post[2] + 4.2], 0, -0.08); await shot('signpost'); }
if (map) { await go([map[0], 1.9, map[2] + 3.2], 0, -0.05); await shot('map'); }
console.log('errors', errors.slice(0, 6));
await browser.close();
