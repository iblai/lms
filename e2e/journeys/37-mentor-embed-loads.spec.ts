import { test, expect } from '@playwright/test';
import { logger } from '@iblai/iblai-js/playwright';
import { gotoTenantPage } from '../utils/navigation';

/**
 * Journey 37: Mentor Embed Loads
 *
 * SkillsAI embeds the mentor through the `agent-ai` web component, which puts
 * the mentor app in an iframe inside its own shadow root. The host owns the
 * auth: the embed announces itself, asks for what it needs over `postMessage`,
 * and the host answers. Nothing in that handshake is visible from the outside,
 * so when it goes wrong the embed does not error — it spins.
 *
 * Every failure this suite exists to catch has looked identical from the host
 * page: an embed that never finishes loading. They were caused by the answer
 * being dropped, the answer being incomplete, or the answer being re-applied
 * forever. So the checkpoints below assert what an outside observer can
 * actually distinguish:
 *
 *   1. The host renders the component, pointed at this tenant's mentor
 *   2. The embed reaches the mentor app rather than a spinner or an error
 *   3. The embed carries the SAME tenant as the host, not a stale one
 *   4. The embed SETTLES — it does not reload itself in a loop
 *
 * Checkpoint 4 is the regression guard: a working embed navigates a small,
 * bounded number of times; a broken auth handshake re-navigates every few
 * seconds for as long as you watch.
 */
test.describe('Journey 37: Mentor Embed Loads', () => {
  test.setTimeout(200000);

  type Page = import('@playwright/test').Page;

  /**
   * The onboarding route is the embed surface that needs no course fixture, so
   * it is reachable on any environment. Playwright's CSS engine pierces open
   * shadow roots, so the component's inner iframe is addressable directly.
   */
  const AGENT_ELEMENT = 'agent-ai';
  const EMBED_IFRAME = 'agent-ai iframe';

  /** How long an embed is allowed to keep navigating before we call it a loop. */
  const SETTLE_WINDOW_MS = 20_000;

  /**
   * A working embed may navigate a couple of times legitimately — the initial
   * load, and one reload if the host hands it fresh auth. Repeated navigation
   * past that is the loop.
   */
  const MAX_EMBED_NAVIGATIONS = 3;

  /** Land on a surface that embeds the mentor, or report that none is configured. */
  async function gotoEmbedSurface(page: Page): Promise<boolean> {
    await gotoTenantPage(page, 'onboarding?flow=user', { timeout: 120000 });
    const appeared = await page
      .locator(AGENT_ELEMENT)
      .first()
      .waitFor({ state: 'attached', timeout: 60000 })
      .then(() => true)
      .catch(() => false);
    return appeared;
  }

  /** The tenant this browser session is actually on, as the host stores it. */
  async function hostTenant(page: Page): Promise<string | null> {
    return page
      .evaluate(() => {
        try {
          return JSON.parse(localStorage.getItem('current_tenant') || '{}').key ?? null;
        } catch {
          return null;
        }
      })
      .catch(() => null);
  }

  test('Checkpoint 1: The host renders the mentor component for this tenant', async ({ page }) => {
    if (!(await gotoEmbedSurface(page))) {
      logger.info('No mentor embed configured on this tenant — nothing to assert');
      return;
    }

    const agent = page.locator(AGENT_ELEMENT).first();
    const tenant = await hostTenant(page);

    // The component is pointed at a mentor, on the tenant the host is on.
    await expect(agent).toHaveAttribute('mentor', /.+/, { timeout: 60000 });
    if (tenant) {
      await expect(agent).toHaveAttribute('tenant', tenant, { timeout: 60000 });
    }
    logger.info(`Mentor component rendered for tenant ${tenant ?? '(unknown)'}`);
  });

  test('Checkpoint 2: The embed reaches the mentor app, not a spinner', async ({ page }) => {
    if (!(await gotoEmbedSurface(page))) {
      logger.info('No mentor embed configured on this tenant — nothing to assert');
      return;
    }

    const iframe = page.locator(EMBED_IFRAME).first();
    await expect(iframe).toBeVisible({ timeout: 120000 });

    // The frame is pointed at the mentor app on a platform route, which is
    // what the component builds once it knows the tenant and mentor.
    await expect(iframe).toHaveAttribute('src', /\/platform\//, { timeout: 60000 });

    // Inside, the mentor app has actually rendered something interactive.
    // Any of these means the app booted; a stuck embed shows none of them.
    const frame = page.frameLocator(EMBED_IFRAME).first();
    const mentorUi = frame
      .getByRole('textbox')
      .or(frame.locator('textarea'))
      .or(frame.getByRole('button', { name: /send|ask/i }))
      .first();

    await expect(mentorUi).toBeVisible({ timeout: 120000 });
    logger.info('Mentor app rendered inside the embed');
  });

  test('Checkpoint 3: The embed runs on the same tenant as the host', async ({ page }) => {
    if (!(await gotoEmbedSurface(page))) {
      logger.info('No mentor embed configured on this tenant — nothing to assert');
      return;
    }

    const tenant = await hostTenant(page);
    if (!tenant) {
      logger.info('Host tenant not resolvable from storage — skipping the comparison');
      return;
    }

    const iframe = page.locator(EMBED_IFRAME).first();
    await expect(iframe).toBeVisible({ timeout: 120000 });

    // The mentor is served per tenant, so its own URL carries the tenant it
    // believes it is on. A mismatch here is the tenant-switch failure: the
    // embed left on a stale tenant while the host moved on.
    await expect(iframe).toHaveAttribute('src', new RegExp(`/platform/${tenant}(/|\\?|$)`), {
      timeout: 120000,
    });
    logger.info(`Embed and host agree on tenant ${tenant}`);
  });

  test('Checkpoint 4: The embed settles instead of reloading in a loop', async ({ page }) => {
    if (!(await gotoEmbedSurface(page))) {
      logger.info('No mentor embed configured on this tenant — nothing to assert');
      return;
    }

    await expect(page.locator(EMBED_IFRAME).first()).toBeVisible({ timeout: 120000 });

    // Count navigations of the embedded frame only. A broken auth handshake
    // re-navigates it every few seconds: save, reload, receive the same
    // answer, save again.
    let navigations = 0;
    const onNavigated = (frame: import('@playwright/test').Frame) => {
      if (frame === page.mainFrame()) return;
      if (frame.url().includes('/platform/')) navigations += 1;
    };
    page.on('framenavigated', onNavigated);

    await page.waitForTimeout(SETTLE_WINDOW_MS);
    page.off('framenavigated', onNavigated);

    logger.info(
      `Embed navigated ${navigations} time(s) in ${SETTLE_WINDOW_MS / 1000}s ` +
        `(limit ${MAX_EMBED_NAVIGATIONS})`,
    );
    expect(
      navigations,
      `The embed kept reloading (${navigations} navigations in ${
        SETTLE_WINDOW_MS / 1000
      }s), which is the auth-handshake loop`,
    ).toBeLessThanOrEqual(MAX_EMBED_NAVIGATIONS);
  });
});
