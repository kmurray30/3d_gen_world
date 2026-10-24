// Facing/idle shots: node scripts/shots-facing.mjs http://localhost:8793 out-dir
import { chromium } from 'playwright';
import fs from 'node:fs';
const base = process.argv[2];
const out = process.argv[3];
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await (await browser.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push(String(e)));
await page.goto(`${base}/`, { waitUntil: 'networkidle' });
await page.fill('input[name=passcode]', 'test-pass');
await page.press('input[name=passcode]', 'Enter');
await page.waitForURL(/\/w\//);
await page.waitForFunction(() => !!window.__game);
await page.waitForTimeout(1500);
const shot = async (name) => { await page.waitForTimeout(600); await page.screenshot({ path: `${out}/${name}.png` }); console.log('saved', name); };
const look = (pos, yaw, pitch) => page.evaluate(([p, y, pt]) => { const g = window.__game; g.camera.teleport(p, y, pt, g.engine.world.player); }, [pos, yaw, pitch]);

// spawn a few living things in front of the player via a hand script, then look at them from the side
await page.evaluate(async () => {
  const g = window.__game;
  const steps = [
    { op: 'spawn', ref: 'd', word: 'dog', at: { rel: 'front', dist: 'near' } },
    { op: 'spawn', ref: 'm', word: 'man', at: { rel: 'left', dist: 'near' } },
    { op: 'spawn', ref: 'c', word: 'cat', at: { rel: 'right', dist: 'near' } },
  ];
  const res = await fetch(location.pathname.replace('/w/', '/api/worlds/') + '/script', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ steps, context: { player: { pos: g.engine.world.player.pos, yaw: g.engine.world.player.yaw }, entities: [] } }) });
  const text = await res.text();
  const s = g.engine.open('shot');
  for (const line of text.split('\n')) { if (!line.trim()) continue; const ev = JSON.parse(line); if (ev.t === 'step') g.engine.append(s, ev.step); }
  g.engine.seal(s);
});
await page.waitForTimeout(2500);
const info = await page.evaluate(() => window.__game.engine.world.list().filter((e) => /^(d|m|c)_/.test(e.id)).map((e) => ({ id: e.id, pos: e.pos, yaw: e.yaw })));
console.log(JSON.stringify(info));
const dog = info.find((e) => e.id.startsWith('d_'));
// from the front (where the player stands) everything faces us
await shot('01-front');
// from the side: 90 degrees around the dog, at eye height; cutouts should show their edge-on-ish profile
const p = dog.pos;
await look([p[0] + 4, 1.4, p[2]], Math.PI / 2, -0.1);
await shot('02-side');
await look([p[0], 1.6, p[2] - 4], Math.PI, -0.1);
await shot('03-behind');
// idle life: wait and compare yaws/positions
await page.evaluate(() => { const g = window.__game; g.camera.setMode('first', g.engine.world.player); });
await page.waitForTimeout(16000);
const after = await page.evaluate(() => window.__game.engine.world.list().filter((e) => /^(d|m|c)_/.test(e.id)).map((e) => ({ id: e.id, pos: e.pos, yaw: e.yaw })));
console.log('after idle', JSON.stringify(after));
await shot('04-after-idle');
// door: poke the house and look at the doorway
const house = await page.evaluate(() => { const g = window.__game; const h = g.engine.world.list().find((e) => e.structure && e.structure.parts.some((p) => p.t === 'decal' && p.role === 'door')); return h ? { id: h.id, pos: h.pos, yaw: h.yaw ?? 0, b: h.structure.bounds, door: h.state.door_open } : null; });
console.log('house', JSON.stringify(house));
if (house) {
  const yawRad = (house.yaw * Math.PI) / 180;
  const d = house.b.d / 2 + 3.5;
  const cam = [house.pos[0] + Math.sin(yawRad) * d, 1.6, house.pos[2] + Math.cos(yawRad) * d];
  const yaw = Math.atan2(-(house.pos[0] - cam[0]), -(house.pos[2] - cam[2]));
  await look(cam, yaw, -0.05);
  await shot('05-door-closed');
  const poked = await page.evaluate((id) => window.__game.engine.poke(id), house.id);
  console.log('poked', poked);
  await page.waitForTimeout(900);
  await shot('06-door-open');
  // the pick hit test: what is under the crosshair from here
  const picked = await page.evaluate(() => window.__game.scene.pick(0, 0));
  console.log('picked at crosshair', picked);
}
// third person avatar: walk sideways and check the avatar turns with its walk direction
await page.evaluate(() => { const g = window.__game; g.camera.setMode('third', g.engine.world.player); g.camera.setAngle(0, g.engine.world.player); });
await page.keyboard.down('a');
await page.waitForTimeout(700);
await shot('07-avatar-walk-left');
await page.keyboard.up('a');
await page.keyboard.down('w');
await page.waitForTimeout(700);
await shot('08-avatar-walk-forward');
await page.keyboard.up('w');
console.log('errors', errors);
await browser.close();
