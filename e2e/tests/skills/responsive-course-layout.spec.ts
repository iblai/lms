import { test, expect, Page } from '@playwright/test';

import { SKILL_HOST } from '../utils';
import { waitForPageReady } from '@iblai/iblai-js/playwright';
import { logger } from '@iblai/iblai-js/playwright';

/**
 * Tests for responsive layout changes introduced in feat/delete-profile-component-integrated:
 * - Course nav tabs container: overflow-x-auto + w-full for horizontal scrollability
 * - EdxIframe container: w-full + dynamic active-tab-{tab} class + course-edx-iframe-container
 * - Mobile media query: removes padding on non-course tabs at < 768px
 * - TimedExam container: sm:p-6 (no padding on mobile)
 */

async function navigateToCourseContent(page: Page) {
  await page.goto(SKILL_HOST, { waitUntil: 'networkidle', timeout: 120000 });
  await waitForPageReady(page);

  await page.goto(`${SKILL_HOST}/home`, { waitUntil: 'networkidle', timeout: 120000 });
  await waitForPageReady(page);
  await page.waitForTimeout(6000);

  const myCoursesGrid = page.getByLabel('My Courses Grid');
  await expect(myCoursesGrid).toBeVisible({ timeout: 120000 });

  const courseLink = myCoursesGrid.getByRole('link').first();
  await expect(courseLink).toBeVisible({ timeout: 120000 });
  await courseLink.click();

  await page.waitForURL(/\/courses\/.*/, { timeout: 120000 });
  await waitForPageReady(page);

  const accessCourseButton = page.getByRole('button', { name: 'Access Course' });
  await expect(accessCourseButton).toBeVisible({ timeout: 120000 });
  await accessCourseButton.click();

  await page.waitForURL(/\/course-content\/.*/, { timeout: 120000 });
  await waitForPageReady(page);
}

