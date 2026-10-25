// Screenshots of the built props in a generated village: the plaza fountain, benches and lamps, a mailbox by a
// door path, the signpost, the well and the garden birdbath, from eye level and from above, and the plaza at night.
//   cd scripts && node shots-village-props.mjs http://localhost:8787 ../test-results/village-props
import { chromium } from 'playwright';
import fs from 'node:fs';

const base = process.argv[2] ?? 'http://localhost:8787';
const out = process.argv[3] ?? '../test-results/village-props';
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
const props = await page.evaluate(() => window.__game.engine.world.list().filter((e) => e.structure).map((e) => ({ id: e.id, gen: e.structure.gen, pos: e.pos, yaw: e.yaw ?? 0, h: e.structure.bounds.h })));
console.log(props.map((p) => p.id).join(' '));
const first = (gen) => props.find((p) => p.gen === gen);
const front = async (p, name, dist, lift = 1.6, side = 0.4) => {
  if (!p) return;
  const a = (p.yaw * Math.PI) / 180;
  const fx = Math.sin(a) + Math.cos(a) * side;
  const fz = Math.cos(a) - Math.sin(a) * side;
  await lookAt([p.pos[0], p.pos[1] + p.h * 0.4, p.pos[2]], [p.pos[0] + fx * dist, p.pos[1] + lift, p.pos[2] + fz * dist]);
  await shot(name);
};
await front(first('fountain'), '10-fountain', 8, 2.2, 0.6);
await front(first('bench'), '11-bench', 3.2, 1.5);
await front(first('lamppost'), '12-lamppost', 4, 1.7);
await front(first('mailbox'), '13-mailbox', 2.6, 1.5, 0.6);
await front(first('signpost'), '14-signpost', 4, 1.7);
await front(first('well'), '15-well', 5, 2);
await front(first('birdbath'), '16-birdbath', 2.6, 1.6);
const f = first('fountain');
await lookAt([f.pos[0], 0, f.pos[2]], [f.pos[0], 16, f.pos[2] + 9]);
await shot('20-plaza-above');
await page.evaluate(() => { const g = window.__game; g.engine.world.sky = 'night'; g.scene.sky.set('night', true); });
await lookAt([f.pos[0], 1, f.pos[2]], [f.pos[0] + 6, 3, f.pos[2] + 10]);
await shot('30-plaza-night', 2500);
console.log(errors.length ? `errors:\n${errors.join('\n')}` : 'no errors');
await browser.close();
