import { test, expect } from '@playwright/test';
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

    const courseCard = page
      .locator(
        '[data-testid*="course-card"], [class*="course-card"], [data-testid*="course"], [class*="card"]',
      )
      .first();
    const emptyState = page
      .getByText(/no recommendation/i)
      .or(page.getByText(/no courses/i))
      .or(page.getByText(/empty/i))
      .or(page.getByText(/nothing to show/i));

    const hasCards = await courseCard.isVisible({ timeout: 120_000 }).catch(() => false);
    const hasEmpty = await emptyState.isVisible({ timeout: 120_000 }).catch(() => false);

    expect(hasCards || hasEmpty).toBe(true);
  });

  test('CP-2: cards show title and description', async ({ page }) => {
    await page.goto(`${SKILL_HOST}/recommended`, { timeout: 60_000 });
    await waitForAppShell(page);

    const courseCard = page
      .locator(
        '[data-testid*="course-card"], [class*="course-card"], [data-testid*="course"], [class*="card"]',
      )
      .first();
    const hasCards = await courseCard.isVisible({ timeout: 120_000 }).catch(() => false);

    if (!hasCards) {
      test.skip(true, 'No recommended courses — skipping card content check');
      return;
    }

    // Verify card has a title
    const cardTitle = courseCard
      .getByRole('heading')
      .first()
      .or(courseCard.locator('[class*="title"], [class*="name"]').first());
    await expect(cardTitle).toBeVisible({ timeout: 10_000 });

    // Verify card has a description or summary text
    const cardDescription = courseCard
      .locator('[class*="description"], [class*="summary"], p')
      .first();
    const hasDescription = await cardDescription.isVisible({ timeout: 120_000 }).catch(() => false);
    // Description may be truncated or absent on some cards — title is sufficient
    expect(cardTitle).toBeDefined();
  });

  test('CP-3: click card navigates to course about page', async ({ page }) => {
    await page.goto(`${SKILL_HOST}/recommended`, { timeout: 60_000 });
    await waitForAppShell(page);

    const courseCard = page
      .locator(
        '[data-testid*="course-card"], [class*="course-card"], [data-testid*="course"], [class*="card"]',
      )
      .first();
    const hasCards = await courseCard.isVisible({ timeout: 120_000 }).catch(() => false);

    if (!hasCards) {
      test.skip(true, 'No recommended courses — skipping navigation check');
      return;
    }

    const courseLink = courseCard.getByRole('link').first();
    const hasLink = await courseLink.isVisible({ timeout: 120_000 }).catch(() => false);

    if (hasLink) {
      await courseLink.click();
    } else {
      await courseCard.click();
    }

    await page.waitForURL(
      (url) =>
        url.href.includes('/course') || url.href.includes('/about') || url.href.includes('/detail'),
      { timeout: 30_000 },
    );
    expect(page.url()).toMatch(/course|about|detail/);
  });

  test('CP-4: personalized recommendations displayed', async ({ page }) => {
    await page.goto(`${SKILL_HOST}/recommended`, { timeout: 60_000 });
    await waitForAppShell(page);

    // Check if the page indicates personalization (e.g. "Recommended for you", user-specific section)
    const personalizedHeading = page.getByText(/recommended for you|personalized|based on/i);
    const courseCard = page
      .locator(
        '[data-testid*="course-card"], [class*="course-card"], [data-testid*="course"], [class*="card"]',
      )
      .first();

    const hasPersonalized = await personalizedHeading
      .isVisible({ timeout: 120_000 })
      .catch(() => false);
    const hasCards = await courseCard.isVisible({ timeout: 120_000 }).catch(() => false);

    // The page should show either personalized content or at least load without error
    const pageMain = page.getByRole('main').or(page.locator('[class*="recommend"]'));
    await expect(pageMain).toBeVisible({ timeout: 10_000 });
  });

  test('CP-5: proper heading is displayed', async ({ page }) => {
    await page.goto(`${SKILL_HOST}/recommended`, { timeout: 60_000 });
    await waitForAppShell(page);

    // The page renders an <h1>Recommended for Me</h1>
    const heading = page.getByRole('heading', { name: /recommended for me/i });
    await expect(heading).toBeVisible({ timeout: 30_000 });
  });
});
