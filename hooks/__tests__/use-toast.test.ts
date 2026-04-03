import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useToast, toast, reducer } from '../use-toast';

describe('useToast', () => {
  beforeEach(() => {
    // Reset the global state by dismissing and removing all toasts
    const { result } = renderHook(() => useToast());
    act(() => {
      result.current.dismiss();
    });
  });

  it('returns expected shape', () => {
    const { result } = renderHook(() => useToast());
    expect(result.current).toHaveProperty('toasts');
    expect(result.current).toHaveProperty('toast');
    expect(result.current).toHaveProperty('dismiss');
    expect(Array.isArray(result.current.toasts)).toBe(true);
  });

  it('adds a toast', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      toast({ title: 'Test Toast' });
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].title).toBe('Test Toast');
    expect(result.current.toasts[0].open).toBe(true);
  });

  it('limits toasts to TOAST_LIMIT (1)', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      toast({ title: 'Toast 1' });
    });
    act(() => {
      toast({ title: 'Toast 2' });
    });

    // Only 1 toast should be present due to TOAST_LIMIT = 1
    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].title).toBe('Toast 2');
  });

  it('dismisses a specific toast', () => {
    const { result } = renderHook(() => useToast());

    let toastResult: any;
    act(() => {
      toastResult = toast({ title: 'Dismissable Toast' });
    });

    act(() => {
      result.current.dismiss(toastResult.id);
    });

    expect(result.current.toasts[0].open).toBe(false);
  });

  it('dismisses all toasts', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      toast({ title: 'Toast' });
    });

    act(() => {
      result.current.dismiss();
    });

    result.current.toasts.forEach((t) => {
      expect(t.open).toBe(false);
    });
  });

  it('toast function returns id, dismiss, and update', () => {
    let toastResult: any;
    const { result } = renderHook(() => useToast());

    act(() => {
      toastResult = toast({ title: 'Test' });
    });

    expect(toastResult).toHaveProperty('id');
    expect(toastResult).toHaveProperty('dismiss');
    expect(toastResult).toHaveProperty('update');
  });

  it('updates a toast', () => {
    const { result } = renderHook(() => useToast());

    let toastResult: any;
    act(() => {
      toastResult = toast({ title: 'Original' });
    });

    act(() => {
      toastResult.update({ title: 'Updated', id: toastResult.id });
    });

    expect(result.current.toasts[0].title).toBe('Updated');
  });
});

describe('reducer', () => {
  it('handles ADD_TOAST', () => {
    const state = { toasts: [] };
    const newToast = { id: '1', title: 'New', open: true } as any;
    const newState = reducer(state, { type: 'ADD_TOAST', toast: newToast });
    expect(newState.toasts).toHaveLength(1);
    expect(newState.toasts[0].id).toBe('1');
  });

  it('handles UPDATE_TOAST', () => {
    const state = { toasts: [{ id: '1', title: 'Old', open: true } as any] };
    const newState = reducer(state, {
      type: 'UPDATE_TOAST',
      toast: { id: '1', title: 'Updated' },
    });
    expect(newState.toasts[0].title).toBe('Updated');
    expect(newState.toasts[0].open).toBe(true);
  });

  it('handles DISMISS_TOAST with specific id', () => {
    const state = { toasts: [{ id: '1', title: 'Toast', open: true } as any] };
    const newState = reducer(state, { type: 'DISMISS_TOAST', toastId: '1' });
    expect(newState.toasts[0].open).toBe(false);
  });

  it('handles DISMISS_TOAST without id (dismiss all)', () => {
    const state = {
      toasts: [{ id: '1', open: true } as any, { id: '2', open: true } as any],
    };
    const newState = reducer(state, { type: 'DISMISS_TOAST' });
    newState.toasts.forEach((t) => expect(t.open).toBe(false));
  });

  it('handles REMOVE_TOAST with specific id', () => {
    const state = {
      toasts: [{ id: '1', title: 'Keep' } as any, { id: '2', title: 'Remove' } as any],
    };
    const newState = reducer(state, { type: 'REMOVE_TOAST', toastId: '2' });
    expect(newState.toasts).toHaveLength(1);
    expect(newState.toasts[0].id).toBe('1');
  });

  it('handles REMOVE_TOAST without id (remove all)', () => {
    const state = {
      toasts: [{ id: '1' } as any, { id: '2' } as any],
    };
    const newState = reducer(state, { type: 'REMOVE_TOAST' });
    expect(newState.toasts).toHaveLength(0);
  });
});
