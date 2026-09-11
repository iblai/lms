import { test, expect } from '@playwright/test';
import { logger } from '@iblai/iblai-js/playwright';

import { gotoTenantPage, waitForAppShell } from '../utils/navigation';
import {
  ADMIN_ONLY_SIDEBAR_ITEMS,
  MEMBER_CHECK_ADMIN_SIDEBAR_ITEMS,
  SHARED_SIDEBAR_ITEMS,
  expectSidebarItem,
  forceViewerRole,
} from '../utils/course-content-helpers';

/**
 * Journey 37: Role-Based Navigation — Sidebar and Profile Menu
 *
 * The sidebar and the top-right profile menu are the two places where an admin's
 * app differs from a learner's before either of them opens a course. The admin
 * cluster (Studio, and the Management / Integrations / Advanced footer actions)
 * is gated on the department member-check endpoint, so these checkpoints stub
 * that response to pin the role rather than depending on whichever account the
 * suite happens to be signed in as.
 *
 * Analytics is the exception: it rides on an RBAC permission loaded from the
 * session, which a route stub can't reach. Its absence for a learner is asserted
 * against a real non-admin session in `41-learner-experience-student.spec.ts`.
 *
 *  1. Shared sidebar rows render for both roles
 *  2. Admin sees the admin-only rows (Studio and/or Analytics)
 *  3. Learner loses the member-check-gated rows
 *  4. Admin sees the admin footer cluster
 *  5. Learner sees Notifications but not the admin footer cluster
 *  6. Analytics row expands into its sub-menu for an admin
 *  7. Profile menu opens from the header for both roles
 *  8. Profile menu exposes the tenant switcher
 *  9. Sidebar collapses and expands
 */
