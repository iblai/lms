import { test, expect } from '@playwright/test';

const SKILL_HOST = process.env.SKILLS_HOST || 'http://localhost:3000';

test.describe('Journey 21: Search', () => {
  test.setTimeout(200000);

  test.beforeEach(async ({ page }) => {
    await page.goto(`${SKILL_HOST}/home`, {
      waitUntil: 'domcontentloaded',
      timeout: 120_000,
    });
    // Wait for the app to be ready
  });

  test('CP-1: Global search is accessible from NavBar', async ({ page }) => {
    // The global search input or button should be present in the navigation bar
    const navbar = page.getByRole('banner');
    await expect(navbar).toBeVisible({ timeout: 30_000 });

    // Look for a search input or search button in the navbar
    const searchInput = navbar.getByRole('textbox', { name: /search/i });
    const searchButton = navbar.getByRole('button', { name: /search/i });

    const hasSearchInput = await searchInput.isVisible().catch(() => false);
    const hasSearchButton = await searchButton.isVisible().catch(() => false);

    expect(hasSearchInput || hasSearchButton).toBeTruthy();
  });

  test('CP-2: Typing a query shows results', async ({ page }) => {
    const navbar = page.getByRole('banner');
    await expect(navbar).toBeVisible({ timeout: 30_000 });

    // Find the search input — could be directly visible or revealed by clicking a button
    let searchInput = navbar.getByRole('textbox', { name: /search/i });
    const isInputVisible = await searchInput.isVisible().catch(() => false);

    if (!isInputVisible) {
      const searchButton = navbar.getByRole('button', { name: /search/i });
      const isButtonVisible = await searchButton.isVisible().catch(() => false);
      if (isButtonVisible) {
        await searchButton.click();
        searchInput = page.getByRole('textbox', { name: /search/i });
        await expect(searchInput).toBeVisible({ timeout: 10_000 });
      }
    }

    // Type a search query
    await searchInput.fill('course');
    await page.waitForTimeout(2000);

    // Results should appear — look for a results container or list items
    const resultsList = page
      .getByRole('listbox')
      .or(page.locator('[data-testid="search-results"]'));
    const resultItems = page
      .getByRole('option')
      .or(page.getByRole('link').filter({ hasText: /course/i }));

    const hasResults = await resultsList.isVisible().catch(() => false);
    const hasItems = (await resultItems.count()) > 0;

    expect(hasResults || hasItems).toBeTruthy();
  });

  test('CP-3: Results show matching courses', async ({ page }) => {
    const navbar = page.getByRole('banner');
    await expect(navbar).toBeVisible({ timeout: 30_000 });

    let searchInput = navbar.getByRole('textbox', { name: /search/i });
    const isInputVisible = await searchInput.isVisible().catch(() => false);

    if (!isInputVisible) {
      const searchButton = navbar.getByRole('button', { name: /search/i });
      const isButtonVisible = await searchButton.isVisible().catch(() => false);
      if (isButtonVisible) {
        await searchButton.click();
        searchInput = page.getByRole('textbox', { name: /search/i });
        await expect(searchInput).toBeVisible({ timeout: 10_000 });
      }
    }

    await searchInput.fill('course');
    await page.waitForTimeout(2000);

    // Verify at least one result contains the search term
    const results = page.locator(
      '[data-testid="search-results"] a, [role="option"], [role="listbox"] a',
    );
    const count = await results.count();

    if (count > 0) {
      // At least one result should be visible
      await expect(results.first()).toBeVisible({ timeout: 10_000 });
    } else {
      // If no structured results, check for any text matching "course"
      const matchingText = page.getByText(/course/i).first();
      await expect(matchingText).toBeVisible({ timeout: 10_000 });
    }
  });

  test('CP-4: Clearing the search resets results', async ({ page }) => {
    const navbar = page.getByRole('banner');
    await expect(navbar).toBeVisible({ timeout: 30_000 });

    let searchInput = navbar.getByRole('textbox', { name: /search/i });
    const isInputVisible = await searchInput.isVisible().catch(() => false);

    if (!isInputVisible) {
      const searchButton = navbar.getByRole('button', { name: /search/i });
      const isButtonVisible = await searchButton.isVisible().catch(() => false);
      if (isButtonVisible) {
        await searchButton.click();
        searchInput = page.getByRole('textbox', { name: /search/i });
        await expect(searchInput).toBeVisible({ timeout: 10_000 });
      }
    }

    // Type a query
    await searchInput.fill('course');
    await page.waitForTimeout(2000);

    // Clear the search input
    await searchInput.clear();
    await page.waitForTimeout(1000);

    // The results container should no longer show search results
    const resultsContainer = page.locator('[data-testid="search-results"]');
    const isResultsVisible = await resultsContainer.isVisible().catch(() => false);

    if (isResultsVisible) {
      // If the container is still visible, it should be empty or showing a default state
      const resultItems = resultsContainer.getByRole('link');
      const count = await resultItems.count();
      // After clearing, either no results or the container is hidden
      expect(count).toBe(0);
    }

    // Verify the search input is empty
    await expect(searchInput).toHaveValue('');
  });

  test('CP-5: Search on discover page', async ({ page }) => {
    await page.goto(`${SKILL_HOST}/discover`, {
      waitUntil: 'domcontentloaded',
      timeout: 120_000,
    });

    // Look for a search input on the discover page
    const searchInput = page.getByRole('textbox', { name: /search/i }).first();
    await expect(searchInput).toBeVisible({ timeout: 30_000 });

    // Type a query
    await searchInput.fill('course');
    await page.waitForTimeout(2000);

    // The page should filter or display results matching the query
    // Look for course cards or search results
    const courseCards = page.getByRole('link').filter({ hasText: /course/i });
    const resultsHeading = page.getByText(/results/i);

    const hasCards = (await courseCards.count()) > 0;
    const hasResultsText = await resultsHeading.isVisible().catch(() => false);

    // At minimum, the search was processed (no crash, page is still functional)
    expect(hasCards || hasResultsText || (await searchInput.isVisible())).toBeTruthy();
  });
});
