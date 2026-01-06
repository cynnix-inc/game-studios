import { expect, test, type Page } from '@playwright/test';
import { prepareForVisualSnapshot } from './visualHarness';

test.describe('visual: settings (Ultimate Sudoku)', () => {
  async function gotoSettings(page: Page) {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Ultimate Sudoku' })).toBeVisible();
    await page.getByRole('button', { name: 'Settings' }).click();
    await expect(page.getByText('Settings', { exact: true })).toBeVisible();
  }

  async function snap(page: Page, name: string) {
    const vp = page.viewportSize();
    if (vp) await page.mouse.move(vp.width - 1, vp.height - 1);
    await expect(page.getByTestId('make-screen')).toHaveScreenshot(name);
  }

  async function scrollToBottom(page: Page) {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  }

  test('mobile.top', async ({ page }) => {
    await prepareForVisualSnapshot(page, 'mobile');
    await gotoSettings(page);
    await snap(page, 'settings.top.mobile.png');
  });

  test('mobile.bottom', async ({ page }) => {
    await prepareForVisualSnapshot(page, 'mobile');
    await gotoSettings(page);
    await scrollToBottom(page);
    await snap(page, 'settings.bottom.mobile.png');
  });

  test('tablet.top', async ({ page }) => {
    await prepareForVisualSnapshot(page, 'tablet');
    await gotoSettings(page);
    await snap(page, 'settings.top.tablet.png');
  });

  test('tablet.bottom', async ({ page }) => {
    await prepareForVisualSnapshot(page, 'tablet');
    await gotoSettings(page);
    await scrollToBottom(page);
    await snap(page, 'settings.bottom.tablet.png');
  });

  test('desktop.top', async ({ page }) => {
    await prepareForVisualSnapshot(page, 'desktop');
    await gotoSettings(page);
    await snap(page, 'settings.top.desktop.png');
  });

  test('desktop.bottom', async ({ page }) => {
    await prepareForVisualSnapshot(page, 'desktop');
    await gotoSettings(page);
    await scrollToBottom(page);
    await snap(page, 'settings.bottom.desktop.png');
  });
});


