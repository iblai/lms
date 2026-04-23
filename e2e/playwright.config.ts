import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

const root = path.resolve(__dirname, '.');
const authDir = path.join(root, 'playwright', '.auth');
dotenv.config({ path: path.join(root, '.env.local'), override: true });
dotenv.config({ path: path.join(root, '.env') });

const testTimeout = process.env.TEST_TIMEOUT
  ? parseInt(process.env.TEST_TIMEOUT, 10)
  : process.env.CI
    ? 120_000
    : 120_000;

const testRetries = process.env.TEST_RETRIES
  ? parseInt(process.env.TEST_RETRIES, 10)
  : process.env.CI
    ? 2
    : 1;

export default defineConfig({
  testDir: './journeys',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: testRetries,
  workers: process.env.CI ? 1 : 4,
  timeout: testTimeout,
  reporter: [
    ['html', { open: 'never' }],
    process.env.CI ? ['list', { printSteps: true }] : ['list'],
    ['json', { outputFile: 'test-results.json' }],
  ],
  use: {
    baseURL: process.env.SKILLS_HOST || 'http://localhost:3000',
    headless: true,
    trace: 'retain-on-failure',
    screenshot: process.env.CI ? 'only-on-failure' : 'off',
    actionTimeout: 30_000,
    navigationTimeout: 30_000,
  },
  projects: [
    // ── Auth setup: runs once per browser, saves storage state ───────────
    {
      name: 'setup-chrome',
      testMatch: /auth\.setup\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'setup-firefox',
      testMatch: /auth\.setup\.ts/,
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'setup-edge',
      testMatch: /auth\.setup\.ts/,
      use: { ...devices['Desktop Edge'] },
    },

    // ── Test projects: each depends on auth setup ───────────────────────
    {
      name: 'skills-desktop-chrome',
      use: {
        ...devices['Desktop Chrome'],
        storageState: path.join(authDir, 'user-chrome.json'),
      },
      dependencies: ['setup-chrome'],
    },
    {
      name: 'skills-desktop-firefox',
      use: {
        ...devices['Desktop Firefox'],
        storageState: path.join(authDir, 'user-firefox.json'),
      },
      dependencies: ['setup-firefox'],
    },
    {
      name: 'skills-desktop-edge',
      use: {
        ...devices['Desktop Edge'],
        storageState: path.join(authDir, 'user-edge.json'),
      },
      dependencies: ['setup-edge'],
    },
  ],
  webServer: process.env.SKILLS_HOST
    ? undefined
    : {
        command: 'pnpm dev',
        url: 'http://localhost:3000',
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
