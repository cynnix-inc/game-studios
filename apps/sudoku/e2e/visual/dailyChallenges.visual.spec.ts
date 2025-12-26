import { expect, test, type Page } from '@playwright/test';
import { prepareForVisualSnapshot } from './visualHarness';

test.describe('visual: dailyChallenges (Ultimate Sudoku)', () => {
  async function gotoDailyChallenges(page: Page) {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Ultimate Sudoku' })).toBeVisible();
    await page.getByRole('button', { name: 'Daily calendar' }).click();
    await expect(page.getByText('Daily Challenges', { exact: true })).toBeVisible();
  }

  async function snap(page: Page, name: string) {
    const vp = page.viewportSize();
    if (vp) await page.mouse.move(vp.width - 1, vp.height - 1);
    await expect(page.getByTestId('make-screen')).toHaveScreenshot(name);
  }

  test('mobile.calendar', async ({ page }) => {
    await prepareForVisualSnapshot(page, 'mobile');
    await gotoDailyChallenges(page);
    await snap(page, 'daily.calendar.mobile.png');
  });

  test('mobile.modal', async ({ page }) => {
    await prepareForVisualSnapshot(page, 'mobile');
    await gotoDailyChallenges(page);
    await page.getByRole('button', { name: 'Day 1, today' }).click();
    await expect(page.getByLabel('Close day details')).toBeVisible();
    await snap(page, 'daily.modal.mobile.png');
  });

  test('mobile.leaderboard', async ({ page }) => {
    await prepareForVisualSnapshot(page, 'mobile');
    await gotoDailyChallenges(page);
    await page.getByLabel('Leaderboard tab').click();
    await snap(page, 'daily.leaderboard.mobile.png');
  });

  test('mobile.stats', async ({ page }) => {
    await prepareForVisualSnapshot(page, 'mobile');
    await gotoDailyChallenges(page);
    await page.getByLabel('Stats tab').click();
    await snap(page, 'daily.stats.mobile.png');
  });

  test('tablet.calendar', async ({ page }) => {
    await prepareForVisualSnapshot(page, 'tablet');
    await gotoDailyChallenges(page);
    await snap(page, 'daily.calendar.tablet.png');
  });

  test('tablet.leaderboard', async ({ page }) => {
    await prepareForVisualSnapshot(page, 'tablet');
    await gotoDailyChallenges(page);
    await page.getByLabel('Leaderboard tab').click();
    await snap(page, 'daily.leaderboard.tablet.png');
  });

  test('tablet.stats', async ({ page }) => {
    await prepareForVisualSnapshot(page, 'tablet');
    await gotoDailyChallenges(page);
    await page.getByLabel('Stats tab').click();
    await snap(page, 'daily.stats.tablet.png');
  });

  test('desktop.calendar', async ({ page }) => {
    await prepareForVisualSnapshot(page, 'desktop');
    await gotoDailyChallenges(page);
    await snap(page, 'daily.calendar.desktop.png');
  });

  test('desktop.leaderboard', async ({ page }) => {
    await prepareForVisualSnapshot(page, 'desktop');
    await gotoDailyChallenges(page);
    await page.getByLabel('Leaderboard tab').click();
    await snap(page, 'daily.leaderboard.desktop.png');
  });

  test('desktop.stats', async ({ page }) => {
    await prepareForVisualSnapshot(page, 'desktop');
    await gotoDailyChallenges(page);
    await page.getByLabel('Stats tab').click();
    await snap(page, 'daily.stats.desktop.png');
  });
});


