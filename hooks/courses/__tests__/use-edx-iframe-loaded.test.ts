import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createElement, Fragment, type ReactNode } from 'react';
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

  it('catches a load that lands between render and the effect subscribing', () => {
    vi.useFakeTimers();
    // Renders after the hook but before its effect runs, so the event is
    // dispatched with no listener attached yet — only the module flag survives.
    function LoadDuringRender() {
      markEdxIframeLoaded();
      return null;
    }
    const wrapper = ({ children }: { children: ReactNode }) =>
      createElement(Fragment, null, children, createElement(LoadDuringRender));

    const { result } = renderHook(() => useEdxIframeLoaded(), { wrapper });

    expect(result.current).toBe(true);
    // Latched from the flag alone: no fallback timer was ever scheduled.
    expect(vi.getTimerCount()).toBe(0);
  });
});
