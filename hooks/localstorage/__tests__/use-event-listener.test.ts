import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useEventListener } from '../use-event-listener';

describe('useEventListener', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('adds event listener to window by default', () => {
    const handler = vi.fn();
    const addSpy = vi.spyOn(window, 'addEventListener');
    const removeSpy = vi.spyOn(window, 'removeEventListener');

    const { unmount } = renderHook(() => useEventListener('click', handler));

    expect(addSpy).toHaveBeenCalledWith('click', expect.any(Function), undefined);

    unmount();
    expect(removeSpy).toHaveBeenCalledWith('click', expect.any(Function), undefined);

    addSpy.mockRestore();
    removeSpy.mockRestore();
  });

  it('calls handler when event is fired on window', () => {
    const handler = vi.fn();
    renderHook(() => useEventListener('click', handler));

    const event = new Event('click');
    window.dispatchEvent(event);

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('adds event listener to a provided element ref', () => {
    const handler = vi.fn();
    const element = document.createElement('div');
    const addSpy = vi.spyOn(element, 'addEventListener');
    const removeSpy = vi.spyOn(element, 'removeEventListener');

    const ref = { current: element };
    const { unmount } = renderHook(() => useEventListener('click', handler, ref));

    expect(addSpy).toHaveBeenCalledWith('click', expect.any(Function), undefined);

    unmount();
    expect(removeSpy).toHaveBeenCalledWith('click', expect.any(Function), undefined);

    addSpy.mockRestore();
    removeSpy.mockRestore();
  });

  it('uses latest handler without re-registering listener', () => {
    const handler1 = vi.fn();
    const handler2 = vi.fn();
    const addSpy = vi.spyOn(window, 'addEventListener');

    const { rerender } = renderHook(({ handler }) => useEventListener('click', handler), {
      initialProps: { handler: handler1 },
    });

    const callCountAfterFirst = addSpy.mock.calls.length;

    rerender({ handler: handler2 });

    // addEventListener should not be called again
    expect(addSpy.mock.calls.length).toBe(callCountAfterFirst);

    // But the new handler should be called
    window.dispatchEvent(new Event('click'));
    expect(handler2).toHaveBeenCalledTimes(1);
    expect(handler1).not.toHaveBeenCalled();

    addSpy.mockRestore();
  });

  it('handles null element ref gracefully', () => {
    const handler = vi.fn();
    const ref = { current: null };

    // Should not throw
    expect(() => {
      renderHook(() => useEventListener('click', handler, ref as any));
    }).not.toThrow();
  });

  it('passes options to addEventListener', () => {
    const handler = vi.fn();
    const addSpy = vi.spyOn(window, 'addEventListener');

    renderHook(() => useEventListener('click', handler, undefined, { capture: true }));

    expect(addSpy).toHaveBeenCalledWith('click', expect.any(Function), { capture: true });

    addSpy.mockRestore();
  });
});
