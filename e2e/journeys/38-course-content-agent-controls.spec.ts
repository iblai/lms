import { test, expect } from '@playwright/test';
import { logger } from '@iblai/iblai-js/playwright';

import {
  agentChatFrame,
  openAgentTab,
  openCourseContent,
  openMobileCourseControls,
  waitForAgentChatReady,
} from '../utils/course-content-helpers';

/**
 * Journey 38: Course Content — Agent Tab Controls
 *
 * The course-content header carries four controls that only make sense on the
 * Agent tab, portalled into the navbar on md+ and collapsed into a single
 * 3-dot popover below that breakpoint:
 *
 *   • Autoplay      — speaks the agent's replies; tenant + course gated
 *   • Media         — the current unit's PDF / video / catalog blocks
 *   • Fullscreen    — expands the agent chat over the whole viewport
 *   • Learn/Assess  — only when the unit embeds a mentor xblock
 *
 * Every one of them is conditional, so each checkpoint probes for its control
 * and skips when the tenant/course/unit doesn't surface it. That is deliberate:
 * a hard failure here would mean "this tenant's course has no PDF", not "the
 * media dropdown is broken".
 *
 *  1. Agent tab is reachable and the chat frame mounts
 *  2. Fullscreen toggle expands the agent and the exit control returns
 *  3. Fullscreen control is absent on the Course tab
 *  4. Autoplay toggle flips state and confirms with a toast
 *  5. Autoplay state is reflected on the control's accessible name
 *  6. Media dropdown lists the current unit's media blocks
 *  7. Selecting a media block opens the preview dialog on the Agent tab
 *  8. Learn/Assess switch flips the agent mode
 *  9. New chat control is available once the agent has rendered
 * 10. Mobile viewport collapses the controls into the 3-dot popover
 */
