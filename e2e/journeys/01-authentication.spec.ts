import { test, expect } from '@playwright/test';
import { waitForAppShell } from '../utils/navigation';

const SKILL_HOST = process.env.SKILLS_HOST || 'http://localhost:3000';
const AUTH_HOST = process.env.AUTH_HOST || '';

/**
 * Journey 01: Authentication
 *
 * Validates the authentication flow for SkillsAI:
 *  1. Unauthenticated user is redirected to SSO / login
 *  2. User can authenticate via SSO
 *  3. After SSO completion, redirected to /home or /start
 *  4. Unauthenticated access to /home is redirected
 *
 * These tests use a fresh browser context (no storageState) so they can
 * observe redirect behaviour for unauthenticated users.
 */
test.describe('Journey 01: Authentication', () => {
  test.setTimeout(200000);

  // Use a fresh context — do NOT inherit the global storageState
  test.use({ storageState: { cookies: [], origins: [] } });

  test('Checkpoint 1: Unauthenticated user visiting root is redirected to SSO login', async ({
    page,
  }) => {
    // Skip when there is no auth host configured (local-only dev)
    if (!AUTH_HOST) {
      test.skip();
      return;
    }

    await page.goto(SKILL_HOST, {
      timeout: 120000,
    });

    // The app should redirect to the auth host or a /login route
    await page.waitForURL(
      (url) =>
        url.href.includes(AUTH_HOST) || url.href.includes('/login') || url.href.includes('/auth'),
      { timeout: 60000 },
    );

    const currentUrl = page.url();
    expect(
      currentUrl.includes(AUTH_HOST) ||
        currentUrl.includes('/login') ||
        currentUrl.includes('/auth'),
    ).toBeTruthy();
  });

  test('Checkpoint 2: User can authenticate via SSO flow', async ({ page }) => {
    if (!AUTH_HOST) {
      test.skip();
      return;
    }

    const username = process.env.PLAYWRIGHT_USERNAME || '';
    const password = process.env.PLAYWRIGHT_PASSWORD || '';

    if (!username || !password) {
      test.skip();
      return;
    }

    await page.goto(SKILL_HOST, {
      timeout: 120000,
    });

    // Wait for auth page
    await page.waitForURL(
      (url) =>
        url.href.includes(AUTH_HOST) || url.href.includes('/login') || url.href.includes('/auth'),
      { timeout: 60000 },
    );

    // Attempt username/password login (most common in CI)
    const continueWithPasswordBtn = page.getByRole('button', {
      name: /continue with password/i,
    });
    const hasPwdButton = await continueWithPasswordBtn
      .isVisible({ timeout: 120_000 })
      .catch(() => false);

    if (hasPwdButton) {
      await continueWithPasswordBtn.click();
    }

    // Fill credentials
    const emailInput = page.locator('input[type="email"]');
    const hasEmail = await emailInput.isVisible({ timeout: 120_000 }).catch(() => false);

    if (hasEmail) {
      await emailInput.fill(username);

      const passwordInput = page.locator('input[type="password"]');
      await expect(passwordInput).toBeVisible({ timeout: 15000 });
      await passwordInput.fill(password);

      const continueBtn = page.getByRole('button', { name: /continue|log in|sign in/i });
      await expect(continueBtn).toBeVisible({ timeout: 10000 });
      await continueBtn.click();
    }

    // After authentication the app should redirect to /home or /start
    await page.waitForURL((url) => url.href.includes('/home') || url.href.includes('/start'), {
      timeout: 120000,
    });

    const postLoginUrl = page.url();
    expect(postLoginUrl.includes('/home') || postLoginUrl.includes('/start')).toBeTruthy();
  });

  test('Checkpoint 3: After SSO completion user lands on /home or /start', async ({ page }) => {
    // This checkpoint re-validates post-login landing using saved storage state
    // by performing a full login then checking the URL.
    if (!AUTH_HOST) {
      test.skip();
      return;
    }

    const username = process.env.PLAYWRIGHT_USERNAME || '';
    const password = process.env.PLAYWRIGHT_PASSWORD || '';

    if (!username || !password) {
      test.skip();
      return;
    }

    await page.goto(SKILL_HOST, {
      timeout: 120000,
    });

    // Wait for auth redirect
    await page.waitForURL(
      (url) =>
        url.href.includes(AUTH_HOST) ||
        url.href.includes('/login') ||
        url.href.includes('/auth') ||
        url.href.includes('/home') ||
        url.href.includes('/start'),
      { timeout: 60000 },
    );

    // If already at home/start, checkpoint passes
    if (page.url().includes('/home') || page.url().includes('/start')) {
      expect(true).toBeTruthy();
      return;
    }

    // Otherwise complete login
    const continueWithPasswordBtn = page.getByRole('button', {
      name: /continue with password/i,
    });
    const hasPwdButton = await continueWithPasswordBtn
      .isVisible({ timeout: 120_000 })
      .catch(() => false);

    if (hasPwdButton) {
      await continueWithPasswordBtn.click();
    }

    const emailInput = page.locator('input[type="email"]');
    const hasEmail = await emailInput.isVisible({ timeout: 120_000 }).catch(() => false);

    if (hasEmail) {
      await emailInput.fill(username);
      const passwordInput = page.locator('input[type="password"]');
      await expect(passwordInput).toBeVisible({ timeout: 15000 });
      await passwordInput.fill(password);

      const continueBtn = page.getByRole('button', { name: /continue|log in|sign in/i });
      await expect(continueBtn).toBeVisible({ timeout: 10000 });
      await continueBtn.click();
    }

    await page.waitForURL((url) => url.href.includes('/home') || url.href.includes('/start'), {
      timeout: 120000,
    });

    const landingUrl = page.url();
    expect(landingUrl.includes('/home') || landingUrl.includes('/start')).toBeTruthy();
  });

  test('Checkpoint 4: Unauthenticated access to /home is redirected', async ({ page }) => {
    if (!AUTH_HOST) {
      test.skip();
      return;
    }

    await page.goto(`${SKILL_HOST}/home`, {
      timeout: 120000,
    });

    // Should redirect away from /home to auth
    await page.waitForURL(
      (url) =>
        url.href.includes(AUTH_HOST) || url.href.includes('/login') || url.href.includes('/auth'),
      { timeout: 60000 },
    );

    const redirectedUrl = page.url();
    expect(redirectedUrl).not.toContain(`${SKILL_HOST}/home`);
  });
});
