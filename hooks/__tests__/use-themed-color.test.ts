import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

const mockGetValue = vi.fn();

vi.mock('@/components/theme-provider', () => ({
  useTheme: vi.fn(() => ({
    getValue: mockGetValue,
  })),
}));

import { useThemedColor } from '../use-themed-color';

describe('useThemedColor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns color from theme when found', () => {
    mockGetValue.mockReturnValue('#ff0000');
    const { result } = renderHook(() => useThemedColor('primary.DEFAULT'));
    expect(result.current).toBe('#ff0000');
    expect(mockGetValue).toHaveBeenCalledWith('colors.primary.DEFAULT');
  });

  it('returns fallback when color is not found in theme', () => {
    mockGetValue.mockReturnValue(undefined);
    const { result } = renderHook(() => useThemedColor('nonexistent.color', '#cccccc'));
    expect(result.current).toBe('#cccccc');
  });

  it('returns default black when no color found and no fallback provided', () => {
    mockGetValue.mockReturnValue(undefined);
    const { result } = renderHook(() => useThemedColor('nonexistent.color'));
    expect(result.current).toBe('#000000');
  });

  it('prepends colors. to the colorPath', () => {
    mockGetValue.mockReturnValue('#00ff00');
    renderHook(() => useThemedColor('status.success'));
    expect(mockGetValue).toHaveBeenCalledWith('colors.status.success');
  });

  it('returns color over fallback when color exists', () => {
    mockGetValue.mockReturnValue('#0000ff');
    const { result } = renderHook(() => useThemedColor('primary.DEFAULT', '#fallback'));
    expect(result.current).toBe('#0000ff');
  });

  it('returns fallback over default when color is empty string', () => {
    mockGetValue.mockReturnValue('');
    const { result } = renderHook(() => useThemedColor('primary.DEFAULT', '#fallback'));
    expect(result.current).toBe('#fallback');
  });
});
