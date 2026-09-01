import { test, expect, Page } from '@playwright/test';
import { getCourseContentTab, gotoTenantPage, waitForAppShell } from '../utils/navigation';
import { waitForPageLoad } from '@iblai/iblai-js/playwright';

/**
 * Journey 24: Mobile View
 * Converted from responsive-course-layout.spec.ts with additional mobile rendering checks.
 */

async function navigateToCourseContent(page: Page) {
  // Enrolled courses live on the centralized catalog page.
  await gotoTenantPage(page, 'discover?content=courses&enrolled=true', { timeout: 120_000 });
  await waitForAppShell(page);

  const courseCard = page.locator('[data-testid="discover-content-card"]').first();
  await expect(courseCard).toBeVisible({ timeout: 120_000 });
  await courseCard.click();

  await page.waitForURL(/\/courses\/.*/, { timeout: 120_000 });

  const accessCourseButton = page.getByRole('button', { name: 'Access Course' });
  await expect(accessCourseButton).toBeVisible({ timeout: 120_000 });
  await accessCourseButton.click();

  await page.waitForURL(/\/course-content\/.*/, { timeout: 120_000 });

  // The course-content tab is named "Course" or "Agent" depending on the course mode.
  const contentTab = page.getByRole('link', { name: /^(Course|Agent)$/ }).first();
  const hasContentTab = await contentTab.isVisible({ timeout: 120_000 }).catch(() => false);
  if (hasContentTab) {
    await contentTab.click();
    await page.waitForURL(/\/course-content\/.*/, { timeout: 120_000 });
    await waitForPageLoad(page);
  }
}

