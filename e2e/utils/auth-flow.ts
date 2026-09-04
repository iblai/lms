/**
 * Shared sign-in used by the admin and non-admin auth setups.
 *
 * Both setups drive the same auth SPA and differ only in credentials and in
 * which storage-state file they write, so the flow lives here rather than being
 * duplicated across the two `*.setup.ts` files.
 */
import { expect, Page } from '@playwright/test';
import path from 'path';

const SKILL_HOST = process.env.SKILLS_HOST || 'http://localhost:3000';
const AUTH_HOST = process.env.AUTH_HOST || '';
const AUTH_FLOW =
  (process.env.AUTH_FLOW as 'username_password' | 'magic_link' | 'sso' | 'direct_sso') ||
  'username_password';

/** Post-login landing pages. Routes are tenant-scoped (`/platform/<tenant>/home`),
 * so matching on the trailing segment covers the scoped and legacy URLs alike. */
const isLandingUrl = (url: URL) => url.href.includes('/home') || url.href.includes('/start');

/** Drive the auth SPA's username/password flow and park on the app's landing page. */
export async function signIn(page: Page, username: string, password: string): Promise<void> {
  await page.goto(SKILL_HOST, { timeout: 120_000 });

  const alreadyLoggedIn = await page
    .waitForURL(isLandingUrl, { timeout: 10_000 })
    .then(() => true)
    .catch(() => false);
  if (alreadyLoggedIn) return;

  if (AUTH_FLOW === 'username_password') {
    await page.waitForURL((url) => url.href.includes(AUTH_HOST) || url.href.includes('/login'), {
      timeout: 60_000,
    });

    const continueWithPasswordBtn = page.getByRole('button', { name: /continue with password/i });
    await expect(continueWithPasswordBtn).toBeVisible({ timeout: 30_000 });
    await continueWithPasswordBtn.click();

    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible({ timeout: 15_000 });
    await emailInput.fill(username);

    const passwordInput = page.locator('input[type="password"]');
    await expect(passwordInput).toBeVisible({ timeout: 15_000 });
    await passwordInput.fill(password);

    await page.getByRole('button', { name: /continue/i }).click();
  }

  // The auth SPA reports bad credentials inline rather than navigating, so
  // surface that as the failure instead of a bare navigation timeout.
  const loginError = page.getByText(/invalid|incorrect|unable to log ?in|login error/i).first();
  await Promise.race([
    page.waitForURL(isLandingUrl, { timeout: 120_000 }),
    loginError.waitFor({ state: 'visible', timeout: 120_000 }).then(async () => {
      throw new Error(
        `Auth rejected the credentials for "${username}": ${(await loginError.textContent()) || 'login error'}`,
      );
    }),
  ]);
}

/** Derive the browser label from the project name ("setup-chrome" → "chrome").
 * Needed because Edge reports browserName "chromium", same as Chrome. */
export const browserLabel = (projectName: string) =>
  projectName.replace('setup-', '').replace('-student', '');

export const storageStatePath = (label: string, suffix = '') =>
  path.join(__dirname, `../playwright/.auth/user-${label}${suffix}.json`);
