import { test, expect, Page } from '@playwright/test';
import { logger } from '@iblai/iblai-js/playwright';
import { gotoTenantPage, waitForAppShell } from '../utils/navigation';

/**
 * Wait for the new /programs/[program_id] page to finish loading.
 * The page renders <program-page-loading> until both metadata and program
 * search results land, then swaps in <program-detail-content>.
 */
async function waitForProgramPage(page: Page): Promise<void> {
  await expect(page.getByTestId('program-detail-content')).toBeVisible({
    timeout: 120_000,
  });
  await expect(page.getByTestId('navbar-page-title')).toBeVisible({
    timeout: 10_000,
  });
}

async function openFirstProfileProgram(page: Page): Promise<boolean> {
  await gotoTenantPage(page, 'profile/programs', { timeout: 120_000 });
  await waitForAppShell(page);

  const card = page.getByTestId('program-card').first();
  const empty = page.getByText('No programs found.').first();
  try {
    await expect(card).toBeVisible({ timeout: 20_000 });
  } catch (error) {
    return false;
  }
  await card.click();
  await page.waitForURL(/\/programs\/[^/]+$/, { timeout: 60_000 });
  await waitForProgramPage(page);
  return true;
}

/**
 * Journey 32: Program Detail Page (/programs/[program_id])
 *
 * Validates the new program detail page reached from two entry points:
 *  - Profile > Programs (program-card click)
 *  - Discover (discover-content-card click on a program-type card)
 */
