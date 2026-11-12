// The village under each Look setting (sprites, paper, 3D), from third person, plus the avatar walking:
//   node scripts/shots-look.mjs http://localhost:8793 out-dir
import { chromium } from 'playwright';
import fs from 'node:fs';
const [base = 'http://localhost:8787', out = 'test-results/look'] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const executablePath = process.env.PW_CHROMIUM ?? (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const browser = await chromium.launch({ executablePath, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
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
await page.addStyleTag({ content: '.lock-overlay, .hint, .toast { display: none !important; }' });
await page.waitForTimeout(1200);
await page.evaluate(() => {
  const g = window.__game;
  g.engine.world.player.pos = [6, 0, -4];
  g.engine.world.player.yaw = 0.35;
  g.camera.setMode('third', g.engine.world.player);
  g.camera.setAngle(1, g.engine.world.player);
});
for (const look of ['sprites', 'paper', 'toon']) {
  await page.evaluate((look) => { window.__game.scene.look = look; }, look);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${out}/village-${look}.png` });
  console.log('saved', look);
}
// walk the avatar forward in 3D for a moment
await page.keyboard.down('w');
await page.waitForTimeout(900);
await page.screenshot({ path: `${out}/avatar-walk-toon.png` });
await page.keyboard.down('Shift');
await page.waitForTimeout(700);
await page.screenshot({ path: `${out}/avatar-run-toon.png` });
await page.keyboard.up('Shift');
await page.keyboard.up('w');
await page.evaluate(() => { window.__game.scene.look = 'paper'; });
await page.keyboard.down('a');
await page.waitForTimeout(900);
await page.screenshot({ path: `${out}/avatar-walk-paper.png` });
await page.keyboard.up('a');
console.log('errors', errors);
await browser.close();
