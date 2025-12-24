import { expect, test } from '@playwright/test';

test('home hub: renders core elements and navigates to supported routes', async ({ page }) => {
  await page.goto('/');

  // Title and primary CTA
  await expect(page.getByRole('heading', { name: 'Ultimate Sudoku' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Play Game' })).toBeVisible();

  // Account control (unauthenticated path)
  await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();

  // Daily challenge card + CTA
  await expect(page.getByText('Daily Challenge')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Play Now' })).toBeVisible();

  // Icon tiles
  await expect(page.getByRole('button', { name: 'Leaderboard' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Settings' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Stats' })).toBeVisible();

  // Supported navigation
  await page.getByRole('button', { name: 'Play Game' }).click();
  await expect(page).toHaveURL(/\/game$/);
  await expect(page.getByLabel('Sudoku grid')).toBeVisible();

  await page.goto('/');
  await page.getByRole('button', { name: 'Play Now' }).click();
  await expect(page).toHaveURL(/\/daily$/);
  await expect(page.getByText('Daily Sudoku')).toBeVisible();

  await page.goto('/');
  await page.getByRole('button', { name: 'Leaderboard' }).click();
  await expect(page).toHaveURL(/\/leaderboard$/);
  await expect(page.getByText('Daily Leaderboard')).toBeVisible();

  await page.goto('/');
  await page.getByRole('button', { name: 'Settings' }).click();
  await expect(page).toHaveURL(/\/settings$/);
});

test('home hub: disabled destinations do not navigate', async ({ page }) => {
  await page.goto('/');

  const stats = page.getByRole('button', { name: 'Stats' });
  // React Native Web maps disabled Pressables to aria-disabled.
  await expect(stats).toHaveAttribute('aria-disabled', 'true');
  await expect(page).toHaveURL(/\/$/);
});


