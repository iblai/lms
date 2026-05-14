import { test, expect, Page, Request } from '@playwright/test';
import { logger } from '@iblai/iblai-js/playwright';
import { waitForAppShell } from '../utils/navigation';

const SKILL_HOST = process.env.SKILLS_HOST || 'http://localhost:3000';

const FAKE_COURSE_ID = 'course-v1:cross-tenant-test+CT101+2026';
const ENCODED_COURSE_ID = encodeURIComponent(FAKE_COURSE_ID);
const COURSE_ABOUT_URL = `${SKILL_HOST}/courses/${ENCODED_COURSE_ID}`;
const COURSE_CONTENT_URL = `${SKILL_HOST}/course-content/${ENCODED_COURSE_ID}/course`;

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
 * course payload with an arbitrary `platform_key`. This is what drives the
 * `isUnauthorizedTenant` branch in the CourseAccessGuard.
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

/**
 * Stub the auth host's /login/complete endpoint so the cross-origin redirect
 * triggered by `switchTenant` does not surface a network error in the test.
 */
async function stubAuthLoginComplete(page: Page) {
  await page.route('**/login/complete*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'text/html',
      body: '<html><body>auth login complete stub</body></html>',
    });
  });
}

/**
 * Force-set the user's tenants list in localStorage on every navigation so
 * the CourseAccessGuard sees a deterministic tenants array.
 */
async function setTenantsOnInit(page: Page, tenants: { key: string }[]) {
  await page.addInitScript((tenantsJson) => {
    window.localStorage.setItem('tenants', tenantsJson);
  }, JSON.stringify(tenants));
}

