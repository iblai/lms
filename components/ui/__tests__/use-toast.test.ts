import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useToast, toast } from '../use-toast';

describe('useToast', () => {
  it('returns toasts array and toast function', () => {
    const { result } = renderHook(() => useToast());
    expect(result.current.toasts).toBeDefined();
    expect(Array.isArray(result.current.toasts)).toBe(true);
    expect(typeof result.current.toast).toBe('function');
    expect(typeof result.current.dismiss).toBe('function');
  });

  it('can add a toast', () => {
    const { result } = renderHook(() => useToast());
    act(() => {
      toast({ title: 'Test toast' });
    });
    expect(result.current.toasts.length).toBeGreaterThan(0);
  });
});
