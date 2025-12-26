import { expect, test, type Page } from '@playwright/test';
import { prepareForVisualSnapshot } from './visualHarness';

test.describe('visual: auth modal (Ultimate Sudoku)', () => {
  async function snap(page: Page, name: string) {
    const vp = page.viewportSize();
    if (vp) await page.mouse.move(vp.width - 1, vp.height - 1);
    await expect(page.getByTestId('make-screen')).toHaveScreenshot(name);
  }

  test('mobile', async ({ page }) => {
    await prepareForVisualSnapshot(page, 'mobile');
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Ultimate Sudoku' })).toBeVisible();
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page.getByText('Welcome to Ultimate Sudoku', { exact: true })).toBeVisible();
    await snap(page, 'auth.mobile.png');
  });

  test('tablet', async ({ page }) => {
    await prepareForVisualSnapshot(page, 'tablet');
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Ultimate Sudoku' })).toBeVisible();
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page.getByText('Welcome to Ultimate Sudoku', { exact: true })).toBeVisible();
    await snap(page, 'auth.tablet.png');
  });

  test('desktop', async ({ page }) => {
    await prepareForVisualSnapshot(page, 'desktop');
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Ultimate Sudoku' })).toBeVisible();
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page.getByText('Welcome to Ultimate Sudoku', { exact: true })).toBeVisible();
    await snap(page, 'auth.desktop.png');
  });
});


