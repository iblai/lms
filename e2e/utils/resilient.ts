/**
 * Resilient interaction helpers for SkillsAI E2E tests.
 * Retry-based click, fill, and wait helpers for flaky environments.
 */
import { Locator, Page, expect } from '@playwright/test';

/**
 * Wait for an element to be stable (attached, visible, and not moving).
 */
export async function waitForElementStable(locator: Locator, timeout = 15_000): Promise<void> {
  await locator.waitFor({ state: 'visible', timeout });
}

/**
 * Click with retry logic — retries up to 3 times on failure.
 */
export async function reliableClick(
  locator: Locator,
  options: { timeout?: number; retries?: number } = {},
): Promise<void> {
  const { timeout = 15_000, retries = 3 } = options;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await locator.waitFor({ state: 'visible', timeout });
      await locator.click({ timeout });
      return;
    } catch (error) {
      if (attempt === retries) throw error;
      await locator.page().waitForTimeout(1_000);
    }
  }
}

/**
 * Fill with verification — retries if the value doesn't stick.
 */
export async function reliableFill(
  locator: Locator,
  value: string,
  options: { timeout?: number; retries?: number } = {},
): Promise<void> {
  const { timeout = 15_000, retries = 3 } = options;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await locator.waitFor({ state: 'visible', timeout });
      await locator.fill(value, { timeout });
      // Verify the value was set
      await expect(locator).toHaveValue(value, { timeout: 5_000 });
      return;
    } catch (error) {
      if (attempt === retries) throw error;
      await locator.page().waitForTimeout(500);
      await locator.clear();
    }
  }
}

/**
 * Wait for iframe content to load and return the frame locator.
 */
export async function waitForIframeContent(
  page: Page,
  iframeSelector = 'iframe',
  timeout = 120_000,
): Promise<ReturnType<Page['frameLocator']>> {
  const iframeElement = page.locator(iframeSelector).first();
  await expect(iframeElement).toBeVisible({ timeout });

  const iframeLocator = page.frameLocator(iframeSelector).first();
  const body = iframeLocator.locator('body');
  await expect(body).toBeVisible({ timeout });

  return page.frameLocator(iframeSelector).first();
}
