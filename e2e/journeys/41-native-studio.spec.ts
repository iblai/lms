import { test, expect, type Page } from '@playwright/test';
import { logger } from '@iblai/iblai-js/playwright';
import { getCurrentTenant, gotoTenantPage, waitForAppShell } from '../utils/navigation';

/**
 * Journey 41: Native Studio
 *
 * The sidebar's Studio entry opens Studio inside the LMS instead of the Studio
 * host: a list of the tenant's courses and programs with the entry points to
 * create either, and, per course, the details form, the embedded Studio
 * outline and the course administration pages behind one section nav.
 *
 * Nothing here creates or saves anything: the creation dialogs are cancelled
 * and the details form is edited without saving, so the journey leaves the
 * tenant's catalog as it found it.
 */

const studioHome = (page: Page) => page.getByTestId('studio-home');
const rows = (page: Page) => page.getByTestId('studio-row');
const courseShell = (page: Page) => page.getByTestId('studio-course-shell');
const sectionNav = (page: Page) => page.getByTestId('course-admin-nav');

/** Opens the Studio home; false when this account has no Studio access. */
async function openStudio(page: Page): Promise<boolean> {
  await gotoTenantPage(page, 'studio', { timeout: 120_000 });
  await waitForAppShell(page);
  return studioHome(page)
    .waitFor({ state: 'visible', timeout: 120_000 })
    .then(() => true)
    .catch(() => false);
}

/** Opens the first listed course in Studio; false when the tenant has none. */
async function openFirstCourse(page: Page): Promise<boolean> {
  if (!(await openStudio(page))) return false;
  const hasCourse = await rows(page)
    .first()
    .waitFor({ state: 'visible', timeout: 60_000 })
    .then(() => true)
    .catch(() => false);
  if (!hasCourse) return false;
  await rows(page).first().click();
  await expect(courseShell(page)).toBeVisible({ timeout: 120_000 });
  return true;
}

