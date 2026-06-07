import { test, expect } from '@playwright/test';
import { logger } from '@iblai/iblai-js/playwright';
import { waitForAppShell, gotoTenantPage } from '../utils/navigation';

/**
 * Journey 06: Public Profile
 *
 * Validates the public profile page at /profile/public:
 *  1. Public Profile tab is active
 *  2. About section displayed by default
 *  3. User name heading is displayed
 *  4. Profile navigation tabs visible
 *  5. Tab navigation works (switch to Skills and back)
 *  6. User heading is displayed
 */
test.describe('Journey 06: Public Profile', () => {
  test.setTimeout(200000);

  test.beforeEach(async ({ page }) => {
    await gotoTenantPage(page, 'profile/public', { timeout: 120000 });
    await waitForAppShell(page);
  });

  test('Checkpoint 1: Public Profile tab is active', async ({ page }) => {
    const publicProfileTab = page.getByRole('link', { name: 'Public Profile' });
    await expect(publicProfileTab).toBeVisible({ timeout: 30000 });

    // The active tab gets a primary-coloured border via className
    const className = (await publicProfileTab.getAttribute('class')) || '';
    expect(className).toContain('border-[var(--primary)]');
    logger.info('Public Profile tab is active');
  });

  test('Checkpoint 2: About section displayed by default', async ({ page }) => {
    const aboutHeading = page.getByRole('heading', { name: 'About' });
    await expect(aboutHeading).toBeVisible({ timeout: 30000 });
    logger.info('About section is visible on public profile');
  });

  test('Checkpoint 3: User name heading is displayed', async ({ page }) => {
    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading).toBeVisible({ timeout: 30000 });

    const text = await heading.textContent();
    expect(text?.length).toBeGreaterThan(0);
    logger.info(`User name heading: ${text}`);
  });

  test('Checkpoint 4: Profile navigation tabs are visible', async ({ page }) => {
    const expectedTabs = ['Activity', 'Skills', 'Credentials', 'Pathways', 'Programs', 'Courses'];

    let visibleTabCount = 0;

    for (const tabName of expectedTabs) {
      const tab = page.getByRole('link', { name: tabName, exact: true });
      const isVisible = await tab.isVisible({ timeout: 120_000 }).catch(() => false);

      if (isVisible) {
        visibleTabCount++;
      }
    }

    logger.info(`Found ${visibleTabCount} profile navigation tab(s)`);
    expect(visibleTabCount).toBeGreaterThan(0);
  });

  test('Checkpoint 5: Tab navigation works', async ({ page }) => {
    const skillsLink = page.getByRole('link', { name: 'Skills', exact: true });
    await expect(skillsLink).toBeVisible({ timeout: 10000 });

    await skillsLink.click();
    await page.waitForURL(/\/profile\/skills/, { timeout: 30000 });
    logger.info(`After clicking Skills tab, URL: ${page.url()}`);

    // Navigate back to Public Profile
    const publicProfileLink = page.getByRole('link', { name: 'Public Profile' });
    await expect(publicProfileLink).toBeVisible({ timeout: 10000 });
    await publicProfileLink.click();
    await page.waitForURL(/\/profile\/public/, { timeout: 30000 });
    logger.info('Navigated back to Public Profile tab');
  });

  test('Checkpoint 6: Public profile has content tabs', async ({ page }) => {
    // The /profile/public page has its own in-page tabs: About, Education, Experience, etc.
    const aboutTab = page.getByRole('button', { name: 'About' });
    await expect(aboutTab).toBeVisible({ timeout: 30000 });

    const educationTab = page.getByRole('button', { name: 'Education' });
    await expect(educationTab).toBeVisible({ timeout: 30000 });

    const experienceTab = page.getByRole('button', { name: 'Experience' });
    await expect(experienceTab).toBeVisible({ timeout: 30000 });

    logger.info('Public profile content tabs are visible');
  });
});