async function getCurrentTenant(page: Page): Promise<string> {
  await page.goto(`${SKILL_HOST}/home`, { timeout: 120_000 });
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
 *  3. Unauthorized + platform_key not in user tenants — redirects to /error/403
 *  4. Unauthorized + platform_key in user tenants — redirects to auth /login/complete
 *  5. The redirect-to query param echoes the full current URL with query string
 *  6. The same redirect logic fires when the guard mounts under /course-content
 *  7. /error/404 is reached when the metadata endpoint returns an empty body
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

    await page.goto(COURSE_ABOUT_URL, { timeout: 60_000 });
    await waitForAppShell(page);

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 30_000 });
    expect(page.url()).not.toMatch(/\/error\/403/);
    expect(page.url()).not.toMatch(/\/login\/complete/);
    logger.info('Guard rendered children for matching tenant');
  });

  test('CP-2: Renders course about page when platform_key is "main"', async ({ page }) => {
    await setupCourseApiMocks(page, 'main');

    await page.goto(COURSE_ABOUT_URL, { timeout: 60_000 });
    await waitForAppShell(page);

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 30_000 });
    expect(page.url()).not.toMatch(/\/error\/403/);
    expect(page.url()).not.toMatch(/\/login\/complete/);
    logger.info('Guard rendered children for platform_key="main"');
  });

  test('CP-3: Redirects to /error/403 when platform_key is foreign and not in user tenants', async ({
    page,
  }) => {
    const foreignKey = `foreign-tenant-${Date.now()}`;
    await setupCourseApiMocks(page, foreignKey);
    await setTenantsOnInit(page, [{ key: 'tenant-a' }, { key: 'tenant-b' }]);

    await page.goto(COURSE_ABOUT_URL, { timeout: 60_000 });
    await page.waitForURL(/\/error\/403/, { timeout: 30_000 });
    expect(page.url()).toMatch(/\/error\/403/);
    logger.info('Guard redirected to /error/403 for unmatched foreign tenant');
  });

  test('CP-4: Redirects to auth /login/complete when platform_key is found in user tenants', async ({
    page,
  }) => {
    const foreignKey = `auth-redirect-tenant-${Date.now()}`;
    await setupCourseApiMocks(page, foreignKey);
    await stubAuthLoginComplete(page);
    await setTenantsOnInit(page, [{ key: foreignKey }, { key: 'tenant-b' }]);

    await page.goto(COURSE_ABOUT_URL, { timeout: 60_000 });

    const requestPromise = page.waitForRequest(
      (req: Request) => /\/login\/complete\?/.test(req.url()),
      { timeout: 30_000 },
    );

    const req = await requestPromise;
    const url = new URL(req.url());
    expect(url.pathname).toContain('/login/complete');
    expect(url.searchParams.get('tenant')).toBe(foreignKey);
    expect(url.searchParams.get('redirect-to')).toBeTruthy();
    logger.info(`Guard issued cross-tenant auth redirect: ${req.url()}`);
  });

  test('CP-5: redirect-to query param echoes the current full URL with query string', async ({
    page,
  }) => {
    const foreignKey = `redirect-echo-tenant-${Date.now()}`;
    const courseUrlWithQuery = `${COURSE_ABOUT_URL}?ref=email&utm_source=test`;

    await setupCourseApiMocks(page, foreignKey);
    await stubAuthLoginComplete(page);
    await setTenantsOnInit(page, [{ key: foreignKey }]);

    const requestPromise = page.waitForRequest(
      (req: Request) => /\/login\/complete\?/.test(req.url()),
      { timeout: 30_000 },
    );

    await page.goto(courseUrlWithQuery, { timeout: 60_000 });

    const req = await requestPromise;
    const url = new URL(req.url());
    const redirectTo = url.searchParams.get('redirect-to') || '';
    expect(redirectTo).toContain(`/courses/${ENCODED_COURSE_ID}`);
    expect(redirectTo).toContain('ref=email');
    expect(redirectTo).toContain('utm_source=test');
    logger.info(`redirect-to preserved: ${redirectTo}`);
  });

  test('CP-6: Cross-tenant redirect also fires from the /course-content layout', async ({
    page,
  }) => {
    const foreignKey = `course-content-tenant-${Date.now()}`;
    await setupCourseApiMocks(page, foreignKey);
    await stubAuthLoginComplete(page);
    await setTenantsOnInit(page, [{ key: foreignKey }]);

    const requestPromise = page.waitForRequest(
      (req: Request) => /\/login\/complete\?/.test(req.url()),
      { timeout: 30_000 },
    );

    await page.goto(COURSE_CONTENT_URL, { timeout: 60_000 });

    const req = await requestPromise;
    const url = new URL(req.url());
    expect(url.searchParams.get('tenant')).toBe(foreignKey);
    expect(url.searchParams.get('redirect-to')).toContain(`/course-content/${ENCODED_COURSE_ID}`);
    logger.info('Guard redirect fires consistently from /course-content layout');
  });

  test('CP-7: Foreign platform_key not in tenants from /course-content also lands on /error/403', async ({
    page,
  }) => {
    const foreignKey = `forbidden-content-${Date.now()}`;
    await setupCourseApiMocks(page, foreignKey);
    await setTenantsOnInit(page, [{ key: 'unrelated-tenant' }]);

    await page.goto(COURSE_CONTENT_URL, { timeout: 60_000 });
    await page.waitForURL(/\/error\/403/, { timeout: 30_000 });
    expect(page.url()).toMatch(/\/error\/403/);
    logger.info('Course-content layout also routes unmatched tenant to /error/403');
  });

  test('CP-8: Empty metadata response surfaces /error/404 (not the cross-tenant branch)', async ({
    page,
  }) => {
    await page.route('**/api/ibl/v1/course_metadata*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({}),
      });
    });

    await page.goto(COURSE_ABOUT_URL, { timeout: 60_000 });
    await page.waitForURL(/\/error\/404/, { timeout: 30_000 });
    expect(page.url()).toMatch(/\/error\/404/);
    logger.info('Empty metadata response routed to /error/404');
  });
});
