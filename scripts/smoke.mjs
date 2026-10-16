// Quick interaction check against a running server: node scripts/smoke.mjs http://localhost:8787/
import { chromium, devices } from 'playwright';
import fs from 'node:fs';

const url = process.argv[2] ?? 'http://localhost:8787/';
const executablePath = process.env.PW_CHROMIUM ?? (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const browser = await chromium.launch({ executablePath, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const pos = (page) => page.evaluate(() => window.__game.world.player.pos.map((v) => +v.toFixed(2)));

{
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  const before = await pos(page);
  await page.keyboard.down('KeyW');
  await page.waitForTimeout(600);
  await page.keyboard.up('KeyW');
  const after = await pos(page);
  console.log('desktop W:', before, '->', after, 'errors:', errors.length);
  await page.keyboard.press('Slash');
  const focused = await page.evaluate(() => document.activeElement?.tagName);
  console.log('slash focuses input:', focused === 'INPUT');
}
{
  const context = await browser.newContext({ ...devices['iPhone 14'] });
  const page = await context.newPage();
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  const before = await pos(page);
  // joystick drag on the left side: push "forward" for ~600ms
  const cdp = await context.newCDPSession(page);
  const touch = async (type, x, y) =>
    cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y }] });
  await touch('touchStart', 80, 420);
  for (let i = 1; i <= 12; i++) {
    await touch('touchMove', 80, 420 - i * 5);
    await page.waitForTimeout(50);
  }
  await touch('touchEnd', 80, 360);
  const after = await pos(page);
  console.log('iphone joystick:', before, '->', after);
  await page.screenshot({ path: '/tmp/claude-0/-home-user-3d-gen-world/0b6987f9-f800-54d3-8b27-066edc9910d1/scratchpad/shots/iphone2.png' });
}
await browser.close();
