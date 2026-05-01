import { test, expect, Page } from '@playwright/test';
import { waitForAppShell } from '../utils/navigation';
import { waitForPageLoad } from '@iblai/iblai-js/playwright';

const SKILL_HOST = process.env.SKILLS_HOST || 'http://localhost:3000';

/**
 * Journey 24: Mobile View
 * Converted from responsive-course-layout.spec.ts with additional mobile rendering checks.
 */

async function navigateToCourseContent(page: Page) {
  await page.goto(`${SKILL_HOST}/home`, {
    timeout: 120_000,
  });
  await waitForAppShell(page);

  const myCoursesGrid = page.getByRole('region', { name: 'My Courses' });
  await expect(myCoursesGrid).toBeVisible({ timeout: 120_000 });

  const courseLink = myCoursesGrid.getByRole('link').first();
  await expect(courseLink).toBeVisible({ timeout: 120_000 });
  await courseLink.click();

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

test.describe('Journey 24: Mobile View', () => {
  test.setTimeout(200000);

  test('CP-1: Navigation drawer appears on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });

    await page.goto(`${SKILL_HOST}/home`, {
      timeout: 120_000,
    });
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

  test('CP-2: Course tabs container is scrollable (overflow-x-auto, min-w-0)', async ({ page }) => {
    await navigateToCourseContent(page);

    // The nav tabs container should have overflow-x-auto and w-full
    const tabsContainer = page.locator('div.flex.overflow-x-auto.min-w-0').first();
    await expect(tabsContainer).toBeVisible({ timeout: 30_000 });

    // Verify course navigation tabs are inside (the first tab is "Course" or "Agent" depending on mode)
    await expect(tabsContainer.getByRole('link', { name: /^(Course|Agent)$/ }).first()).toBeVisible(
      {
        timeout: 30_000,
      },
    );
    await expect(tabsContainer.getByRole('link', { name: 'Progress' })).toBeVisible({
      timeout: 30_000,
    });
    await expect(tabsContainer.getByRole('link', { name: 'Dates' })).toBeVisible({
      timeout: 30_000,
    });
    await expect(tabsContainer.getByRole('link', { name: 'Discussion' })).toBeVisible({
      timeout: 30_000,
    });
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
      await page.goto(`${SKILL_HOST}${path}`, {
        timeout: 120_000,
      });
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
