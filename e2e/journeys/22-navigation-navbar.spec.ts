import { test, expect } from '@playwright/test';
import { waitForAppShell, gotoTenantPage } from '../utils/navigation';

/**
 * Journey 22: Navigation — NavBar & Sidebar
 *
 * The navbar is the cross-SPA PlatformNavbar shell (search + notification
 * bell + profile dropdown on the right, Studio / AI Analytics links, and
 * the course switcher on course pages). Page navigation (Home, Courses,
 * Discover, …) lives in the PlatformSidebar.
 */
test.describe('Journey 22: Navigation & NavBar', () => {
  test.setTimeout(200000);

  test.beforeEach(async ({ page }) => {
    await gotoTenantPage(page, 'home', { timeout: 120_000 });
    await waitForAppShell(page);
  });

  test('CP-1: NavBar renders all expected elements', async ({ page }) => {
    const navbar = page.getByRole('banner');
    await expect(navbar).toBeVisible({ timeout: 30_000 });

    // Invariant search bar (routes to Discover)
    const search = navbar.getByRole('searchbox');
    await expect(search.first()).toBeVisible({ timeout: 10_000 });

    // Profile / more-options button should exist
    const profileButton = navbar.getByRole('button', { name: 'More options' });
    await expect(profileButton).toBeVisible({ timeout: 10_000 });
  });

  test('CP-2: Sidebar Home item navigates to /home', async ({ page }) => {
    // Navigate away first
    await gotoTenantPage(page, 'discover', { timeout: 120_000 });
    await waitForAppShell(page);

    const sidebar = page.getByRole('complementary').first();
    const homeItem = sidebar.getByRole('button', { name: 'Home' });
    await expect(homeItem).toBeVisible({ timeout: 30_000 });
    await homeItem.click();

    await page.waitForURL(/\/home/, { timeout: 60_000 });
    expect(page.url()).toContain('/home');
  });

  test('CP-3: Profile is reachable from the profile dropdown', async ({ page }) => {
    const navbar = page.getByRole('banner');
    const profileButton = navbar.getByRole('button', { name: 'More options' });
    await expect(profileButton).toBeVisible({ timeout: 15_000 });
    await profileButton.click();

    const profileMenuItem = page.getByRole('menuitem', { name: /profile/i });
    await expect(profileMenuItem).toBeVisible({ timeout: 10_000 });
    await profileMenuItem.click();

    await page.waitForURL(/\/profile/, { timeout: 60_000 });
    expect(page.url()).toContain('/profile');
  });

  test('CP-4: Suggested Courses "See More" navigates to /recommended', async ({ page }) => {
    const suggestedHeading = page.getByRole('heading', { name: /suggested courses/i });
    const hasSuggested = await suggestedHeading.isVisible({ timeout: 120_000 }).catch(() => false);

    if (!hasSuggested) {
      test.skip();
      return;
    }

    // The See More link sits in the Suggested Courses section header.
    const seeMore = page.locator('a[href*="/recommended"]').first();
    await expect(seeMore).toBeVisible({ timeout: 30_000 });
    await seeMore.click();

    await page.waitForURL(/\/recommended/, { timeout: 60_000 });
    expect(page.url()).toContain('/recommended');
  });

  test('CP-5: Sidebar Discover item navigates to /discover', async ({ page }) => {
    const sidebar = page.getByRole('complementary').first();
    const discoverItem = sidebar.getByRole('button', { name: 'Discover' });
    await expect(discoverItem).toBeVisible({ timeout: 30_000 });
    await discoverItem.click();

    await page.waitForURL(/\/discover/, { timeout: 60_000 });
    expect(page.url()).toContain('/discover');
  });

  test('CP-6: Sidebar Analytics menu navigates to /analytics (admin only)', async ({ page }) => {
    const sidebar = page.getByRole('complementary').first();

    // The Analytics sub-items render in the expanded sidebar.
    const expandButton = sidebar.getByRole('button', { name: /expand sidebar/i });
    if (await expandButton.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await expandButton.click();
    }

    // Admin/RBAC-dependent — skip when the Analytics section is not visible.
    const analyticsSection = sidebar.getByRole('button', { name: 'Analytics' });
    const isVisible = await analyticsSection
      .waitFor({ state: 'visible', timeout: 10_000 })
      .then(() => true)
      .catch(() => false);

    if (!isVisible) {
      test.skip();
      return;
    }

    await analyticsSection.click();
    const overviewItem = sidebar.getByRole('button', { name: 'Overview' });
    await expect(overviewItem).toBeVisible({ timeout: 10_000 });
    await overviewItem.click();

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

  test('CP-8: Sidebar logo navigates to home', async ({ page }) => {
    // Navigate away from home first
    await gotoTenantPage(page, 'discover', { timeout: 120_000 });
    await waitForAppShell(page);

    const sidebar = page.getByRole('complementary').first();
    // The logo is only shown when the sidebar is expanded.
    const expandButton = sidebar.getByRole('button', { name: /expand sidebar/i });
    if (await expandButton.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await expandButton.click();
    }

    const logoLink = sidebar.getByRole('link', { name: 'Home' });
    await expect(logoLink).toBeVisible({ timeout: 15_000 });
    await logoLink.click();

    await page.waitForURL(/\/(home|start)?$/, { timeout: 60_000 });
    const url = page.url();
    expect(url.includes('/home') || url.endsWith('/') || url.includes('/start')).toBeTruthy();
  });

  test('CP-9: Course switcher shows the current course and switches to another', async ({
    page,
  }) => {
    // Enter a course from My Courses
    const myCoursesGrid = page.getByRole('region', { name: 'My Courses' });
    await expect(myCoursesGrid).toBeVisible({ timeout: 120_000 });
    const courseLink = myCoursesGrid.getByRole('link').first();

    if (!(await courseLink.isVisible({ timeout: 30_000 }).catch(() => false))) {
      test.skip();
      return;
    }
    await courseLink.click();
    await page.waitForURL(/\/courses\//, { timeout: 120_000 });
    await waitForAppShell(page);

    // The switcher shows the current course in the navbar's left cluster
    const switcher = page.getByRole('button', { name: 'Switch course' });
    await expect(switcher).toBeVisible({ timeout: 30_000 });
    await switcher.click();

    const menu = page.getByRole('menu');
    await expect(menu).toBeVisible({ timeout: 10_000 });
    const items = menu.getByRole('menuitem');
    const count = await items.count();

    if (count < 2) {
      test.skip();
      return;
    }

    const startUrl = page.url();
    // Pick the first course that is NOT the current one (current is marked
    // but simplest is: click an item and verify the URL changed to another
    // course about page).
    for (let i = 0; i < count; i++) {
      const item = items.nth(i);
      const hasCheck = (await item.locator('svg.text-amber-500').count()) > 0;
      if (!hasCheck) {
        await item.click();
        break;
      }
    }

    await page.waitForURL(/\/courses\//, { timeout: 60_000 });
    expect(page.url()).not.toBe(startUrl);
  });
});
