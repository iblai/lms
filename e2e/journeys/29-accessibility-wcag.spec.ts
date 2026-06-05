import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { waitForAppShell, gotoTenantPage } from '../utils/navigation';

/**
 * Journey 29: Accessibility WCAG 2.1 AA
 * Runs axe-core scans on key pages and verifies ARIA attributes
 * on interactive components.
 */
test.fixme('Journey 29: Accessibility WCAG 2.1 AA', () => {
  test.setTimeout(200000);

  test('CP-1: Home page passes axe-core scan', async ({ page }) => {
    await gotoTenantPage(page, 'home', { timeout: 120_000 });
    await waitForAppShell(page);

    // library and cannot be fixed in our source code.
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();

    if (results.violations.length > 0) {
      console.warn(
        `Axe violations on /home:\n${results.violations.map((v) => `${v.id}: ${v.description}`).join('\n')}`,
      );
    }
    expect(results.violations).toHaveLength(0);
  });

  test('CP-2: Discover page passes axe-core scan', async ({ page }) => {
    await gotoTenantPage(page, 'discover', { timeout: 120_000 });
    await waitForAppShell(page);

    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();

    if (results.violations.length > 0) {
      console.warn(
        `Axe violations on /discover:\n${results.violations.map((v) => `${v.id}: ${v.description}`).join('\n')}`,
      );
    }
    expect(results.violations).toHaveLength(0);
  });

  test('CP-3: Profile page passes axe-core scan', async ({ page }) => {
    await gotoTenantPage(page, 'profile', { timeout: 120_000 });
    await waitForAppShell(page);

    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();

    if (results.violations.length > 0) {
      console.warn(
        `Axe violations on /profile:\n${results.violations.map((v) => `${v.id}: ${v.description}`).join('\n')}`,
      );
    }
    expect(results.violations).toHaveLength(0);
  });

  test('CP-4: Course about page passes axe-core scan', async ({ page }) => {
    // Navigate to home and click into a course
    await gotoTenantPage(page, 'home', { timeout: 120_000 });
    await waitForAppShell(page);

    const myCoursesGrid = page.getByRole('region', { name: 'My Courses' });
    const hasGrid = await myCoursesGrid
      .waitFor({ state: 'visible', timeout: 30_000 })
      .then(() => true)
      .catch(() => false);

    if (!hasGrid) {
      test.skip();
      return;
    }

    const courseLink = myCoursesGrid.getByRole('link').first();
    await expect(courseLink).toBeVisible({ timeout: 30_000 });
    await courseLink.click();
    await page.waitForURL(/\/courses\/.*/, { timeout: 120_000 });

    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();

    expect(results.violations).toEqual([]);
  });

  test('CP-5: Analytics page passes axe-core scan (admin only)', async ({ page }) => {
    // Navigate to analytics — admin only
    const analyticsLink = page.getByRole('link', { name: /ai analytics/i });

    await gotoTenantPage(page, 'home', { timeout: 120_000 });
    await waitForAppShell(page);

    const isAnalyticsVisible = await page
      .getByRole('link', { name: /ai analytics/i })
      .waitFor({ state: 'visible', timeout: 10_000 })
      .then(() => true)
      .catch(() => false);

    if (!isAnalyticsVisible) {
      test.skip();
      return;
    }

    await gotoTenantPage(page, 'analytics', { timeout: 120_000 });
    await waitForAppShell(page);

    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();

    expect(results.violations).toEqual([]);
  });

  test('CP-6: Edit Profile dialog has proper ARIA attributes', async ({ page }) => {
    await gotoTenantPage(page, 'home', { timeout: 120_000 });
    await waitForAppShell(page);

    // Open profile dialog
    const profileButton = page.getByRole('button', { name: 'More options' });
    await expect(profileButton).toBeVisible({ timeout: 15_000 });
    await profileButton.click();

    const profileMenuItem = page.getByRole('menuitem', { name: /profile/i });
    await expect(profileMenuItem).toBeVisible({ timeout: 10_000 });
    await profileMenuItem.click();

    const profileDialog = page.getByRole('dialog').filter({ hasText: 'Basic' });
    await expect(profileDialog).toBeVisible({ timeout: 15_000 });

    // Verify the dialog has role="dialog"
    await expect(profileDialog).toHaveAttribute('role', 'dialog');

    // Run axe-core on the dialog
    const results = await new AxeBuilder({ page })
      .include('[role="dialog"]')
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });

  test('CP-7: Program modal has dialog role', async ({ page }) => {
    await gotoTenantPage(page, 'profile/programs', { timeout: 120_000 });
    await waitForAppShell(page);

    // Find a program card and click it to open a modal
    const programCard = page
      .getByRole('link')
      .filter({ hasText: /program/i })
      .first()
      .or(page.locator('[data-testid*="program"]').first());

    const hasProgramCard = await programCard
      .waitFor({ state: 'visible', timeout: 15_000 })
      .then(() => true)
      .catch(() => false);

    if (!hasProgramCard) {
      // No programs available — skip
      test.skip();
      return;
    }

    await programCard.click();

    // Wait for a modal/dialog to appear
    const dialog = page.getByRole('dialog');
    const hasDialog = await dialog
      .first()
      .waitFor({ state: 'visible', timeout: 10_000 })
      .then(() => true)
      .catch(() => false);

    if (!hasDialog) {
      // Program click may navigate instead of opening a modal
      test.skip();
      return;
    }

    await expect(dialog.first()).toHaveAttribute('role', 'dialog');
  });

  test('CP-8: Notification dropdown has ARIA attributes', async ({ page }) => {
    await gotoTenantPage(page, 'home', { timeout: 120_000 });
    await waitForAppShell(page);

    const navbar = page.getByRole('banner');
    await expect(navbar).toBeVisible({ timeout: 30_000 });

    // Look for notification button
    const notificationButton = navbar
      .getByRole('button', { name: /notification/i })
      .or(navbar.locator('[aria-label*="notification" i], [data-testid*="notification"]'));

    const hasNotifications = await notificationButton
      .first()
      .isVisible()
      .catch(() => false);

    if (!hasNotifications) {
      test.skip();
      return;
    }

    // Verify the notification button has aria attributes
    const button = notificationButton.first();
    await expect(button).toBeVisible();

    // Click to open notification dropdown
    await button.click();

    // The dropdown should have proper ARIA (menu, listbox, or region)
    const dropdown = page
      .getByRole('menu')
      .or(page.getByRole('listbox'))
      .or(page.locator('[role="region"][aria-label*="notification" i]'));

    const hasDropdown = await dropdown
      .first()
      .waitFor({ state: 'visible', timeout: 10_000 })
      .then(() => true)
      .catch(() => false);

    if (hasDropdown) {
      const role = await dropdown.first().getAttribute('role');
      expect(['menu', 'listbox', 'region']).toContain(role);
    }
  });

  test('CP-9: Interactive elements have accessible names', async ({ page }) => {
    await gotoTenantPage(page, 'home', { timeout: 120_000 });
    await waitForAppShell(page);

    // Check that all visible buttons have accessible names
    const buttons = page.getByRole('button');
    const buttonCount = await buttons.count();

    const buttonsWithoutNames: string[] = [];

    for (let i = 0; i < Math.min(buttonCount, 50); i++) {
      const button = buttons.nth(i);
      const isVisible = await button.isVisible({ timeout: 120_000 }).catch(() => false);
      if (!isVisible) continue;

      const ariaLabel = await button.getAttribute('aria-label');
      const ariaLabelledBy = await button.getAttribute('aria-labelledby');
      const textContent = await button.textContent();
      const title = await button.getAttribute('title');

      const hasAccessibleName =
        (ariaLabel && ariaLabel.trim().length > 0) ||
        (ariaLabelledBy && ariaLabelledBy.trim().length > 0) ||
        (textContent && textContent.trim().length > 0) ||
        (title && title.trim().length > 0);

      if (!hasAccessibleName) {
        const outerHTML = await button.evaluate((el) => el.outerHTML.slice(0, 200));
        buttonsWithoutNames.push(outerHTML);
      }
    }

    if (buttonsWithoutNames.length > 0) {
      console.warn(`Buttons without accessible names:\n${buttonsWithoutNames.join('\n')}`);
    }

    expect(buttonsWithoutNames).toHaveLength(0);
  });

  test('CP-10: No images without alt text', async ({ page }) => {
    await gotoTenantPage(page, 'home', { timeout: 120_000 });
    await waitForAppShell(page);

    // Find all visible images and check for alt attributes
    const imagesWithoutAlt = await page.evaluate(() => {
      const images = Array.from(document.querySelectorAll('img'));
      const issues: string[] = [];

      for (const img of images) {
        // Skip invisible images
        const style = window.getComputedStyle(img);
        if (style.display === 'none' || style.visibility === 'hidden') continue;

        const alt = img.getAttribute('alt');
        const role = img.getAttribute('role');

        // Images with role="presentation" or role="none" are decorative and don't need alt
        if (role === 'presentation' || role === 'none') continue;

        // alt="" is valid for decorative images
        if (alt === null) {
          issues.push(img.src.slice(0, 100));
        }
      }

      return issues;
    });

    if (imagesWithoutAlt.length > 0) {
      console.warn(`Images without alt attribute:\n${imagesWithoutAlt.join('\n')}`);
    }

    expect(imagesWithoutAlt).toHaveLength(0);
  });
});
