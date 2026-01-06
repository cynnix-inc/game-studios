import { defineConfig, devices } from '@playwright/test';

const PORT_WEB = Number(process.env.SUDOKU_E2E_WEB_PORT ?? '4401');

export default defineConfig({
  testDir: __dirname,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['list']] : [['list']],
  use: {
    baseURL: `http://127.0.0.1:${PORT_WEB}`,
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
  },
  webServer: {
    command: 'node e2e/start-server.mjs',
    cwd: __dirname + '/..',
    url: `http://127.0.0.1:${PORT_WEB}`,
    // Important: env vars are inlined at web export time, so reuse can cause stale config.
    reuseExistingServer: false,
    timeout: 180_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});


