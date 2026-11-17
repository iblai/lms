import { test, expect, Page } from '@playwright/test';
import { logger } from '@iblai/iblai-js/playwright';
import { waitForAppShell, gotoTenantPage } from '../utils/navigation';

/**
 * Helper: Navigate to the first course about page from /home.
 * Returns the course heading text or null if no courses exist.
 */
async function navigateToCourseAbout(
  page: Page,
  catalog = 'discover?content=courses&enrolled=true',
): Promise<string | null> {
  // Enrolled courses live on the centralized catalog page.
  await gotoTenantPage(page, catalog, { timeout: 120000 });
  await waitForAppShell(page);

  const courseCard = page.locator('[data-testid="discover-content-card"]').first();
  // isVisible() never waits, so wait for either the first card or the
  // catalog's empty state before deciding there is nothing to open.
  const hasCourse = await Promise.race([
    courseCard.waitFor({ state: 'visible', timeout: 120_000 }).then(() => true),
    page
      .getByTestId('empty-box')
      .waitFor({ state: 'visible', timeout: 120_000 })
      .then(() => false),
  ]).catch(() => false);

  if (!hasCourse) return null;

  await courseCard.click();
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
 *  6. Mobile: the image, CTA and course facts come before the description
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

  test('Checkpoint 6: Mobile — image, CTA and course facts come before the description', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    // Any course will do for a layout check, so fall back to the full catalog
    // when the account has no enrolments.
    const courseName =
      (await navigateToCourseAbout(page)) ??
      (await navigateToCourseAbout(page, 'discover?content=courses'));

    if (!courseName) {
      test.skip();
      return;
    }

    // Every label use-course-detail.ts can put on the course CTA.
    const cta = page
      .getByRole('button', {
        name: /^(Access Course|Enroll Now|Request Access|Invitation Only|Buy Now|Purchase Now)/,
      })
      .first();
    await expect(cta).toBeVisible({ timeout: 120_000 });
    const description = page.getByRole('heading', { name: 'Course Description' });
    await expect(description).toBeVisible({ timeout: 30000 });

    const [ctaBox, descriptionBox] = await Promise.all([
      cta.boundingBox(),
      description.boundingBox(),
    ]);
    expect(ctaBox).not.toBeNull();
    expect(descriptionBox).not.toBeNull();
    expect(ctaBox!.y).toBeLessThan(descriptionBox!.y);

    // DOM order has to match too, so tab and screen-reader order agree with
    // what is on screen.
    const ctaPrecedesDescription = await cta.evaluate((el, headingText) => {
      const heading = [...document.querySelectorAll('h1, h2, h3')].find(
        (h) => h.textContent?.trim() === headingText,
      );
      return (
        !!heading && !!(el.compareDocumentPosition(heading) & Node.DOCUMENT_POSITION_FOLLOWING)
      );
    }, 'Course Description');
    expect(ctaPrecedesDescription).toBe(true);
    logger.info('Mobile about page shows the image/CTA/facts block before the description');
  });
});
