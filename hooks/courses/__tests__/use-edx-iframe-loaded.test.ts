import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createElement, Fragment, type ReactNode } from 'react';
import { act, renderHook } from '@testing-library/react';
import { config } from '@/lib/config';
import {
  EDX_CONTEXT_REQUEST_MESSAGE_TYPE,
  EDX_IFRAME_ID,
  EDX_IFRAME_LOAD_FALLBACK_MS,
  EDX_UNIT_LOADED_EVENT,
  getLoadedEdxUnitId,
  hasEdxIframeLoaded,
  isEdxUnitLoadedMessage,
  markEdxIframeLoaded,
  markEdxIframeUnloaded,
  markEdxUnitLoaded,
  requestEdxUnitContext,
  useEdxIframeLoaded,
  waitForEdxUnitLoaded,
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

describe('unit loaded signal', () => {
  beforeEach(() => {
    markEdxIframeUnloaded();
  });

  afterEach(() => {
    markEdxIframeUnloaded();
  });

  it("recognises the edX page's unit.loaded frame and nothing else", () => {
    expect(isEdxUnitLoadedMessage({ type: 'unit.loaded', usageId: 'unit-1' })).toBe(true);
    expect(
      isEdxUnitLoadedMessage({
        type: 'unit.loaded',
        usageId: 'unit-1',
        courseId: null,
        displayName: null,
      }),
    ).toBe(true);
    expect(isEdxUnitLoadedMessage({ type: 'unit.loaded', usageId: '' })).toBe(false);
    expect(isEdxUnitLoadedMessage({ type: 'unit.loaded' })).toBe(false);
    expect(isEdxUnitLoadedMessage({ type: 'context', usageId: 'unit-1' })).toBe(false);
    expect(isEdxUnitLoadedMessage('unit.loaded')).toBe(false);
    expect(isEdxUnitLoadedMessage(null)).toBe(false);
  });

  it('records the loaded unit and announces it', () => {
    const listener = vi.fn();
    window.addEventListener(EDX_UNIT_LOADED_EVENT, listener);
    try {
      markEdxUnitLoaded('unit-1');

      expect(getLoadedEdxUnitId()).toBe('unit-1');
      expect(listener).toHaveBeenCalledTimes(1);
      expect((listener.mock.calls[0][0] as CustomEvent).detail).toEqual({ usageId: 'unit-1' });
    } finally {
      window.removeEventListener(EDX_UNIT_LOADED_EVENT, listener);
    }
  });

  it('implies the iframe itself has loaded', () => {
    markEdxUnitLoaded('unit-1');
    expect(hasEdxIframeLoaded()).toBe(true);
  });

  it('forgets the loaded unit when the iframe is torn down', () => {
    markEdxUnitLoaded('unit-1');
    markEdxIframeUnloaded();
    expect(getLoadedEdxUnitId()).toBeNull();
  });
});

describe('waitForEdxUnitLoaded', () => {
  beforeEach(() => {
    markEdxIframeUnloaded();
  });

  afterEach(() => {
    markEdxIframeUnloaded();
    vi.useRealTimers();
  });

  it('runs at once when that unit is already loaded', () => {
    markEdxUnitLoaded('unit-1');
    const onLoaded = vi.fn();

    waitForEdxUnitLoaded('unit-1', onLoaded);

    expect(onLoaded).toHaveBeenCalledTimes(1);
  });

  it('does not take a unit loaded earlier for this one', () => {
    markEdxUnitLoaded('unit-A');
    const onLoaded = vi.fn();

    const cancel = waitForEdxUnitLoaded('unit-B', onLoaded);

    expect(onLoaded).not.toHaveBeenCalled();
    cancel();
  });

  it('waits for that unit, not whichever loads next', () => {
    vi.useFakeTimers();
    const onLoaded = vi.fn();
    waitForEdxUnitLoaded('unit-B', onLoaded);

    markEdxUnitLoaded('unit-A');
    expect(onLoaded).not.toHaveBeenCalled();

    markEdxUnitLoaded('unit-B');
    expect(onLoaded).toHaveBeenCalledTimes(1);

    // Settled: the fallback is gone and a repeat load changes nothing.
    expect(vi.getTimerCount()).toBe(0);
    markEdxUnitLoaded('unit-B');
    expect(onLoaded).toHaveBeenCalledTimes(1);
  });

  it('gives up after the fallback timeout', () => {
    vi.useFakeTimers();
    const onLoaded = vi.fn();
    waitForEdxUnitLoaded('unit-1', onLoaded);

    vi.advanceTimersByTime(EDX_IFRAME_LOAD_FALLBACK_MS - 1);
    expect(onLoaded).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(onLoaded).toHaveBeenCalledTimes(1);
  });

  it('cancelling stops both the listener and the fallback', () => {
    vi.useFakeTimers();
    const onLoaded = vi.fn();
    const cancel = waitForEdxUnitLoaded('unit-1', onLoaded);

    cancel();
    markEdxUnitLoaded('unit-1');
    vi.advanceTimersByTime(EDX_IFRAME_LOAD_FALLBACK_MS);

    expect(onLoaded).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe('requestEdxUnitContext', () => {
  afterEach(() => {
    document.getElementById(EDX_IFRAME_ID)?.remove();
  });

  it('asks the mounted course iframe, at the LMS origin, to announce itself again', () => {
    const iframe = document.createElement('iframe');
    iframe.id = EDX_IFRAME_ID;
    document.body.appendChild(iframe);
    const postMessage = vi.spyOn(iframe.contentWindow!, 'postMessage');

    requestEdxUnitContext();

    expect(postMessage).toHaveBeenCalledWith(
      { type: EDX_CONTEXT_REQUEST_MESSAGE_TYPE },
      config.urls.lms(),
    );
  });

  it('does nothing when no course iframe is mounted', () => {
    expect(() => requestEdxUnitContext()).not.toThrow();
  });
});
