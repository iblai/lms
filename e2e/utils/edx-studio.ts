/**
 * Open edX session + Studio course-outline helpers for the course Authoring link.
 *
 * The suite's storage state signs into the IBL auth host only. The course
 * page reaches edX through a one-time SSO token that renders the unit inside
 * the hidden course iframe without leaving a browser session behind, so in a
 * fresh context the Authoring link lands on the edX sign-in page. The same SSO
 * backend has a top-level login endpoint that takes such a token and starts a
 * real LMS session; Studio then signs in through the LMS over OAuth2 on its own.
 *
 * The token is minted by replaying the app's own token request (URL and
 * authorization header, captured off the page) with Studio as the redirect
 * target, so the tests need no LMS host or credential configuration of their own.
 *
 * The outline helpers drive Studio's legacy course-outline page: sections hold
 * subsections, subsections hold units, every row has an "Actions" menu
 * (Configure / Duplicate / Delete …), and a unit with unpublished changes
 * grows a "Publish" control that opens a confirmation dialog.
 */
import {
  expect,
  type BrowserContext,
  type Locator,
  type Page,
  type Response,
} from '@playwright/test';

const SSO_TOKEN_PATH = '/ibl/ai/sso/backend/edx/sso-auth-token/generate';
const SSO_LOGIN_PATH = '/ibl/ai/sso/backend/edx/login';

export type CapturedSsoTokenRequest = {
  /** Full URL of the app's own token request, `username` and `redirect_url` included. */
  url: string;
  authorization: string;
};

/**
 * Remember the app's own SSO token request. It is sent whenever the course
 * page builds the hidden edX iframe, so attach before opening the course.
 */
export function trackEdxSsoToken(page: Page) {
  let latest: CapturedSsoTokenRequest | null = null;

  const capture = async (response: Response): Promise<CapturedSsoTokenRequest | null> => {
    if (!response.url().includes(SSO_TOKEN_PATH) || !response.ok()) return null;
    const headers = await response.request().allHeaders();
    latest = { url: response.url(), authorization: headers['authorization'] ?? '' };
    return latest;
  };

  page.on('response', (response) => {
    void capture(response).catch(() => undefined);
  });

  return {
    /** The latest capture, or the next successful token response when none has happened yet. */
    async current(timeout = 120_000): Promise<CapturedSsoTokenRequest> {
      if (latest) return latest;
      const response = await page.waitForResponse(
        (candidate) => candidate.url().includes(SSO_TOKEN_PATH) && candidate.ok(),
        { timeout },
      );
      const captured = await capture(response);
      if (!captured) throw new Error('the SSO token response could not be captured');
      return captured;
    },
  };
}

/**
 * Start an edX LMS session in `context` for the signed-in user, so Studio (and
 * any other LMS-authenticated page) opens without a sign-in prompt. Lands a
 * throwaway page on `redirectUrl` through the SSO login endpoint and closes it.
 */
export async function startEdxSession(
  context: BrowserContext,
  captured: CapturedSsoTokenRequest,
  redirectUrl: string,
): Promise<void> {
  const tokenUrl = new URL(captured.url);
  tokenUrl.searchParams.set('redirect_url', redirectUrl);
  const response = await context.request.get(tokenUrl.toString(), {
    headers: { authorization: captured.authorization },
  });
  expect(response.ok(), `minting an edX SSO token failed: ${response.status()}`).toBeTruthy();
  const token = (await response.json())?.sso_auth_token as string | undefined;
  expect(token, 'the SSO token response carried no sso_auth_token').toBeTruthy();

  const loginUrl = new URL(SSO_LOGIN_PATH, tokenUrl.origin);
  loginUrl.searchParams.set('code', token as string);
  loginUrl.searchParams.set('redirect_url', redirectUrl);

  const page = await context.newPage();
  try {
    await page.goto(loginUrl.toString(), { timeout: 120_000 });
    // The endpoint signs in and redirects; "Error" is the title of the page it
    // renders instead when the token was rejected.
    await expect(page).not.toHaveTitle(/^Error$/, { timeout: 30_000 });
  } finally {
    await page.close();
  }
}

// ── Studio course outline ───────────────────────────────────────────────────

/** Studio's course-outline URL for a course, as the Authoring link builds it. */
export const studioCourseUrl = (studioOrigin: string, courseId: string) =>
  `${studioOrigin.replace(/\/$/, '')}/course/${courseId}`;

export const studioUnits = (studio: Page): Locator => studio.locator('.outline-unit');

/** The edX usage key of an outline row — the same string the LMS outline uses as the unit id. */
export const studioUnitLocator = (unit: Locator) => unit.getAttribute('data-locator');

/**
 * Expand the first subsection of the first section if it is collapsed. Studio
 * renders a subsection's units only once it is open.
 */
