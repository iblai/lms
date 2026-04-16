import { test, expect } from '@playwright/test';
import { waitForAppShell } from '../utils/navigation';

const SKILL_HOST = process.env.SKILLS_HOST || 'http://localhost:3000';

test.describe('Journey 22: Navigation & NavBar', () => {
  test.setTimeout(200000);

  test.beforeEach(async ({ page }) => {
    await page.goto(`${SKILL_HOST}/home`, {
      timeout: 120_000,
    });
    await waitForAppShell(page);
  });

  test('CP-1: NavBar renders all expected elements', async ({ page }) => {
    const navbar = page.getByRole('banner');
    await expect(navbar).toBeVisible({ timeout: 30_000 });

    // Logo or brand element should exist
    const logo = navbar.getByRole('link').first();
    await expect(logo).toBeVisible({ timeout: 10_000 });

    // Profile / more-options button should exist
    const profileButton = navbar.getByRole('button', { name: 'More options' });
    await expect(profileButton).toBeVisible({ timeout: 10_000 });
  });

  test('CP-2: Home link navigates to /home', async ({ page }) => {
    // Navigate away first
    await page.goto(`${SKILL_HOST}/discover`, {
      timeout: 120_000,
    });
    await waitForAppShell(page);

    const homeLink = page.getByRole('link', { name: /home/i });
    await expect(homeLink).toBeVisible({ timeout: 30_000 });
    await homeLink.click();

    await page.waitForURL(/\/home/, { timeout: 60_000 });
    expect(page.url()).toContain('/home');
  });

  test('CP-3: Profile link navigates to /profile', async ({ page }) => {
    const profileLink = page.getByRole('link', { name: /profile/i });
    const isVisible = await profileLink.isVisible({ timeout: 120_000 }).catch(() => false);

    if (!isVisible) {
      // Profile might be in a dropdown menu
      const navbar = page.getByRole('banner');
      const profileButton = navbar.getByRole('button', { name: 'More options' });
      await expect(profileButton).toBeVisible({ timeout: 10_000 });
      await profileButton.click();

      const profileMenuItem = page.getByRole('menuitem', { name: /profile/i });
      await expect(profileMenuItem).toBeVisible({ timeout: 10_000 });
      await profileMenuItem.click();
    } else {
      await profileLink.click();
    }

    await page.waitForURL(/\/profile/, { timeout: 60_000 });
    expect(page.url()).toContain('/profile');
  });

  test('CP-4: Recommended link navigates to /recommended', async ({ page }) => {
    const recommendedLink = page.getByRole('link', { name: /recommended/i });
    const isVisible = await recommendedLink.isVisible({ timeout: 120_000 }).catch(() => false);

    if (!isVisible) {
      test.skip();
      return;
    }

    await recommendedLink.click();
    await page.waitForURL(/\/recommended/, { timeout: 60_000 });
    expect(page.url()).toContain('/recommended');
  });

  test('CP-5: Discover link navigates to /discover', async ({ page }) => {
    const discoverLink = page.getByRole('link', { name: /discover/i });
    await expect(discoverLink).toBeVisible({ timeout: 30_000 });
    await discoverLink.click();

    await page.waitForURL(/\/discover/, { timeout: 60_000 });
    expect(page.url()).toContain('/discover');
  });

  test('CP-6: AI Analytics link navigates to /analytics (admin only)', async ({ page }) => {
    // This test is admin-dependent — skip if AI Analytics link is not visible
    const analyticsLink = page.getByRole('link', { name: /ai analytics/i });
    const isVisible = await analyticsLink
      .waitFor({ state: 'visible', timeout: 10_000 })
      .then(() => true)
      .catch(() => false);

    if (!isVisible) {
      test.skip();
      return;
    }

    await analyticsLink.click();
    await page.waitForURL(/\/analytics/, { timeout: 60_000 });
    expect(page.url()).toContain('/analytics');
  });

  test('CP-7: Profile dropdown shows options', async ({ page }) => {
    const profileButton = page.getByRole('button', { name: 'More options' });
    await expect(profileButton).toBeVisible({ timeout: 15_000 });
    await profileButton.click();

    // The dropdown menu should be visible
    const menu = page.getByRole('menu');
    await expect(menu).toBeVisible({ timeout: 10_000 });

    // Should have Profile menu item
    const profileMenuItem = page.getByRole('menuitem', { name: /profile/i });
    await expect(profileMenuItem).toBeVisible({ timeout: 5_000 });

    // Should have at least one more menu item (tenant/org option or logout)
    const menuItems = page.getByRole('menuitem');
    const count = await menuItems.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test('CP-8: Logo link navigates to home', async ({ page }) => {
    // Navigate away from home first
    await page.goto(`${SKILL_HOST}/discover`, {
      timeout: 120_000,
    });
    await waitForAppShell(page);

    // Click the logo (typically the first link in the banner)
    const navbar = page.getByRole('banner');
    const logoLink = navbar.getByRole('link').first();
    await expect(logoLink).toBeVisible({ timeout: 10_000 });
    await logoLink.click();

    await page.waitForURL(/\/(home|start)?$/, { timeout: 60_000 });
    // Should be on home or root
    const url = page.url();
    expect(url.includes('/home') || url.endsWith('/') || url.includes('/start')).toBeTruthy();
  });
});