test.describe('Journey 37: Role-Based Navigation', () => {
  test.setTimeout(200_000);

  test('Checkpoint 1: Shared sidebar rows render for an admin and a learner', async ({ page }) => {
    for (const role of ['admin', 'learner'] as const) {
      await forceViewerRole(page, role);
      await gotoTenantPage(page, 'home');
      await waitForAppShell(page);

      for (const name of SHARED_SIDEBAR_ITEMS) {
        await expectSidebarItem(page, name, true);
      }
      logger.info(`Shared sidebar rows present for ${role}`);
      await page.unrouteAll({ behavior: 'ignoreErrors' });
    }
  });

  test('Checkpoint 2: Admin sees the Studio and Analytics sidebar rows', async ({ page }) => {
    await forceViewerRole(page, 'admin');
    await gotoTenantPage(page, 'home');
    await waitForAppShell(page);

    // Studio is additionally gated on a config flag, and Analytics on an RBAC
    // permission, so a tenant can legitimately hide either from an admin.
    // Assert on whichever is present rather than forcing both.
    const visible: string[] = [];
    for (const name of ADMIN_ONLY_SIDEBAR_ITEMS) {
      const item = page.getByRole('button', { name, exact: true }).first();
      if (await item.isVisible({ timeout: 20_000 }).catch(() => false)) visible.push(name);
    }
    logger.info(`Admin-only sidebar rows visible: ${visible.join(', ') || 'none'}`);
    expect(visible.length).toBeGreaterThan(0);
  });

  test('Checkpoint 3: Learner loses the member-check-gated sidebar rows', async ({ page }) => {
    await forceViewerRole(page, 'learner');
    await gotoTenantPage(page, 'home');
    await waitForAppShell(page);

    // Only Studio is driven by the member check. Analytics rides on an RBAC
    // permission that the stub can't reach, so it is asserted against the real
    // learner session in Journey 41 instead of being forced here.
    for (const name of MEMBER_CHECK_ADMIN_SIDEBAR_ITEMS) {
      await expectSidebarItem(page, name, false);
    }
    logger.info('Studio is hidden from a learner');
  });

  test('Checkpoint 4: Admin sees the admin footer cluster', async ({ page }) => {
    await forceViewerRole(page, 'admin');
    await gotoTenantPage(page, 'home');
    await waitForAppShell(page);

    // The SDK narrows this cluster further per-item via RBAC, so require the
    // cluster to exist rather than every row in it.
    const adminActions = ['Management', 'Integrations', 'Advanced', 'Invites'];
    const visible: string[] = [];
    for (const name of adminActions) {
      const item = page.getByRole('button', { name, exact: true }).first();
      if (await item.isVisible({ timeout: 15_000 }).catch(() => false)) visible.push(name);
    }
    logger.info(`Admin footer actions visible: ${visible.join(', ') || 'none'}`);
    expect(visible.length).toBeGreaterThan(0);
  });

  test('Checkpoint 5: Learner keeps Notifications but loses the admin footer cluster', async ({
    page,
  }) => {
    await forceViewerRole(page, 'learner');
    await gotoTenantPage(page, 'home');
    await waitForAppShell(page);

    // Notifications is shown to every logged-in user.
    await expectSidebarItem(page, 'Notifications', true);

    for (const name of ['Management', 'Integrations', 'Advanced']) {
      await expectSidebarItem(page, name, false);
    }
    logger.info('Learner keeps Notifications and loses the admin cluster');
  });

  test('Checkpoint 6: Analytics row expands into its sub-menu for an admin', async ({ page }) => {
    await forceViewerRole(page, 'admin');
    await gotoTenantPage(page, 'home');
    await waitForAppShell(page);

    const analytics = page.getByRole('button', { name: 'Analytics', exact: true }).first();
    if (!(await analytics.isVisible({ timeout: 20_000 }).catch(() => false))) {
      logger.info('Analytics not enabled for this tenant — skipping');
      test.skip();
      return;
    }

    await analytics.click();
    // Overview is the one row present for every analytics-capable viewer,
    // including a pure watcher.
    const overview = page.getByRole('button', { name: 'Overview', exact: true }).first();
    await expect(overview).toBeVisible({ timeout: 30_000 });
    logger.info('Analytics sub-menu expanded');
  });

  test('Checkpoint 7: Profile menu opens from the header for both roles', async ({ page }) => {
    for (const role of ['admin', 'learner'] as const) {
      await forceViewerRole(page, role);
      await gotoTenantPage(page, 'home');
      await waitForAppShell(page);

      const profileBtn = page.getByRole('button', { name: 'More options' });
      await expect(profileBtn).toBeVisible({ timeout: 30_000 });
      await profileBtn.click();

      const menu = page.getByRole('menu', { name: 'More options' });
      await expect(menu).toBeVisible({ timeout: 15_000 });
      logger.info(`Profile menu opens for ${role}`);

      await page.keyboard.press('Escape');
      await expect(menu).toBeHidden({ timeout: 10_000 });
      await page.unrouteAll({ behavior: 'ignoreErrors' });
    }
  });

  test('Checkpoint 8: Profile menu exposes the tenant switcher', async ({ page }) => {
    await gotoTenantPage(page, 'home');
    await waitForAppShell(page);

    const tenants: Array<{ key: string; platform_name: string }> = await page.evaluate(() => {
      try {
        return JSON.parse(localStorage.getItem('tenants') || '[]');
      } catch {
        return [];
      }
    });
    if (tenants.length < 2) {
      logger.info('Account belongs to a single tenant — no switcher to assert');
      test.skip();
      return;
    }

    await page.getByRole('button', { name: 'More options' }).click();
    const menu = page.getByRole('menu', { name: 'More options' });
    await expect(menu).toBeVisible({ timeout: 15_000 });

    // The switcher lists the account's tenants by platform name; the current
    // tenant's own entry is the one that opens the account sheet.
    const currentTenantKey = await page.evaluate(() => localStorage.getItem('tenant'));
    const current = tenants.find((t) => t.key === currentTenantKey);
    expect(current, 'current tenant should be in the account tenant list').toBeTruthy();
    await expect(menu.getByText(current!.platform_name, { exact: true }).first()).toBeVisible({
      timeout: 15_000,
    });
    logger.info(`Tenant switcher lists ${tenants.length} tenants`);
  });

  test('Checkpoint 9: Sidebar collapses and expands', async ({ page }) => {
    await gotoTenantPage(page, 'home');
    await waitForAppShell(page);

    // The rail exposes exactly one of these two at a time.
    const collapse = page.getByRole('button', { name: 'Collapse sidebar' }).first();
    const expand = page.getByRole('button', { name: 'Expand sidebar' }).first();

    const startedCollapsed = await expand.isVisible({ timeout: 20_000 }).catch(() => false);
    if (startedCollapsed) {
      await expand.click();
      await expect(collapse).toBeVisible({ timeout: 20_000 });
      await collapse.click();
      await expect(expand).toBeVisible({ timeout: 20_000 });
    } else {
      await expect(collapse).toBeVisible({ timeout: 20_000 });
      await collapse.click();
      await expect(expand).toBeVisible({ timeout: 20_000 });
      await expand.click();
      await expect(collapse).toBeVisible({ timeout: 20_000 });
    }
    logger.info('Sidebar toggles between collapsed and expanded');
  });
});
