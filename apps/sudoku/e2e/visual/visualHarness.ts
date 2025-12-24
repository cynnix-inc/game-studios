import type { Page } from '@playwright/test';

export const VIEWPORTS = {
  mobile: { width: 390, height: 844 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1440, height: 900 },
} as const;

export type VisualViewportName = keyof typeof VIEWPORTS;

const FIXED_NOW_MS = Date.UTC(2025, 0, 1, 12, 0, 0);

async function freezeTime(page: Page, nowMs: number) {
  // Must run before app code executes (before page.goto).
  await page.addInitScript(
    ({ now }) => {
      const OriginalDate = Date;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      class MockDate extends (OriginalDate as any) {
        constructor(...args: unknown[]) {
          // new Date() -> fixed
          if (args.length === 0) {
            return new OriginalDate(now);
          }
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return new OriginalDate(...(args as any));
        }
        static now() {
          return now;
        }
      }
      // @ts-expect-error - override global Date for deterministic UI in snapshots
      globalThis.Date = MockDate;
    },
    { now: nowMs },
  );
}

/**
 * For deterministic screenshots:
 * - force reduced motion so animated particles don’t introduce flake
 * - keep viewport stable per spec
 * - freeze time so countdown/timers don’t change between CI runs
 */
export async function prepareForVisualSnapshot(page: Page, viewport: VisualViewportName) {
  await page.setViewportSize(VIEWPORTS[viewport]);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await freezeTime(page, FIXED_NOW_MS);
}


