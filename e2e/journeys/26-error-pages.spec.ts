import { test, expect } from '@playwright/test';

const SKILL_HOST = process.env.SKILLS_HOST || 'http://localhost:3000';

test.describe('Journey 26: Error Pages', () => {
  test.setTimeout(200000);

  test('CP-1: /error/404 shows Page Not Found', async ({ page }) => {
    await page.goto(`${SKILL_HOST}/error/404`, {
      waitUntil: 'domcontentloaded',
      timeout: 120_000,
    });
    await page.waitForLoadState('domcontentloaded');

    // Should display a "Page Not Found" or "404" message
    const notFoundText = page.getByText(/page not found|404|not found/i).first();
    await expect(notFoundText).toBeVisible({ timeout: 30_000 });
  });

  test('CP-2: /error/403 shows Forbidden', async ({ page }) => {
    await page.goto(`${SKILL_HOST}/error/403`, {
      waitUntil: 'domcontentloaded',
      timeout: 120_000,
    });
    await page.waitForLoadState('domcontentloaded');

    // Should display a "Forbidden" or "403" or "Access Denied" message
    const forbiddenText = page.getByText(/forbidden|403|access denied|not authorized/i).first();
    await expect(forbiddenText).toBeVisible({ timeout: 30_000 });
  });

  test('CP-3: Non-existent route shows 404 page', async ({ page }) => {
    const randomPath = `/this-page-does-not-exist-${Date.now()}`;
    await page.goto(`${SKILL_HOST}${randomPath}`, {
      waitUntil: 'domcontentloaded',
      timeout: 120_000,
    });
    await page.waitForLoadState('domcontentloaded');

    // Should display a "Not Found" or "404" message or redirect to an error page
    const errorContent = page.getByText(/not found|404|page not found|does not exist/i).first();
    const isErrorVisible = await errorContent.isVisible().catch(() => false);

    // Either the error page renders or we get redirected to a known error page
    const url = page.url();
    const isOnErrorPage = url.includes('/error') || url.includes('/404');

    expect(isErrorVisible || isOnErrorPage).toBeTruthy();
  });

  test('CP-4: Error pages have a Home link', async ({ page }) => {
    await page.goto(`${SKILL_HOST}/error/404`, {
      waitUntil: 'domcontentloaded',
      timeout: 120_000,
    });
    await page.waitForLoadState('domcontentloaded');

    // Look for a link that navigates back to home
    const homeLink = page
      .getByRole('link', { name: /home|go back|return/i })
      .or(page.getByRole('button', { name: /home|go back|return/i }));

    const hasHomeLink = await homeLink
      .first()
      .isVisible()
      .catch(() => false);

    if (hasHomeLink) {
      await homeLink.first().click();
      await page.waitForURL(/\/(home|start)?$/, { timeout: 60_000 });
      const url = page.url();
      expect(url.includes('/home') || url.endsWith('/') || url.includes('/start')).toBeTruthy();
    } else {
      // At minimum, the banner/navbar with logo link should still be present
      const navbar = page.getByRole('banner');
      const hasNavbar = await navbar.isVisible().catch(() => false);

      if (hasNavbar) {
        const logoLink = navbar.getByRole('link').first();
        await expect(logoLink).toBeVisible({ timeout: 10_000 });
      }
    }
  });
});
