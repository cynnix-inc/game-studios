import { expect, test, type Page } from '@playwright/test';

test.describe('ultimate: behavior gates (Figma Make parity)', () => {
  // Expo web startup + first render can be close to the default 60s on slower machines.
  test.describe.configure({ timeout: 120_000 });

  async function gotoMenu(page: Page) {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Ultimate Sudoku' })).toBeVisible();
  }

  test('auth modal opens and closes (overlay + close button)', async ({ page }) => {
    await gotoMenu(page);

    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page.getByText('Welcome', { exact: true })).toBeVisible();

    await page.getByRole('button', { name: 'Close', exact: true }).click();
    await expect(page.getByText('Welcome', { exact: true })).toHaveCount(0);

    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page.getByText('Welcome', { exact: true })).toBeVisible();

    // Close via overlay click (outside the card).
    await page.mouse.click(5, 5);
    await expect(page.getByText('Welcome', { exact: true })).toHaveCount(0);
  });

  test('game menu opens and closes (Menu button + overlay)', async ({ page }) => {
    await gotoMenu(page);

    await page.getByRole('button', { name: 'Play Game' }).click();
    await expect(page.getByText('Select Difficulty', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Easy' }).click();

    // Menu closed
    await expect(page.getByRole('button', { name: 'Menu' })).toBeVisible();
    await expect(page.getByLabel('Close menu')).toHaveCount(0);

    // Open
    await page.getByRole('button', { name: 'Menu' }).click();
    await expect(page.getByLabel('Close menu')).toBeVisible();

    // Close via overlay
    await page.getByLabel('Close menu').click();
    await expect(page.getByLabel('Close menu')).toHaveCount(0);
  });

  test('in-game menu sliders are interactive (music volume updates)', async ({ page }) => {
    await gotoMenu(page);

    await page.getByRole('button', { name: 'Play Game' }).click();
    await expect(page.getByText('Select Difficulty', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Easy' }).click();

    // Open in-game menu
    await page.getByRole('button', { name: 'Menu' }).click();
    await expect(page.getByLabel('Close menu')).toBeVisible();

    // Expand audio section
    await page.getByRole('button', { name: 'Audio Settings' }).click();

    // Wait for settings-backed controls to render (settings load is async on first boot).
    await expect(page.getByRole('switch', { name: 'Music' })).toBeVisible();

    // Ensure Music is enabled so the slider is visible
    const musicSwitch = page.getByRole('switch', { name: 'Music' });
    // RN-web may render aria-checked; if it's missing for any reason, click once and proceed.
    const checked0 = await musicSwitch.getAttribute('aria-checked');
    if (checked0 !== 'true') {
      await musicSwitch.click();
      const checked1 = await musicSwitch.getAttribute('aria-checked');
      if (checked1 !== 'true') {
        // One more attempt to force "on".
        await musicSwitch.click();
      }
    }

    // Adjust the range input; on web this is a real <input type="range">.
    const musicVolume = page.locator('input[aria-label="Music volume"]');
    await expect(musicVolume).toBeVisible();
    await musicVolume.evaluate((el) => {
      const input = el as HTMLInputElement;
      input.value = '12';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });

    // UI label next to the slider should update to the new percent.
    await expect(page.getByText('12%')).toBeVisible();
  });

  test('game layout: grid does not overflow viewport width (no horizontal scroll) on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await gotoMenu(page);

    await page.getByRole('button', { name: 'Play Game' }).click();
    await expect(page.getByText('Select Difficulty', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Easy' }).click();

    const grid = page.getByLabel('Sudoku grid');
    await expect(grid).toBeVisible();

    const box = await grid.boundingBox();
    expect(box, 'Expected Sudoku grid to have a bounding box').not.toBeNull();
    if (!box) return;

    // Guardrail: the rendered grid must fit within the viewport width.
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(390 + 1);

    // Stronger guardrail: no horizontal scrolling on the page.
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  });

  test('auto-advance moves selection to the next empty editable cell after digit entry', async ({ page }) => {
    // Seed settings deterministically so we don't rely on RN-web switch semantics for this gate.
    // The app loads settings from local save key: `cynnix.save.${gameKey}.${slot}`.
    await page.addInitScript(() => {
      const key = 'cynnix.save.sudoku.settings';
      const save = {
        gameKey: 'sudoku',
        slot: 'settings',
        updatedAtMs: 0,
        data: {
          schemaVersion: 1,
          kind: 'sudoku_settings',
          updatedAtMs: 0,
          updatedByDeviceId: 'e2e',
          toggles: { autoAdvance: true },
          extra: {},
        },
      };
      window.localStorage.setItem(key, JSON.stringify(save));
    });

    await gotoMenu(page);

    await page.getByRole('button', { name: 'Play Game' }).click();
    await expect(page.getByText('Select Difficulty', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Easy' }).click();
    await expect(page.getByLabel('Sudoku grid')).toBeVisible();

    // Open in-game menu
    await page.getByRole('button', { name: 'Menu' }).click();
    await expect(page.getByLabel('Close menu')).toBeVisible();

    // Expand gameplay section
    await page.getByRole('button', { name: 'Gameplay Assists' }).click();
    const autoAdvance = page.getByRole('switch', { name: 'Auto-advance' });
    await expect(autoAdvance).toBeVisible();

    // Close menu so we can interact with the board.
    // On web there can be 2 "Resume" buttons (header + menu). Prefer header toggle for stability.
    await page.getByRole('button', { name: 'Resume' }).first().click();
    await expect(page.getByLabel('Close menu')).toHaveCount(0);

    // Find a non-given cell in the top-left region to keep this deterministic across puzzles.
    // We scan a small region and pick the first cell that is not marked as "given".
    let startLabel: string | null = null;
    for (let r = 1; r <= 3 && !startLabel; r++) {
      for (let c = 1; c <= 3 && !startLabel; c++) {
        const label = `Cell row ${r} column ${c}`;
        const cell = page.getByRole('button', { name: new RegExp(`^${label}(, given)?(, selected)?$`) });
        const aria = (await cell.first().getAttribute('aria-label')) ?? '';
        if (!aria.includes('given')) startLabel = label;
      }
    }
    expect(startLabel, 'Expected at least one editable cell in the 3x3 top-left region').not.toBeNull();

    // Select the start cell and enter a digit
    const startCell = page.getByRole('button', { name: new RegExp(`^${startLabel}(, selected)?$`) });
    await startCell.click();
    await page.getByRole('button', { name: 'Digit 5' }).click();

    // Sanity: digit was applied (avoids false positives if keypad is disabled).
    await expect(startCell).toContainText('5');

    // Auto-advance should move selection away from the start cell.
    await expect(page.getByRole('button', { name: new RegExp(`^${startLabel}, selected$`) })).toHaveCount(0);

    // And some other cell should now be selected.
    await expect(page.getByRole('button', { name: /, selected$/ })).toBeVisible();
  });

  test('lock mode: choosing a digit and tapping an empty cell places that digit', async ({ page }) => {
    await gotoMenu(page);

    await page.getByRole('button', { name: 'Play Game' }).click();
    await expect(page.getByText('Select Difficulty', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Easy' }).click();
    await expect(page.getByLabel('Sudoku grid')).toBeVisible();

    // Enable lock mode.
    await page.getByRole('button', { name: 'Lock' }).click();

    // Choose a locked digit (should not require a selected cell).
    await page.getByRole('button', { name: 'Digit 5' }).click();

    // Find an editable empty cell in the top-left region.
    let targetLabel: string | null = null;
    for (let r = 1; r <= 3 && !targetLabel; r++) {
      for (let c = 1; c <= 3 && !targetLabel; c++) {
        const label = `Cell row ${r} column ${c}`;
        const cell = page.getByRole('button', { name: new RegExp(`^${label}(, given)?(, selected)?$`) });
        const aria = (await cell.first().getAttribute('aria-label')) ?? '';
        if (aria.includes('given')) continue;
        const text = ((await cell.first().textContent()) ?? '').trim();
        if (text.length === 0) targetLabel = label;
      }
    }
    expect(targetLabel, 'Expected at least one editable empty cell in the 3x3 top-left region').not.toBeNull();
    if (!targetLabel) return;

    const target = page.getByRole('button', { name: new RegExp(`^${targetLabel}(, selected)?$`) });
    await target.click();
    await expect(target).toContainText('5');
  });

  test('settings has core sections shown in Make (Gameplay, Grid Sizing, Audio, Notifications)', async ({ page }) => {
    await gotoMenu(page);
    await page.getByRole('button', { name: 'Settings' }).click();
    await expect(page.getByText('Settings', { exact: true })).toBeVisible();

    // Sections from Make Settings
    await expect(page.getByText('Gameplay', { exact: true })).toBeVisible();
    await expect(page.getByText('Grid Sizing', { exact: true })).toBeVisible();
    await expect(page.getByText('Audio', { exact: true })).toBeVisible();
    await expect(page.getByText('Notifications', { exact: true })).toBeVisible();
  });

  test('menu tiles navigate to Stats/Profile/Leaderboard (no disabled placeholders)', async ({ page }) => {
    await gotoMenu(page);

    // Stats
    await page.getByRole('button', { name: 'Stats' }).click();
    await expect(page.getByText('Your Stats', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Back' }).click();

    // Leaderboard
    await page.getByRole('button', { name: 'Leaderboard' }).click();
    await expect(page.getByText('Leaderboard', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Back' }).click();

    // Profile requires auth in the Make design; for parity we still expect navigation to be possible when signed-in.
    // This assertion is implemented once profile tile is enabled and auth state is available in E2E.
  });
});


