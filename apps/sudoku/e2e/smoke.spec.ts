import { expect, test } from '@playwright/test';

test('daily: loads, accepts keyboard input, and submits score (mocked)', async ({ page }) => {
  await page.goto('/daily');
  await expect(page.getByText('Daily Sudoku')).toBeVisible();

  // Focus the grid and select the first cell (row 1 col 1 is the only empty cell in the mock payload).
  const grid = page.getByLabel('Sudoku grid');
  await grid.click();

  const cell11 = page.getByLabel(/Cell row 1 column 1/i);
  await cell11.click();

  // Enter the correct digit via keyboard.
  await page.keyboard.press('5');

  // Completion triggers submit-score; UI should reflect the submitted state.
  await expect(page.getByText('Submitted.')).toBeVisible();
});

test('leaderboard: renders score and raw time tabs (mocked)', async ({ page }) => {
  await page.goto('/leaderboard');
  await expect(page.getByText('Daily Leaderboard')).toBeVisible();

  // Score tab (default)
  await expect(page.getByText(/Top 100/i)).toBeVisible();
  await expect(page.getByLabel('Score tab')).toBeVisible();

  // Switch to Raw Time
  await page.getByLabel('Raw Time tab').click();
  await expect(page.getByLabel('Raw Time tab')).toBeVisible();

  // Ensure at least one row renders.
  await expect(page.getByText(/Mistakes/).first()).toBeVisible();
});

test('game: can navigate to free play and see the grid', async ({ page }) => {
  await page.goto('/game');
  await expect(page.getByText('Sudoku')).toBeVisible();
  await expect(page.getByLabel('Sudoku grid')).toBeVisible();
});


