/**
 * Navigation utilities for SkillsAI E2E tests.
 * Provides resilient navigation helpers that handle cross-browser quirks.
 */
import test, { Page, Locator, expect } from '@playwright/test';

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
 * Resolve the active tenant slug from localStorage.
 *
 * App routes are now scoped as `/platform/<tenant>/<page>` and the slug is
 * persisted under the `tenant` key. localStorage is restored per-origin from
 * the saved storageState, so it is only readable once the page has loaded the
 * app origin. When the slug isn't available yet (e.g. the page is still on
 * about:blank at the start of a test) we visit the root first — which both
 * primes localStorage and redirects to `/platform/<tenant>` — then read it.
 */
export async function getCurrentTenant(page: Page): Promise<string> {
  let tenant = await page.evaluate(() => localStorage.getItem('tenant')).catch(() => null);
  if (!tenant) {
    await page.goto(SKILL_HOST, { timeout: 120_000 });
    await safeWaitForURL(page, /\/platform\//, { timeout: 120_000 }).catch(() => undefined);
    tenant = await page.evaluate(() => localStorage.getItem('tenant'));
  }
  return tenant ?? '';
}

/**
 * Navigate to a tenant-scoped page. `subpath` is everything after the tenant
 * segment, e.g. `gotoTenantPage(page, 'home')` →
 * `${SKILL_HOST}/platform/<tenant>/home`. Query strings are supported
 * (`gotoTenantPage(page, 'discover?q=python')`). Pass `''` for the tenant root.
 */
export async function gotoTenantPage(
  page: Page,
  subpath = '',
  options: { timeout?: number } = {},
): Promise<void> {
  const tenant = await getCurrentTenant(page);
  const suffix = subpath ? `/${subpath.replace(/^\//, '')}` : '';
  await page.goto(`${SKILL_HOST}/platform/${tenant}${suffix}`, {
    timeout: options.timeout ?? 120_000,
  });
}

/**
 * Navigate to the skills home page (authenticated).
 */
export async function navigateToHome(page: Page): Promise<void> {
  await gotoTenantPage(page, 'home');
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
 * Open the user profile dialog via the "More options" dropdown and switch to
 * the named sidebar tab. Throws when the platform_name can't be read from
 * localStorage. Returns the dialog locator scoped to the selected tab.
 */
export async function navigateToAccountComponent(
  page: Page,
  wantedTabName: string,
  skipIfTabNotExists: boolean = false,
): Promise<Locator> {
  const profileBtn = page.getByRole('button', { name: 'More options' });
  await expect(profileBtn).toBeVisible({ timeout: 15_000 });
  await profileBtn.click();

  const menu = page.getByRole('menu', { name: 'More options' });
  await expect(menu).toBeVisible({ timeout: 5_000 });

  const platformName = await page.evaluate(() => {
    const raw = localStorage.getItem('current_tenant');
    const tenant = localStorage.getItem('tenant');
    const tenants = localStorage.getItem('tenants');
    if (!raw) return null;
    try {
      return (
        JSON.parse(raw)?.platform_name ??
        JSON.parse(tenants as string)?.find((t: any) => t.key === tenant)?.platform_name
      );
    } catch {
      return null;
    }
  });

  if (!platformName) {
    throw new Error(
      'Could not retrieve platform_name from localStorage — cannot navigate to account settings',
    );
  }

  const tenantMenuItem = menu.getByText(platformName, { exact: true });
  await expect(tenantMenuItem).toBeVisible({ timeout: 5_000 });
  await tenantMenuItem.click();

  const accountDialog = page.getByRole('dialog', { name: 'User Profile' });
  await expect(accountDialog).toBeVisible({ timeout: 10_000 });

  const wantedTab = accountDialog.getByRole('button', { name: wantedTabName });
  try {
    await expect(wantedTab).toBeVisible({ timeout: 5_000 });
    await wantedTab.click();
    return accountDialog;
  } catch (error) {
    if (skipIfTabNotExists) {
      test.skip(true, `Tab ${wantedTabName} not found`);
    }
    throw error;
  }
}

/**
 * Navigate to advanced settings dialog.
 */
export async function navigateToAdvancedSettings(page: Page): Promise<Locator> {
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
