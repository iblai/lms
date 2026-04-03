import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useEventCallback } from '../use-event-callback';

describe('useEventCallback', () => {
  it('returns a stable callback reference', () => {
    const fn = vi.fn(() => 'result');
    const { result, rerender } = renderHook(() => useEventCallback(fn));

    const firstRef = result.current;
    rerender();
    const secondRef = result.current;

    expect(firstRef).toBe(secondRef);
  });

  it('calls the latest version of the callback', () => {
    const fn1 = vi.fn(() => 'first');
    const fn2 = vi.fn(() => 'second');

    const { result, rerender } = renderHook(({ fn }) => useEventCallback(fn), {
      initialProps: { fn: fn1 },
    });

    expect(result.current()).toBe('first');

    rerender({ fn: fn2 });

    expect(result.current()).toBe('second');
    expect(fn2).toHaveBeenCalled();
  });

  it('passes arguments through to the callback', () => {
    const fn = vi.fn((a: number, b: string) => `${a}-${b}`);
    const { result } = renderHook(() => useEventCallback(fn));

    const value = result.current(42, 'hello');
    expect(value).toBe('42-hello');
    expect(fn).toHaveBeenCalledWith(42, 'hello');
  });

  it('handles undefined callback gracefully', () => {
    const { result } = renderHook(() => useEventCallback(undefined));
    // When undefined is passed, the hook still returns a wrapper function
    // but calling it returns undefined since ref.current is undefined
    expect(typeof result.current).toBe('function');
    expect(result.current()).toBeUndefined();
  });
});
