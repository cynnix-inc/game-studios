import { expect, test } from '@playwright/test';

test('ultimate UI: can start free play and see the grid', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Ultimate Sudoku' })).toBeVisible();

  await page.getByRole('button', { name: 'Free Play play' }).click();
  await expect(page.getByText('Select Difficulty')).toBeVisible();
  await page.getByRole('button', { name: 'Easy' }).click();

  await expect(page.getByLabel('Sudoku grid')).toBeVisible();
});