test.describe('Journey 41: Native Studio', () => {
  test.setTimeout(300_000);

  test('CP-1: admin opens Studio from the sidebar and stays inside the LMS', async ({ page }) => {
    const tenant = await getCurrentTenant(page);
    await gotoTenantPage(page, 'home', { timeout: 120_000 });
    await waitForAppShell(page);

    const studioEntry = page.getByRole('button', { name: 'Studio', exact: true }).first();
    const available = await studioEntry
      .waitFor({ state: 'visible', timeout: 120_000 })
      .then(() => true)
      .catch(() => false);
    if (!available) {
      logger.info('No Studio entry in the sidebar for this account — skipping');
      test.skip();
      return;
    }

    const pagesBefore = page.context().pages().length;
    await studioEntry.click();
    await expect(page).toHaveURL(new RegExp(`/platform/${tenant}/studio$`), { timeout: 60_000 });
    await expect(studioHome(page)).toBeVisible({ timeout: 120_000 });
    await expect(page.getByRole('heading', { name: 'Studio', exact: true })).toBeVisible();
    expect(page.context().pages()).toHaveLength(pagesBefore);
  });

  test('CP-2/CP-3: admin browses and searches the tenant courses and opens the create-course dialog', async ({
    page,
  }) => {
    if (!(await openStudio(page))) {
      logger.info('Studio is not available to this account — skipping');
      test.skip();
      return;
    }

    await expect(page.getByRole('tab', { name: 'Courses' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    const hasCourse = await rows(page)
      .first()
      .waitFor({ state: 'visible', timeout: 60_000 })
      .then(() => true)
      .catch(() => false);
    if (hasCourse) {
      await expect(rows(page).first()).toHaveAttribute(
        'href',
        /\/studio\/courses\/course-v1[^/]+\/details$/,
      );
      await page.getByLabel('Search courses').fill('zzz-no-such-course-zzz');
      await expect(rows(page)).toHaveCount(0);
      await expect(page.getByText('No courses match "zzz-no-such-course-zzz".')).toBeVisible();
      await page.getByLabel('Search courses').fill('');
      await expect(rows(page).first()).toBeVisible();
    } else {
      await expect(page.getByText('No courses yet.')).toBeVisible();
    }

    await page.getByRole('button', { name: 'Create Course' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByLabel('Course name *')).toBeVisible();
    await expect(dialog.getByLabel('Description *')).toBeVisible();
    await dialog.getByRole('button', { name: 'Cancel' }).click();
    await expect(dialog).toBeHidden();
  });

  test('CP-4: admin switches to programs and opens the create-program dialog', async ({ page }) => {
    if (!(await openStudio(page))) {
      logger.info('Studio is not available to this account — skipping');
      test.skip();
      return;
    }

    await page.getByRole('tab', { name: 'Programs' }).click();
    await expect(page).toHaveURL(/\/studio\?view=programs$/);
    await expect(page.getByRole('tab', { name: 'Programs' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await expect(page.getByTestId('studio-loading')).toBeHidden({ timeout: 60_000 });
    if ((await rows(page).count()) > 0) {
      await expect(rows(page).first()).toHaveAttribute('href', /\/programs\/[^/]+$/);
    } else {
      await expect(page.getByText('No programs yet.')).toBeVisible();
    }

    await page.getByRole('button', { name: 'Create Program' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Program name *').fill('E2E Sample Program');
    await expect(dialog.getByLabel('Program ID *')).toHaveValue('e2e-sample-program');
    await dialog.getByRole('button', { name: 'Cancel' }).click();
    await expect(dialog).toBeHidden();
  });

  test('CP-5/CP-6: admin opens a course in Studio and edits its details form', async ({ page }) => {
    if (!(await openFirstCourse(page))) {
      logger.info('No course available in Studio for this account — skipping');
      test.skip();
      return;
    }

    await expect(page).toHaveURL(/\/studio\/courses\/[^/]+\/details$/);
    await expect(
      courseShell(page).getByRole('link', { name: 'Studio', exact: true }),
    ).toBeVisible();
    for (const section of ['Details', 'Outline', 'Grades', 'Settings']) {
      await expect(
        sectionNav(page).getByRole('link', { name: section, exact: true }),
      ).toBeVisible();
    }
    await expect(
      sectionNav(page).getByRole('link', { name: 'Details', exact: true }),
    ).toHaveAttribute('aria-current', 'page');

    const form = page.getByTestId('course-details-form');
    await expect(form).toBeVisible({ timeout: 120_000 });
    const save = form.getByRole('button', { name: 'Save changes' });
    await expect(save).toBeDisabled();
    const subtitle = form.getByLabel('Subtitle');
    const original = await subtitle.inputValue();
    await subtitle.fill(`${original} (edited)`);
    await expect(save).toBeEnabled();
    await subtitle.fill(original);
    await expect(save).toBeDisabled();
  });

  test('CP-7: the Outline section embeds the Studio course page through the edX SSO login', async ({
    page,
  }) => {
    if (!(await openFirstCourse(page))) {
      logger.info('No course available in Studio for this account — skipping');
      test.skip();
      return;
    }

    await sectionNav(page).getByRole('link', { name: 'Outline', exact: true }).click();
    await expect(page).toHaveURL(/\/studio\/courses\/[^/]+\/outline$/, { timeout: 60_000 });

    const frame = page.getByTestId('studio-frame');
    await expect(frame).toBeVisible({ timeout: 120_000 });
    const newTab = frame.getByRole('link', { name: 'Open in a new tab' });
    await expect(newTab).toHaveAttribute('href', /\/course\/course-v1:/);
    await expect(newTab).toHaveAttribute('target', '_blank');
    await expect(frame.locator('iframe')).toHaveAttribute(
      'src',
      /\/ibl\/ai\/sso\/backend\/edx\/login\?code=[^&]+&redirect_url=[^&]*%2Fcourse%2Fcourse-v1/,
      { timeout: 60_000 },
    );
  });

  test('CP-8: the Settings section shows the course configuration and the breadcrumb returns to Studio', async ({
    page,
  }) => {
    if (!(await openFirstCourse(page))) {
      logger.info('No course available in Studio for this account — skipping');
      test.skip();
      return;
    }

    await sectionNav(page).getByRole('link', { name: 'Settings', exact: true }).click();
    await expect(page).toHaveURL(/\/studio\/courses\/[^/]+\/configuration$/, { timeout: 60_000 });
    await expect(page.getByTestId('configuration-tab')).toBeVisible({ timeout: 120_000 });
    await expect(courseShell(page)).toBeVisible();

    await courseShell(page).getByRole('link', { name: 'Studio', exact: true }).click();
    await expect(page).toHaveURL(/\/studio$/, { timeout: 60_000 });
    await expect(studioHome(page)).toBeVisible({ timeout: 60_000 });
  });
});
