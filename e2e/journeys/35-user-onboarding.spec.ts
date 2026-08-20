import { test, expect } from '@playwright/test';
import { logger } from '@iblai/iblai-js/playwright';
import { gotoTenantPage } from '../utils/navigation';

/**
 * Journey 35: User Onboarding
 *
 * Covers the member half of the single onboarding route
 * `/platform/<tenant>/onboarding` (app/platform/[tenant]/onboarding/page.tsx).
 * The page picks the flow from the viewer: members get the tenant's user
 * onboarding form (SDK wizard in user mode), admins get the setup flow — walked
 * by Journey 34 — plus a switch that previews the member flow.
 *
 * The switch lives in the navbar and writes its choice to the URL (`?flow=user`),
 * which the page reads — so a preview survives a reload.
 *
 * The member form is authored per tenant and stored in the tenant metadata, so
 * a tenant that has configured none is a supported state: the wizard reports
 * completion immediately and the page lands on /home. Every checkpoint accepts
 * both outcomes and asserts what must hold either way.
 *
 *  1. The route serves one flow or the other, never an error (admins land on
 *     the member flow when their tenant has one configured)
 *  2. An admin session can switch into the member flow, and back out of it
 *  3. The member flow's step heading is rendered in the navbar
 *  4. The member flow never shows the admin setup steps
 *  5. Previewing does not navigate the admin away from onboarding
 */
test.describe('Journey 35: User Onboarding', () => {
  test.setTimeout(200000);

  const flowToggle = (page: import('@playwright/test').Page) =>
    page.getByTestId('onboarding-flow-toggle');
  // Checked is the ADMIN flow — the thumb rests on the side naming the flow in
  // view, and User is the left/off label.
  const flowSwitch = (page: import('@playwright/test').Page) =>
    page.getByRole('switch', { name: 'Show admin setup flow' });

  /** Flip into the member-flow preview and wait for the switch to settle off. */
  async function previewMemberFlow(page: import('@playwright/test').Page) {
    await flowSwitch(page).click();
    await expect(flowSwitch(page)).toHaveAttribute('aria-checked', 'false');
  }

  /** Land on the onboarding route and wait for whichever flow it serves. */
  async function gotoOnboarding(page: import('@playwright/test').Page) {
    await gotoTenantPage(page, 'onboarding', { timeout: 120000 });
    // Either a wizard paints its first step, or the member flow bailed out (no
    // form configured) and the page replaced itself with the dashboard.
    await expect(page.getByRole('progressbar').or(page.locator('header')).first()).toBeVisible({
      timeout: 120000,
    });
  }

  /**
   * Whether a wizard is on screen. An agent-only tenant is a single step, so
   * the flow shows no progress row — the step itself is the signal.
   */
  async function wizardOnScreen(page: import('@playwright/test').Page) {
    return page
      .getByRole('progressbar')
      .or(page.getByTestId('user-onboarding-agent-step'))
      .or(page.getByLabel('Organization name'))
      .first()
      .isVisible()
      .catch(() => false);
  }

  /** Whether this session is an admin — only they get the flow switch. */
  async function isAdminSession(page: import('@playwright/test').Page) {
    return flowToggle(page)
      .isVisible()
      .catch(() => false);
  }

  test('Checkpoint 1: Onboarding route serves a flow chosen by the viewer', async ({ page }) => {
    await gotoOnboarding(page);

    if (await isAdminSession(page)) {
      // Admins land on whichever flow their tenant actually runs: the member
      // one when it is configured, else their own setup flow.
      await expect(
        page
          .getByTestId('user-onboarding-agent-step')
          .or(page.getByTestId('user-onboarding-empty'))
          .or(page.getByLabel('Organization name'))
          .first(),
      ).toBeVisible({ timeout: 60000 });
      logger.info('Admin session served a flow');
    } else if (await wizardOnScreen(page)) {
      logger.info('Member session served the tenant onboarding');
    } else {
      await expect(page).toHaveURL(/\/home/, { timeout: 60000 });
      logger.info('Member session with no configured form landed on /home');
    }
  });

  test('Checkpoint 2: An admin can switch to the member flow and back', async ({ page }) => {
    await gotoOnboarding(page);

    if (!(await isAdminSession(page))) {
      logger.info('Not an admin session — the flow switch is correctly absent');
      await expect(flowToggle(page)).toHaveCount(0);
      return;
    }

    await previewMemberFlow(page);
    // The choice rides in the URL, so the page and the navbar cannot disagree.
    await expect(page).toHaveURL(/[?&]flow=user/, { timeout: 60000 });
    // The setup flow's first step is gone the moment the member flow takes over.
    await expect(page.getByLabel('Organization name')).toHaveCount(0);

    // The switch names both flows, so the way back is visible from the member
    // flow rather than being an unlabelled off state.
    await expect(flowToggle(page).getByText('Admin', { exact: true })).toBeVisible();
    await expect(flowToggle(page).getByText('User', { exact: true })).toBeVisible();

    await flowSwitch(page).click();
    await expect(flowSwitch(page)).toHaveAttribute('aria-checked', 'true');
    await expect(page.getByLabel('Organization name')).toBeVisible({ timeout: 60000 });
    logger.info('Flow switch toggles between setup and member onboarding');
  });

  test('Checkpoint 3: The member flow shows its step heading in the navbar', async ({ page }) => {
    await gotoOnboarding(page);

    if (await isAdminSession(page)) {
      await previewMemberFlow(page);
    } else if (!(await wizardOnScreen(page))) {
      logger.info('No onboarding configured for this tenant — no heading to place');
      return;
    }

    // The heading (icon + title + subtitle) sits in the navbar so the step
    // keeps its room for the questions or the agent.
    const header = page.getByTestId('onboarding-navbar-header');
    await expect(header).toBeVisible({ timeout: 60000 });
    await expect(header).not.toBeEmpty();
    logger.info('Member flow heading rendered in the navbar');
  });

  test('Checkpoint 4: The member flow never shows the admin setup steps', async ({ page }) => {
    await gotoOnboarding(page);

    if (await isAdminSession(page)) {
      await previewMemberFlow(page);
    }

    // Organization → sector → invite belong to the setup flow alone.
    await expect(page.getByLabel('Organization name')).toHaveCount(0);
    await expect(page.getByRole('heading', { name: /Welcome to/i })).toHaveCount(0);
    await expect(page.getByRole('heading', { name: /Invite your team/i })).toHaveCount(0);
    logger.info('Member flow confirmed free of the admin setup steps');
  });

  test('Checkpoint 5: Previewing keeps the admin on onboarding', async ({ page }) => {
    await gotoOnboarding(page);

    if (!(await isAdminSession(page))) {
      logger.info('Not an admin session — nothing to preview');
      return;
    }

    await previewMemberFlow(page);

    // A tenant with no form makes the wizard report completion at once; the
    // preview must swallow that rather than routing the admin to /home.
    await expect(page).toHaveURL(/\/onboarding/, { timeout: 60000 });
    await expect(flowToggle(page)).toBeVisible();
    logger.info('Preview stayed on the onboarding route');
  });
});
