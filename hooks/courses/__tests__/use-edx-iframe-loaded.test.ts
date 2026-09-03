import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import {
  EDX_IFRAME_LOAD_FALLBACK_MS,
  hasEdxIframeLoaded,
  markEdxIframeLoaded,
  markEdxIframeUnloaded,
  useEdxIframeLoaded,
} from '../use-edx-iframe-loaded';

describe('useEdxIframeLoaded', () => {
  beforeEach(() => {
    markEdxIframeUnloaded();
  });

  afterEach(() => {
    markEdxIframeUnloaded();
    vi.useRealTimers();
  });

  it('starts false while no iframe has loaded', () => {
    const { result } = renderHook(() => useEdxIframeLoaded());
    expect(result.current).toBe(false);
  });

  it('turns true when the iframe reports a load', () => {
    const { result } = renderHook(() => useEdxIframeLoaded());

    act(() => {
      markEdxIframeLoaded();
    });

    expect(result.current).toBe(true);
    expect(hasEdxIframeLoaded()).toBe(true);
  });

  it('starts true when the load happened before the consumer mounted', () => {
    markEdxIframeLoaded();

    const { result } = renderHook(() => useEdxIframeLoaded());

    expect(result.current).toBe(true);
  });

  it('stays true after the iframe navigates, so consumers are not torn down', () => {
    const { result } = renderHook(() => useEdxIframeLoaded());

    act(() => {
      markEdxIframeLoaded();
    });
    act(() => {
      markEdxIframeUnloaded();
    });

    expect(result.current).toBe(true);
  });

  it('gives up waiting after the fallback timeout', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useEdxIframeLoaded());

    expect(result.current).toBe(false);

    act(() => {
      vi.advanceTimersByTime(EDX_IFRAME_LOAD_FALLBACK_MS);
    });

    expect(result.current).toBe(true);
  });

  it('does not leave the fallback timer running after unmount', () => {
    vi.useFakeTimers();
    const { unmount } = renderHook(() => useEdxIframeLoaded());
    unmount();

    expect(vi.getTimerCount()).toBe(0);
  });
});
