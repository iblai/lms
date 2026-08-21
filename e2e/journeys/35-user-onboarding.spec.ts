import { test, expect } from '@playwright/test';
import { logger } from '@iblai/iblai-js/playwright';
import { gotoTenantPage } from '../utils/navigation';

/**
 * Journey 35: User Onboarding
 *
 * Covers the single onboarding route `/platform/<tenant>/onboarding`
 * (app/platform/[tenant]/onboarding/page.tsx). The page picks the flow from the
 * viewer: members always get the tenant's user onboarding form (SDK wizard in
 * user mode), admins get it too when their tenant has one configured and the
 * first-run setup flow — walked by Journey 34 — when it has not.
 *
 * The choice rides in the `?flow=` query param, which the page reads and which
 * admins alone can override. The navbar switch that used to drive it is parked
 * (see `onboardingFlowSwitch` in components/nav-bar.tsx), so the param is the
 * only way in and the toggle must be absent from every session.
 *
 * The member form is authored per tenant and stored in the tenant metadata, so
 * a tenant that has configured none is a supported state: the wizard says so
 * (`user-onboarding-empty`) rather than blanking or redirecting. Every
 * checkpoint accepts both outcomes and asserts what must hold either way.
 *
 *  1. The route serves one flow or the other, never an error
 *  2. `?flow=` picks the flow for an admin, and is ignored for a member
 *  3. The member flow's step heading is rendered in the navbar
 *  4. The member flow never shows the admin setup steps
 *  5. The member flow holds the route instead of redirecting away
 */
test.describe('Journey 35: User Onboarding', () => {
  test.setTimeout(200000);

  type Page = import('@playwright/test').Page;

  // The setup flow's first step. Matched on the input id rather than its label
  // so the assertion does not ride on the UI language.
  const adminFirstStep = (page: Page) => page.locator('#onboarding-org-name');

  /** Whatever the member flow can put on screen: a question step, the closing
   *  agent, or the "nothing configured" notice. */
  const memberFlow = (page: Page) =>
    page
      .getByTestId('onboarding-navbar-header')
      .or(page.getByTestId('user-onboarding-agent-step'))
      .or(page.getByTestId('user-onboarding-empty'))
      .first();

  /**
   * Whether this session is an admin. Read from the stored tenant — the same
   * `is_admin` flag `useIsAdmin()` resolves the flow from — because the navbar
   * no longer carries an admin-only control to infer it from.
   */
  async function isAdminSession(page: Page) {
    return page
      .evaluate(() => {
        try {
          return !!JSON.parse(localStorage.getItem('current_tenant') || '{}').is_admin;
        } catch {
          return false;
        }
      })
      .catch(() => false);
  }

  /** Land on the onboarding route and wait for whichever flow it serves. */
  async function gotoOnboarding(page: Page, flow?: 'user' | 'admin') {
    await gotoTenantPage(page, `onboarding${flow ? `?flow=${flow}` : ''}`, { timeout: 120000 });
    await expect(page.getByTestId('onboarding-page')).toBeVisible({ timeout: 120000 });
    // One flow or the other has painted — never a blank shell.
    await expect(memberFlow(page).or(adminFirstStep(page)).first()).toBeVisible({
      timeout: 120000,
    });
  }

  test('Checkpoint 1: Onboarding route serves a flow chosen by the viewer', async ({ page }) => {
    await gotoOnboarding(page);

    if (await isAdminSession(page)) {
      // Admins land on whichever flow their tenant actually runs: the member
      // one when it is configured, else their own setup flow.
      await expect(memberFlow(page).or(adminFirstStep(page)).first()).toBeVisible({
        timeout: 60000,
      });
      logger.info('Admin session served a flow');
      return;
    }

    // Members only ever get the member flow — the setup steps are not theirs.
    await expect(memberFlow(page)).toBeVisible({ timeout: 60000 });
    await expect(adminFirstStep(page)).toHaveCount(0);
    logger.info('Member session served the tenant onboarding');
  });

  test('Checkpoint 2: The flow param picks the flow, and only for admins', async ({ page }) => {
    await gotoOnboarding(page, 'admin');

    // The navbar switch that used to drive this is parked, so no session shows
    // it — the param is the only way to name a flow.
    await expect(page.getByTestId('onboarding-flow-toggle')).toHaveCount(0);

    if (!(await isAdminSession(page))) {
      // `flow=admin` is an admin's word; a member asking for it still gets the
      // member flow rather than the setup steps.
      await expect(memberFlow(page)).toBeVisible({ timeout: 60000 });
      await expect(adminFirstStep(page)).toHaveCount(0);
      logger.info('Member session ignored the flow param, as it must');
      return;
    }

    await expect(adminFirstStep(page)).toBeVisible({ timeout: 60000 });

    // ...and the other side of the param takes the admin back to the member
    // flow, whatever their tenant's default is.
    await gotoOnboarding(page, 'user');
    await expect(memberFlow(page)).toBeVisible({ timeout: 60000 });
    await expect(adminFirstStep(page)).toHaveCount(0);
    logger.info('Flow param switches an admin between setup and member onboarding');
  });

  test('Checkpoint 3: The member flow shows its step heading in the navbar', async ({ page }) => {
    // `flow=user` is the member flow for an admin and a no-op for a member, so
    // both sessions land in the same place.
    await gotoOnboarding(page, 'user');

    if (
      await page
        .getByTestId('user-onboarding-empty')
        .isVisible()
        .catch(() => false)
    ) {
      logger.info('No onboarding configured for this tenant — no step heading to place');
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
    await gotoOnboarding(page, 'user');

    // Organization → sector → invite belong to the setup flow alone.
    await expect(adminFirstStep(page)).toHaveCount(0);
    await expect(page.getByRole('heading', { name: /Welcome to/i })).toHaveCount(0);
    await expect(page.getByRole('heading', { name: /Invite your team/i })).toHaveCount(0);
    logger.info('Member flow confirmed free of the admin setup steps');
  });

  test('Checkpoint 5: The member flow holds the onboarding route', async ({ page }) => {
    await gotoOnboarding(page, 'user');

    // A tenant with no form is a dead end the wizard has to name rather than
    // silently routing people to /home — the notice, with its own way out.
    await expect(page).toHaveURL(/\/onboarding/, { timeout: 60000 });
    await expect(memberFlow(page)).toBeVisible({ timeout: 60000 });
    logger.info('Member flow stayed on the onboarding route');
  });
});
