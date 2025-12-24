import { expect, test } from '@playwright/test';
import { prepareForVisualSnapshot } from './visualHarness';

test.describe('visual: menu (Ultimate Sudoku)', () => {
  test('mobile', async ({ page }) => {
    await prepareForVisualSnapshot(page, 'mobile');
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Ultimate Sudoku' })).toBeVisible();

    const screen = page.getByTestId('make-screen');
    await expect(screen).toBeVisible();
    await expect(screen).toHaveScreenshot('menu.mobile.png');
  });

  test('tablet', async ({ page }) => {
    await prepareForVisualSnapshot(page, 'tablet');
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Ultimate Sudoku' })).toBeVisible();

    const screen = page.getByTestId('make-screen');
    await expect(screen).toBeVisible();
    await expect(screen).toHaveScreenshot('menu.tablet.png');
  });

  test('desktop', async ({ page }) => {
    await prepareForVisualSnapshot(page, 'desktop');
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Ultimate Sudoku' })).toBeVisible();

    const screen = page.getByTestId('make-screen');
    await expect(screen).toBeVisible();
    await expect(screen).toHaveScreenshot('menu.desktop.png');
  });
});


