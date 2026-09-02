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

// Per-tab authStorage passthrough for `vi.mock('@iblai/iblai-js/web-utils')`
// factories. skillsai now imports getAuthItem/setAuthItem/removeAuthItem/
// clearPerTabSession/isPerTabAuthEnabled from the SDK; the many hand-listed
// web-utils mocks would otherwise throw "No <fn> export is defined on the mock"
// wherever that code runs. This object reproduces the flag-OFF behavior (plain
// localStorage passthrough). Factories spread it first, so any explicit
// per-test override still wins. Exposed as a runtime global because a hoisted
// vi.mock factory cannot reference a module-level import.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).__iblAuthStorageMock = {
  getAuthItem: (key: string) => window.localStorage.getItem(key),
  setAuthItem: (key: string, value: string) => window.localStorage.setItem(key, value),
  removeAuthItem: (key: string) => window.localStorage.removeItem(key),
  clearPerTabSession: () => {},
  isPerTabAuthEnabled: () => false,
};

// Mock ResizeObserver
if (typeof global.ResizeObserver === 'undefined') {
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}
