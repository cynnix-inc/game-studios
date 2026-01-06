import { expect, test, type Page } from '@playwright/test';
import { prepareForVisualSnapshot } from './visualHarness';

test.describe('visual: difficulty (Ultimate Sudoku)', () => {
  async function gotoDifficulty(page: Page) {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Ultimate Sudoku' })).toBeVisible();
    await page.getByRole('button', { name: 'Free Play play' }).click();
    await expect(page.getByText('Select Difficulty')).toBeVisible();
  }

  test('mobile', async ({ page }) => {
    await prepareForVisualSnapshot(page, 'mobile');
    await gotoDifficulty(page);
    await page.mouse.move(0, 0);
    await expect(page.getByTestId('make-screen')).toHaveScreenshot('difficulty.mobile.png');
  });

  test('tablet', async ({ page }) => {
    await prepareForVisualSnapshot(page, 'tablet');
    await gotoDifficulty(page);
    await page.mouse.move(0, 0);
    await expect(page.getByTestId('make-screen')).toHaveScreenshot('difficulty.tablet.png');
  });

  test('desktop', async ({ page }) => {
    await prepareForVisualSnapshot(page, 'desktop');
    await gotoDifficulty(page);
    await page.mouse.move(0, 0);
    await expect(page.getByTestId('make-screen')).toHaveScreenshot('difficulty.desktop.png');
  });
});


