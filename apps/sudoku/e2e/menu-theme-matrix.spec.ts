import { expect, test } from '@playwright/test';
import { prepareForVisualSnapshot } from './visual/visualHarness';

type ThemeType = 'default' | 'light' | 'dark' | 'grayscale' | 'device';
type DailyStatus = 'play' | 'resume' | 'completed';

const FIXED_TODAY = '2025-01-01';

async function seedMenuState(args: { page: import('@playwright/test').Page; daily: DailyStatus; freeInProgress: boolean }) {
  await args.page.addInitScript(
    ({ daily, freeInProgress, today }) => {
      try {
        // Clear our known save slots
        window.localStorage.removeItem(`cynnix.save.sudoku.main`);
        window.localStorage.removeItem(`cynnix.save.sudoku.daily:completion_index_v1`);

        // Daily completion index
        if (daily === 'completed') {
          window.localStorage.setItem(
            `cynnix.save.sudoku.daily:completion_index_v1`,
            JSON.stringify({
              gameKey: 'sudoku',
              slot: 'daily:completion_index_v1',
              updatedAtMs: 0,
              data: { v: 1, byDateKey: { [today]: { completedAtMs: 123 } } },
            }),
          );
        } else {
          window.localStorage.setItem(
            `cynnix.save.sudoku.daily:completion_index_v1`,
            JSON.stringify({
              gameKey: 'sudoku',
              slot: 'daily:completion_index_v1',
              updatedAtMs: 0,
              data: { v: 1, byDateKey: {} },
            }),
          );
        }

        if (daily === 'resume') {
          // Daily in-progress save in the main slot
          window.localStorage.setItem(
            `cynnix.save.sudoku.main`,
            JSON.stringify({
              gameKey: 'sudoku',
              slot: 'main',
              updatedAtMs: 0,
              data: {
                v: 1,
                mode: 'daily',
                dailyDateKey: today,
                serializedPuzzle: '.'.repeat(81),
                givensMask: Array.from({ length: 81 }, () => false),
                mistakes: 1,
                hintsUsedCount: 0,
                hintBreakdown: {},
                runTimer: { startedAtMs: Date.UTC(2025, 0, 1, 12, 0, 0), totalPausedMs: 0, pausedAtMs: Date.UTC(2025, 0, 1, 12, 0, 0) },
                runStatus: 'paused',
              },
            }),
          );
          return;
        }

        if (freeInProgress) {
          window.localStorage.setItem(
            `cynnix.save.sudoku.main`,
            JSON.stringify({
              gameKey: 'sudoku',
              slot: 'main',
              updatedAtMs: 0,
              data: {
                v: 1,
                mode: 'free',
                deviceId: 'test',
                revision: 1,
                moves: [],
                undoStack: [],
                redoStack: [],
                serializedPuzzle: `${'1'.repeat(20)}${'.'.repeat(61)}`,
                serializedSolution: `${'1'.repeat(81)}`,
                givensMask: Array.from({ length: 81 }, () => false),
                mistakes: 2,
                hintsUsedCount: 1,
                hintBreakdown: {},
                runTimer: { startedAtMs: Date.UTC(2025, 0, 1, 11, 40, 0), totalPausedMs: 0, pausedAtMs: Date.UTC(2025, 0, 1, 12, 0, 0) },
                runStatus: 'paused',
                difficulty: 'skilled',
              },
            }),
          );
        }
      } catch {
        // ignore
      }
    },
    { daily: args.daily, freeInProgress: args.freeInProgress, today: FIXED_TODAY },
  );
}

async function setTheme(page: import('@playwright/test').Page, theme: ThemeType, deviceColorScheme?: 'light' | 'dark') {
  if (theme === 'device') {
    await page.emulateMedia({ colorScheme: deviceColorScheme ?? 'dark' });
  }
  await page.addInitScript(
    ({ t }) => {
      try {
        window.localStorage.setItem('ultimateSudoku.theme', t);
      } catch {
        // ignore
      }
    },
    { t: theme },
  );
}

async function expectIconsVisible(page: import('@playwright/test').Page) {
  // Daily: calendar icon + action button with icon
  await expect(page.getByRole('button', { name: 'Daily calendar' })).toBeVisible();
  const dailyAction = page.getByRole('button', { name: 'Daily play' });
  await expect(dailyAction).toBeVisible();
  await expect(dailyAction.locator('svg')).toHaveCount(1);

  // Free Play: setup always
  await expect(page.getByRole('button', { name: 'Free Play setup' })).toBeVisible();

  // Free Play action: either play or resume
  const freeResume = page.getByRole('button', { name: 'Free Play resume' });
  const freePlay = page.getByRole('button', { name: 'Free Play play' });
  const resumeVisible = await freeResume.isVisible().catch(() => false);
  const playVisible = await freePlay.isVisible().catch(() => false);
  expect(resumeVisible || playVisible).toBeTruthy();
  if (resumeVisible) {
    await expect(freeResume.locator('svg')).toHaveCount(1);

    // Hover tooltip (Make parity): should appear above the resume button and not be clipped.
    await freeResume.hover();
    const tipTitle = page.getByText('Game in Progress');
    await expect(tipTitle).toBeVisible();

    const btnBox = await freeResume.boundingBox();
    const tipBox = await tipTitle.boundingBox();
    if (btnBox && tipBox) {
      // Tooltip should render above the button (allow a tiny tolerance).
      expect(tipBox.y + tipBox.height).toBeLessThanOrEqual(btnBox.y + 2);
    }
  }
  if (playVisible) await expect(freePlay).toBeVisible();

  // Bottom tiles
  await expect(page.getByRole('button', { name: 'Stats' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Leaderboard' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Settings' })).toBeVisible();
}

test.describe('menu: icon states × themes', () => {
  const themes: ThemeType[] = ['default', 'light', 'dark', 'grayscale', 'device'];
  const dailyStates: DailyStatus[] = ['play', 'resume', 'completed'];

  for (const theme of themes) {
    for (const daily of dailyStates) {
      // Free in-progress is mutually exclusive with daily resume (single save slot); keep it off in that case.
      const freeInProgress = daily !== 'resume';
      const label = theme === 'device' ? `${theme}.dark` : theme;

      test(`${label}: daily.${daily} + free.${freeInProgress ? 'inProgress' : 'none'}`, async ({ page }) => {
        await prepareForVisualSnapshot(page, 'desktop');
        await setTheme(page, theme, 'dark');
        await seedMenuState({ page, daily, freeInProgress });

        await page.goto('/');
        await expect(page.getByRole('heading', { name: 'Ultimate Sudoku' })).toBeVisible();

        await expectIconsVisible(page);
      });
    }

    if (theme === 'device') {
      test(`device.light: daily.play + free.none`, async ({ page }) => {
        await prepareForVisualSnapshot(page, 'desktop');
        await setTheme(page, 'device', 'light');
        await seedMenuState({ page, daily: 'play', freeInProgress: false });

        await page.goto('/');
        await expect(page.getByRole('heading', { name: 'Ultimate Sudoku' })).toBeVisible();
        await expectIconsVisible(page);
      });
    }
  }
});


