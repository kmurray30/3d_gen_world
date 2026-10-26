// Screenshots of built things' moving pieces: the mailbox door and flag, the bin lid, the well bucket, lamps
// switched off, a fountain turned off, house windows and shutters, the exploded view and a roof coming off:
//   cd scripts && npx tsx shots-parts.ts http://localhost:8787 ../test-results/parts
import { chromium } from 'playwright';
import fs from 'node:fs';
import { generate, coerceParams, type GenName } from '../src/shared/structure/index';
import { structureEntity } from '../src/shared/structure/entity';

const base = process.argv[2] ?? 'http://localhost:8787';
const out = process.argv[3] ?? '../test-results/parts';
fs.mkdirSync(out, { recursive: true });

const decals = (word: string) => (word === 'door' ? { file: 'door.webp', w: 261, h: 399 } : word === 'window' ? { file: 'window.webp', w: 312, h: 373 } : null);
const make = (id: string, gen: GenName, params: Record<string, unknown>, pos: [number, number, number], seed = 4) =>
  structureEntity(id, gen.replace('_', ' '), generate(gen, coerceParams(gen, params), seed, decals)!, pos, 0, 0);
const entities = [
  make('mailbox_1', 'mailbox', { color: 'red' }, [0, 0, -10]),
  make('bin_1', 'trash_can', { color: 'green' }, [3, 0, -10]),
  make('well_1', 'well', {}, [8, 0, -10]),
  make('lamp_1', 'lamppost', {}, [14, 0, -10]),
  make('lamp_2', 'lamppost', {}, [16, 0, -10]),
  make('fountain_1', 'fountain', { tiers: 1 }, [-10, 0, -12]),
  make('house_1', 'house', { w: 7, d: 5, stories: 2, roof: 'gable', shutters: true, shutterColor: '#4e8fd6', chimney: true }, [0, 0, -30]),
];

