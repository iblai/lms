import { config } from '@/lib/config';

export type StudioView = 'courses' | 'programs';

export const studioBasePath = (tenant: string) => `/platform/${tenant}/studio`;

export const studioCoursePath = (tenant: string, courseKey: string, section = 'details') =>
  `${studioBasePath(tenant)}/courses/${encodeURIComponent(courseKey)}/${section}`;

/** Studio's own page for a course (outline, units, xblocks) — what the Outline section embeds. */
export const studioAuthoringUrl = (courseKey: string) =>
  `${config.urls.studioUrl()}/course/${courseKey}`;

/**
 * The edX SSO login view: signs the browser into edX with a one-time code and
 * redirects to `redirectUrl`. Studio has no IBL sign-in of its own, so an
 * embedded Studio page is always entered through this.
 */
export const edxSsoLoginUrl = (code: string, redirectUrl: string) =>
  `${config.urls.legacyLmsUrl()}/ibl/ai/sso/backend/edx/login?code=${encodeURIComponent(
    code,
  )}&redirect_url=${encodeURIComponent(redirectUrl)}`;

/** A program ID derived from its name: lowercase letters, digits and hyphens. */
export const programIdFromName = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);

export const isValidProgramId = (programId: string) => /^[A-Za-z0-9_-]+$/.test(programId);

/** `2026-06-19T19:28:12Z` → `2026-06-19` for a date input; empty when unset. */
export const toDateInputValue = (value: unknown) =>
  typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value) ? value.slice(0, 10) : '';

/**
 * A date input value back to the ISO timestamp the settings endpoint stores.
 * The original timestamp is kept when the day is unchanged, so saving an
 * untouched form never shifts a course's start time to midnight.
 */
export const fromDateInputValue = (value: string, original: unknown) => {
  if (!value) return null;
  if (typeof original === 'string' && original.slice(0, 10) === value) return original;
  return `${value}T00:00:00Z`;
};

const siteOf = (hostname: string) => hostname.split('.').slice(-2).join('.');

/**
 * Whether two URLs share a site (`skillsai.iblai.org` and
 * `apps.learn.iblai.org` do, `localhost` and either do not). Browsers withhold
 * cookies and storage from a cross-site frame, which the embedded Studio needs
 * for its edX session.
 */
export const isSameSite = (url: string, otherUrl: string) => {
  try {
    return siteOf(new URL(url).hostname) === siteOf(new URL(otherUrl).hostname);
  } catch {
    return false;
  }
};
