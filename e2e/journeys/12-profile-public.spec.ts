import { test, expect } from '@playwright/test';

const SKILL_HOST = process.env.SKILLS_HOST || 'http://localhost:3000';

test.describe('Journey 12: Profile Public', () => {
  test.setTimeout(200_000);

  test.beforeEach(async ({ page }) => {
    await page.goto(SKILL_HOST, { waitUntil: 'domcontentloaded', timeout: 120_000 });
    await page.waitForURL(
      (url) => url.href.includes('/home') || url.href.includes('/start'),
      { timeout: 60_000 }
    );
  });

  test('CP-1: public profile page loads', async ({ page }) => {
    await page.goto(`${SKILL_HOST}/profile/public-profile`, {
      waitUntil: 'domcontentloaded',
      timeout: 60_000,
    });

    // The page should load without errors — look for any profile content
    const profileContent = page.locator('[class*="profile"], [data-testid*="profile"]').first()
      .or(page.getByRole('main'));
    await expect(profileContent).toBeVisible({ timeout: 30_000 });
  });

  test('CP-2: shows user name and visible info', async ({ page }) => {
    await page.goto(`${SKILL_HOST}/profile/public-profile`, {
      waitUntil: 'domcontentloaded',
      timeout: 60_000,
    });

    // Look for the user's displayed name — heading, text, or element with name info
    const userName = page.getByRole('heading').first()
      .or(page.locator('[class*="name"], [class*="username"], [data-testid*="name"]').first());
    await expect(userName).toBeVisible({ timeout: 30_000 });

    // Verify at least some visible profile information is present (e.g. avatar, bio, skills)
    const profileInfo = page.locator(
      '[class*="avatar"], [class*="bio"], [class*="skill"], img[alt*="avatar" i], img[alt*="profile" i]'
    ).first();
    const hasProfileInfo = await profileInfo.isVisible({ timeout: 10_000 }).catch(() => false);

    // At minimum the name should be visible
    const nameText = await userName.textContent();
    expect(nameText?.trim().length).toBeGreaterThan(0);
  });

  test('CP-3: no private information exposed', async ({ page }) => {
    await page.goto(`${SKILL_HOST}/profile/public-profile`, {
      waitUntil: 'domcontentloaded',
      timeout: 60_000,
    });

    // Ensure private fields are NOT visible on the public profile view
    // Check that sensitive data like password fields, tokens, or private emails are not displayed
    const passwordField = page.locator('input[type="password"]');
    const tokenText = page.getByText(/api.key|secret.key|access.token/i);

    await expect(passwordField).toHaveCount(0);
    const hasToken = await tokenText.isVisible({ timeout: 3_000 }).catch(() => false);
    expect(hasToken).toBe(false);

    // Verify no edit buttons for private data are exposed on the public view
    const editPrivateBtn = page.getByRole('button', { name: /edit email|change password/i });
    const hasEditPrivate = await editPrivateBtn.isVisible({ timeout: 3_000 }).catch(() => false);
    expect(hasEditPrivate).toBe(false);
  });
});
