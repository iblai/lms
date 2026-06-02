import { test, expect, Page } from '@playwright/test';
import { logger } from '@iblai/iblai-js/playwright';
import { gotoTenantPage, waitForAppShell } from '../utils/navigation';

const FAKE_COURSE_ID = 'course-v1:cross-tenant-test+CT101+2026';
const ENCODED_COURSE_ID = encodeURIComponent(FAKE_COURSE_ID);
const COURSE_ABOUT_SUBPATH = `courses/${ENCODED_COURSE_ID}`;

/**
 * Build a minimal CourseEdxData payload sufficient for the course about page
 * to mount. We override `platform_key` to drive the CourseAccessGuard branches.
 */
function buildCourseFixture(platformKey: string, overrides: Record<string, unknown> = {}) {
  return {
    title: 'Cross Tenant Test Course',
    effort: null,
    license: null,
    duration: '',
    end_date: null,
    language: 'en',
    overview: '<p>Test overview</p>',
    subtitle: '',
    syllabus: null,
    self_paced: true,
    start_date: '2024-01-01T00:00:00Z',
    description: 'Cross tenant test course description',
    intro_video: null,
    learning_info: [],
    enrollment_end: null,
    instructor_info: { instructors: [] },
    enrollment_start: null,
    entrance_exam_id: '',
    banner_image_name: '',
    course_image_name: '',
    short_description: 'Short description',
    about_sidebar_html: '',
    entrance_exam_enabled: '',
    pre_requisite_courses: [],
    banner_image_asset_path: '',
    course_image_asset_path: '',
    certificate_available_date: null,
    video_thumbnail_image_name: '',
    certificates_display_behavior: '',
    entrance_exam_minimum_score_pct: '',
    video_thumbnail_image_asset_path: '',
    platform_key: platformKey,
    org: 'cross-tenant',
    display_name: 'Cross Tenant Test Course',
    course_outline: [],
    agent_content_mode: false,
    course_content_mode: true,
    ...overrides,
  };
}

/**
 * Intercept the course metadata API (and a few siblings) so we can serve a
 * course payload with an arbitrary `platform_key` for the CourseAccessGuard.
 */
async function setupCourseApiMocks(page: Page, platformKey: string) {
  await page.route('**/api/ibl/v1/course_metadata*', async (route) => {
    const url = new URL(route.request().url());
    const courseKey = url.searchParams.get('course_key') || '';
    if (decodeURIComponent(courseKey) !== FAKE_COURSE_ID) {
      await route.continue();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(buildCourseFixture(platformKey)),
    });
  });

  // Eligibility & outline endpoints — return empty payloads so the about page
  // does not stall waiting on related data.
  await page.route('**/api/ibl/enrollment/enroll_status*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ is_enrolled: false, can_enroll: true, is_eligible: true }),
    });
  });
  await page.route('**/api/ibl/completion/course_outline/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({}),
    });
  });
}

async function getCurrentTenant(page: Page): Promise<string> {
  await gotoTenantPage(page, 'home', { timeout: 120_000 });
  await waitForAppShell(page);
  const tenant = await page.evaluate(() => window.localStorage.getItem('tenant') || '');
  return tenant;
}

/**
 * Journey 30: Course Access Guard — Cross-Tenant Redirect
 *
 * Validates the CourseAccessGuard's tenant-mismatch handling:
 *  1. Authorized: course.platform_key === current tenant — guard renders children
 *  2. Authorized: course.platform_key === 'main' — guard renders children
 *  3. /error/404 is reached when the metadata endpoint returns an empty body
 *  4. A foreign platform_key still renders — cross-tenant gating was removed
 */
test.describe('Journey 30: Course Access Guard — Cross-Tenant Redirect', () => {
  test.setTimeout(120_000);

  test('CP-1: Renders course about page when platform_key matches the current tenant', async ({
    page,
  }) => {
    const currentTenant = await getCurrentTenant(page);
    if (!currentTenant) {
      logger.info('No tenant in localStorage — skipping');
      test.skip();
      return;
    }

    await setupCourseApiMocks(page, currentTenant);

    await gotoTenantPage(page, COURSE_ABOUT_SUBPATH, { timeout: 60_000 });
    await waitForAppShell(page);

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 30_000 });
    expect(page.url()).not.toMatch(/\/error\/403/);
    expect(page.url()).not.toMatch(/\/login\/complete/);
    logger.info('Guard rendered children for matching tenant');
  });

  test('CP-2: Renders course about page when platform_key is "main"', async ({ page }) => {
    await setupCourseApiMocks(page, 'main');

    await gotoTenantPage(page, COURSE_ABOUT_SUBPATH, { timeout: 60_000 });
    await waitForAppShell(page);

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 30_000 });
    expect(page.url()).not.toMatch(/\/error\/403/);
    expect(page.url()).not.toMatch(/\/login\/complete/);
    logger.info('Guard rendered children for platform_key="main"');
  });

  test('CP-3: Empty metadata response surfaces /error/404', async ({ page }) => {
    await page.route('**/api/ibl/v1/course_metadata*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({}),
      });
    });

    await gotoTenantPage(page, COURSE_ABOUT_SUBPATH, { timeout: 60_000 });
    await page.waitForURL(/\/error\/404/, { timeout: 30_000 });
    expect(page.url()).toMatch(/\/error\/404/);
    logger.info('Empty metadata response routed to /error/404');
  });

  test('CP-4: Renders course about page for a foreign platform_key (cross-tenant gating removed)', async ({
    page,
  }) => {
    // The guard no longer gates on platform_key, so a course whose platform_key
    // does not match the current tenant must still render rather than redirect
    // to /error/403. This pins the removal of the cross-tenant branch.
    const foreignKey = `foreign-tenant-${Date.now()}`;
    await setupCourseApiMocks(page, foreignKey);

    await gotoTenantPage(page, COURSE_ABOUT_SUBPATH, { timeout: 60_000 });
    await waitForAppShell(page);

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 30_000 });
    expect(page.url()).not.toMatch(/\/error\/403/);
    logger.info('Guard rendered children for a foreign platform_key — cross-tenant gating is gone');
  });
});
