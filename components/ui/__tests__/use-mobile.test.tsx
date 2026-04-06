import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useIsMobile } from '../use-mobile';

describe('useIsMobile', () => {
  it('returns a boolean', () => {
    // Default jsdom window.innerWidth is 1024, so should be false
    const { result } = renderHook(() => useIsMobile());
    expect(typeof result.current).toBe('boolean');
  });
});
