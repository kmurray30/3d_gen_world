// Screenshots of every built prop on an empty meadow, close up from the front, the side and above, and at night:
//   cd scripts && npx tsx shots-props.ts http://localhost:8787 ../test-results/props
import { chromium } from 'playwright';
import fs from 'node:fs';
import { generate, coerceParams, PROP_GENS, type GenName } from '../src/shared/structure/index';
import { structureEntity } from '../src/shared/structure/entity';

const base = process.argv[2] ?? 'http://localhost:8787';
const out = process.argv[3] ?? '../test-results/props';
fs.mkdirSync(out, { recursive: true });

const props: Array<{ gen: GenName; params?: Record<string, unknown>; seed: number }> = [
  { gen: 'fountain', params: { tiers: 1 }, seed: 3 },
  { gen: 'fountain', params: { tiers: 2 }, seed: 5 },
  ...PROP_GENS.filter((g) => g !== 'fountain').map((gen, i) => ({ gen, seed: 11 + i })),
];
const entities = props.map((p, i) => {
  const s = generate(p.gen, coerceParams(p.gen, p.params ?? {}), p.seed, () => null)!;
  return structureEntity(`${p.gen}_${i}`, p.gen.replace('_', ' '), s, [(i % 5) * 12 - 24, 0, -Math.floor(i / 5) * 14 - 10], 0, 0);
});

const executablePath = process.env.PW_CHROMIUM ?? (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const browser = await chromium.launch({ executablePath, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await (await browser.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
const errors: string[] = [];
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
page.on('pageerror', (e) => errors.push(String(e)));
await page.goto(base, { waitUntil: 'networkidle' });
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
const shot = async (name: string, wait = 700) => {
  await page.waitForTimeout(wait);
  await page.screenshot({ path: `${out}/${name}.png` });
  console.log(`saved ${name}`);
};
const sky = (t: string) => page.evaluate((time) => {
  const g = (window as any).__game;
  g.engine.world.sky = time;
  g.scene.sky.set(time, true);
}, t);

for (const [i, e] of entities.entries()) {
  const b = e.structure!.bounds;
  const size = Math.max(b.w, b.d, b.h);
  const d = size * 1.05 + 0.9;
  const target = [e.pos[0], b.h * 0.45, e.pos[2]];
  const name = `${String(i).padStart(2, '0')}-${e.id}`;
  await lookAt(target, [e.pos[0] + d * 0.35, b.h * 0.6 + 0.6, e.pos[2] + d]);
  await shot(`${name}-front`);
  await lookAt(target, [e.pos[0] + d, b.h * 0.7 + 0.8, e.pos[2] - d * 0.25]);
  await shot(`${name}-side`);
  await lookAt(target, [e.pos[0] + 0.01, b.h + d * 0.9, e.pos[2] + d * 0.55]);
  await shot(`${name}-above`);
}
await sky('night');
for (const [i, e] of entities.entries()) {
  if (!/lamppost|fountain_0/.test(e.id)) continue;
  const b = e.structure!.bounds;
  const d = Math.max(b.w, b.d, b.h) * 1.05 + 0.9;
  await lookAt([e.pos[0], b.h * 0.5, e.pos[2]], [e.pos[0] + d * 0.4, b.h * 0.6 + 0.5, e.pos[2] + d]);
  await shot(`${String(i).padStart(2, '0')}-${e.id}-night`, 1500);
}
console.log(errors.length ? `errors:\n${errors.join('\n')}` : 'no errors');
await browser.close();
