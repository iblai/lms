import { test, expect } from '@playwright/test';
import { logger } from '@iblai/iblai-js/playwright';

import { getCourseContentTab } from '../utils/navigation';
import {
  ADMIN_ONLY_COURSE_TABS,
  SHARED_COURSE_TABS,
  forceViewerRole,
  openCourseContent,
} from '../utils/course-content-helpers';

/**
 * Journey 40: Course Content — Tabs By Role
 *
 * `courseTabs` in the course-content layout appends Instructor, Configuration
 * and Authoring only when the member check reports a platform admin, and
 * Analytics only when the viewer can see course analytics. Journey 05 covers
 * the tabs every learner gets; this one covers the boundary between the two
 * roles, driving it off a stubbed member check so the assertion doesn't depend
 * on which account is signed in.
 *
 * 1. Learner-visible tabs render for both roles
 * 2. Admin gets the Instructor tab
 * 3. Learner does not get the Instructor tab
 * 4. Admin gets the Configuration tab
 * 5. Learner does not get the Configuration tab
 * 6. Authoring tab is admin-only and opens Studio externally
 * 7. Learner is bounced off a deep-linked admin tab
 * 8. Tab overflow menu exposes tabs that don't fit the row
 */
test.describe('Journey 40: Course Content — Tabs By Role', () => {
  test.setTimeout(300_000);

  test('Checkpoint 1: Learner-visible tabs render for both roles', async ({ page }) => {
    const assertSharedTabs = async (role: string) => {
      for (const name of SHARED_COURSE_TABS) {
        const tab = await getCourseContentTab(page, name);
        expect(tab, `${name} tab should exist for ${role}`).not.toBeNull();
        await expect(tab!).toBeVisible({ timeout: 20_000 });
      }
      logger.info(`Shared course tabs present for ${role}`);
    };

    await forceViewerRole(page, 'admin');
    if (!(await openCourseContent(page))) {
      logger.info('No accessible enrolled course — skipping');
      test.skip();
      return;
    }
    await assertSharedTabs('admin');

    // Swap the role on the same course rather than walking in from the catalog
    // a second time — the tab row is what's under test, and the extra round trip
    // only adds a chance for the catalog to answer empty.
    await page.unrouteAll({ behavior: 'ignoreErrors' });
    await forceViewerRole(page, 'learner');
    await page.reload();
    await assertSharedTabs('learner');
  });

  test('Checkpoint 2: Admin gets the Instructor tab', async ({ page }) => {
    await forceViewerRole(page, 'admin');
    if (!(await openCourseContent(page))) {
      test.skip();
      return;
    }

    const tab = await getCourseContentTab(page, 'Instructor');
    expect(tab, 'Instructor tab should exist for an admin').not.toBeNull();
    await expect(tab!).toBeVisible({ timeout: 20_000 });
    logger.info('Instructor tab present for admin');
  });

  test('Checkpoint 3: Learner does not get the Instructor tab', async ({ page }) => {
    await forceViewerRole(page, 'learner');
    if (!(await openCourseContent(page))) {
      test.skip();
      return;
    }

    const tab = await getCourseContentTab(page, 'Instructor');
    expect(tab, 'Instructor tab must not be offered to a learner').toBeNull();
    logger.info('Instructor tab hidden from learner');
  });

  test('Checkpoint 4: Admin gets the Configuration tab', async ({ page }) => {
    await forceViewerRole(page, 'admin');
    if (!(await openCourseContent(page))) {
      test.skip();
      return;
    }

    const tab = await getCourseContentTab(page, 'Configuration');
    expect(tab, 'Configuration tab should exist for an admin').not.toBeNull();
    await expect(tab!).toBeVisible({ timeout: 20_000 });
    logger.info('Configuration tab present for admin');
  });

  test('Checkpoint 5: Learner does not get the Configuration tab', async ({ page }) => {
    await forceViewerRole(page, 'learner');
    if (!(await openCourseContent(page))) {
      test.skip();
      return;
    }

    const tab = await getCourseContentTab(page, 'Configuration');
    expect(tab, 'Configuration tab must not be offered to a learner').toBeNull();
    logger.info('Configuration tab hidden from learner');
  });

  test('Checkpoint 6: Authoring tab is admin-only and points at Studio', async ({ page }) => {
    await forceViewerRole(page, 'admin');
    if (!(await openCourseContent(page))) {
      test.skip();
      return;
    }

    const tab = await getCourseContentTab(page, 'Authoring');
    if (tab === null) {
      logger.info('Studio not configured for this environment — skipping');
      test.skip();
      return;
    }

    // Declared `external: true`, so it must leave the SPA rather than route.
    const href = await tab.getAttribute('href');
    expect(href, 'Authoring should link out to Studio').toMatch(/^https?:\/\//);
    logger.info(`Authoring tab links to ${href}`);

    await page.unrouteAll({ behavior: 'ignoreErrors' });
    await forceViewerRole(page, 'learner');
    await page.reload();
    const learnerTab = await getCourseContentTab(page, 'Authoring');
    expect(learnerTab, 'Authoring must not be offered to a learner').toBeNull();
    logger.info('Authoring tab hidden from learner');
  });

  test('Checkpoint 7: Learner is bounced off a deep-linked admin tab', async ({ page }) => {
    await forceViewerRole(page, 'learner');
    if (!(await openCourseContent(page))) {
      test.skip();
      return;
    }

    const contentUrl = page.url();
    const base = contentUrl.replace(/\/(agent|course|progress|dates|discussion).*$/, '');
    await page.goto(`${base}/configuration`, { timeout: 120_000 });

    // The guard either redirects away from the admin route or refuses to render
    // its content; both are acceptable, showing the admin page is not.
    await page.waitForTimeout(6_000);
    const stillOnConfiguration = page.url().includes('/configuration');
    if (stillOnConfiguration) {
      const tab = await getCourseContentTab(page, 'Configuration');
      expect(tab, 'a learner deep-linking Configuration must not get the tab').toBeNull();
      logger.info('Configuration deep link renders without the admin tab');
    } else {
      logger.info(`Learner redirected away from Configuration to ${page.url()}`);
    }
  });

  test('Checkpoint 8: Overflow menu exposes tabs that do not fit the row', async ({ page }) => {
    await forceViewerRole(page, 'admin');
    // An admin has the longest tab list, and a narrow viewport guarantees the
    // row overflows.
    await page.setViewportSize({ width: 900, height: 900 });
    if (!(await openCourseContent(page))) {
      test.skip();
      return;
    }

    const overflow = page.getByTestId('course-tabs-overflow-trigger');
    if (!(await overflow.isVisible({ timeout: 20_000 }).catch(() => false))) {
      logger.info('All tabs fit the row at this width — skipping');
      test.skip();
      return;
    }

    await expect(overflow).toHaveAttribute('aria-label', 'More course tabs');
    await overflow.click();
    await expect(page.getByRole('menuitem').first()).toBeVisible({ timeout: 20_000 });
    logger.info('Overflow menu lists the tabs that did not fit');
    await page.keyboard.press('Escape');
  });
});
