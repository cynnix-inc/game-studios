import { expect, test } from '@playwright/test';

test('make theme: home hub renders glass background + card + primary button', async ({ page }) => {
  await page.goto('/');

  const screen = page.getByTestId('make-screen');
  await expect(screen).toBeVisible();

  const gradient = await screen.evaluate((el) => getComputedStyle(el).backgroundImage);
  expect(gradient).toContain('linear-gradient');

  const card = page.getByTestId('make-card').first();
  await expect(card).toBeVisible();
  const cardBg = await card.evaluate((el) => getComputedStyle(el).backgroundColor);
  // Should be translucent (not fully opaque).
  expect(cardBg).toContain('rgba');

  const play = page.getByRole('button', { name: 'Free Play play' });
  await expect(play).toBeVisible();
  const playBgLayer = play.getByTestId('make-button-primary-bg');
  await expect(playBgLayer).toBeVisible();
  const playBg = await playBgLayer.evaluate((el) => getComputedStyle(el).backgroundImage);
  expect(playBg).toContain('linear-gradient');
});

test('make theme: settings screen uses Make theme wrappers', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Settings' }).click();
  await expect(page.getByText('Settings', { exact: true })).toBeVisible();

  const screen = page.getByTestId('make-screen');
  await expect(screen).toBeVisible();

  const card = page.getByTestId('make-card').first();
  await expect(card).toBeVisible();
});


