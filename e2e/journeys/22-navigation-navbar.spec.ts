import { test, expect } from '@playwright/test';
import { waitForAppShell, gotoTenantPage } from '../utils/navigation';

/**
 * Journey 22: Navigation — NavBar & Sidebar
 *
 * The navbar is the cross-SPA PlatformNavbar shell (search + notification
 * bell + profile dropdown on the right, and the current course / program
 * title on course and program pages). Page navigation (Home, Courses,
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

    expect(await page.getByRole('dialog', { name: 'Profile' })).toBeVisible({ timeout: 10_000 });
  });

  test('CP-4: Recommended catalog view lists recommendations with pills', async ({ page }) => {
    // Recommendations live on the centralized catalog page behind the
    // Recommended filter.
    await gotoTenantPage(page, 'discover?recommended=true', { timeout: 120_000 });
    await waitForAppShell(page);

    // "Recommended" is a term of the Access facet (slug: enrollment).
    const recommendedChip = page.getByRole('button', {
      name: /remove filter enrollment: recommended/i,
    });
    await expect(recommendedChip).toBeVisible({ timeout: 120_000 });

    const contentCard = page.locator('[data-testid="discover-content-card"]');
    const emptyState = page.getByText(/no recommended content found/i).first();
    await expect(contentCard.first().or(emptyState)).toBeVisible({ timeout: 120_000 });

    const hasCards = await contentCard
      .first()
      .isVisible()
      .catch(() => false);
    if (!hasCards) {
      test.skip();
      return;
    }

    const recommendedPill = contentCard.first().getByText('Recommended');
    await expect(recommendedPill).toBeVisible({ timeout: 30_000 });
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

  test('CP-9: Navbar shows the current course title on a course page', async ({ page }) => {
    // Enter a course from the enrolled catalog view
    await gotoTenantPage(page, 'discover?content=courses&enrolled=true', { timeout: 120_000 });
    await waitForAppShell(page);
    const courseCard = page.locator('[data-testid="discover-content-card"]').first();

    if (!(await courseCard.isVisible({ timeout: 120_000 }).catch(() => false))) {
      test.skip();
      return;
    }
    const cardTitle = (await courseCard.getByRole('heading').first().textContent())?.trim();
    await courseCard.click();
    await page.waitForURL(/\/courses\//, { timeout: 120_000 });
    await waitForAppShell(page);

    // The navbar's left cluster shows the course name as a heading (the
    // enrolled-courses dropdown is gone).
    const navbar = page.getByRole('banner');
    const title = navbar.getByRole('heading').first();
    await expect(title).toBeVisible({ timeout: 30_000 });
    if (cardTitle) {
      await expect(title).toHaveText(cardTitle, { timeout: 30_000 });
    }
    await expect(navbar.getByRole('button', { name: 'Switch course' })).toHaveCount(0);
  });

  test('CP-10: Admin can switch the navbar between Admin and User modes', async ({ page }) => {
    const navbar = page.getByRole('banner');
    const modeSwitch = navbar.getByTestId('learner-mode-switch');

    // Admin-only — skip for accounts that are not platform admins.
    if (!(await modeSwitch.isVisible({ timeout: 30_000 }).catch(() => false))) {
      test.skip();
      return;
    }

    // Starts in admin mode, sitting just left of the notification bell.
    await expect(modeSwitch).toBeChecked();
    await expect(navbar.getByText('User', { exact: true })).toBeVisible();
    await expect(navbar.getByText('Admin', { exact: true })).toBeVisible();

    const sidebar = page.getByRole('complementary').first();
    const expandButton = sidebar.getByRole('button', { name: /expand sidebar/i });
    if (await expandButton.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await expandButton.click();
    }
    const analyticsSection = sidebar.getByRole('button', { name: 'Analytics' });
    const hadAnalytics = await analyticsSection
      .waitFor({ state: 'visible', timeout: 10_000 })
      .then(() => true)
      .catch(() => false);

    // User mode mimics a plain learner: staff entry points leave the sidebar.
    await modeSwitch.click();
    await expect(modeSwitch).not.toBeChecked();
    if (hadAnalytics) {
      await expect(analyticsSection).toHaveCount(0);
    }

    // And back to admin mode restores them.
    await modeSwitch.click();
    await expect(modeSwitch).toBeChecked();
    if (hadAnalytics) {
      await expect(analyticsSection).toBeVisible({ timeout: 10_000 });
    }
  });

  test('CP-11: Below xl the mode switch moves into the profile dropdown', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });

    const navbar = page.getByRole('banner');
    const profileButton = navbar.getByRole('button', { name: 'More options' });
    await expect(profileButton).toBeVisible({ timeout: 15_000 });

    // The inline switch is hidden at this width.
    await expect(navbar.getByTestId('learner-mode-toggle')).toBeHidden();

    await profileButton.click();
    await expect(page.getByRole('menu')).toBeVisible({ timeout: 10_000 });
    const menuSwitch = page.getByRole('menu').getByTestId('learner-mode-switch');

    // Admin-only — skip for accounts that are not platform admins.
    if (!(await menuSwitch.isVisible({ timeout: 10_000 }).catch(() => false))) {
      test.skip();
      return;
    }

    await expect(menuSwitch).toBeChecked();
    await menuSwitch.click();
    await expect(menuSwitch).not.toBeChecked();
    await menuSwitch.click();
    await expect(menuSwitch).toBeChecked();
  });

  test('CP-12: Profile dropdown Help link opens the help center in one new tab', async ({
    page,
  }) => {
    const profileButton = page.getByRole('banner').getByRole('button', { name: 'More options' });
    await expect(profileButton).toBeVisible({ timeout: 15_000 });
    await profileButton.click();
    await expect(page.getByRole('menu')).toBeVisible({ timeout: 10_000 });

    const helpLink = page.getByRole('menu').getByRole('link', { name: /help/i });
    // A tenant can turn the help center off (show_help: false).
    if (!(await helpLink.isVisible({ timeout: 10_000 }).catch(() => false))) {
      test.skip();
      return;
    }

    await expect(helpLink).toHaveAttribute('href', /^https?:\/\//);
    await expect(helpLink).toHaveAttribute('target', '_blank');

    const context = page.context();
    const pagesBefore = context.pages().length;
    const [helpPage] = await Promise.all([context.waitForEvent('page'), helpLink.click()]);
    // The SDK anchor and onHelpClick used to both open the URL; wait long
    // enough for a second tab to show up if that regresses.
    await page.waitForTimeout(1_000);
    expect(context.pages().length).toBe(pagesBefore + 1);
    await helpPage.close();
  });
});
