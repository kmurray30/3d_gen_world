import { expect, test } from '@playwright/test';

/* eslint-disable @typescript-eslint/no-explicit-any */
test('start screen -> the Atlas: every thing laid out, only nearby things drawn, name tags, read-only', async ({ page, isMobile }) => {
  test.setTimeout(180_000);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  const puts: string[] = [];
  page.on('request', (r) => {
    if (r.method() === 'PUT') puts.push(r.url());
  });
  await page.goto('/');
  await page.fill('input[name=passcode]', 'test-pass');
  await page.press('input[name=passcode]', 'Enter');
  await page.click('button[data-start=atlas]');
  await page.waitForURL((u) => u.pathname === '/atlas');
  await page.waitForFunction(() => !!(window as any).__game, null, { timeout: 90_000 });
  const info = await page.evaluate(() => {
    const g = (window as any).__game;
    const list = g.engine.world.list();
    return { size: list.length, things: list.filter((e: any) => e.id.startsWith('a_')).length, look: g.scene.look, cull: g.scene.cullRadius };
  });
  expect(info.things).toBeGreaterThan(3500);
  expect(info.look).toBe('cel');
  expect(info.cull).toBeLessThan(100);
  // only what is near the camera gets a view
  await page.waitForTimeout(2500);
  const drawn = await page.evaluate(() => {
    const g = (window as any).__game;
    return g.scene.views.size + g.scene.figures.size + g.scene.structures.size;
  });
  expect(drawn).toBeGreaterThan(0);
  expect(drawn).toBeLessThan(info.size / 3);
  // walk to the first district and see things tagged with their names
  await page.evaluate(() => {
    const g = (window as any).__game;
    const first = g.engine.world.list().find((e: any) => e.id.startsWith('a_'));
    g.engine.world.player.pos = [first.pos[0], 0, first.pos[2] + 3];
  });
  await page.waitForFunction(() => [...document.querySelectorAll('.nametag')].some((el) => (el as HTMLElement).style.display !== 'none' && el.textContent), null, { timeout: 30_000 });
  // poking a thing works here too, and nothing is ever saved
  const poked = await page.evaluate(() => {
    const g = (window as any).__game;
    const id = [...g.scene.figures.keys()][0];
    return id ? g.engine.poke(id) : true;
  });
  expect(poked).toBe(true);
  await page.waitForTimeout(1500);
  expect(puts).toEqual([]);
  if (!isMobile) expect(errors).toEqual([]);
});
