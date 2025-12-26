import { expect, test, type Page } from '@playwright/test';
import { prepareForVisualSnapshot } from './visualHarness';

test.describe('visual: stats (Ultimate Sudoku)', () => {
  async function snap(page: Page, name: string) {
    const vp = page.viewportSize();
    if (vp) await page.mouse.move(vp.width - 1, vp.height - 1);
    await expect(page.getByTestId('make-screen')).toHaveScreenshot(name);
  }

  test('mobile', async ({ page }) => {
    await prepareForVisualSnapshot(page, 'mobile', { ultimateState: { screen: 'stats' } });
    await page.goto('/');
    await expect(page.getByText('Your Stats', { exact: true })).toBeVisible();
    await snap(page, 'stats.mobile.png');
  });

  test('tablet', async ({ page }) => {
    await prepareForVisualSnapshot(page, 'tablet', { ultimateState: { screen: 'stats' } });
    await page.goto('/');
    await expect(page.getByText('Your Stats', { exact: true })).toBeVisible();
    await snap(page, 'stats.tablet.png');
  });

  test('desktop', async ({ page }) => {
    await prepareForVisualSnapshot(page, 'desktop', { ultimateState: { screen: 'stats' } });
    await page.goto('/');
    await expect(page.getByText('Your Stats', { exact: true })).toBeVisible();
    await snap(page, 'stats.desktop.png');
  });
});


