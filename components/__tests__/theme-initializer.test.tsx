import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

const mockApplyCssVariables = vi.fn();

vi.mock('@/components/theme-provider', () => ({
  useTheme: () => ({ theme: 'light' }),
}));

vi.mock('@/lib/theme-utils', () => ({
  applyCssVariables: () => mockApplyCssVariables(),
}));

import { ThemeInitializer } from '../theme-initializer';

describe('ThemeInitializer', () => {
  it('renders without crashing', () => {
    const { container } = render(<ThemeInitializer />);
    // ThemeInitializer returns null
    expect(container.firstChild).toBeNull();
  });

  it('calls applyCssVariables on mount', () => {
    render(<ThemeInitializer />);
    expect(mockApplyCssVariables).toHaveBeenCalled();
  });

  it('returns null (no visible output)', () => {
    const { container } = render(<ThemeInitializer />);
    expect(container.innerHTML).toBe('');
  });
});