const executablePath = process.env.PW_CHROMIUM ?? (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const browser = await chromium.launch({ executablePath, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await (await browser.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
const errors: string[] = [];
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
page.on('pageerror', (e) => errors.push(String(e)));
await page.goto(base, { waitUntil: 'networkidle' });
if (await page.locator('input[name=passcode]').count()) {
  await page.fill('input[name=passcode]', 'test-pass');
  await page.press('input[name=passcode]', 'Enter');
  await page.waitForURL(/\/w\//);
}
await page.waitForFunction(() => !!(window as any).__game);
await page.addStyleTag({ content: '.lock-overlay, .toasts, .hud { display: none !important; }' });
await page.evaluate((list) => {
  const g = (window as any).__game;
  for (const e of g.engine.world.list()) g.engine.world.remove(e.id);
  for (const e of list) g.engine.world.add(e);
}, entities);
await page.waitForTimeout(1500);

const lookAt = (target: number[], from: number[]) =>
  page.evaluate(
    ([t, f]) => {
      const g = (window as any).__game;
      const dx = t[0] - f[0];
      const dy = t[1] - f[1];
      const dz = t[2] - f[2];
      g.camera.teleport(f, Math.atan2(-dx, -dz), Math.atan2(dy, Math.hypot(dx, dz)), g.engine.world.player);
    },
    [target, from],
  );
const shot = async (name: string, wait = 900) => {
  await page.waitForTimeout(wait);
  await page.screenshot({ path: `${out}/${name}.png` });
  console.log(`saved ${name}`);
};
const run = (steps: unknown[]) => page.evaluate((s) => (window as any).__game.engine.run(s), steps);
const poke = (id: string, part?: string) => page.evaluate(([i, p]) => (window as any).__game.engine.poke(i, p), [id, part] as const);
const sky = (t: string) =>
  page.evaluate((time) => {
    const g = (window as any).__game;
    g.engine.world.sky = time;
    g.scene.sky.set(time, true);
  }, t);
const pickAt = (target: number[], from: number[]) =>
  page.evaluate(async ([t, f]) => {
    const g = (window as any).__game;
    const dx = t[0] - f[0];
    const dy = t[1] - f[1];
    const dz = t[2] - f[2];
    g.camera.teleport(f, Math.atan2(-dx, -dz), Math.atan2(dy, Math.hypot(dx, dz)), g.engine.world.player);
    await new Promise((r) => setTimeout(r, 300));
    return g.scene.pickPart(0, 0);
  }, [target, from]);

// the mailbox: closed, the door picked and clicked open, the flag up
await lookAt([0, 1.1, -10], [0.8, 1.35, -9.0]);
await shot('mailbox-closed');
console.log('mailbox door pick', JSON.stringify(await pickAt([0, 1.08, -9.77], [0.6, 1.3, -8.4])));
await lookAt([0, 1.1, -10], [0.8, 1.35, -9.0]);
await poke('mailbox_1', 'door');
await shot('mailbox-door-open');
await poke('mailbox_1', 'flag');
await shot('mailbox-flag-up', 1300);
await lookAt([0, 1.1, -10], [1.6, 1.3, -10.4]);
await shot('mailbox-side');

// the bin's lid, the well's bucket
await run([{ op: 'operate', id: 'bin_1', part: 'lid', to: 'open' }, { op: 'operate', id: 'well_1', part: 'bucket', to: 'down' }]);
await lookAt([3, 0.6, -10], [4.3, 1.6, -8.6]);
await shot('bin-open');
await lookAt([8, 1.4, -10], [9.8, 2.6, -7.4]);
await shot('well-bucket-down', 2000);

// lamps at night, one switched off
await sky('night');
await run([{ op: 'operate', id: 'lamp_2', part: 'light', to: 'off' }]);
await lookAt([15, 2.4, -10], [15, 2.2, -4.5]);
await shot('lamps-night-one-off', 1200);
await sky('day');

// the fountain off and on
await run([{ op: 'operate', id: 'fountain_1', part: 'water', to: 'off' }]);
await lookAt([-10, 1, -12], [-6.5, 2.6, -7]);
await shot('fountain-off', 1400);
await run([{ op: 'operate', id: 'fountain_1', part: 'water', to: 'on' }]);
await shot('fountain-on', 1400);

// the house: as built, windows open, shutters closed on some, at night, apart, roof off
await lookAt([0, 2.5, -30], [3.5, 2.6, -21]);
await shot('house');
const win = await page.evaluate(() => {
  const e = (window as any).__game.engine.world.get('house_1');
  const p = e.structure.parts.find((q: any) => q.role === 'window' && !q.rot);
  return [e.pos[0] + p.pos[0], e.pos[1] + p.pos[1] + p.h / 2, e.pos[2] + p.pos[2]];
});
console.log('window pick', JSON.stringify(await pickAt(win, [win[0] + 0.5, win[1] + 0.2, win[2] + 4])));
await poke('house_1', 'window_0');
await shot('house-window-clicked', 1000);
await poke('house_1', 'window_0');
await page.waitForTimeout(800);
await lookAt([0, 2.5, -30], [3.5, 2.6, -21]);
await run([{ op: 'operate', id: 'house_1', part: 'windows', to: 'open' }]);
await shot('house-windows-open');
await run([{ op: 'operate', id: 'house_1', part: 'shutters', to: 'closed' }]);
await shot('house-shutters-closed', 1300);
await run([{ op: 'operate', id: 'house_1', part: 'window_0', to: 'open' }, { op: 'operate', id: 'house_1', part: 'window_1', to: 'open' }]);
await sky('night');
await shot('house-night-two-open', 1300);
await sky('day');
await run([{ op: 'anim', id: 'house_1', name: 'apart' }]);
await shot('house-apart', 1100);
await page.waitForTimeout(1800);
await run([{ op: 'detach', id: 'house_1', part: 'roof', newId: 'roof_1' }]);
await lookAt([0, 2, -30], [9, 4.5, -18]);
await shot('house-roof-off', 2500);
await run([{ op: 'reattach', id: 'roof_1' }]);
await shot('house-roof-back', 1000);
await run([{ op: 'anim', id: 'mailbox_1', name: 'apart' }]);
await lookAt([0, 1.1, -10], [1.4, 1.5, -8.3]);
await shot('mailbox-apart', 1000);
console.log('describe', JSON.stringify(await page.evaluate(() => (window as any).__game.engine.world.get('house_1').state)));
console.log('errors', JSON.stringify(errors));
await browser.close();
