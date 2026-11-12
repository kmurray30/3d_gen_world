// The flying dragon in every style (sprite, paper, origami, 3D), mid-flap, breathing fire and from the side:
//   node scripts/shots-dragon.mjs http://localhost:8793 out-dir
import { chromium } from 'playwright';
import fs from 'node:fs';
const [base = 'http://localhost:8787', out = 'test-results/dragon'] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const executablePath = process.env.PW_CHROMIUM ?? (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const browser = await chromium.launch({ executablePath, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await (await browser.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
await page.goto(`${base}/?preset=gallery`);
if (await page.locator('input[name=passcode]').count()) {
  await page.fill('input[name=passcode]', 'test-pass');
  await page.press('input[name=passcode]', 'Enter');
}
await page.waitForURL(/\/w\//);
await page.waitForFunction(() => !!window.__game);
await page.addStyleTag({ content: '.lock-overlay, .hint, .cmd, .toast, .viewbar, .topbar { display: none !important; }' });
await page.waitForTimeout(1500);
const look = (pos, yaw, pitch) => page.evaluate(([p, y, pt]) => { const g = window.__game; g.camera.teleport(p, y, pt, g.engine.world.player); }, [pos, yaw, pitch]);
const ds = await page.evaluate(() => window.__game.engine.world.list().filter((e) => e.word === 'dragon').map((e) => ({ id: e.id, pos: e.pos, look: e.look, h: e.heightM })));
console.log(JSON.stringify(ds.map((d) => [d.id, d.pos.map((v) => +v.toFixed(1))])));
const xs = ds.map((d) => d.pos[0]);
const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
const z = ds[0].pos[2];
const y = ds[0].pos[1] + ds[0].h * 0.45;
await look([cx, y, z + 16], 0, -0.02);
for (const t of [0, 300, 600]) {
  await page.waitForTimeout(t ? 300 : 0);
  await page.screenshot({ path: `${out}/all-${t}.png` });
}
// each style alone, close, at two points in the flap
for (const d of ds) {
  await look([d.pos[0], y, z + 9], 0, -0.02);
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${out}/solo-${d.look}-a.png` });
  await page.waitForTimeout(370);
  await page.screenshot({ path: `${out}/solo-${d.look}-b.png` });
}
// one pair close: paper + origami, then origami + 3D
for (const [a, b] of [['paper', 'origami'], ['origami', 'toon']]) {
  const A = ds.find((d) => d.look === a), B = ds.find((d) => d.look === b);
  await look([(A.pos[0] + B.pos[0]) / 2, y, z + 11], 0, -0.02);
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${out}/pair-${a}-${b}.png` });
}
// fire!
for (const d of ds) await page.evaluate((id) => window.__game.scene.react(id, 'breathe'), d.id);
await look([cx, y, z + 19], 0, -0.02);
await page.waitForTimeout(1200);
await page.screenshot({ path: `${out}/fire.png` });
// three-quarters from the front of the 3D one, and the origami one from above
const T = ds.find((d) => d.look === 'toon');
await page.waitForTimeout(1600);
await look([T.pos[0] - 6, y + 1, z + 6], -Math.PI / 4, -0.1);
await page.waitForTimeout(500);
await page.screenshot({ path: `${out}/toon-34.png` });
const O = ds.find((d) => d.look === 'origami');
await look([O.pos[0] - 5, y + 5, z + 5], -Math.PI / 4, -0.6);
await page.waitForTimeout(500);
await page.screenshot({ path: `${out}/origami-above.png` });
console.log('errors', errors);
await browser.close();
