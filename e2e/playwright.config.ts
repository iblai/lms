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
    // Separate from `setup-chrome` on purpose: Playwright skips every project
    // depending on a failed setup, so keeping the student login here means a
    // missing or rejected non-admin account can't take the admin suite down.
    {
      name: 'setup-chrome-student',
      testMatch: /auth-student\.setup\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },

    // ── Test projects: each depends on auth setup ───────────────────────
    {
      name: 'skills-desktop-chrome',
      // The student journeys need the non-admin session, not this one.
      testIgnore: /-student\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: path.join(authDir, 'user-chrome.json'),
      },
      dependencies: ['setup-chrome'],
    },
    {
      name: 'skills-desktop-firefox',
      // The student journeys need the non-admin session, not this one.
      testIgnore: /-student\.spec\.ts/,
      use: {
        ...devices['Desktop Firefox'],
        storageState: path.join(authDir, 'user-firefox.json'),
      },
      dependencies: ['setup-firefox'],
    },
    {
      name: 'skills-desktop-edge',
      // The student journeys need the non-admin session, not this one.
      testIgnore: /-student\.spec\.ts/,
      use: {
        ...devices['Desktop Edge'],
        storageState: path.join(authDir, 'user-edge.json'),
      },
      dependencies: ['setup-edge'],
    },

    // ── Non-admin (student) session ──────────────────────────────────────
    // Runs the journeys that assert what a learner *cannot* see. Chrome-only:
    // the role gating is app logic, not a rendering-engine concern, so paying
    // for it three times over adds runtime without adding signal.
    //
    // The agent journeys (38/39) run here as well as under the admin session.
    // The Agent tab is a per-course setting, so whether they exercise anything
    // depends entirely on which courses the signed-in account can reach — and
    // the two accounts reach different ones. Running both sessions means the
    // agent controls get covered whenever *either* account has a course with
    // the agent enabled, instead of silently skipping. (Pointing a session at
    // another tenant by URL is not an option: the app treats a tenant that
    // doesn't match the session as a logout and ends the run.)
    {
      name: 'skills-desktop-chrome-student',
      testMatch: /(-student\.spec\.ts|3[89]-course-content-agent-.*\.spec\.ts)/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: path.join(authDir, 'user-chrome-student.json'),
      },
      dependencies: ['setup-chrome-student'],
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
