import { describe, it, expect, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';

import {
  PRODUCT_TOUR_VERSION,
  productTourStorageKey,
  useTourCompletion,
} from '../use-tour-completion';

describe('productTourStorageKey', () => {
  it('is namespaced, versioned, and per user', () => {
    expect(PRODUCT_TOUR_VERSION).toBe(1);
    // Mirrored in e2e/utils/product-tour.ts — keep both in sync.
    expect(productTourStorageKey('alice')).toBe('skills:product-tour:v1:alice');
  });

  it('falls back to an anonymous bucket without a username', () => {
    expect(productTourStorageKey(null)).toBe('skills:product-tour:v1:anonymous');
    expect(productTourStorageKey(undefined)).toBe('skills:product-tour:v1:anonymous');
    expect(productTourStorageKey('')).toBe('skills:product-tour:v1:anonymous');
  });
});

describe('useTourCompletion', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('starts incomplete and persists the outcome', () => {
    const { result } = renderHook(() => useTourCompletion('alice'));
    expect(result.current.completed).toBe(false);
    expect(result.current.outcome).toBeNull();

    act(() => result.current.markCompleted('finished'));

    expect(result.current.completed).toBe(true);
    expect(result.current.outcome).toBe('finished');
    expect(window.localStorage.getItem(productTourStorageKey('alice'))).toBe('finished');
  });

  it('reads a previously stored outcome', () => {
    window.localStorage.setItem(productTourStorageKey('alice'), 'skipped');
    const { result } = renderHook(() => useTourCompletion('alice'));
    expect(result.current.completed).toBe(true);
    expect(result.current.outcome).toBe('skipped');
  });

  it('ignores values it did not write', () => {
    window.localStorage.setItem(productTourStorageKey('alice'), 'maybe');
    const { result } = renderHook(() => useTourCompletion('alice'));
    expect(result.current.completed).toBe(false);
  });

  it('keeps users on the same browser independent', () => {
    window.localStorage.setItem(productTourStorageKey('alice'), 'finished');
    const { result } = renderHook(() => useTourCompletion('bob'));
    expect(result.current.completed).toBe(false);
  });

  it('can be reset', () => {
    window.localStorage.setItem(productTourStorageKey('alice'), 'finished');
    const { result } = renderHook(() => useTourCompletion('alice'));
    expect(result.current.completed).toBe(true);

    act(() => result.current.reset());

    expect(result.current.completed).toBe(false);
    expect(window.localStorage.getItem(productTourStorageKey('alice'))).toBeNull();
  });
});