export async function expandStudioSubsection(studio: Page): Promise<Locator> {
  const subsection = studio.locator('.outline-subsection').first();
  await expect(subsection).toBeVisible({ timeout: 60_000 });
  const collapsed = ((await subsection.getAttribute('class')) ?? '').includes('is-collapsed');
  if (collapsed) {
    // The header is one toggle, but its title doubles as an inline editor, so
    // aim for the caret.
    await subsection
      .locator('.subsection-header .ui-toggle-expansion > .icon.fa-caret-down')
      .click();
  }
  await expect(subsection).not.toHaveClass(/is-collapsed/, { timeout: 30_000 });
  await expect(studioUnits(studio).first()).toBeVisible({ timeout: 60_000 });
  return subsection;
}

/** Open a row's "Actions" (⋮) menu and pick an entry. */
async function pickStudioAction(row: Locator, action: string): Promise<void> {
  await row.getByRole('button', { name: 'Actions' }).click({ timeout: 15_000 });
  const entry = row.getByRole('button', { name: action, exact: true });
  await expect(entry).toBeVisible({ timeout: 10_000 });
  await entry.click({ timeout: 15_000 });
}

/**
 * Duplicate the last unit of the outline. Returns the new row, which Studio
 * appends after the original as "Duplicate of '<name>'" with its display-name
 * editor already open.
 */
export async function duplicateLastStudioUnit(studio: Page): Promise<Locator> {
  const units = studioUnits(studio);
  const before = await units.count();
  await pickStudioAction(units.last(), 'Duplicate');
  await expect(units).toHaveCount(before + 1, { timeout: 60_000 });
  const added = units.last();
  await expect(added.locator('a.unit-title')).toHaveText(/^Duplicate of/, { timeout: 30_000 });
  return added;
}

/** Rename a unit through its inline display-name editor and wait for the save. */
export async function renameStudioUnit(unit: Locator, name: string): Promise<void> {
  const editor = unit.locator('.wrapper-unit-title');
  if (!((await editor.getAttribute('class')) ?? '').includes('is-editing')) {
    await unit.getByRole('button', { name: 'Edit' }).click();
  }
  const input = unit.locator('input.incontext-editor-input');
  await expect(input).toBeVisible({ timeout: 10_000 });
  await input.fill(name);
  await input.press('Enter');
  await expect(unit.locator('a.unit-title')).toHaveText(name, { timeout: 30_000 });
  await expect(editor).not.toHaveClass(/is-editing/, { timeout: 30_000 });
  // The row re-renders once the save lands; acting on it before that races the
  // refresh. The "Saving" notification keeps its element around, so wait on its
  // shown state rather than its text.
  await expect(unit.page().locator('.wrapper-notification.is-shown')).toHaveCount(0, {
    timeout: 30_000,
  });
}

/** Publish a unit's pending changes through the outline's Publish control and its dialog. */
export async function publishStudioUnit(studio: Page, unit: Locator): Promise<void> {
  await unit.locator('a.publish-button').click();
  // The role=dialog wrapper has no box of its own, so visibility is judged on
  // the modal window inside it.
  const modal = studio.getByRole('dialog', { name: /^Publish / }).locator('.modal-window');
  await expect(modal).toBeVisible({ timeout: 15_000 });
  await expect(modal).toContainText('Publish all unpublished changes for this unit?');
  await modal.getByRole('link', { name: 'Publish', exact: true }).click();
  await expect(modal).toBeHidden({ timeout: 30_000 });
  await expect(unit).toHaveClass(/is-live/, { timeout: 60_000 });
  await expect(unit.locator('a.publish-button')).toHaveCount(0);
  await expect(unit.locator('.unit-status')).not.toContainText('Unpublished units');
}

/** A unit row by its edX usage key (`data-locator`). */
export const studioUnitByLocator = (studio: Page, locator: string): Locator =>
  studio.locator(`.outline-unit[data-locator="${locator}"]`);

/**
 * Delete a unit through its Actions menu and the "Delete this unit?" prompt.
 * No-op when the unit is already gone.
 */
export async function deleteStudioUnit(studio: Page, locator: string): Promise<void> {
  // A fresh outline: no half-open modal or menu left over from a failed step.
  await studio.goto(studio.url(), { timeout: 120_000 });
  await expandStudioSubsection(studio);
  const row = studioUnitByLocator(studio, locator);
  if ((await row.count()) === 0) return;
  const prompt = studio.locator('#prompt-warning');
  await pickStudioAction(row, 'Delete');
  const opened = await prompt
    .waitFor({ state: 'visible', timeout: 3_000 })
    .then(() => true)
    .catch(() => false);
  if (!opened) {
    // The row's drag-and-drop indicator overlays the menu's last entry, so a
    // pointer click on Delete lands on it instead; a dispatched click reaches
    // the handler.
    await row.locator('a.delete-button').dispatchEvent('click');
  }
  await expect(prompt).toBeVisible({ timeout: 15_000 });
  await expect(prompt).toContainText('Delete this unit?');
  await prompt.getByRole('button', { name: 'Yes, delete this unit' }).click();
  await expect(row).toHaveCount(0, { timeout: 60_000 });
}