test.describe('Responsive Course Layout', () => {
  test.setTimeout(200000);

  test('course nav tabs container is horizontally scrollable and full width', async ({ page }) => {
    await navigateToCourseContent(page);

    // The nav tabs container should have overflow-x-auto and w-full
    const tabsContainer = page.locator('div.flex.overflow-x-auto.w-full').first();
    await expect(tabsContainer).toBeVisible({ timeout: 30000 });

    // Verify the Course, Progress, Dates, and Discussion tabs are inside it
    await expect(tabsContainer.getByRole('link', { name: 'Course' })).toBeVisible({ timeout: 30000 });
    await expect(tabsContainer.getByRole('link', { name: 'Progress' })).toBeVisible({ timeout: 30000 });
    await expect(tabsContainer.getByRole('link', { name: 'Dates' })).toBeVisible({ timeout: 30000 });
    await expect(tabsContainer.getByRole('link', { name: 'Discussion' })).toBeVisible({ timeout: 30000 });

    logger.info('Nav tabs container has overflow-x-auto and w-full');
  });

  test('edx iframe container has course-edx-iframe-container class and correct active-tab class per tab', async ({
    page,
  }) => {
    await navigateToCourseContent(page);

    const tabsToCheck: Array<{ linkName: string; tabClass: string }> = [
      { linkName: 'Course', tabClass: 'active-tab-course' },
      { linkName: 'Progress', tabClass: 'active-tab-progress' },
      { linkName: 'Dates', tabClass: 'active-tab-dates' },
      { linkName: 'Discussion', tabClass: 'active-tab-forum' },
    ];

    for (const { linkName, tabClass } of tabsToCheck) {
      logger.info(`Checking iframe container classes on "${linkName}" tab`);

      const tabLink = page.getByRole('link', { name: linkName }).first();
      await expect(tabLink).toBeVisible({ timeout: 30000 });
      await tabLink.click();
      await page.waitForTimeout(2000);

      const iframeContainer = page.locator('.course-edx-iframe-container').first();
      await expect(iframeContainer).toBeVisible({ timeout: 30000 });
      await expect(iframeContainer).toHaveClass(/course-edx-iframe-container/, { timeout: 10000 });
      await expect(iframeContainer).toHaveClass(new RegExp(tabClass), { timeout: 10000 });

      // Container should be full width, not max-w-4xl
      const classList = await iframeContainer.getAttribute('class');
      expect(classList).toContain('w-full');
      expect(classList).not.toContain('max-w-4xl');

      logger.info(`"${linkName}" tab: container has classes "${classList}"`);
    }
  });

  test('mobile viewport: non-course tabs have no padding on iframe container', async ({ page }) => {
    // Set mobile viewport (< 768px triggers the media query)
    await page.setViewportSize({ width: 375, height: 812 });

    await navigateToCourseContent(page);

    const nonCourseTabs: Array<{ linkName: string; tabClass: string }> = [
      { linkName: 'Progress', tabClass: 'active-tab-progress' },
      { linkName: 'Dates', tabClass: 'active-tab-dates' },
      { linkName: 'Discussion', tabClass: 'active-tab-forum' },
    ];

    for (const { linkName, tabClass } of nonCourseTabs) {
      logger.info(`Mobile: checking padding on "${linkName}" tab`);

      const tabLink = page.getByRole('link', { name: linkName }).first();
      await expect(tabLink).toBeVisible({ timeout: 30000 });
      await tabLink.click();
      await page.waitForTimeout(2000);

      const iframeContainer = page.locator('.course-edx-iframe-container').first();
      await expect(iframeContainer).toBeVisible({ timeout: 30000 });

      // On mobile, media query sets padding to 0 for non-course tabs
      const padding = await iframeContainer.evaluate((el) => {
        const style = window.getComputedStyle(el);
        return style.padding;
      });

      logger.info(`Mobile "${linkName}" tab computed padding: ${padding}`);
      expect(padding).toBe('0px');
    }
  });

  test('mobile viewport: course tab retains padding on iframe container', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });

    await navigateToCourseContent(page);

    // Course tab is not in the mobile no-padding media query, so it keeps p-6 (24px)
    const courseTabLink = page.getByRole('link', { name: 'Course' }).first();
    await expect(courseTabLink).toBeVisible({ timeout: 30000 });
    await courseTabLink.click();
    await page.waitForTimeout(2000);

    const iframeContainer = page.locator('.course-edx-iframe-container').first();
    await expect(iframeContainer).toBeVisible({ timeout: 30000 });

    const padding = await iframeContainer.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return style.padding;
    });

    logger.info(`Mobile "Course" tab computed padding: ${padding}`);
    // p-6 = 1.5rem = 24px — should not be stripped on mobile for the course tab
    expect(padding).not.toBe('0px');
  });

  test('desktop viewport: all tab containers retain padding', async ({ page }) => {
    // Desktop viewport — media query at max-width 768px does not apply
    await page.setViewportSize({ width: 1280, height: 800 });

    await navigateToCourseContent(page);

    const tabsToCheck = ['Progress', 'Dates', 'Discussion'];

    for (const linkName of tabsToCheck) {
      logger.info(`Desktop: checking padding on "${linkName}" tab`);

      const tabLink = page.getByRole('link', { name: linkName }).first();
      await expect(tabLink).toBeVisible({ timeout: 30000 });
      await tabLink.click();
      await page.waitForTimeout(2000);

      const iframeContainer = page.locator('.course-edx-iframe-container').first();
      await expect(iframeContainer).toBeVisible({ timeout: 30000 });

      const padding = await iframeContainer.evaluate((el) => {
        const style = window.getComputedStyle(el);
        return style.padding;
      });

      logger.info(`Desktop "${linkName}" tab computed padding: ${padding}`);
      // p-6 = 24px — media query should NOT remove it on desktop
      expect(padding).not.toBe('0px');
    }
  });
});
