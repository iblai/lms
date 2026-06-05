import { test, expect } from '@playwright/test';
import { waitForAppShell, gotoTenantPage } from '../utils/navigation';

test.describe('Journey 12: Profile Public', () => {
  test.setTimeout(200_000);

  test.beforeEach(async ({ page }) => {
    await gotoTenantPage(page, 'profile/public', { timeout: 120_000 });
    await waitForAppShell(page);
  });

  test('CP-1: public profile page loads', async ({ page }) => {
    // The page renders the user's name in an <h1> and an About heading
    const userName = page.getByRole('heading', { level: 1 });
    await expect(userName).toBeVisible({ timeout: 30_000 });

    const nameText = await userName.textContent();
    expect(nameText?.trim().length).toBeGreaterThan(0);
  });

  test('CP-2: shows user name and visible info', async ({ page }) => {
    // User name heading
    const userName = page.getByRole('heading', { level: 1 });
    await expect(userName).toBeVisible({ timeout: 30_000 });

    const nameText = await userName.textContent();
    expect(nameText?.trim().length).toBeGreaterThan(0);

    // About section is visible by default
    const aboutHeading = page.getByRole('heading', { name: 'About' });
    await expect(aboutHeading).toBeVisible({ timeout: 10_000 });

    // Profile content tabs (About, Education, Experience, etc.) are rendered as buttons
    const educationTab = page.getByRole('button', { name: 'Education' });
    await expect(educationTab).toBeVisible({ timeout: 10_000 });
  });

  test('CP-3: no private information exposed', async ({ page }) => {
    // Ensure no password fields or sensitive tokens are visible
    const passwordField = page.locator('input[type="password"]');
    await expect(passwordField).toHaveCount(0);

    const tokenText = page.getByText(/api.key|secret.key|access.token/i);
    const hasToken = await tokenText.isVisible({ timeout: 3_000 }).catch(() => false);
    expect(hasToken).toBe(false);
  });
});
