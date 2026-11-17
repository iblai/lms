import { test, expect } from '@playwright/test';
import { logger } from '@iblai/iblai-js/playwright';
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
  /**
   * The SDK's credit balance sits just left of the bell, as on OS. The shell
   * shows it only to a live admin (or free-trial user) of a paywall tenant with
   * ecommerce on, so the assertion is keyed on the facts the host stores.
   */
  test('CP-13: Admins of a paywall tenant see the credit balance beside the bell', async ({
    page,
  }) => {
    const navbar = page.getByRole('banner');
    await expect(navbar).toBeVisible({ timeout: 30_000 });

    const facts = await page.evaluate(() => {
      try {
        const tenant = JSON.parse(localStorage.getItem('current_tenant') || '{}');
        return { isAdmin: !!tenant.is_admin, showPaywall: !!tenant.show_paywall, key: tenant.key };
      } catch {
        return { isAdmin: false, showPaywall: false, key: null };
      }
    });
    const trigger = navbar.getByTestId('credit-balance-trigger');
    const bell = navbar.getByRole('button', { name: /notification/i }).first();

    if (!(facts.isAdmin && facts.showPaywall)) {
      await expect(trigger).toHaveCount(0);
      return;
    }

    await expect(trigger).toBeVisible({ timeout: 30_000 });
    await expect(trigger).toContainText(/credit/i);
    if (await bell.isVisible({ timeout: 10_000 }).catch(() => false)) {
      const [t, b] = await Promise.all([trigger.boundingBox(), bell.boundingBox()]);
      expect(t && b && t.x < b.x).toBe(true);
    }

    // The dropdown offers the credits actions the SDK ships.
    await trigger.click();
    await expect(page.getByTestId('credit-balance-panel')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('button', { name: /add credits/i }).first()).toBeVisible();
    await page.keyboard.press('Escape');
  });
  /**
   * A free-trial user (a non-admin whose only organization is the main one,
   * with billing on) sees the whole admin cluster, as on OS, and every entry
   * opens the SDK plan picker instead of the real action. Keyed on the facts
   * the host stores; skipped for any other kind of account.
   */
  test('CP-14: A free-trial user sees the admin cluster and gets the plan picker on click', async ({
    page,
  }) => {
    const facts = await page.evaluate(() => {
      try {
        const tenant = JSON.parse(localStorage.getItem('current_tenant') || '{}');
        const tenants = JSON.parse(localStorage.getItem('tenants') || '[]');
        return {
          isAdmin: tenant.is_admin === true,
          key: tenant.key ?? null,
          count: tenants.length,
        };
      } catch {
        return { isAdmin: true, key: null, count: 0 };
      }
    });
    const mainTenantKey = process.env.MAIN_PLATFORM_KEY || 'main';
    if (facts.isAdmin || facts.count !== 1 || facts.key !== mainTenantKey) {
      test.skip();
      return;
    }

    const sidebar = page.getByRole('complementary').first();
    const expandButton = sidebar.getByRole('button', { name: /expand sidebar/i });
    if (await expandButton.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await expandButton.click();
    }
    const management = sidebar.getByRole('button', { name: /management/i }).first();
    await expect(management).toBeVisible({ timeout: 30_000 });

    await management.click();
    await expect(page.getByRole('dialog', { name: /(choose|change) your plan/i })).toBeVisible({
      timeout: 30_000,
    });
    await page.keyboard.press('Escape');
  });

  test('CP-15: On a narrow viewport a truncated course title gets an info button that reveals the full title', async ({
    page,
  }) => {
    // Narrow enough that most course titles cannot fit beside the hamburger,
    // bell and avatar.
    await page.setViewportSize({ width: 320, height: 568 });
    // Any course will do; fall back to the full catalog when the account has
    // no enrolments. isVisible() never waits, so wait for either the first
    // card or the catalog's empty state.
    let opened = false;
    for (const catalog of ['discover?content=courses&enrolled=true', 'discover?content=courses']) {
      await gotoTenantPage(page, catalog, { timeout: 120_000 });
      await waitForAppShell(page);
      const courseCard = page.locator('[data-testid="discover-content-card"]').first();
      const hasCourse = await Promise.race([
        courseCard.waitFor({ state: 'visible', timeout: 120_000 }).then(() => true),
        page
          .getByTestId('empty-box')
          .waitFor({ state: 'visible', timeout: 120_000 })
          .then(() => false),
      ]).catch(() => false);
      if (hasCourse) {
        await courseCard.click();
        opened = true;
        break;
      }
    }
    if (!opened) {
      test.skip();
      return;
    }
    await page.waitForURL(/\/courses\//, { timeout: 120_000 });
    await waitForAppShell(page);

    const navbar = page.getByRole('banner');
    const title = navbar.getByTestId('navbar-page-title');
    await expect(title).toBeVisible({ timeout: 30_000 });
    // The h1 always holds the full text; CSS does the ellipsizing.
    const fullTitle = (await title.textContent())?.trim() ?? '';
    // Measure after webfonts have swapped in, like the component's own re-measure.
    await page.evaluate(() => document.fonts.ready);
    const truncated = await title.evaluate((el) => el.scrollWidth > el.clientWidth + 1);
    logger.info(
      truncated
        ? `Title "${fullTitle}" is truncated at 320px — checking the ⓘ popover`
        : `Title "${fullTitle}" fits at 320px — checking there is no ⓘ`,
    );
    const info = navbar.getByRole('button', { name: 'Show full title' });

    if (!truncated) {
      await expect(info).toHaveCount(0);
      await expect(title).not.toHaveAttribute('title', /./);
      return;
    }

    await expect(title).toHaveAttribute('title', fullTitle);
    await info.click();
    const popover = page.getByTestId('navbar-page-title-full');
    await expect(popover).toBeVisible({ timeout: 10_000 });
    await expect(popover).toHaveText(fullTitle);
    const box = await popover.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(320);

    await page.keyboard.press('Escape');
    await expect(popover).toHaveCount(0);
  });
});
