import { expect, test, type Page } from '@playwright/test';
import { prepareForVisualSnapshot } from './visualHarness';

test.describe('visual: game (Ultimate Sudoku)', () => {
  async function startGame(page: Page) {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Ultimate Sudoku' })).toBeVisible();
    await page.getByRole('button', { name: 'Free Play play' }).click();
    await expect(page.getByText('Select Difficulty')).toBeVisible();
    await page.getByRole('button', { name: 'Easy' }).click();
    await expect(page.getByRole('button', { name: 'Menu', exact: true })).toBeVisible();
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
    await page.getByRole('button', { name: 'Menu', exact: true }).click();
    await expect(page.getByLabel('Close menu')).toBeVisible();
    await snapshotGame(page, 'game.menu.mobile.png');
  });

  test('mobile.autoPaused', async ({ page }) => {
    await prepareForVisualSnapshot(page, 'mobile');
    await page.addInitScript(() => {
      // @ts-expect-error - test-only visual flag
      globalThis.__VISUAL_GAME_AUTO_RESUME_OVERLAY__ = true;
    });
    await startGame(page);
    await expect(page.getByText('Welcome Back!', { exact: true })).toBeVisible();
    await snapshotGame(page, 'game.autopause.mobile.png');
  });

  test('tablet.playing', async ({ page }) => {
    await prepareForVisualSnapshot(page, 'tablet');
    await startGame(page);
    await snapshotGame(page, 'game.playing.tablet.png');
  });

  test('tablet.menuOpen', async ({ page }) => {
    await prepareForVisualSnapshot(page, 'tablet');
    await startGame(page);
    await page.getByRole('button', { name: 'Menu', exact: true }).click();
    await expect(page.getByLabel('Close menu')).toBeVisible();
    await snapshotGame(page, 'game.menu.tablet.png');
  });

  test('tablet.autoPaused', async ({ page }) => {
    await prepareForVisualSnapshot(page, 'tablet');
    await page.addInitScript(() => {
      // @ts-expect-error - test-only visual flag
      globalThis.__VISUAL_GAME_AUTO_RESUME_OVERLAY__ = true;
    });
    await startGame(page);
    await expect(page.getByText('Welcome Back!', { exact: true })).toBeVisible();
    await snapshotGame(page, 'game.autopause.tablet.png');
  });

  test('desktop.playing', async ({ page }) => {
    await prepareForVisualSnapshot(page, 'desktop');
    await startGame(page);
    await snapshotGame(page, 'game.playing.desktop.png');
  });

  test('desktop.menuOpen', async ({ page }) => {
    await prepareForVisualSnapshot(page, 'desktop');
    await startGame(page);
    await page.getByRole('button', { name: 'Menu', exact: true }).click();
    await expect(page.getByLabel('Close menu')).toBeVisible();
    await snapshotGame(page, 'game.menu.desktop.png');
  });

  test('desktop.autoPaused', async ({ page }) => {
    await prepareForVisualSnapshot(page, 'desktop');
    await page.addInitScript(() => {
      // @ts-expect-error - test-only visual flag
      globalThis.__VISUAL_GAME_AUTO_RESUME_OVERLAY__ = true;
    });
    await startGame(page);
    await expect(page.getByText('Welcome Back!', { exact: true })).toBeVisible();
    await snapshotGame(page, 'game.autopause.desktop.png');
  });

  test('desktop.playing.darkTheme.selectedHighlights', async ({ page }) => {
    await prepareForVisualSnapshot(page, 'desktop');
    await startGame(page);

    // Select a cell and enter a digit so same-number highlight can render.
    await page.getByRole('button', { name: /^Cell row 1 column 1/ }).click();
    await page.getByRole('button', { name: 'Digit 5' }).click();

    await snapshotGame(page, 'game.playing.desktop.dark.selected-highlights.png');
  });

  test('desktop.playing.lightTheme.selectedHighlights', async ({ page }) => {
    await prepareForVisualSnapshot(page, 'desktop');
    await page.addInitScript(() => {
      try {
        window.localStorage.setItem('ultimateSudoku.theme', 'light');
      } catch {
        // ignore
      }
    });
    await startGame(page);

    await page.getByRole('button', { name: /^Cell row 1 column 1/ }).click();
    await page.getByRole('button', { name: 'Digit 5' }).click();

    await snapshotGame(page, 'game.playing.desktop.light.selected-highlights.png');
  });
});


