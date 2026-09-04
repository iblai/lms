import { test, expect } from '@playwright/test';
import { logger } from '@iblai/iblai-js/playwright';

import { getCourseContentTab, gotoTenantPage, waitForAppShell } from '../utils/navigation';
import {
  ADMIN_ONLY_COURSE_TABS,
  MEMBER_CHECK_ADMIN_SIDEBAR_ITEMS,
  SHARED_SIDEBAR_ITEMS,
  expectSidebarItem,
  openAgentTab,
  openCourseContent,
} from '../utils/course-content-helpers';

/**
 * Journey 41: Learner Experience (non-admin account)
 *
 * Runs only in the `skills-desktop-chrome-student` project, against a real
 * non-admin session (`PLAYWRIGHT_NONADMIN_*`). Journeys 37 and 40 pin the role
 * by stubbing the member-check endpoint, which proves the UI reacts to the flag;
 * this journey proves the flag itself comes back the way it should for an actual
 * learner account, and that the learner's own routes work end to end.
 *
 * 1. Learner lands on a tenant-scoped home page
 * 2. Learner sidebar has the shared rows and no admin-gated rows
 * 3. Learner has no admin footer cluster
 * 4. Member check reports the learner as a non-admin
 * 5. Analytics entry point matches the account's RBAC permission
 * 6. Learner course content has the learner tabs and no admin tabs
 * 7. Learner can open the Agent tab
 * 8. Learner profile menu opens and offers Logout
 */
test.describe('Journey 41: Learner Experience (non-admin account)', () => {
  test.setTimeout(240_000);

  test('Checkpoint 1: Learner lands on a tenant-scoped home page', async ({ page }) => {
    await gotoTenantPage(page, 'home');
    await waitForAppShell(page);
    expect(page.url()).toMatch(/\/platform\/[^/]+\/home/);
    logger.info(`Learner home: ${page.url()}`);
  });

  test('Checkpoint 2: Learner sidebar has the shared rows and no admin-gated rows', async ({
    page,
  }) => {
    await gotoTenantPage(page, 'home');
    await waitForAppShell(page);

    for (const name of SHARED_SIDEBAR_ITEMS) {
      await expectSidebarItem(page, name, true);
    }

    // Only Studio is gated on admin status. Analytics is deliberately excluded:
    // it hangs off the `#can_view_analytics` RBAC permission, which a non-admin
    // can legitimately hold — this very account does, while the member check
    // reports `is_platform_admin: false` (see Checkpoint 4). Asserting its
    // absence here would encode a rule the app doesn't have.
    for (const name of MEMBER_CHECK_ADMIN_SIDEBAR_ITEMS) {
      await expectSidebarItem(page, name, false);
    }
    logger.info('Learner sidebar has the shared rows and no Studio');
  });

  test('Checkpoint 3: Learner has no admin footer cluster', async ({ page }) => {
    await gotoTenantPage(page, 'home');
    await waitForAppShell(page);

    await expectSidebarItem(page, 'Notifications', true);
    for (const name of ['Management', 'Integrations', 'Advanced', 'Monetization']) {
      await expectSidebarItem(page, name, false);
    }
    logger.info('Learner footer has Notifications only');
  });

  test('Checkpoint 4: Member check reports the learner as a non-admin', async ({ page }) => {
    await gotoTenantPage(page, 'home');
    await waitForAppShell(page);

    const response = await page
      .waitForResponse(
        (r) => r.url().includes('/api/core/departments/members/check/') && r.status() === 200,
        { timeout: 30_000 },
      )
      .catch(() => null);

    if (!response) {
      // The query is cached across navigations, so a warm shell may not refire
      // it. Force a fresh load rather than asserting on nothing.
      await page.reload();
      await waitForAppShell(page);
    }

    const fresh =
      response ??
      (await page
        .waitForResponse(
          (r) => r.url().includes('/api/core/departments/members/check/') && r.status() === 200,
          { timeout: 30_000 },
        )
        .catch(() => null));

    if (!fresh) {
      logger.info('Member check not observed on this load — skipping');
      test.skip();
      return;
    }

    const body = await fresh.json().catch(() => null);
    logger.info(`Member check: ${JSON.stringify(body)}`);
    expect(body?.is_platform_admin, 'learner must not be a platform admin').toBeFalsy();
  });

  test("Checkpoint 5: Analytics entry point matches the account's permission", async ({ page }) => {
    await gotoTenantPage(page, 'home');
    await waitForAppShell(page);

    // Analytics is RBAC-gated (`#can_view_analytics` / the watcher resource),
    // not admin-gated, so a non-admin may or may not have it. What must hold
    // either way is that the sidebar doesn't lie: an offered row leads
    // somewhere real, and an absent row means no analytics in the shell.
    const analytics = page.getByRole('button', { name: 'Analytics', exact: true }).first();
    const offered = await analytics.isVisible({ timeout: 20_000 }).catch(() => false);

    if (!offered) {
      await expect(page.getByRole('link', { name: 'AI Analytics' })).toHaveCount(0);
      logger.info('Learner has no analytics permission and no entry point');
      return;
    }

    await analytics.click();
    const overview = page.getByRole('button', { name: 'Overview', exact: true }).first();
    await expect(overview).toBeVisible({ timeout: 30_000 });
    await overview.click();
    await page.waitForURL(/\/analytics/, { timeout: 60_000 });
    await waitForAppShell(page);
    logger.info(`Learner holds the analytics permission; Overview opened at ${page.url()}`);
  });

  test('Checkpoint 6: Learner course content has no admin tabs', async ({ page }) => {
    if (!(await openCourseContent(page))) {
      logger.info('Learner has no accessible enrolled course — skipping');
      test.skip();
      return;
    }

    // Progress/Dates/Discussion are unconditional, so at least one must be here
    // to prove the tab row rendered before asserting on absences.
    const progress = await getCourseContentTab(page, 'Progress');
    expect(progress, 'Progress tab should exist for a learner').not.toBeNull();

    for (const name of ADMIN_ONLY_COURSE_TABS) {
      const tab = await getCourseContentTab(page, name);
      expect(tab, `${name} tab must not be offered to a learner`).toBeNull();
    }
    logger.info('Learner course tabs exclude Instructor, Configuration and Authoring');
  });

  test('Checkpoint 7: Learner can open the Agent tab', async ({ page }) => {
    if (!(await openCourseContent(page))) {
      test.skip();
      return;
    }
    if (!(await openAgentTab(page))) {
      logger.info('Course has no Agent tab for this learner — skipping');
      test.skip();
      return;
    }

    expect(page.url()).toContain('/agent');
    await expect(page.locator('agent-ai').first()).toBeAttached({ timeout: 60_000 });
    logger.info('Learner reached the Agent tab');
  });

  test('Checkpoint 8: Learner profile menu opens and offers Logout', async ({ page }) => {
    await gotoTenantPage(page, 'home');
    await waitForAppShell(page);

    await page.getByRole('button', { name: 'More options' }).click();
    const menu = page.getByRole('menu', { name: 'More options' });
    await expect(menu).toBeVisible({ timeout: 15_000 });

    // Present for every signed-in user regardless of role.
    await expect(menu.getByText(/log ?out/i).first()).toBeVisible({ timeout: 15_000 });
    logger.info('Learner profile menu offers Logout');

    await page.keyboard.press('Escape');
  });
});
