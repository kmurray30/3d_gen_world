// Screenshots of the village's drawn decor up close: the fountain and lampposts as turned solids, the signpost and
// mailbox as crossed sheets, from several sides and from above, plus steep looks down to check nothing tilts.
//   node scripts/shots-decor.mjs http://localhost:8787 test-results/decor
import { chromium } from 'playwright';
import fs from 'node:fs';

const base = process.argv[2] ?? 'http://localhost:8787';
const out = process.argv[3] ?? 'test-results/decor';
fs.mkdirSync(out, { recursive: true });
const executablePath = process.env.PW_CHROMIUM ?? (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const browser = await chromium.launch({ executablePath, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await (await browser.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push(String(e)));
await page.goto(`${base}/?preset=village`, { waitUntil: 'networkidle' });
await page.waitForFunction(() => !!window.__game);
await page.addStyleTag({ content: '.lock-overlay, .toasts { display: none !important; }' });
await page.waitForTimeout(3000);

const shot = async (name, wait = 900) => {
  await page.waitForTimeout(wait);
  await page.screenshot({ path: `${out}/${name}.png` });
  console.log(`saved ${name}`);
};
const lookAt = (target, from) =>
  page.evaluate(([t, f]) => {
    const g = window.__game;
    const dx = t[0] - f[0], dy = t[1] - f[1], dz = t[2] - f[2];
    g.camera.teleport(f, Math.atan2(-dx, -dz), Math.atan2(dy, Math.hypot(dx, dz)), g.engine.world.player);
  }, [target, from]);
const find = (re) => page.evaluate((src) => window.__game.engine.world.list().filter((e) => new RegExp(src).test(e.word)).map((e) => ({ id: e.id, word: e.word, pos: e.pos, h: e.heightM })), re);
const solids = await page.evaluate(() => [...window.__game.scene.views.values()].filter((v) => v.solid).map((v) => `${v.id}:${v.solid.constructor.name}`));
console.log('solids', solids.join(' '));

const around = async (e, name, dist, lift) => {
  const [x, y, z] = e.pos;
  const target = [x, y + e.h * 0.45, z];
  for (const [i, a] of [0, 1.6, 3.4].entries()) await lookAt(target, [x + Math.sin(a) * dist, y + lift, z + Math.cos(a) * dist]), await shot(`${name}-${i}`);
  await lookAt(target, [x + 0.01, y + e.h + dist * 0.9, z + dist * 0.6]);
  await shot(`${name}-above`);
};
const [fountain] = await find('^fountain$');
if (fountain) await around(fountain, '10-fountain', 6, 1.8);
const [lamp] = await find('lamppost');
if (lamp) await around(lamp, '20-lamppost', 5, 1.7);
const [sign] = await find('signpost');
if (sign) await around(sign, '30-signpost', 4, 1.6);
const [mail] = await find('mailbox');
if (mail) await around(mail, '31-mailbox', 3.5, 1.5);
// steep looks down at the plaza: everything stays upright
if (fountain) {
  const [x, y, z] = fountain.pos;
  await lookAt([x, y, z + 2], [x, y + 10, z + 9]);
  await shot('40-look-down');
  await lookAt([x, y, z + 1], [x, y + 18, z + 3]);
  await shot('41-look-down-steep');
}
await page.evaluate(() => {
  const g = window.__game;
  g.camera.setMode('third', g.engine.world.player);
  g.camera.setAngle(2, g.engine.world.player);
});
await shot('50-third-high', 1500);
await page.evaluate(() => window.__game.camera.setAngle(3, window.__game.engine.world.player));
await shot('51-top-down', 1500);
await page.evaluate(() => { const g = window.__game; g.engine.world.sky = 'night'; g.scene.sky.set('night', true); g.camera.setAngle(1, g.engine.world.player); });
if (lamp) {
  const [x, y, z] = lamp.pos;
  await lookAt([x, y + 1.6, z], [x + 7, y + 2.5, z + 7]);
  await shot('60-night-lamppost', 2500);
}
console.log(errors.length ? `errors:\n${errors.join('\n')}` : 'no errors');
await browser.close();