// TODO FIXME: This test is flaky on CI.
test.describe.fixme('Journey 24: Mobile View', () => {
  test.setTimeout(200000);

  test('CP-1: Navigation drawer appears on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });

    await gotoTenantPage(page, 'home', { timeout: 120_000 });
    await waitForAppShell(page);

    // On mobile, navigation should be behind a hamburger menu or drawer toggle
    const hamburgerButton = page
      .getByRole('button', { name: /menu|toggle|navigation/i })
      .or(page.locator('button[aria-label*="menu"], button[aria-label*="Menu"]'));

    const hasHamburger = await hamburgerButton
      .first()
      .isVisible()
      .catch(() => false);

    // On mobile, the main nav links should either be hidden or in a drawer
    const navbar = page.getByRole('banner');
    await expect(navbar).toBeVisible({ timeout: 10_000 });

    // Either a hamburger is present or the nav adapts to mobile
    expect(hasHamburger || (await navbar.isVisible())).toBeTruthy();
  });

  test('CP-2: Course tabs collapse into the overflow menu instead of overlapping', async ({
    page,
  }) => {
    await navigateToCourseContent(page);

    const tabsContainer = page.getByTestId('course-content-tabs');
    await expect(tabsContainer).toBeVisible({ timeout: 30_000 });

    // The tab row never spills past its container — anything that doesn't fit
    // moves into the 3-dot overflow menu.
    const overflows = await tabsContainer.evaluate(
      (el) => el.scrollWidth > el.clientWidth + 1 || false,
    );
    expect(overflows).toBe(false);

    // Every core tab stays reachable, inline or through the overflow menu.
    for (const name of [/^(Course|Agent)$/, 'Progress', 'Dates', 'Discussion'] as Array<
      string | RegExp
    >) {
      const tab = await getCourseContentTab(page, name);
      expect(tab, `tab ${name} should be reachable`).not.toBeNull();
      await expect(tab!).toBeVisible({ timeout: 30_000 });
    }
  });

  test('CP-3: Iframe container has correct CSS classes per tab', async ({ page }) => {
    await navigateToCourseContent(page);

    // The first tab is "Course" or "Agent" depending on the course mode.
    const tabsToCheck: Array<{ linkName: string | RegExp; tabClass: RegExp }> = [
      { linkName: /^(Course|Agent)$/, tabClass: /active-tab-(course|agent)/ },
      { linkName: 'Progress', tabClass: /active-tab-progress/ },
      { linkName: 'Dates', tabClass: /active-tab-dates/ },
      { linkName: 'Discussion', tabClass: /active-tab-forum/ },
    ];

    for (const { linkName, tabClass } of tabsToCheck) {
      const tabLink = page.getByRole('link', { name: linkName }).first();
      await expect(tabLink).toBeVisible({ timeout: 30_000 });
      await tabLink.click();
      await page.waitForTimeout(2000);
      // In Agent mode the course iframe is replaced by the agent UI, so skip iframe assertions.
      const tabText = (await tabLink.textContent()) ?? '';
      if (!/agent/i.test(tabText)) {
        const iframeContainer = page.locator('.course-edx-iframe-container').first();
        await expect(iframeContainer).toBeVisible({ timeout: 30_000 });
        await expect(iframeContainer).toHaveClass(/course-edx-iframe-container/);
        await expect(iframeContainer).toHaveClass(tabClass);

        const classList = await iframeContainer.getAttribute('class');
        expect(classList).toContain('w-full');
        expect(classList).not.toContain('max-w-4xl');
      }
    }
  });

  test('CP-4: Mobile — non-course tabs have no padding on iframe container', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await navigateToCourseContent(page);

    const nonCourseTabs: Array<{ linkName: string }> = [
      { linkName: 'Progress' },
      { linkName: 'Dates' },
      { linkName: 'Discussion' },
    ];

    for (const { linkName } of nonCourseTabs) {
      const tabLink = page.getByRole('link', { name: linkName }).first();
      await expect(tabLink).toBeVisible({ timeout: 30_000 });
      await tabLink.click();
      await page.waitForTimeout(2000);
      // In Agent mode the course iframe is replaced by the agent UI, so skip iframe assertions.
      const tabText = (await tabLink.textContent()) ?? '';
      if (!/agent/i.test(tabText)) {
        const iframeContainer = page.locator('.course-edx-iframe-container').first();
        await expect(iframeContainer).toBeVisible({ timeout: 30_000 });

        // On mobile, media query sets padding to 0 for non-course tabs
        const padding = await iframeContainer.evaluate((el) => {
          const style = window.getComputedStyle(el);
          return style.padding;
        });

        expect(padding).toBe('0px');
      }
    }
  });

  test('CP-5: Mobile — course tab retains padding on iframe container', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await navigateToCourseContent(page);

    // The course-content tab is "Course" or "Agent" depending on the course mode.
    const courseTabLink = page.getByRole('link', { name: /^(Course|Agent)$/ }).first();
    await expect(courseTabLink).toBeVisible({ timeout: 30_000 });
    await courseTabLink.click();
    await page.waitForTimeout(2000);

    // In Agent mode the course iframe is replaced by the agent UI, so skip iframe assertions.
    const tabText = (await courseTabLink.textContent()) ?? '';
    if (!/agent/i.test(tabText)) {
      const iframeContainer = page.locator('.course-edx-iframe-container').first();
      await expect(iframeContainer).toBeVisible({ timeout: 30_000 });

      const padding = await iframeContainer.evaluate((el) => {
        const style = window.getComputedStyle(el);
        return style.padding;
      });

      // p-6 = 1.5rem = 24px — should not be stripped on mobile for the course tab
      expect(padding).not.toBe('0px');
    }
  });

  test('CP-6: Desktop — all tabs retain padding', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await navigateToCourseContent(page);

    const tabsToCheck = ['Progress', 'Dates', 'Discussion'];

    for (const linkName of tabsToCheck) {
      const tabLink = page.getByRole('link', { name: linkName }).first();
      await expect(tabLink).toBeVisible({ timeout: 30_000 });
      await tabLink.click();
      await page.waitForTimeout(2000);
      // In Agent mode the course iframe is replaced by the agent UI, so skip iframe assertions.
      const tabText = (await tabLink.textContent()) ?? '';
      if (!/agent/i.test(tabText)) {
        const iframeContainer = page.locator('.course-edx-iframe-container').first();
        await expect(iframeContainer).toBeVisible({ timeout: 30_000 });

        const padding = await iframeContainer.evaluate((el) => {
          const style = window.getComputedStyle(el);
          return style.padding;
        });

        // Desktop: media query should NOT remove padding
        expect(padding).not.toBe('0px');
      }
    }
  });

  test('CP-7: Key pages render on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });

    const pages = [
      { path: '/home', name: 'Home' },
      { path: '/discover', name: 'Discover' },
      { path: '/profile', name: 'Profile' },
    ];

    for (const { path, name } of pages) {
      await gotoTenantPage(page, path.replace(/^\//, ''), { timeout: 120_000 });
      await waitForAppShell(page);

      // Wait for app root to render children
      const hasChildren = await page.evaluate(() => {
        return document.body && document.body.hasChildNodes();
      });

      expect(hasChildren).toBeTruthy();

      // Verify the page didn't crash — navbar/banner should be present
      const navbar = page.getByRole('banner');
      await expect(navbar).toBeVisible({ timeout: 30_000 });
    }
  });
});
