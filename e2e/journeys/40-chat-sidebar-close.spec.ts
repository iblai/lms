import { test, expect, type Page } from '@playwright/test';
import { logger } from '@iblai/iblai-js/playwright';
import { getCurrentTenant, gotoTenantPage, waitForAppShell } from '../utils/navigation';

/**
 * Journey 40: Chat Sidebar Close
 *
 * The "Open chat assistant" launcher opens the tenant's default agent in a
 * sidebar through the `agent-ai` web component, with `showclosebutton` set so
 * the mentor renders its own Close (X) button. That button lives inside the
 * mentor iframe: it posts `{ closeEmbed: true, collapseSidebarCopilot: true }`
 * to the host, and the host is the one that hides the sidebar and brings the
 * launcher back. The component never hides itself, so a host that stops
 * listening leaves a close button that does nothing.
 */

const launcher = (page: Page) => page.getByRole('button', { name: 'Open chat assistant' });
const panel = (page: Page) => page.getByTestId('chat-panel');
const agent = (page: Page) => panel(page).locator('agent-ai');
const embedFrame = (page: Page) => panel(page).locator('agent-ai iframe').contentFrame();

async function openChatSidebar(page: Page): Promise<boolean> {
  await gotoTenantPage(page, 'home', { timeout: 120_000 });
  await waitForAppShell(page);

  const available = await launcher(page)
    .waitFor({ state: 'visible', timeout: 120_000 })
    .then(() => true)
    .catch(() => false);
  if (!available) return false;

  await launcher(page).click();
  await expect(panel(page)).toBeVisible({ timeout: 30_000 });
  return true;
}

test.describe('Journey 40: Chat Sidebar Close', () => {
  test.setTimeout(300_000);

  test('CP-1/CP-2: user opens the chat sidebar and it embeds the tenant agent with the close button enabled', async ({
    page,
  }) => {
    const tenant = await getCurrentTenant(page);
    if (!(await openChatSidebar(page))) {
      logger.info('Chat launcher not shown on this tenant (mentor sidebar hidden) — skipping');
      test.skip();
      return;
    }

    await expect(launcher(page)).toBeHidden();
    await expect(agent(page)).toHaveCount(1);
    await expect(agent(page)).toHaveAttribute('showclosebutton', '');
    await expect(agent(page)).toHaveAttribute('tenant', tenant);
    await expect(agent(page)).toHaveAttribute('mentor', /.+/, { timeout: 60_000 });

    const mentor = (await agent(page).getAttribute('mentor')) as string;
    const iframe = panel(page).locator('agent-ai iframe');
    // agent-ai joins the path as `/platform/<tenant>//<mentor>/`.
    await expect(iframe).toHaveAttribute(
      'src',
      new RegExp(`/platform/${tenant}/+${mentor}(/|\\?)`),
      { timeout: 60_000 },
    );
    await expect(iframe).toHaveAttribute('src', /[?&]show-close-button=true(&|$)/);
    logger.info(`Chat sidebar embeds agent ${mentor} on tenant ${tenant}`);
  });

  test('CP-3/CP-4: user closes the chat sidebar from the agent close button and reopens the same agent', async ({
    page,
  }) => {
    if (!(await openChatSidebar(page))) {
      logger.info('Chat launcher not shown on this tenant (mentor sidebar hidden) — skipping');
      test.skip();
      return;
    }

    await expect(agent(page)).toHaveAttribute('mentor', /.+/, { timeout: 60_000 });
    const mentor = (await agent(page).getAttribute('mentor')) as string;

    const closeButton = embedFrame(page).getByRole('button', { name: 'Close chat' });
    await expect(closeButton).toBeVisible({ timeout: 120_000 });
    await closeButton.click();

    await expect(panel(page)).toBeHidden({ timeout: 15_000 });
    await expect(launcher(page)).toBeVisible();

    // The sidebar is only hidden on close, so reopening shows the same agent
    // without remounting the embed.
    await launcher(page).click();
    await expect(panel(page)).toBeVisible();
    await expect(agent(page)).toHaveAttribute('mentor', mentor);
    await expect(embedFrame(page).getByRole('button', { name: 'Close chat' })).toBeVisible({
      timeout: 60_000,
    });
  });
});
