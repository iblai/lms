import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useIsMobile } from '../use-mobile';

describe('useIsMobile', () => {
  let matchMediaListeners: Record<string, Function>;
  let mockMatchMedia: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    matchMediaListeners = {};
    mockMatchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn((event: string, handler: Function) => {
        matchMediaListeners[event] = handler;
      }),
      removeEventListener: vi.fn(),
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: mockMatchMedia,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns false when window width is >= 768', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, value: 1024 });

    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
  });

  it('returns true when window width is < 768', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, value: 500 });

    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
  });

  it('initially returns false (coerced from undefined)', () => {
    // Before useEffect runs, isMobile is undefined, !!undefined = false
    Object.defineProperty(window, 'innerWidth', { writable: true, value: 500 });
    const { result } = renderHook(() => useIsMobile());
    // After effect, should be true
    expect(result.current).toBe(true);
  });

  it('calls matchMedia with correct query', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, value: 1024 });
    renderHook(() => useIsMobile());
    expect(mockMatchMedia).toHaveBeenCalledWith('(max-width: 767px)');
  });

  it('cleans up event listener on unmount', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, value: 1024 });
    const mockRemove = vi.fn();
    mockMatchMedia.mockImplementation((query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: mockRemove,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const { unmount } = renderHook(() => useIsMobile());
    unmount();

    expect(mockRemove).toHaveBeenCalledWith('change', expect.any(Function));
  });
});
