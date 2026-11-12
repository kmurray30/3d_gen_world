// Reaction clips on the paper and 3D versions of one figure, captured mid-clip:
//   node scripts/shots-anims.mjs http://localhost:8793 out-dir man wave,cheer,point
import { chromium } from 'playwright';
import fs from 'node:fs';
const [base = 'http://localhost:8787', out = 'test-results/anims', key = 'man', list] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const executablePath = process.env.PW_CHROMIUM ?? (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const browser = await chromium.launch({ executablePath, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await (await browser.newContext({ viewport: { width: 900, height: 600 } })).newPage();
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
await page.waitForTimeout(1000);
const id = key.replace(/\s+/g, '_');
const info = await page.evaluate((id) => {
  const w = window.__game.engine.world;
  const a = w.get(`${id}_paper`), b = w.get(`${id}_toon`);
  return { a: a.pos, b: b.pos, h: a.heightM };
}, id);
const cx = (info.a[0] + info.b[0]) / 2;
const d = Math.max(Math.abs(info.b[0] - info.a[0]) * 1.2, info.h * 1.25) + 0.3;
await page.evaluate(([p, y, pt]) => { const g = window.__game; g.camera.teleport(p, y, pt, g.engine.world.player); }, [[cx, info.h * 0.55, info.a[2] + d], 0, -0.05]);
const clips = (list ?? 'wave,cheer,tada,point,shrug,jump,dance,think,scared,clap,bow,facepalm,stomp,laugh,love,yawn').split(',');
for (const clip of clips) {
  await page.evaluate(([id, clip]) => {
    const s = window.__game.scene;
    s.react(`${id}_paper`, clip);
    s.react(`${id}_toon`, clip);
  }, [id, clip]);
  await page.waitForTimeout(clip === 'jump' ? 550 : 850);
  await page.screenshot({ path: `${out}/${id}-${clip}.png` });
  await page.waitForTimeout(2200);
}
console.log('done', clips.length, 'errors', errors);
await browser.close();
