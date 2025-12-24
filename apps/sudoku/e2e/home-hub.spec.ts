import { expect, test } from '@playwright/test';

test('home: renders Make menu and navigates within the new screen state machine', async ({ page }) => {
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

  // Navigation: Play Game -> difficulty -> game
  await page.getByRole('button', { name: 'Play Game' }).click();
  await expect(page.getByText('Select Difficulty')).toBeVisible();
  await page.getByRole('button', { name: 'Medium' }).click();
  await expect(page.getByLabel('Sudoku grid')).toBeVisible();

  // Exit back to menu using in-game menu
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByRole('button', { name: 'Exit' }).click();
  await expect(page.getByRole('heading', { name: 'Ultimate Sudoku' })).toBeVisible();

  // Navigation: Daily Challenge -> daily challenges screen
  await page.getByRole('button', { name: 'Play Now' }).click();
  await expect(page.getByText('Daily Challenges', { exact: true })).toBeVisible();

  // Navigation: Leaderboard and Settings
  await page.goto('/');
  await page.getByRole('button', { name: 'Leaderboard' }).click();
  await expect(page.getByText('Leaderboard', { exact: true })).toBeVisible();

  await page.goto('/');
  await page.getByRole('button', { name: 'Settings' }).click();
  await expect(page.getByText('Settings', { exact: true })).toBeVisible();
});

test('home hub: disabled destinations do not navigate', async ({ page }) => {
  await page.goto('/');

  const stats = page.getByRole('button', { name: 'Stats' });
  // React Native Web maps disabled Pressables to aria-disabled.
  await expect(stats).toHaveAttribute('aria-disabled', 'true');
  await expect(page).toHaveURL(/\/$/);
});


