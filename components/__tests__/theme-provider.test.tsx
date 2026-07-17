import { describe, it, expect } from 'vitest';
import { render, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useState } from 'react';
import { ThemeProvider, useTheme } from '@/components/theme-provider';
import { themeConfig } from '@/config/config';

let latest: ReturnType<typeof useTheme>;
let bump: () => void;

function Consumer() {
  latest = useTheme();
  return null;
}

function Harness({ theme }: { theme?: any }) {
  const [, setN] = useState(0);
  bump = () => setN((n) => n + 1);
  return (
    <ThemeProvider theme={theme}>
      <Consumer />
    </ThemeProvider>
  );
}

describe('ThemeProvider', () => {
  it('provides the merged theme and a working getValue resolver', () => {
    render(<Harness />);
    expect(latest.theme).toMatchObject(themeConfig);
    expect(latest.getValue('colors.primary.DEFAULT')).toBe(themeConfig.colors.primary.DEFAULT);
  });

  it('keeps a stable context value across re-renders when no theme prop changes', () => {
    render(<Harness />);
    const value = latest;
    act(() => bump());
    // The default theme resolves to a stable reference, so memoized consumers
    // (e.g. ThemeInitializer's effect) are not re-run on unrelated re-renders.
    expect(latest).toBe(value);
    expect(latest.getValue).toBe(value.getValue);
  });

  it('merges an explicit theme override over the defaults', () => {
    render(
      <Harness theme={{ colors: { ...themeConfig.colors, primary: { DEFAULT: '#123456' } } }} />,
    );
    expect(latest.getValue('colors.primary.DEFAULT')).toBe('#123456');
  });

  it('falls back to the default theme context when used without a provider', () => {
    render(<Consumer />);
    expect(latest.theme).toBe(themeConfig);
    expect(latest.getValue('colors.primary.DEFAULT')).toBe(themeConfig.colors.primary.DEFAULT);
  });
});
