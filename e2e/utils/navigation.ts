/**
 * Navigation utilities for SkillsAI E2E tests.
 * Provides resilient navigation helpers that handle cross-browser quirks.
 */
import { Page, expect } from '@playwright/test';

const SKILL_HOST = process.env.SKILLS_HOST || 'http://localhost:3000';

/**
 * Wait for the app shell to be visible, confirming React has mounted.
 * The <header> element is rendered by NavBar on every authenticated page.
 */
export async function waitForAppShell(page: Page, timeout = 120_000): Promise<void> {
  await expect(page.locator('header').first()).toBeVisible({ timeout });
}

export async function waitForLoaderToDisappear(page: Page, timeout = 30_000): Promise<void> {
  await expect(page.getByRole('status', { name: 'Loading...' })).not.toBeVisible({ timeout });
}

/**
 * Safe URL wait that handles Firefox NS_BINDING_ABORTED and Safari policy errors.
 */
export async function safeWaitForURL(
  page: Page,
  urlMatcher: string | RegExp | ((url: URL) => boolean),
  options: { timeout?: number } = {},
): Promise<void> {
  const timeout = options.timeout ?? 30_000;
  try {
    await page.waitForURL(urlMatcher, { timeout });
  } catch (error) {
    // Retry once — handles transient NS_BINDING_ABORTED on Firefox
    await page.waitForTimeout(2_000);
    await page.waitForURL(urlMatcher, { timeout: timeout / 2 });
  }
}

/**
 * Navigate to the skills home page (authenticated).
 */
export async function navigateToHome(page: Page): Promise<void> {
  await page.goto(`${SKILL_HOST}/home`, { timeout: 120_000 });
  await waitForAppShell(page);
}

/**
 * Navigate to a course about page from home by clicking a course card.
 * Returns the course heading text.
 */
export async function navigateToCourseFromHome(page: Page): Promise<string> {
  await navigateToHome(page);

  const myCoursesHeading = page.getByRole('heading', { name: 'My Courses' });
  await expect(myCoursesHeading).toBeVisible({ timeout: 120_000 });

  const myCoursesGrid = page.getByRole('region', { name: 'My Courses' });
  await expect(myCoursesGrid).toBeVisible({ timeout: 120_000 });

  const courseLink = myCoursesGrid.getByRole('link').first();
  await expect(courseLink).toBeVisible({ timeout: 120_000 });
  await courseLink.click();

  await page.waitForURL(/\/courses\/.*/, { timeout: 120_000 });

  const heading = page.getByRole('heading', { level: 1 });
  await expect(heading).toBeVisible({ timeout: 30_000 });
  return (await heading.textContent()) || '';
}

/**
 * Navigate from course about page into course content.
 */
export async function accessCourseContent(page: Page): Promise<void> {
  const accessButton = page.getByRole('button', { name: 'Access Course' });
  await expect(accessButton).toBeVisible({ timeout: 120_000 });
  await accessButton.click();
  await page.waitForURL(/\/course-content\/.*/, { timeout: 120_000 });
}

/**
 * Navigate to the analytics overview page.
 */
export async function navigateToAnalytics(page: Page): Promise<void> {
  const analyticsLink = page.getByRole('link', { name: 'AI Analytics' });
  await expect(analyticsLink).toBeVisible({ timeout: 30_000 });
  await analyticsLink.click();
  await page.waitForURL(/\/analytics/, { timeout: 60_000 });
}

/**
 * Navigate to advanced settings dialog.
 */
export async function navigateToAdvancedSettings(
  page: Page,
): Promise<import('@playwright/test').Locator> {
  const profileBtn = page.getByRole('button', { name: 'More options' });
  await expect(profileBtn).toBeVisible({ timeout: 15_000 });
  await profileBtn.click();

  const menu = page.getByRole('menu', { name: 'More options' });
  await expect(menu).toBeVisible({ timeout: 5_000 });

  // Get platform name from localStorage
  const platformName = await page.evaluate(() => {
    const currentTenant = localStorage.getItem('current_tenant');
    if (currentTenant) {
      try {
        const tenant = JSON.parse(currentTenant);
        return tenant?.platform_name;
      } catch {
        return null;
      }
    }
    return null;
  });

  if (!platformName) throw new Error('Could not retrieve platform_name from localStorage');

  const tenantMenuItem = menu.getByText(platformName, { exact: true });
  await expect(tenantMenuItem).toBeVisible({ timeout: 5_000 });
  await tenantMenuItem.click();

  const accountDialog = page.getByRole('dialog', { name: 'User Profile' });
  await expect(accountDialog).toBeVisible({ timeout: 10_000 });

  const advancedTab = accountDialog.getByRole('button', { name: 'Advanced' });
  await expect(advancedTab).toBeVisible({ timeout: 5_000 });
  await advancedTab.click();

  await expect(accountDialog.getByText('Advanced CSS')).toBeVisible({ timeout: 5_000 });
  return accountDialog;
}
