import '@testing-library/jest-dom';
import { vi } from 'vitest';

// jsdom: matchMedia (useIsMobile, embla-carousel, etc.)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  configurable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// jsdom: scrollIntoView (cmdk, profile-tabs, etc.)
Element.prototype.scrollIntoView = vi.fn() as typeof Element.prototype.scrollIntoView;

// jsdom: IntersectionObserver (embla-carousel, etc.)
globalThis.IntersectionObserver = class IntersectionObserver {
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
} as unknown as typeof IntersectionObserver;

// Mock localStorage for tests that need it
class LocalStorageMock implements Storage {
  private store: Record<string, string> = {};

  get length(): number {
    return Object.keys(this.store).length;
  }

  clear(): void {
    this.store = {};
  }

  getItem(key: string): string | null {
    return this.store[key] ?? null;
  }

  key(index: number): string | null {
    return Object.keys(this.store)[index] ?? null;
  }

  removeItem(key: string): void {
    delete this.store[key];
  }

  setItem(key: string, value: string): void {
    this.store[key] = value;
  }
}

Object.defineProperty(window, 'localStorage', {
  value: new LocalStorageMock(),
  writable: true,
});

// Mock ResizeObserver
if (typeof global.ResizeObserver === 'undefined') {
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

// next-intl: `NextIntlClientProvider` is mounted in the root layout, which unit
// tests never render — so `useTranslations` would throw in every component test.
// Resolve against the real `messages/en.json` instead of a passthrough stub, so
// assertions keep matching the strings a user actually sees and a key that is
// missing from the catalog fails the test loudly rather than silently rendering
// its own name.
vi.mock('next-intl', async (importOriginal) => {
  const actual = await importOriginal<typeof import('next-intl')>();
  const messages = (await import('../messages/en.json')).default as Record<
    string,
    Record<string, string>
  >;

  return {
    ...actual,
    useTranslations: (namespace?: string) => {
      const dict = namespace ? (messages[namespace] ?? {}) : {};
      return (key: string) => {
        const value = dict[key];
        if (value === undefined) {
          throw new Error(
            `Missing message: ${namespace ? `${namespace}.` : ''}${key} (messages/en.json)`,
          );
        }
        return value;
      };
    },
  };
});
