import { expect, test, type Page } from '@playwright/test';
import { prepareForVisualSnapshot } from './visualHarness';

test.describe('visual: leaderboard (Ultimate Sudoku)', () => {
  async function snap(page: Page, name: string) {
    const vp = page.viewportSize();
    if (vp) await page.mouse.move(vp.width - 1, vp.height - 1);
    await expect(page.getByTestId('make-screen')).toHaveScreenshot(name);
  }

  test('mobile', async ({ page }) => {
    await prepareForVisualSnapshot(page, 'mobile', { ultimateState: { screen: 'leaderboard' } });
    await page.goto('/');
    await expect(page.getByText('Leaderboard', { exact: true })).toBeVisible();
    await snap(page, 'leaderboard.mobile.png');
  });

  test('tablet', async ({ page }) => {
    await prepareForVisualSnapshot(page, 'tablet', { ultimateState: { screen: 'leaderboard' } });
    await page.goto('/');
    await expect(page.getByText('Leaderboard', { exact: true })).toBeVisible();
    await snap(page, 'leaderboard.tablet.png');
  });

  test('desktop', async ({ page }) => {
    await prepareForVisualSnapshot(page, 'desktop', { ultimateState: { screen: 'leaderboard' } });
    await page.goto('/');
    await expect(page.getByText('Leaderboard', { exact: true })).toBeVisible();
    await snap(page, 'leaderboard.desktop.png');
  });
});


