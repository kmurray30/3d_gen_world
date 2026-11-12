// The Atlas from the plaza and from a few districts, with frame timing:
//   node scripts/shots-atlas.mjs http://localhost:8793 out-dir
import { chromium } from 'playwright';
import fs from 'node:fs';
const [base = 'http://localhost:8787', out = 'test-results/atlas', only] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const executablePath = process.env.PW_CHROMIUM ?? (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const browser = await chromium.launch({ executablePath, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await (await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: Number(process.env.DPR ?? 1) })).newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
await page.goto(`${base}/atlas`);
if (await page.locator('input[name=passcode]').count()) {
  await page.fill('input[name=passcode]', 'test-pass');
  await page.press('input[name=passcode]', 'Enter');
}
await page.waitForFunction(() => !!window.__game, null, { timeout: 60000 });
await page.addStyleTag({ content: '.hint, .toast { display: none !important; }' });
const stats = () => page.evaluate(() => { const g = window.__game; return { entities: g.engine.world.size, views: g.scene.views.size, figures: g.scene.figures.size, structures: g.scene.structures.size, pending: [...g.scene.figures.values()].filter((v) => v.celPending).length }; });
const frames = () => page.evaluate(() => new Promise((res) => { let n = 0; const t0 = performance.now(); const f = () => { n++; if (performance.now() - t0 < 2000) requestAnimationFrame(f); else res(Math.round((n / (performance.now() - t0)) * 1000)); }; requestAnimationFrame(f); }));
await page.waitForTimeout(4000);
console.log('plaza', JSON.stringify(await stats()), 'fps', await frames());
await page.screenshot({ path: `${out}/plaza.png`, timeout: 120000 });
// visit each district sign: stand a few metres in front of it, looking in
const signs = await page.evaluate(() => window.__game.engine.world.list().filter((e) => e.structure && /^[A-Z &]+$/.test((e.structure.params.text ?? '')) && e.label !== 'the atlas' && e.label !== 'everything there is').map((e) => ({ text: e.structure.params.text, pos: e.pos })));
const TITLES = ['TOWN SQUARE', 'LITTLE PLACES', 'FOOD HALL', 'KITCHEN', 'HOME', 'WARDROBE', 'TOY SHOP', 'MUSIC HALL', 'SPORTS FIELD', 'SCHOOL & OFFICE', 'TECH LAB', 'CLINIC', 'WORKSHOP', 'ARMORY', 'GARAGE', 'FARM', 'PET PARK', 'WILD PARK', 'AVIARY', 'BUG GARDEN', 'SEASIDE', 'GARDEN', 'WILDERNESS', 'SKY & SPACE', 'FANTASY GROVE', 'IDEAS & SYMBOLS'];
const districts = signs.filter((s) => TITLES.includes(s.text));
for (const s of districts.filter((d) => !only || only.split(',').includes(d.text))) {
  await page.evaluate(([p]) => { const g = window.__game; g.camera.teleport([p[0] + 6, 2.4, p[2] + 4], 0.35, -0.18, g.engine.world.player); }, [s.pos]);
  await page.waitForFunction(() => [...window.__game.scene.figures.values()].every((v) => !v.celPending), null, { timeout: 30000 }).catch(() => undefined);
  await page.waitForTimeout(800);
  const name = s.text.toLowerCase().replace(/[^a-z]+/g, '-');
  await page.screenshot({ path: `${out}/${name}.png`, timeout: 120000 });
  console.log(s.text, JSON.stringify(await stats()));
}
console.log('fps at the end', await frames());
console.log('errors', errors.slice(0, 5));
await browser.close();