test.describe('Journey 32: Program Detail Page', () => {
  test.setTimeout(200_000);

  test.beforeEach(async ({ page }) => {
    await gotoTenantPage(page, 'home', { timeout: 120_000 });
    await waitForAppShell(page);
  });

  test('CP-1: Opens program page from profile > programs card', async ({ page }) => {
    const opened = await openFirstProfileProgram(page);
    if (!opened) {
      test.skip(true, 'No programs in profile — skipping');
      return;
    }
    expect(page.url()).toMatch(/\/programs\/[^/]+$/);
    logger.info(`Opened program page from profile: ${page.url()}`);
  });

  test('CP-2: Opens program page from discover program card', async ({ page }) => {
    await gotoTenantPage(page, 'discover', { timeout: 120_000 });
    await waitForAppShell(page);

    const allCards = page.getByTestId('discover-content-card');
    const empty = page.getByText(/no content found/i).first();
    await expect(allCards.first().or(empty)).toBeVisible({ timeout: 120_000 });

    // Each card has a small uppercase badge in the bottom-left displaying
    // its contentType (course | pathway | program). Filter to the program badge.
    const programCard = allCards
      .filter({
        has: page.locator('div.uppercase', { hasText: /^program$/i }),
      })
      .first();

    const hasProgramCard = await programCard.isVisible({ timeout: 10_000 }).catch(() => false);
    if (!hasProgramCard) {
      test.skip(true, 'No program-type content cards in discover — skipping');
      return;
    }

    await programCard.click();
    await page.waitForURL(/\/programs\/[^/]+$/, { timeout: 60_000 });
    await waitForProgramPage(page);
    logger.info(`Opened program page from discover: ${page.url()}`);
  });

  test('CP-3: Program name and card image are visible', async ({ page }) => {
    const opened = await openFirstProfileProgram(page);
    if (!opened) {
      test.skip(true, 'No programs in profile');
      return;
    }

    const name = page.getByTestId('navbar-page-title');
    await expect(name).toBeVisible();
    const nameText = (await name.textContent())?.trim() ?? '';
    expect(nameText.length).toBeGreaterThan(0);

    await expect(page.getByTestId('program-page-card-image')).toBeVisible({
      timeout: 10_000,
    });
  });

  test('CP-4: Admin sees About, Courses, and Settings tabs', async ({ page }) => {
    const opened = await openFirstProfileProgram(page);
    if (!opened) {
      test.skip(true, 'No programs');
      return;
    }

    const tabs = page.getByTestId('program-tabs');
    const hasTabs = await tabs.isVisible({ timeout: 10_000 }).catch(() => false);
    if (!hasTabs) {
      test.skip(true, 'Tabs not shown — non-admin or platform_key mismatch');
      return;
    }

    await expect(page.getByTestId('about-tab')).toBeVisible();
    await expect(page.getByTestId('courses-tab')).toBeVisible();
    await expect(page.getByTestId('settings-tab')).toBeVisible();

    // About is the default tab
    await expect(page.getByTestId('about-tab')).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByTestId('about-tab-content')).toBeVisible();
  });

  test('CP-5: Tab switching About → Courses → Settings updates content', async ({ page }) => {
    const opened = await openFirstProfileProgram(page);
    if (!opened) {
      test.skip(true, 'No programs');
      return;
    }

    const tabs = page.getByTestId('program-tabs');
    if (!(await tabs.isVisible({ timeout: 10_000 }).catch(() => false))) {
      test.skip(true, 'Tabs not shown');
      return;
    }

    const aboutTab = page.getByTestId('about-tab');
    const coursesTab = page.getByTestId('courses-tab');
    const settingsTab = page.getByTestId('settings-tab');

    await expect(aboutTab).toHaveAttribute('aria-selected', 'true');

    await coursesTab.click();
    await expect(coursesTab).toHaveAttribute('aria-selected', 'true');
    await expect(aboutTab).toHaveAttribute('aria-selected', 'false');
    await expect(page.getByTestId('courses-tab-content')).toBeVisible();

    await settingsTab.click();
    await expect(settingsTab).toHaveAttribute('aria-selected', 'true');
    await expect(coursesTab).toHaveAttribute('aria-selected', 'false');
    await expect(page.getByTestId('settings-tab-content')).toBeVisible({
      timeout: 30_000,
    });
  });

  test('CP-6: Settings form sections render for admin', async ({ page }) => {
    const opened = await openFirstProfileProgram(page);
    if (!opened) {
      test.skip(true, 'No programs');
      return;
    }

    const settingsTab = page.getByTestId('settings-tab');
    if (!(await settingsTab.isVisible({ timeout: 10_000 }).catch(() => false))) {
      test.skip(true, 'Settings tab not visible (non-admin or platform mismatch)');
      return;
    }

    await settingsTab.click();
    await expect(page.getByTestId('settings-tab-content')).toBeVisible({
      timeout: 30_000,
    });

    const sections = [
      'basic-information-section',
      'pricing-dates-section',
      'visibility-access-section',
      'images-section',
      'social-promotion-section',
    ];
    for (const id of sections) {
      await expect(page.getByTestId(id)).toBeVisible({ timeout: 10_000 });
    }
    await expect(page.getByTestId('save-settings-button')).toBeVisible();
  });

  test('CP-7: Non-admin / non-tenant program renders courses list directly', async ({ page }) => {
    const opened = await openFirstProfileProgram(page);
    if (!opened) {
      test.skip(true, 'No programs');
      return;
    }

    const hasTabs = await page
      .getByTestId('program-tabs')
      .isVisible({ timeout: 5_000 })
      .catch(() => false);

    if (hasTabs) {
      // Admin path — courses are reachable via the Courses tab
      await page.getByTestId('courses-tab').click();
      await expect(page.getByTestId('courses-tab-content')).toBeVisible();
    } else {
      // No-tab path — the courses list (or empty box) is rendered inline
      const firstCourse = page.getByTestId('course-card-0');
      const emptyCourses = page.getByText('No courses found under this program.');
      await expect(firstCourse.or(emptyCourses)).toBeVisible({ timeout: 30_000 });
    }
  });

  test('CP-8: Course card click navigates to /courses/...', async ({ page }) => {
    const opened = await openFirstProfileProgram(page);
    if (!opened) {
      test.skip(true, 'No programs');
      return;
    }

    if (
      await page
        .getByTestId('program-tabs')
        .isVisible({ timeout: 5_000 })
        .catch(() => false)
    ) {
      await page.getByTestId('courses-tab').click();
      await expect(page.getByTestId('courses-tab-content')).toBeVisible();
    }

    const firstCourse = page.getByTestId('course-card-0');
    if (!(await firstCourse.isVisible({ timeout: 10_000 }).catch(() => false))) {
      test.skip(true, 'No course cards in this program');
      return;
    }

    await firstCourse.click();
    await page.waitForURL(/\/courses\/[^/]+$/, { timeout: 60_000 });
    expect(page.url()).toContain('/courses/');
  });

  test('CP-9: CTA button visible for non-enrolled / paywalled users', async ({ page }) => {
    const opened = await openFirstProfileProgram(page);
    if (!opened) {
      test.skip(true, 'No programs');
      return;
    }

    // CTA only renders when user is not enrolled or lacks monetization access.
    const cta = page.getByTestId('program-page-cta');
    const hasCta = await cta.isVisible({ timeout: 10_000 }).catch(() => false);

    if (!hasCta) {
      logger.info('No CTA — user already enrolled with access');
      return;
    }

    const label = (await cta.textContent())?.trim() ?? '';
    expect(label).toMatch(/Enroll Now|Purchase Now|Enrolling/i);
    await expect(cta).toBeEnabled();
  });

  test('CP-10: Direct navigation to /programs/[id] renders the page', async ({ page }) => {
    // First navigate via profile to discover a real program id we can revisit
    await gotoTenantPage(page, 'profile/programs', { timeout: 120_000 });
    await waitForAppShell(page);

    const card = page.getByTestId('program-card').first();
    if (!(await card.isVisible({ timeout: 60_000 }).catch(() => false))) {
      test.skip(true, 'No programs to derive an id from');
      return;
    }
    await card.click();
    await page.waitForURL(/\/programs\/[^/]+$/, { timeout: 60_000 });
    const url = page.url();
    await waitForProgramPage(page);

    // Now hit the URL directly in a fresh navigation
    await gotoTenantPage(page, 'home', { timeout: 120_000 });
    await waitForAppShell(page);
    await page.goto(url, { timeout: 120_000 });
    await waitForAppShell(page);
    await waitForProgramPage(page);
    expect(page.url()).toBe(url);
  });
});
