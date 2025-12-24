import { expect, test, type Page } from '@playwright/test';
import { prepareForVisualSnapshot } from './visualHarness';

test.describe('visual: game (Ultimate Sudoku)', () => {
  async function startGame(page: Page) {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Ultimate Sudoku' })).toBeVisible();
    await page.getByRole('button', { name: 'Play Game' }).click();
    await expect(page.getByText('Select Difficulty')).toBeVisible();
    await page.getByRole('button', { name: 'Easy' }).click();
    await expect(page.getByRole('button', { name: 'Menu' })).toBeVisible();
  }

  async function snapshotGame(page: Page, name: string) {
    const vp = page.viewportSize();
    if (vp) {
      await page.mouse.move(vp.width - 1, vp.height - 1);
    } else {
      await page.mouse.move(1, 1);
    }
    await expect(page.getByTestId('make-screen')).toHaveScreenshot(name);
  }

  test('mobile.playing', async ({ page }) => {
    await prepareForVisualSnapshot(page, 'mobile');
    await startGame(page);
    await snapshotGame(page, 'game.playing.mobile.png');
  });

  test('mobile.menuOpen', async ({ page }) => {
    await prepareForVisualSnapshot(page, 'mobile');
    await startGame(page);
    await page.getByRole('button', { name: 'Menu' }).click();
    await expect(page.getByLabel('Close menu')).toBeVisible();
    await snapshotGame(page, 'game.menu.mobile.png');
  });

  test('tablet.playing', async ({ page }) => {
    await prepareForVisualSnapshot(page, 'tablet');
    await startGame(page);
    await snapshotGame(page, 'game.playing.tablet.png');
  });

  test('tablet.menuOpen', async ({ page }) => {
    await prepareForVisualSnapshot(page, 'tablet');
    await startGame(page);
    await page.getByRole('button', { name: 'Menu' }).click();
    await expect(page.getByLabel('Close menu')).toBeVisible();
    await snapshotGame(page, 'game.menu.tablet.png');
  });

  test('desktop.playing', async ({ page }) => {
    await prepareForVisualSnapshot(page, 'desktop');
    await startGame(page);
    await snapshotGame(page, 'game.playing.desktop.png');
  });

  test('desktop.menuOpen', async ({ page }) => {
    await prepareForVisualSnapshot(page, 'desktop');
    await startGame(page);
    await page.getByRole('button', { name: 'Menu' }).click();
    await expect(page.getByLabel('Close menu')).toBeVisible();
    await snapshotGame(page, 'game.menu.desktop.png');
  });
});


