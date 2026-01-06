import { expect, test, type Page } from '@playwright/test';
import { prepareForVisualSnapshot } from './visualHarness';

test.describe('visual: dailyChallenges (Ultimate Sudoku)', () => {
  async function gotoDailyChallenges(page: Page) {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Ultimate Sudoku' })).toBeVisible();
    await page.getByRole('button', { name: 'Daily calendar' }).click();
    await expect(page.getByRole('button', { name: 'Back' })).toBeVisible();
    await expect(page.getByText('This Week', { exact: true })).toBeVisible();
  }

  async function snap(page: Page, name: string) {
    const vp = page.viewportSize();
    if (vp) await page.mouse.move(vp.width - 1, vp.height - 1);
    await expect(page.getByTestId('make-screen')).toHaveScreenshot(name);
  }

  test('mobile.main', async ({ page }) => {
    await prepareForVisualSnapshot(page, 'mobile');
    await gotoDailyChallenges(page);
    await snap(page, 'daily.mobile.png');
  });

  test('mobile.fullCalendar', async ({ page }) => {
    await prepareForVisualSnapshot(page, 'mobile');
    await gotoDailyChallenges(page);
    await page.getByRole('button', { name: 'Previous month' }).click();
    await snap(page, 'daily.prevMonth.mobile.png');
  });

  test('tablet.main', async ({ page }) => {
    await prepareForVisualSnapshot(page, 'tablet');
    await gotoDailyChallenges(page);
    await snap(page, 'daily.tablet.png');
  });

  test('tablet.fullCalendar', async ({ page }) => {
    await prepareForVisualSnapshot(page, 'tablet');
    await gotoDailyChallenges(page);
    await page.getByRole('button', { name: 'Previous month' }).click();
    await snap(page, 'daily.prevMonth.tablet.png');
  });

  test('desktop.main', async ({ page }) => {
    await prepareForVisualSnapshot(page, 'desktop');
    await gotoDailyChallenges(page);
    await snap(page, 'daily.desktop.png');
  });

  test('desktop.fullCalendar', async ({ page }) => {
    await prepareForVisualSnapshot(page, 'desktop');
    await gotoDailyChallenges(page);
    await page.getByRole('button', { name: 'Previous month' }).click();
    await snap(page, 'daily.prevMonth.desktop.png');
  });
});


