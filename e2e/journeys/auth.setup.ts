import { test as setup, expect } from '@playwright/test';
import path from 'path';

const SKILL_HOST = process.env.SKILLS_HOST || 'http://localhost:3000';
const AUTH_HOST = process.env.AUTH_HOST || '';
const AUTH_FLOW =
  (process.env.AUTH_FLOW as 'username_password' | 'magic_link' | 'sso' | 'direct_sso') ||
  'username_password';

setup('authenticate', async ({ page, browserName }) => {
  const storageStatePath = path.join(
    __dirname,
    `../playwright/.auth/user-${browserName === 'chromium' ? 'chrome' : browserName === 'webkit' ? 'safari' : browserName}.json`,
  );

  // Navigate to the skills host
  await page.goto(SKILL_HOST, { waitUntil: 'domcontentloaded', timeout: 120_000 });

  // Wait for either the app to load (already logged in) or auth redirect
  const isAlreadyLoggedIn = await page
    .waitForURL((url) => url.href.includes('/home') || url.href.includes('/start'), {
      timeout: 10_000,
    })
    .then(() => true)
    .catch(() => false);

  if (!isAlreadyLoggedIn) {
    // Handle SSO or username/password login
    if (AUTH_FLOW === 'username_password') {
      // Wait for auth page
      await page.waitForURL((url) => url.href.includes(AUTH_HOST) || url.href.includes('/login'), {
        timeout: 60_000,
      });

      // Click "Continue with Password"
      const continueWithPasswordBtn = page.getByRole('button', {
        name: /continue with password/i,
      });
      await expect(continueWithPasswordBtn).toBeVisible({ timeout: 30_000 });
      await continueWithPasswordBtn.click();

      // Fill credentials
      const emailInput = page.locator('input[type="email"]');
      await expect(emailInput).toBeVisible({ timeout: 15_000 });
      await emailInput.fill(process.env.PLAYWRIGHT_USERNAME || '');

      const passwordInput = page.locator('input[type="password"]');
      await expect(passwordInput).toBeVisible({ timeout: 15_000 });
      await passwordInput.fill(process.env.PLAYWRIGHT_PASSWORD || '');

      // Click Continue / Login
      const continueBtn = page.getByRole('button', { name: /continue/i });
      await continueBtn.click();
    } else if (AUTH_FLOW === 'sso' || AUTH_FLOW === 'direct_sso') {
      // SSO flow — wait for redirect back
      // Implementation depends on IDP
    }

    // Wait for redirect back to skills app
    await page.waitForURL((url) => url.href.includes('/home') || url.href.includes('/start'), {
      timeout: 120_000,
    });
  }

  // Save storage state
  await page.context().storageState({ path: storageStatePath });
});
