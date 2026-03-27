/**
 * Environment variables, URL constants, and data generators for SkillsAI E2E tests.
 */

// ── Host URLs ───────────────────────────────────────────────────────────────
export const SKILL_HOST = process.env.SKILLS_HOST || 'http://localhost:3000';
export const AUTH_HOST = process.env.AUTH_HOST || '';
export const MENTOR_NEXTJS_HOST = process.env.MENTOR_NEXTJS_HOST || '';
export const EMBED_URL = process.env.EMBED_URL || '';

// ── Auth credentials ────────────────────────────────────────────────────────
export const PLAYWRIGHT_USERNAME = process.env.PLAYWRIGHT_USERNAME || '';
export const PLAYWRIGHT_PASSWORD = process.env.PLAYWRIGHT_PASSWORD || '';
export const INVITE_USERNAME = process.env.INVITE_USERNAME || '';
export const INVITE_USER_PASSWORD = process.env.INVITE_USER_PASSWORD || '';

// ── Feature flags ───────────────────────────────────────────────────────────
export const AUTH_FLOW =
  (process.env.AUTH_FLOW as
    | 'username_password'
    | 'magic_link'
    | 'sso'
    | 'direct_sso') || 'username_password';

// ── URL lists for console-error checks ──────────────────────────────────────
export const skillsUrlsToTest = [
  '/home',
  '/discover',
  '/profile',
  '/profile/skills',
  '/profile/credentials',
  '/profile/pathways',
  '/profile/programs',
  '/profile/courses',
  '/recommended',
];

// ── Data generators ─────────────────────────────────────────────────────────
export function generateTestEmail(): string {
  return `test+${Date.now()}@ibleducation.com`;
}

export function generateTestPassword(): string {
  return 'test-password-e2e';
}

// ── Ignored console errors ──────────────────────────────────────────────────
export const IGNORED_CONSOLE_ERRORS: Array<string | RegExp> = [
  'There was an error setting cookie `_pk_testcookie_domain`',
  "Can't write cookie on domain",
  'downloadable font: download failed',
  'Download the React DevTools',
  "instances of 'styled-components'",
  'Cookie "_pk_testcookie_domain" has been rejected',
  'Warning: React does not recognize the `dataSlot` prop',
  'Layout was forced before the page was fully loaded',
  'does not have a proper "SameSite" attribute value',
  'matomo.js',
  'is registered more than once in "_paq"',
  "Couldn't process unknown directive 'require-trusted-types-for'",
  'youtube',
  'The resource from "https://drive.google.com',
  /A resource is blocked by OpaqueResponseBlocking/,
  /Failed to load resource/,
  /Intercom Messenger error/,
];

export function isIgnoredError(message: string): boolean {
  return IGNORED_CONSOLE_ERRORS.some((pattern) =>
    pattern instanceof RegExp ? pattern.test(message) : message.includes(pattern)
  );
}
