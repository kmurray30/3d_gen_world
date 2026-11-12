import { expect, test } from '@playwright/test';

/* eslint-disable @typescript-eslint/no-explicit-any */
test('start screen -> visuals demo: figures in paper and 3D, clicks make them react, the Look setting switches styles', async ({ page, isMobile }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto('/');
  await page.fill('input[name=passcode]', 'test-pass');
  await page.press('input[name=passcode]', 'Enter');
  await expect(page.locator('button[data-start=village]')).toBeVisible();
  await page.click('button[data-start=gallery]');
  await page.waitForURL(/\/w\/[a-z]+-[a-z]+-\d{4}/);
  await page.waitForFunction(() => !!(window as any).__game);
  // every sample figure stands as sprite, paper and 3D; the paper and 3D ones are figure views
  const counts = await page.evaluate(() => {
    const list = (window as any).__game.engine.world.list();
    return { sprite: list.filter((e: any) => e.look === 'sprite').length, paper: list.filter((e: any) => e.look === 'paper').length, toon: list.filter((e: any) => e.look === 'toon').length };
  });
  expect(counts.paper).toBeGreaterThanOrEqual(25);
  expect(counts.toon).toBe(counts.paper);
  expect(counts.sprite).toBe(counts.paper);
  await page.waitForFunction((n) => (window as any).__game.scene.figures.size === n, counts.paper * 2);

  // poke the 3D man: the engine reacts and so does the figure (a random reaction clip)
  const reacting = await page.evaluate(() => {
    const g = (window as any).__game;
    g.engine.poke('man_toon');
    g.engine.update(0.05);
    g.scene.sync(g.engine.world, 0.05, g.camera.pose);
    return g.scene.figures.get('man_toon').animator.reacting;
  });
  expect(reacting).toBeTruthy();

  // the Look setting turns things with a figure into paper or 3D everywhere (gallery pieces keep their own look)
  if (!isMobile) {
    await page.click('button[data-view=look]');
    await expect(page.locator('button[data-view=look] .v')).toHaveText('paper');
    await page.click('button[data-view=look]');
    await expect(page.locator('button[data-view=look] .v')).toHaveText('3D');
    expect(await page.evaluate(() => (window as any).__game.scene.look)).toBe('toon');
    await page.click('button[data-view=look]');
    await expect(page.locator('button[data-view=look] .v')).toHaveText('sprites');
  }

  // a second visit from the start screen reopens the same demo world
  const slug = new URL(page.url()).pathname;
  await page.goto('/');
  await page.click('button[data-start=gallery]');
  await page.waitForURL((u) => u.pathname === slug);
  expect(errors).toEqual([]);
});