test.describe('Journey 38: Course Content — Agent Tab Controls', () => {
  test.setTimeout(300_000);

  test('Checkpoint 1: Agent tab is reachable and the chat frame mounts', async ({ page }) => {
    if (!(await openCourseContent(page))) {
      logger.info('No accessible enrolled course — skipping');
      test.skip();
      return;
    }
    if (!(await openAgentTab(page))) {
      logger.info('Course has no Agent tab — skipping');
      test.skip();
      return;
    }

    expect(page.url()).toContain('/agent');
    const ready = await waitForAgentChatReady(page);
    expect(ready, 'agent chat iframe should render').toBe(true);
    logger.info('Agent tab mounted with its chat frame');
  });

  test('Checkpoint 2: Fullscreen toggle expands the agent and exits again', async ({ page }) => {
    if (!(await openCourseContent(page)) || !(await openAgentTab(page))) {
      test.skip();
      return;
    }

    const enter = page.getByTestId('agent-fullscreen-toggle');
    if (!(await enter.isVisible({ timeout: 30_000 }).catch(() => false))) {
      logger.info('Fullscreen control not rendered (narrow viewport?) — skipping');
      test.skip();
      return;
    }

    await expect(enter).toHaveAttribute('aria-label', 'Enter fullscreen');
    await enter.click();

    const exit = page.getByTestId('agent-fullscreen-exit');
    await expect(exit).toBeVisible({ timeout: 30_000 });
    await expect(exit).toHaveAttribute('aria-label', 'Exit fullscreen');
    logger.info('Agent entered fullscreen');

    await exit.click();
    await expect(exit).toBeHidden({ timeout: 30_000 });
    await expect(enter).toBeVisible({ timeout: 30_000 });
    logger.info('Agent exited fullscreen');
  });

  test('Checkpoint 3: Fullscreen control is absent on the Course tab', async ({ page }) => {
    if (!(await openCourseContent(page))) {
      test.skip();
      return;
    }

    const courseTab = page.getByRole('link', { name: 'Course', exact: true }).first();
    if (!(await courseTab.isVisible({ timeout: 20_000 }).catch(() => false))) {
      logger.info('Course has no Course tab — skipping');
      test.skip();
      return;
    }

    await courseTab.click();
    await page.waitForURL(/\/course(\?|$)/, { timeout: 60_000 }).catch(() => undefined);
    // fullscreenToggleVisible is `currentTab === 'agent'`, so it must go away.
    await expect(page.getByTestId('agent-fullscreen-toggle')).toBeHidden({ timeout: 30_000 });
    logger.info('Fullscreen control is agent-only');
  });

  test('Checkpoint 4: Autoplay toggle flips state and confirms with a toast', async ({ page }) => {
    if (!(await openCourseContent(page)) || !(await openAgentTab(page))) {
      test.skip();
      return;
    }

    const autoplay = page.getByTestId('agent-autoplay-toggle');
    if (!(await autoplay.isVisible({ timeout: 30_000 }).catch(() => false))) {
      logger.info('Autoplay is off for this tenant/course — skipping');
      test.skip();
      return;
    }

    const before = await autoplay.getAttribute('aria-checked');
    await autoplay.click();

    // setAgentAutoplay toasts on every change.
    await expect(page.getByText(/Autoplay turned (on|off)/i).first()).toBeVisible({
      timeout: 20_000,
    });
    await expect(autoplay).not.toHaveAttribute('aria-checked', before || 'false');
    logger.info(`Autoplay flipped from aria-checked=${before}`);

    // And back, so the checkpoint leaves no state behind.
    await autoplay.click();
    await expect(autoplay).toHaveAttribute('aria-checked', before || 'false');
  });

  test('Checkpoint 5: Autoplay state is reflected on the accessible name', async ({ page }) => {
    if (!(await openCourseContent(page)) || !(await openAgentTab(page))) {
      test.skip();
      return;
    }

    const autoplay = page.getByTestId('agent-autoplay-toggle');
    if (!(await autoplay.isVisible({ timeout: 30_000 }).catch(() => false))) {
      logger.info('Autoplay is off for this tenant/course — skipping');
      test.skip();
      return;
    }

    await expect(autoplay).toHaveRole('switch');
    const checked = (await autoplay.getAttribute('aria-checked')) === 'true';
    await expect(autoplay).toHaveAttribute(
      'aria-label',
      checked ? 'Disable agent autoplay' : 'Enable agent autoplay',
    );
    await expect(autoplay).toHaveAttribute('title', checked ? 'Autoplay on' : 'Autoplay off');
    logger.info('Autoplay label matches its state');
  });

  test('Checkpoint 6: Media dropdown lists the current unit media blocks', async ({ page }) => {
    if (!(await openCourseContent(page)) || !(await openAgentTab(page))) {
      test.skip();
      return;
    }

    const trigger = page.getByTestId('course-media-dropdown-trigger');
    if (!(await trigger.isVisible({ timeout: 30_000 }).catch(() => false))) {
      logger.info('Current unit has no media blocks — skipping');
      test.skip();
      return;
    }

    await expect(trigger).toHaveAttribute('aria-label', 'Unit media');
    await trigger.click();

    const items = page.getByTestId('course-media-dropdown-item');
    await expect(items.first()).toBeVisible({ timeout: 20_000 });
    const count = await items.count();
    expect(count).toBeGreaterThan(0);
    logger.info(`Media dropdown lists ${count} block(s)`);

    await page.keyboard.press('Escape');
  });

  test('Checkpoint 7: Selecting a media block opens the preview dialog', async ({ page }) => {
    if (!(await openCourseContent(page)) || !(await openAgentTab(page))) {
      test.skip();
      return;
    }

    const trigger = page.getByTestId('course-media-dropdown-trigger');
    if (!(await trigger.isVisible({ timeout: 30_000 }).catch(() => false))) {
      logger.info('Current unit has no media blocks — skipping');
      test.skip();
      return;
    }

    await trigger.click();
    await page.getByTestId('course-media-dropdown-item').first().click();

    // On the agent tab a block with a student view opens the preview; one
    // without toasts instead. Both are correct, so accept either.
    const preview = page.getByTestId('course-media-preview');
    const noPreviewToast = page.getByText('This resource has no preview available');
    await expect(preview.or(noPreviewToast).first()).toBeVisible({ timeout: 30_000 });

    if (await preview.isVisible().catch(() => false)) {
      await expect(preview.locator('iframe')).toBeVisible({ timeout: 30_000 });
      logger.info('Media preview dialog opened with its iframe');
      await page.keyboard.press('Escape');
      await expect(preview).toBeHidden({ timeout: 20_000 });
    } else {
      logger.info('Selected block has no preview — toast shown instead');
    }
  });

  test('Checkpoint 8: Learn/Assess switch flips the agent mode', async ({ page }) => {
    if (!(await openCourseContent(page)) || !(await openAgentTab(page))) {
      test.skip();
      return;
    }

    const modeSwitch = page.getByRole('switch', { name: 'Toggle assessment mode' }).first();
    if (!(await modeSwitch.isVisible({ timeout: 30_000 }).catch(() => false))) {
      logger.info('Unit has no mentor xblock — Learn/Assess hidden, skipping');
      test.skip();
      return;
    }

    // A first-visit hint popover anchors to the same control; dismiss it so it
    // can't swallow the click.
    const gotIt = page.getByRole('button', { name: 'Got it' });
    if (await gotIt.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await gotIt.click();
    }

    const before = await modeSwitch.getAttribute('aria-checked');
    await modeSwitch.click();
    await expect(modeSwitch).not.toHaveAttribute('aria-checked', before || 'false');
    logger.info(`Agent mode switched from aria-checked=${before}`);

    await modeSwitch.click();
    await expect(modeSwitch).toHaveAttribute('aria-checked', before || 'false');
  });

  test('Checkpoint 9: New chat control is available once the agent renders', async ({ page }) => {
    if (!(await openCourseContent(page)) || !(await openAgentTab(page))) {
      test.skip();
      return;
    }
    if (!(await waitForAgentChatReady(page))) {
      logger.info('Agent chat frame never rendered — skipping');
      test.skip();
      return;
    }

    // Only rendered once the mentor's own loading spinner has gone.
    const newChat = page.getByRole('button', { name: 'New chat' });
    if (!(await newChat.isVisible({ timeout: 60_000 }).catch(() => false))) {
      logger.info('Agent still loading — New chat not surfaced, skipping');
      test.skip();
      return;
    }

    await newChat.click();
    // The reset happens inside the mentor iframe; assert the host stayed put
    // and the frame is still live rather than reaching across the boundary.
    expect(page.url()).toContain('/agent');
    await expect(agentChatFrame(page).locator('body')).toBeVisible({ timeout: 30_000 });
    logger.info('New chat dispatched without navigating away');
  });

  test('Checkpoint 10: Mobile viewport collapses controls into the 3-dot popover', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 480, height: 900 });

    if (!(await openCourseContent(page)) || !(await openAgentTab(page))) {
      test.skip();
      return;
    }

    if (!(await openMobileCourseControls(page))) {
      logger.info('No course controls for this unit — skipping');
      test.skip();
      return;
    }

    // At least one of the four controls must be inside the popover; which ones
    // depends on the unit, so accept any.
    const autoplay = page.getByTestId('agent-autoplay-popover-switch');
    const fullscreen = page.getByTestId('agent-fullscreen-popover-button');
    const media = page.getByTestId('course-media-menu-item').first();
    await expect(autoplay.or(fullscreen).or(media).first()).toBeVisible({ timeout: 30_000 });
    logger.info('Mobile course-controls popover renders its controls');

    // The desktop inline controls must be hidden at this width.
    await expect(page.getByTestId('agent-fullscreen-toggle')).toBeHidden({ timeout: 20_000 });
  });
});
