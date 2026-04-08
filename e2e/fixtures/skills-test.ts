/**
 * Extended Playwright test fixture for SkillsAI E2E tests.
 * Provides page objects and helper utilities as fixtures.
 */
import { test as base, expect, Page } from '@playwright/test';
import { SKILL_HOST } from './test-data';

// ── Helper: navigate to Skills app home (authenticated) ─────────────────────
async function navigateToSkillsApp(page: Page): Promise<void> {
  await page.goto(SKILL_HOST, { waitUntil: 'domcontentloaded', timeout: 120_000 });
  // Wait for the app to load (either /home or /start for first-time users)
  await page.waitForURL(
    (url) =>
      url.href.includes('/home') ||
      url.href.includes('/start') ||
      url.href.includes('/discover') ||
      url.href.includes('/profile'),
    { timeout: 120_000 },
  );
}

// ── Helper: check admin status via Configuration tab visibility ─────────────
async function checkAdminStatus(page: Page): Promise<boolean> {
  // Navigate to a course page to check if Configuration tab is visible
  // This is a quick heuristic; adjust if needed
  try {
    const analyticsLink = page.getByRole('link', { name: 'AI Analytics' });
    return await analyticsLink.isVisible({ timeout: 5_000 }).catch(() => false);
  } catch {
    return false;
  }
}

// ── Step helper ─────────────────────────────────────────────────────────────
type StepFn = (name: string, body: () => Promise<void>) => Promise<void>;

// ── Exported test fixture ───────────────────────────────────────────────────
export const test = base.extend<{
  skillsApp: Page;
  isAdmin: boolean;
  step: StepFn;
}>({
  skillsApp: async ({ page }, use) => {
    await navigateToSkillsApp(page);
    await use(page);
  },

  isAdmin: async ({ page }, use) => {
    const admin = await checkAdminStatus(page);
    await use(admin);
  },

  step: async ({}, use) => {
    const stepFn: StepFn = async (name, body) => {
      await base.step(name, body);
    };
    await use(stepFn);
  },
});

export { expect };
export { SKILL_HOST, navigateToSkillsApp, checkAdminStatus };
