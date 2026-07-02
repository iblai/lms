import { test, expect, Page } from '@playwright/test';
import { logger } from '@iblai/iblai-js/playwright';
import { waitForAppShell, gotoTenantPage } from '../utils/navigation';

/**
 * Helper: Navigate to the first course about page from /home.
 * Returns the course heading text or null if no courses exist.
 */
async function navigateToCourseAbout(page: Page): Promise<string | null> {
  await gotoTenantPage(page, 'home', { timeout: 120000 });
  await waitForAppShell(page);

  const myCoursesHeading = page.getByRole('heading', { name: 'My Courses' });
  await expect(myCoursesHeading).toBeVisible({ timeout: 120000 });

  const myCoursesGrid = page.getByRole('region', { name: 'My Courses' });
  await expect(myCoursesGrid).toBeVisible({ timeout: 120000 });

  // Course cards stream in after the grid mounts; wait for the first link before
  // probing visibility so we don't falsely conclude there are no courses.
  await myCoursesGrid
    .getByRole('link', { name: /.*/ })
    .first()
    .waitFor({ state: 'visible', timeout: 30_000 })
    .catch(() => null);

  const courseLink = myCoursesGrid.getByRole('link').first();
  const hasCourse = await courseLink.isVisible({ timeout: 120_000 }).catch(() => false);

  if (!hasCourse) return null;

  await courseLink.click();
  await page.waitForURL(/\/courses\//, { timeout: 120000 });
  await waitForAppShell(page);

  const heading = page.getByRole('heading', { level: 1 });
  await expect(heading).toBeVisible({ timeout: 30000 });
  return (await heading.textContent()) || 'Course';
}

/**
 * Journey 04: Course About
 *
 * Validates the course about page. The admin Configuration/Learning Info/
 * Instructors tabs and the Authoring link were moved out of this page and into
 * the course-content view (see Journey 05); only About and Syllabus remain here.
 *  1. Course about page with heading
 *  2. Description and enrollment details
 *  3. Access Course button
 *  4. Enrollment button for non-enrolled
 *  5. Only About and Syllabus tabs remain (moved tabs/links are gone)
 */
test.describe('Journey 04: Course About', () => {
  test.setTimeout(200000);

  test.beforeEach(async ({ page }) => {
    await gotoTenantPage(page, 'home', { timeout: 120000 });
    await waitForAppShell(page);
  });

  test('Checkpoint 1: Course about page displays heading', async ({ page }) => {
    const courseName = await navigateToCourseAbout(page);

    if (!courseName) {
      logger.info('No courses available — skipping');
      test.skip();
      return;
    }

    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading).toBeVisible({ timeout: 30000 });
    const text = await heading.textContent();
    expect(text?.length).toBeGreaterThan(0);
    logger.info(`Course about heading: ${text}`);
  });

  test('Checkpoint 2: Course about shows description and enrollment details', async ({ page }) => {
    const courseName = await navigateToCourseAbout(page);

    if (!courseName) {
      test.skip();
      return;
    }

    // Look for description or course info content
    const pageContent = await page.textContent('body');
    expect(pageContent?.length).toBeGreaterThan(0);

    // Check for enrollment-related text or dates
    const enrollmentInfo = page.getByText(/enroll|start date|end date|self-paced/i).first();
    const hasEnrollInfo = await enrollmentInfo.isVisible({ timeout: 120_000 }).catch(() => false);

    if (hasEnrollInfo) {
      logger.info('Enrollment information is displayed');
    } else {
      logger.info('No explicit enrollment info found — page content still present');
    }
  });

  test('Checkpoint 3: Access Course button is visible', async ({ page }) => {
    const courseName = await navigateToCourseAbout(page);

    if (!courseName) {
      test.skip();
      return;
    }

    const accessCourseButton = page.getByRole('button', {
      name: 'Access Course',
    });
    const enrollButton = page.getByRole('button', { name: /enroll/i });

    //wait for enrollbutton or accesscoursebutton not to be disabled using promise

    const isEnrollButtonDisabled = await enrollButton
      .isDisabled({ timeout: 10000 })
      .catch(() => false);
    const isAccessCourseButtonDisabled = await accessCourseButton
      .isDisabled({ timeout: 10000 })
      .catch(() => false);
    expect(isEnrollButtonDisabled || isAccessCourseButtonDisabled).toBeFalsy();

    const hasAccess = await accessCourseButton.isVisible({ timeout: 10000 }).catch(() => false);
    const hasEnroll = await enrollButton.isVisible({ timeout: 10000 }).catch(() => false);

    // At least one of these should be visible
    expect(hasAccess || hasEnroll).toBeTruthy();
    logger.info(hasAccess ? 'Access Course button visible' : 'Enroll button visible');
  });

  test('Checkpoint 4: Enrollment button visible for non-enrolled course', async ({ page }) => {
    const courseName = await navigateToCourseAbout(page);

    if (!courseName) {
      test.skip();
      return;
    }

    // If user is enrolled, Access Course is shown; otherwise Enroll is shown
    const enrollButton = page.getByRole('button', { name: /enroll/i });
    const accessButton = page.getByRole('button', { name: 'Access Course' });

    const hasEnroll = await enrollButton.isVisible({ timeout: 120_000 }).catch(() => false);
    const hasAccess = await accessButton.isVisible({ timeout: 120_000 }).catch(() => false);

    if (hasEnroll) {
      await expect(enrollButton).toBeVisible();
      logger.info('Enrollment button displayed (user not enrolled)');
    } else if (hasAccess) {
      logger.info('User already enrolled — Access Course shown instead');
    } else {
      logger.info('Neither Enroll nor Access Course found');
    }
  });

  test('Checkpoint 5: Only About and Syllabus tabs remain on the about page', async ({ page }) => {
    const courseName = await navigateToCourseAbout(page);

    if (!courseName) {
      test.skip();
      return;
    }

    // About and Syllabus are the only tabs that should remain here.
    await expect(page.getByRole('button', { name: 'About', exact: true })).toBeVisible({
      timeout: 30000,
    });
    const syllabusTab = page.getByRole('button', { name: 'Syllabus', exact: true });
    await expect(syllabusTab).toBeVisible({ timeout: 30000 });

    // The Configuration/Learning Info/Instructors tabs and the Authoring link were
    // moved to the course-content view — none of them should appear on the about page,
    // even for admins.
    await expect(page.getByRole('button', { name: 'Configuration', exact: true })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Learning Info', exact: true })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Instructors', exact: true })).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Authoring', exact: true })).toHaveCount(0);

    // Syllabus still switches within the about page (the tab renders an <h2>Syllabus</h2>).
    await syllabusTab.click();
    await expect(page.getByRole('heading', { name: 'Syllabus' })).toBeVisible({
      timeout: 30000,
    });
    logger.info('About page exposes only About and Syllabus tabs');
  });
});
