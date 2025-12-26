import { expect, test } from '@playwright/test';

test('home: renders Make menu and navigates within the new screen state machine', async ({ page }) => {
  await page.goto('/');

  // Title
  await expect(page.getByRole('heading', { name: 'Ultimate Sudoku' })).toBeVisible();

  // Account control (unauthenticated path)
  await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();

  // Daily challenge card + actions
  await expect(page.getByText('Daily Challenge')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Daily play' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Daily calendar' })).toBeVisible();

  // Free Play card + actions
  await expect(page.getByText('Free Play')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Free Play setup' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Free Play play' })).toBeVisible();

  // Journey card
  await expect(page.getByText('Journey')).toBeVisible();

  // Icon tiles
  await expect(page.getByRole('button', { name: 'Leaderboard' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Settings' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Stats' })).toBeVisible();

  // Navigation: Free Play -> difficulty -> game
  await page.getByRole('button', { name: 'Free Play play' }).click();
  await expect(page.getByText('Select Difficulty')).toBeVisible();
  await page.getByRole('button', { name: 'Medium' }).click();
  await expect(page.getByLabel('Sudoku grid')).toBeVisible();

  // Exit back to menu using in-game menu
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByRole('button', { name: 'Exit' }).click();
  await expect(page.getByRole('heading', { name: 'Ultimate Sudoku' })).toBeVisible();

  // Navigation: Daily Challenge -> daily challenges screen (calendar button)
  await page.getByRole('button', { name: 'Daily calendar' }).click();
  await expect(page.getByText('Daily Challenges', { exact: true })).toBeVisible();

  // Navigation: Leaderboard and Settings
  await page.goto('/');
  await page.getByRole('button', { name: 'Leaderboard' }).click();
  await expect(page.getByText('Leaderboard', { exact: true })).toBeVisible();

  await page.goto('/');
  await page.getByRole('button', { name: 'Settings' }).click();
  await expect(page.getByText('Settings', { exact: true })).toBeVisible();
});

test('home hub: journey buttons are disabled (coming soon)', async ({ page }) => {
  await page.goto('/');

  const journeyMap = page.getByRole('button', { name: 'Journey map' });
  await expect(journeyMap).toHaveAttribute('aria-disabled', 'true');
  const journeyLocked = page.getByRole('button', { name: 'Journey locked' });
  await expect(journeyLocked).toHaveAttribute('aria-disabled', 'true');
  await expect(page).toHaveURL(/\/$/);
});


