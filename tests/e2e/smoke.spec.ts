import { expect, test, type Page } from '@playwright/test';

/* eslint-disable @typescript-eslint/no-explicit-any */
// window.__game is exposed by the client for tests (see src/client/app.ts).
async function enter(page: Page): Promise<void> {
  await page.goto('/');
  await page.fill('input[name=passcode]', 'test-pass');
  await page.press('input[name=passcode]', 'Enter');
  await page.waitForURL(/\/w\/[a-z]+-[a-z]+-\d{4}/);
  await page.waitForFunction(() => !!(window as any).__game);
}

const size = (page: Page) => page.evaluate(() => (window as any).__game.engine.world.size);

test('passcode, new world, command, persistence, undo, reset', async ({ page, isMobile }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await enter(page);
  const url = page.url();
  const n0 = await size(page);
  expect(n0).toBeGreaterThan(3);

  await page.fill('.cmd input', 'a dog walks up to me');
  await page.press('.cmd input', 'Enter');
  await page.waitForFunction((n) => (window as any).__game.engine.world.size === n + 1, n0);
  // the dog approaches the player and stops at a sensible distance
  await page.waitForFunction(() => !(window as any).__game.engine.busy, null, { timeout: 20000 });
  const dog = await page.evaluate(() => (window as any).__game.engine.world.list().find((e: { id: string }) => e.id.startsWith('dog'))!.pos);
  const player = await page.evaluate(() => (window as any).__game.engine.world.player.pos);
  const dist = Math.hypot(dog[0] - player[0], dog[2] - player[2]);
  expect(dist).toBeGreaterThan(0.4);
  expect(dist).toBeLessThan(4);

  // saved: a reload of the same link keeps the dog
  await page.waitForTimeout(1500);
  await page.reload();
  await page.waitForFunction(() => !!(window as any).__game);
  expect(page.url()).toBe(url);
  expect(await size(page)).toBe(n0 + 1);

  if (!isMobile) {
    await page.click('.menu-btn');
    await page.click('button[data-act=undo]');
    await page.waitForFunction((n) => (window as any).__game.engine.world.size === n, n0);
    await page.click('.menu-btn');
    await page.click('button[data-act=reset]');
    await page.waitForTimeout(800);
    expect(await size(page)).toBe(n0);
  }
  expect(errors).toEqual([]);
});

test('movement: keyboard on desktop, joystick on touch', async ({ page, isMobile, context }) => {
  await enter(page);
  const before = await page.evaluate(() => [...(window as any).__game.engine.world.player.pos]);
  if (isMobile) {
    const cdp = await context.newCDPSession(page);
    const touch = (type: 'touchStart' | 'touchMove' | 'touchEnd', x: number, y: number) =>
      cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y }] });
    await touch('touchStart', 80, 420);
    for (let i = 1; i <= 10; i++) {
      await touch('touchMove', 80, 420 - i * 5);
      await page.waitForTimeout(40);
    }
    await page.waitForTimeout(400);
    await touch('touchEnd', 80, 370);
  } else {
    await page.keyboard.down('KeyW');
    await page.waitForTimeout(600);
    await page.keyboard.up('KeyW');
  }
  const after = await page.evaluate(() => [...(window as any).__game.engine.world.player.pos]);
  expect(Math.hypot(after[0] - before[0], after[2] - before[2])).toBeGreaterThan(0.5);
});
