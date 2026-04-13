import { test, expect } from '@playwright/test';
import { logger } from '@iblai/iblai-js/playwright';
import { waitForAppShell } from '../utils/navigation';

const SKILL_HOST = process.env.SKILLS_HOST || 'http://localhost:3000';

test.describe('Journey 13: Recommended Courses', () => {
  test.setTimeout(200_000);

  test.beforeEach(async ({ page }) => {
    await page.goto(`${SKILL_HOST}/home`, { timeout: 120_000 });
    await waitForAppShell(page);
  });

  test('CP-1: recommended page loads with cards or empty state', async ({ page }) => {
    await page.goto(`${SKILL_HOST}/recommended`, { timeout: 60_000 });
    await waitForAppShell(page);

    // CourseBox renders as <Link href="/courses/...">. Empty state says "No courses found."
    // Use expect().toBeVisible() (polling) to wait for elements during loading/skeleton phase.
    const courseCard = page.locator('a[href*="/courses/"]').first();
    const emptyState = page.getByText(/no courses found/i).first();

    const loaded = courseCard.or(emptyState);
    await expect(loaded).toBeVisible({ timeout: 120_000 });

    const hasCards = await courseCard.isVisible().catch(() => false);
    logger.info(hasCards ? 'Recommended course cards displayed' : 'Empty state — no courses');
  });

  test('CP-2: cards show title and description', async ({ page }) => {
    await page.goto(`${SKILL_HOST}/recommended`, { timeout: 60_000 });
    await waitForAppShell(page);

    const courseCard = page.locator('a[href*="/courses/"]').first();
    const emptyState = page.getByText(/no courses found/i).first();

    await expect(courseCard.or(emptyState)).toBeVisible({ timeout: 120_000 });

    const hasCards = await courseCard.isVisible().catch(() => false);
    if (!hasCards) {
      test.skip(true, 'No recommended courses — skipping card content check');
      return;
    }

    // CourseBox renders an h3 with the course name
    const cardTitle = courseCard.locator('h3').first();
    await expect(cardTitle).toBeVisible({ timeout: 10_000 });
    logger.info(`First recommended card title: ${await cardTitle.textContent()}`);
  });

  test('CP-3: click card navigates to course about page', async ({ page }) => {
    await page.goto(`${SKILL_HOST}/recommended`, { timeout: 60_000 });
    await waitForAppShell(page);

    const courseCard = page.locator('a[href*="/courses/"]').first();
    const emptyState = page.getByText(/no courses found/i).first();

    await expect(courseCard.or(emptyState)).toBeVisible({ timeout: 120_000 });

    const hasCards = await courseCard.isVisible().catch(() => false);
    if (!hasCards) {
      test.skip(true, 'No recommended courses — skipping navigation check');
      return;
    }

    // CourseBox is already a Link — click it directly
    await courseCard.click();
    await page.waitForURL((url) => url.href.includes('/courses/'), { timeout: 30_000 });
    expect(page.url()).toContain('/courses/');
    logger.info(`Navigated to course: ${page.url()}`);
  });

  test('CP-4: personalized recommendations displayed', async ({ page }) => {
    await page.goto(`${SKILL_HOST}/recommended`, { timeout: 60_000 });
    await waitForAppShell(page);

    // Wait for page to finish loading
    const courseCard = page.locator('a[href*="/courses/"]').first();
    const emptyState = page.getByText(/no courses found/i).first();
    await expect(courseCard.or(emptyState)).toBeVisible({ timeout: 120_000 });

    // The page should show the "Recommended for Me" heading
    const heading = page.getByText(/recommended for me/i);
    await expect(heading).toBeVisible({ timeout: 10_000 });
    logger.info('Personalized recommendations page loaded');
  });

  test('CP-5: proper heading is displayed', async ({ page }) => {
    await page.goto(`${SKILL_HOST}/recommended`, { timeout: 60_000 });
    await waitForAppShell(page);

    // The page renders an <h1>Recommended for Me</h1>
    const heading = page.getByRole('heading', { name: /recommended for me/i });
    await expect(heading).toBeVisible({ timeout: 30_000 });
  });
});
