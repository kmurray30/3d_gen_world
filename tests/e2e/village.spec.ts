import { expect, test, type Page } from '@playwright/test';

/* eslint-disable @typescript-eslint/no-explicit-any */
async function enterVillage(page: Page): Promise<void> {
  await page.goto('/?preset=village');
  await page.fill('input[name=passcode]', 'test-pass');
  await page.press('input[name=passcode]', 'Enter');
  await page.waitForURL(/\/w\/[a-z]+-[a-z]+-\d{4}/);
  await page.waitForFunction(() => !!(window as any).__game);
}

test('village preset: structures load, views cycle, walls fade, the player walks into a house', async ({ page, isMobile }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await enterVillage(page);
  const gens = await page.evaluate(() => (window as any).__game.engine.world.list().filter((e: any) => e.structure).map((e: any) => e.structure.gen).sort());
  expect(gens).toEqual(['bunker', 'gingerbread', 'house', 'house', 'house', 'lighthouse', 'witch_hut', 'yard']);
  // structures are drawn with their own views
  await page.waitForFunction(() => (window as any).__game.scene.structures.size === 8);

  // view toolbar: first -> third -> free -> first; angle cycles in third person; walls toggle
  await page.click('button[data-view=view]');
  expect(await page.evaluate(() => (window as any).__game.camera.mode)).toBe('third');
  await expect(page.locator('button[data-view=view] .v')).toHaveText('3rd person');
  await page.click('button[data-view=angle]');
  await expect(page.locator('button[data-view=angle] .v')).toHaveText('bird');
  await page.click('button[data-view=walls]');
  await expect(page.locator('button[data-view=walls] .v')).toHaveText('solid');
  await page.click('button[data-view=walls]');
  await page.click('button[data-view=view]');
  expect(await page.evaluate(() => (window as any).__game.camera.mode)).toBe('free');
  await page.click('button[data-view=view]');
  expect(await page.evaluate(() => (window as any).__game.camera.mode)).toBe('first');
  // the choice is remembered on this device
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('pw.view')!).angle)).toBe(2);

  if (!isMobile) {
    // hotkeys
    await page.keyboard.press('KeyV');
    expect(await page.evaluate(() => (window as any).__game.camera.mode)).toBe('third');
    await page.keyboard.press('KeyV');
    await page.keyboard.press('KeyV');
    expect(await page.evaluate(() => (window as any).__game.camera.mode)).toBe('first');

    // stand in front of house_1's doorway (found from the wall part with an opening), walk forward, end up inside
    await page.evaluate(() => {
      const g = (window as any).__game;
      const h = g.engine.world.get('house_1');
      const p = g.engine.world.player;
      const rot = (v: number[], deg: number) => {
        const c = Math.cos((deg * Math.PI) / 180);
        const s = Math.sin((deg * Math.PI) / 180);
        return [v[0] * c + v[2] * s, v[1], -v[0] * s + v[2] * c];
      };
      const wall = h.structure.parts.find((q: any) => q.t === 'wall' && q.openings?.length);
      const door = rot([wall.openings[0].at, 0, 0], wall.rot ?? 0).map((v, i) => v + wall.pos[i]);
      const out = rot([0, 0, 1], wall.rot ?? 0);
      const start = door.map((v, i) => v + out[i] * 1.6);
      const w = rot(start, h.yaw).map((v, i) => v + h.pos[i]);
      const wd = rot(door, h.yaw).map((v, i) => v + h.pos[i]);
      p.pos = [w[0], 0, w[2]];
      p.yaw = Math.atan2(-(wd[0] - w[0]), -(wd[2] - w[2]));
    });
    const isInside = () => {
      const g = (window as any).__game;
      const h = g.engine.world.get('house_1');
      const p = g.engine.world.player.pos;
      return Math.hypot(p[0] - h.pos[0], p[2] - h.pos[2]) < Math.min(h.structure.bounds.w, h.structure.bounds.d) / 2 - 0.3;
    };
    await page.keyboard.down('KeyW');
    await page.waitForFunction(isInside, null, { timeout: 10000 }).catch(() => undefined);
    await page.keyboard.up('KeyW');
    expect(await page.evaluate(isInside)).toBe(true);

    // walk at a wall from inside: blocked, still inside
    await page.keyboard.down('KeyA');
    await page.waitForTimeout(1500);
    await page.keyboard.up('KeyA');
    const stillInside = await page.evaluate(() => {
      const g = (window as any).__game;
      const h = g.engine.world.get('house_1');
      const p = g.engine.world.player.pos;
      return Math.hypot(p[0] - h.pos[0], p[2] - h.pos[2]) < Math.hypot(h.structure.bounds.w, h.structure.bounds.d) / 2;
    });
    expect(stillInside).toBe(true);

    // on the bunker's first patio the ground is raised
    await page.evaluate(() => {
      const g = (window as any).__game;
      const b = g.engine.world.get('bunker_1');
      g.engine.world.player.pos = [b.pos[0], 3.4, b.pos[2]];
    });
    await page.waitForTimeout(300);
    expect(await page.evaluate(() => (window as any).__game.engine.playerGround)).toBeGreaterThan(3);
  }

  // a mock command that builds a custom structure streams a build step and the scene shows it
  await page.fill('.cmd input', 'build a wizard tower with a crooked hat');
  await page.press('.cmd input', 'Enter');
  await page.waitForFunction(() => (window as any).__game.scene.structures.size === 9, null, { timeout: 20000 });
  await page.waitForFunction(() => !(window as any).__game.engine.busy, null, { timeout: 20000 });
  const tower = await page.evaluate(() => (window as any).__game.engine.world.list().find((e: any) => e.structure?.gen === 'custom'));
  expect(tower.scale).toBeCloseTo(1, 2);
  expect(errors).toEqual([]);
});
