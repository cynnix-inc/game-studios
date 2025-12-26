import { expect, test, type Page } from '@playwright/test';
import { prepareForVisualSnapshot } from './visualHarness';

test.describe('visual: profile (Ultimate Sudoku)', () => {
  async function snap(page: Page, name: string) {
    const vp = page.viewportSize();
    if (vp) await page.mouse.move(vp.width - 1, vp.height - 1);
    await expect(page.getByTestId('make-screen')).toHaveScreenshot(name);
  }

  test('mobile', async ({ page }) => {
    await prepareForVisualSnapshot(page, 'mobile', { ultimateState: { screen: 'profile' } });
    await page.goto('/');
    await expect(page.getByText('Profile', { exact: true })).toBeVisible();
    await snap(page, 'profile.mobile.png');
  });

  test('tablet', async ({ page }) => {
    await prepareForVisualSnapshot(page, 'tablet', { ultimateState: { screen: 'profile' } });
    await page.goto('/');
    await expect(page.getByText('Profile', { exact: true })).toBeVisible();
    await snap(page, 'profile.tablet.png');
  });

  test('desktop', async ({ page }) => {
    await prepareForVisualSnapshot(page, 'desktop', { ultimateState: { screen: 'profile' } });
    await page.goto('/');
    await expect(page.getByText('Profile', { exact: true })).toBeVisible();
    await snap(page, 'profile.desktop.png');
  });
});


