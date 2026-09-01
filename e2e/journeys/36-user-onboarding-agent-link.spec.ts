import { test, expect } from '@playwright/test';
import { logger } from '@iblai/iblai-js/playwright';
import { gotoTenantPage } from '../utils/navigation';

/**
 * Journey 36: User Onboarding — Per-Agent Links
 *
 * Covers the agent-scoped onboarding route
 * `/platform/<tenant>/onboarding/<agent-id>`
 * (app/platform/[tenant]/onboarding/[agentId]/page.tsx), the route behind the
 * link an admin copies out of the admin panel's Onboarding tab.
 *
 * A tenant may configure several onboarding agents. They are not a sequence —
 * a member meets exactly one, chosen by the id in the link they arrive through,
 * so a tenant can point different audiences at different onboardings. Arriving
 * at the plain `/onboarding` route instead gets the first agent configured.
 *
 * Two rules carry the feature, and both are asserted here without depending on
 * what this tenant happens to have configured:
 *
 *   - An id naming a configured agent opens THAT agent.
 *   - An id naming none opens the "nothing set up" notice, never a different
 *     agent — a link aimed at one audience must not silently open another's.
 *
 * The second is checkable anywhere, since no tenant configures the nonsense id
 * used below. The first is checked by discovering the tenant's own default
 * agent from the plain route and then asking for it by name; on a tenant with
 * no onboarding configured there is nothing to discover, and those checkpoints
 * report that and pass rather than asserting a fiction.
 *
 *  1. The agent route serves the member flow, never an error page
 *  2. An unknown agent id shows the notice rather than another agent
 *  3. The tenant's default agent is reachable by its own link
 *  4. The agent route never shows the admin setup steps
 *  5. An admin can still switch to the setup flow from an agent link
 */
test.describe('Journey 36: User Onboarding — Per-Agent Links', () => {
  test.setTimeout(200000);

  type Page = import('@playwright/test').Page;

  /**
   * An id no tenant can have configured, so the "unknown agent" path is
   * reachable on any environment. Fixed rather than random to keep a failing
   * run reproducible from its trace.
   */
  const UNKNOWN_AGENT_ID = 'e2e-no-such-onboarding-agent';

  // The setup flow's first step, matched on the input id rather than its label
  // so the assertion does not ride on the UI language.
  const adminFirstStep = (page: Page) => page.locator('#onboarding-org-name');

  const agentStep = (page: Page) => page.getByTestId('user-onboarding-agent-step');
  const emptyNotice = (page: Page) => page.getByTestId('user-onboarding-empty');

  /** Whatever the member flow can put on screen for a given agent. */
  const memberFlow = (page: Page) =>
    page.getByTestId('onboarding-navbar-header').or(agentStep(page)).or(emptyNotice(page)).first();

  /**
   * Whether this session is an admin. Read from the stored tenant — the same
   * `is_admin` flag `useIsAdmin()` resolves the flow from.
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

  /** Land on an onboarding route and wait for whichever flow it serves. */
  async function gotoOnboarding(page: Page, subpath = '') {
    await gotoTenantPage(page, `onboarding${subpath}`, { timeout: 120000 });
    await expect(page.getByTestId('onboarding-page')).toBeVisible({ timeout: 120000 });
    await expect(memberFlow(page).or(adminFirstStep(page)).first()).toBeVisible({
      timeout: 120000,
    });
  }

  /**
   * The agent id the tenant's onboarding actually hands over, read off the
   * embedded `agent-ai` element — the SDK sets `mentor` to the configured
   * agent's `unique_id`. Null when this tenant configures no onboarding agent,
   * or when the flow opens on questions before reaching the agent step.
   */
  async function discoverDefaultAgentId(page: Page): Promise<string | null> {
    await gotoOnboarding(page, '?flow=user');
    if (
      !(await agentStep(page)
        .isVisible()
        .catch(() => false))
    )
      return null;
    return page.locator('agent-ai').first().getAttribute('mentor');
  }

  test('Checkpoint 1: The agent route serves the member flow', async ({ page }) => {
    await gotoOnboarding(page, `/${UNKNOWN_AGENT_ID}`);

    // The route resolves and renders the wizard — not a 404, not a blank shell.
    await expect(page.getByTestId('onboarding-page')).toBeVisible({ timeout: 60000 });
    await expect(memberFlow(page)).toBeVisible({ timeout: 60000 });
    // ...and it holds the route rather than bouncing the member to /home.
    await expect(page).toHaveURL(new RegExp(`/onboarding/${UNKNOWN_AGENT_ID}`), {
      timeout: 60000,
    });
    logger.info('Agent-scoped onboarding route served the member flow');
  });

  test('Checkpoint 2: An unknown agent id shows the notice, not another agent', async ({
    page,
  }) => {
    await gotoOnboarding(page, `/${UNKNOWN_AGENT_ID}`);

    // The whole point of the per-agent link: an id this tenant does not
    // onboard with must not fall through to whichever agent is first.
    await expect(emptyNotice(page)).toBeVisible({ timeout: 60000 });
    await expect(agentStep(page)).toHaveCount(0);
    logger.info('Unknown agent id resolved to the notice rather than a substitute agent');
  });

  test('Checkpoint 3: The tenant default agent is reachable by its own link', async ({ page }) => {
    const agentId = await discoverDefaultAgentId(page);

    if (!agentId) {
      logger.info('Tenant configures no onboarding agent — no link to follow');
      return;
    }

    // Asking for the agent by name opens the same agent the plain route does.
    await gotoOnboarding(page, `/${encodeURIComponent(agentId)}`);
    await expect(agentStep(page)).toBeVisible({ timeout: 60000 });
    await expect(page.locator('agent-ai').first()).toHaveAttribute('mentor', agentId, {
      timeout: 60000,
    });
    await expect(emptyNotice(page)).toHaveCount(0);
    logger.info(`Configured agent ${agentId} opened from its own link`);
  });

  test('Checkpoint 4: The agent route never shows the admin setup steps', async ({ page }) => {
    // An agent link is a member-flow link by construction, so even an admin
    // following one sees what that audience gets, not their own first-run setup.
    await gotoOnboarding(page, `/${UNKNOWN_AGENT_ID}`);

    await expect(adminFirstStep(page)).toHaveCount(0);
    await expect(page.getByRole('heading', { name: /Welcome to/i })).toHaveCount(0);
    await expect(page.getByRole('heading', { name: /Invite your team/i })).toHaveCount(0);
    logger.info('Agent route confirmed free of the admin setup steps');
  });

  test('Checkpoint 5: An admin can still switch to the setup flow from an agent link', async ({
    page,
  }) => {
    await gotoOnboarding(page, `/${UNKNOWN_AGENT_ID}?flow=admin`);

    if (!(await isAdminSession(page))) {
      // `flow=admin` is an admin's word; a member asking for it on an agent
      // link still gets the member flow.
      await expect(memberFlow(page)).toBeVisible({ timeout: 60000 });
      await expect(adminFirstStep(page)).toHaveCount(0);
      logger.info('Member session ignored the flow param on an agent link, as it must');
      return;
    }

    // The agent id only defaults the flow; an explicit switch is a decision and
    // still wins.
    await expect(adminFirstStep(page)).toBeVisible({ timeout: 60000 });
    logger.info('Admin switched to the setup flow from an agent link');
  });
});
