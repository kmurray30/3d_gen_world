// Headless screenshots of the running app for quick visual checks: node scripts/screenshot.mjs <url> <outdir>
import { chromium, devices } from 'playwright';
import fs from 'node:fs';

const url = process.argv[2] ?? 'http://localhost:8787/';
const out = process.argv[3] ?? 'test-results/shots';
fs.mkdirSync(out, { recursive: true });
const executablePath = process.env.PW_CHROMIUM ?? (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const browser = await chromium.launch({
  executablePath,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
const shots = [
  { name: 'desktop', ctx: { viewport: { width: 1280, height: 720 } } },
  { name: 'iphone', ctx: { ...devices['iPhone 14'] } },
];
for (const s of shots) {
  const context = await browser.newContext(s.ctx);
  const page = await context.newPage();
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${out}/${s.name}.png` });
  console.log(`${s.name}: saved; console errors: ${errors.length ? errors.join(' | ') : 'none'}`);
  await context.close();
}
await browser.close();
