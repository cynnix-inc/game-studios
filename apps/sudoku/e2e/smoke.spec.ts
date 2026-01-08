import { expect, test } from '@playwright/test';

test('ultimate UI: can start free play and see the grid', async ({ page }) => {
  page.on('pageerror', (e) => {
    throw e;
  });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Ultimate Sudoku' })).toBeVisible();

  await page.getByRole('button', { name: 'Free Play play' }).click();
  await expect(page.getByText('Choose Your Puzzle')).toBeVisible();
  await page.getByRole('button', { name: 'Classic Sudoku' }).click();
  await expect(page.getByText('Select Difficulty')).toBeVisible();
  await page.getByRole('button', { name: 'Skilled' }).click();

  await expect(page.getByLabel('Sudoku grid')).toBeVisible();
});

test('ultimate UI: free play creates a resumable in-progress save', async ({ page }) => {
  page.on('pageerror', (e) => {
    throw e;
  });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Ultimate Sudoku' })).toBeVisible();

  // Start a game
  await page.getByRole('button', { name: 'Free Play play' }).click();
  await page.getByRole('button', { name: 'Classic Sudoku' }).click();
  await page.getByRole('button', { name: 'Skilled' }).click();
  await expect(page.getByLabel('Sudoku grid')).toBeVisible();

  // Give autosave a moment to persist.
  await page.waitForTimeout(600);

  // Reload and ensure Resume is available.
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Ultimate Sudoku' })).toBeVisible();
  const resume = page.getByRole('button', { name: 'Free Play resume' });
  await expect(resume).toBeVisible();

  // Regression guard: hovering Resume should not crash (tooltip uses a portal on web).
  await resume.hover();
  await expect(page.getByText('Game in Progress')).toBeVisible();
});

test('ultimate UI: in-game menu opens and shows main sections', async ({ page }) => {
  page.on('pageerror', (e) => {
    throw e;
  });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Ultimate Sudoku' })).toBeVisible();

  await page.getByRole('button', { name: 'Free Play play' }).click();
  await page.getByRole('button', { name: 'Classic Sudoku' }).click();
  await page.getByRole('button', { name: 'Skilled' }).click();
  await expect(page.getByLabel('Sudoku grid')).toBeVisible();

  // Open in-game menu (header button)
  await page.getByRole('button', { name: 'Menu' }).click();

  // Menu actions + sections
  await expect(page.getByRole('button', { name: 'Audio Settings' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Gameplay Assists' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Customize Grid' })).toBeVisible();

  // Expand gameplay and verify Make-parity controls exist
  await page.getByRole('button', { name: 'Gameplay Assists' }).click();
  await expect(page.getByRole('switch', { name: 'Auto-advance' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Hint Type', exact: true })).toBeVisible();
});

test('ultimate UI: settings screen opens and grid customizer can open', async ({ page }) => {
  page.on('pageerror', (e) => {
    throw e;
  });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Ultimate Sudoku' })).toBeVisible();

  // Open Settings from home hub
  await page.getByRole('button', { name: 'Settings' }).click();
  await expect(page.getByRole('button', { name: 'Back' })).toBeVisible();

  // Grid customization entry + modal
  await expect(page.getByRole('button', { name: 'Customize Grid' })).toBeVisible();
  await page.getByRole('button', { name: 'Customize Grid' }).click();
  await expect(page.getByRole('button', { name: 'Apply settings' })).toBeVisible();
});

test('ultimate UI: zen mode hides header status (Make parity)', async ({ page }) => {
  page.on('pageerror', (e) => {
    throw e;
  });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Ultimate Sudoku' })).toBeVisible();

  // Enable Zen Mode in Settings
  await page.getByRole('button', { name: 'Settings' }).click();
  await expect(page.getByRole('switch', { name: 'Zen Mode' })).toBeVisible();
  await page.getByRole('switch', { name: 'Zen Mode' }).click();
  await page.getByRole('button', { name: 'Back' }).click();

  // Start a game
  await page.getByRole('button', { name: 'Free Play play' }).click();
  await page.getByRole('button', { name: 'Classic Sudoku' }).click();
  await page.getByRole('button', { name: 'Skilled' }).click();
  await expect(page.getByLabel('Sudoku grid')).toBeVisible();

  // Header status rows should be hidden in Zen mode.
  await expect(page.getByText('Mistakes')).toHaveCount(0);
  await expect(page.getByText('Time')).toHaveCount(0);
});


