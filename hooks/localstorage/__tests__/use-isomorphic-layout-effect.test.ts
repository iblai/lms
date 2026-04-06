import { describe, it, expect } from 'vitest';
import { useLayoutEffect } from 'react';
import { useIsomorphicLayoutEffect } from '../use-isomorphic-layout-effect';

describe('useIsomorphicLayoutEffect', () => {
  it('is useLayoutEffect in browser environment', () => {
    // In a jsdom/browser-like test environment, window is defined
    expect(useIsomorphicLayoutEffect).toBe(useLayoutEffect);
  });
});
