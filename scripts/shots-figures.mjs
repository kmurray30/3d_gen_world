// Screenshots of the visuals demo (code-drawn figures as sprite, paper and 3D) for eyeballing:
//   node scripts/shots-figures.mjs http://localhost:8793 out-dir
import { chromium } from 'playwright';
import fs from 'node:fs';
const base = process.argv[2] ?? 'http://localhost:8787';
const out = process.argv[3] ?? 'test-results/figures';
const only = process.argv[4];
fs.mkdirSync(out, { recursive: true });
const executablePath = process.env.PW_CHROMIUM ?? (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const browser = await chromium.launch({ executablePath, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await (await browser.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push(String(e)));
await page.goto(`${base}/?preset=gallery`);
if (await page.locator('input[name=passcode]').count()) {
  await page.fill('input[name=passcode]', 'test-pass');
  await page.press('input[name=passcode]', 'Enter');
}
await page.waitForURL(/\/w\//);
await page.waitForFunction(() => !!window.__game);
await page.waitForTimeout(1500);
await page.addStyleTag({ content: '.lock-overlay, .hint, .cmd, .toast { display: none !important; }' });
const shot = async (name) => { await page.waitForTimeout(700); await page.screenshot({ path: `${out}/${name}.png` }); console.log('saved', name); };
const look = (pos, yaw, pitch) => page.evaluate(([p, y, pt]) => { const g = window.__game; g.camera.teleport(p, y, pt, g.engine.world.player); }, [pos, yaw, pitch]);
const ents = await page.evaluate(() => window.__game.engine.world.list().map((e) => ({ id: e.id, word: e.word, pos: e.pos, h: e.heightM, look: e.look })));
// one shot per item: the trio framed from the front
const keys = [...new Set(ents.filter((e) => e.look === 'paper').map((e) => e.word))].filter((k) => !only || only.split(',').includes(k));
for (const k of keys) {
  const trio = ents.filter((e) => e.word === k && e.look);
  const xs = trio.map((e) => e.pos[0]);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
  const span = Math.max(...xs) - Math.min(...xs);
  const h = trio[0].h;
  const d = Math.max(span * 0.9, h * 1.5) + 1.2;
  const z = trio[0].pos[2];
  await look([cx, h * 0.55 + 0.2, z + d], 0, -Math.atan2(0.15 * h + 0.1, d));
  await shot(`item-${k.replace(/\s+/g, '_')}`);
  // close up on the paper and 3D pair, then from three-quarters to the side
  const pair = trio.filter((e) => e.look !== 'sprite');
  const px = (pair[0].pos[0] + pair[1].pos[0]) / 2;
  const pd = Math.max(Math.abs(pair[1].pos[0] - pair[0].pos[0]) * 1.1, h * 1.15) + 0.4;
  await look([px, h * 0.55, z + pd], 0, -0.06);
  await shot(`close-${k.replace(/\s+/g, '_')}`);
  await look([px + pd * 0.7, h * 0.6, z + pd * 0.7], Math.PI / 4, -0.08);
  await shot(`side-${k.replace(/\s+/g, '_')}`);
}
console.log('errors', errors.slice(0, 5));
await browser.close();
