import { expect, test } from '@playwright/test';

/* eslint-disable @typescript-eslint/no-explicit-any */
test('start screen -> Everytown: every thing in its place, only nearby things drawn, name tags, acts on click, read-only', async ({ page, isMobile }) => {
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
  await page.click('button[data-start=town]');
  await page.waitForURL((u) => u.pathname === '/town');
  await page.waitForFunction(() => !!(window as any).__game, null, { timeout: 90_000 });
  const info = await page.evaluate(() => {
    const g = (window as any).__game;
    const list = g.engine.world.list();
    return { size: list.length, things: list.filter((e: any) => /^(a|st|sky)_/.test(e.id) && !e.state.setup).length, look: g.scene.look, cull: g.scene.cullRadius, walkers: list.filter((e: any) => e.state.wander).length, maps: list.filter((e: any) => e.word === 'map' && e.structure).length };
  });
  expect(info.things).toBeGreaterThan(3500);
  expect(info.look).toBe('cel');
  expect(info.cull).toBeLessThan(100);
  expect(info.walkers).toBeGreaterThanOrEqual(40);
  expect(info.maps).toBeGreaterThan(4);
  // only what is near the camera gets a view
  await page.waitForTimeout(2500);
  const drawn = await page.evaluate(() => {
    const g = (window as any).__game;
    return g.scene.views.size + g.scene.figures.size + g.scene.structures.size;
  });
  expect(drawn).toBeGreaterThan(0);
  expect(drawn).toBeLessThan(info.size / 3);
  // walk up to the toaster and see things tagged with their names
  await page.evaluate(() => {
    const g = (window as any).__game;
    const t = g.engine.world.list().find((e: any) => e.word === 'toaster' && !e.state.setup);
    g.engine.world.player.pos = [t.pos[0], 0, t.pos[2] + 1.5];
  });
  await page.waitForFunction(() => [...document.querySelectorAll('.nametag')].some((el) => (el as HTMLElement).style.display !== 'none' && el.textContent), null, { timeout: 30_000 });
  // the toaster starts with bread in it; clicking it toasts the bread, and nothing is ever saved
  const before = await page.evaluate(() => {
    const g = (window as any).__game;
    const t = g.engine.world.list().find((e: any) => e.word === 'toaster' && !e.state.setup);
    return { id: t.id, kids: g.engine.world.children(t.id).map((k: any) => k.word) };
  });
  expect(before.kids.length).toBeGreaterThan(0);
  expect(await page.evaluate((id) => (window as any).__game.engine.poke(id), before.id)).toBe(true);
  // the act takes about five seconds of game time; step it here (a software renderer draws the town slowly)
  const after = await page.evaluate((id) => {
    const g = (window as any).__game;
    for (let i = 0; i < 160; i++) g.engine.update(0.05);
    return g.engine.world.children(id).map((k: any) => k.word);
  }, before.id);
  expect(after).toEqual(['toast', 'toast']);
  await page.waitForTimeout(1500);
  expect(puts).toEqual([]);
  if (!isMobile) expect(errors).toEqual([]);
});
