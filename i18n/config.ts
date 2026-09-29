/**
 * Supported UI locales for the LMS.
 * - `en` English
 * - `fr` French
 *
 * Mirrors `os`'s `i18n/config.ts` deliberately: the two apps share the
 * cross-subdomain language cookie below, so their locale vocabularies have to
 * agree. Adding a locale here means adding `messages/<locale>.json` — CI
 * (`scripts/validate-i18n.mjs`) fails the build if the catalogs drift.
 */
export const SUPPORTED_LOCALES = ['en', 'fr'] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'en';

/** Cookie used to persist the user's selected language (no URL routing). */
export const LOCALE_COOKIE = 'NEXT_LOCALE';

/**
 * Shared Open edX language-preference cookie. Set on the registrable parent
 * domain (e.g. `.iblai.app`) so the selected language is synced across all
 * subdomain apps (auth, learn, mentor, …). Reading it here is what lets a
 * language chosen in any other IBL app carry into the LMS.
 */
export const OPENEDX_LOCALE_COOKIE = 'openedx-language-preference';

/** Human-readable labels for the language selector. */
export const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  fr: 'Français',
};

/**
 * Narrow an arbitrary string to a supported locale, falling back to default.
 * Normalizes region/script subtags so Open edX codes resolve too, e.g.
 * `fr-FR`/`fr_CA` → `fr`, `en-US` → `en`.
 */
export function resolveLocale(value: string | undefined | null): Locale {
  if (!value) return DEFAULT_LOCALE;
  const v = value.toLowerCase().trim();
  const supported = SUPPORTED_LOCALES as readonly string[];
  if (supported.includes(v)) return v as Locale;
  const base = v.split(/[-_]/)[0];
  if (supported.includes(base)) return base as Locale;
  return DEFAULT_LOCALE;
}
