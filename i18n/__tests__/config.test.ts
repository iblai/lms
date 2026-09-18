import { describe, it, expect } from 'vitest';
import { DEFAULT_LOCALE, LOCALE_LABELS, SUPPORTED_LOCALES, resolveLocale } from '../config';

describe('resolveLocale', () => {
  it('falls back to the default locale when nothing is set', () => {
    expect(resolveLocale(undefined)).toBe(DEFAULT_LOCALE);
    expect(resolveLocale(null)).toBe(DEFAULT_LOCALE);
    expect(resolveLocale('')).toBe(DEFAULT_LOCALE);
  });

  it('passes through an exactly supported locale', () => {
    expect(resolveLocale('en')).toBe('en');
    expect(resolveLocale('fr')).toBe('fr');
  });

  it('normalizes region subtags so Open edX codes resolve', () => {
    // The shared `openedx-language-preference` cookie carries codes like
    // `fr-FR` and `en_US`; both must narrow to a supported base locale.
    expect(resolveLocale('fr-FR')).toBe('fr');
    expect(resolveLocale('fr_CA')).toBe('fr');
    expect(resolveLocale('en-GB')).toBe('en');
  });

  it('is case- and whitespace-insensitive', () => {
    expect(resolveLocale('FR')).toBe('fr');
    expect(resolveLocale('  fr-fr  ')).toBe('fr');
  });

  it('falls back to the default for a locale this app does not ship', () => {
    expect(resolveLocale('de')).toBe(DEFAULT_LOCALE);
    expect(resolveLocale('zh-Hans')).toBe(DEFAULT_LOCALE);
    expect(resolveLocale('not-a-locale')).toBe(DEFAULT_LOCALE);
  });
});

describe('locale metadata', () => {
  it('labels every supported locale', () => {
    for (const locale of SUPPORTED_LOCALES) {
      expect(LOCALE_LABELS[locale]).toBeTruthy();
    }
    expect(Object.keys(LOCALE_LABELS).sort()).toEqual([...SUPPORTED_LOCALES].sort());
  });

  it('ships a catalog for every supported locale with identical keys', async () => {
    const catalogs = await Promise.all(
      SUPPORTED_LOCALES.map(
        async (locale) => (await import(`../../messages/${locale}.json`)).default,
      ),
    );
    const [first, ...rest] = catalogs.map((c) => JSON.stringify(Object.keys(c.Sidebar).sort()));
    for (const other of rest) expect(other).toBe(first);
  });
});
