'use client';

import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react';
import { themeConfig, type ThemeConfig, getThemeValue } from '@/config/config';

const EMPTY_THEME: Partial<ThemeConfig> = {};

// Create a context for the theme
const ThemeContext = createContext<{
  theme: ThemeConfig;
  getValue: (path: string) => any;
}>({
  theme: themeConfig,
  getValue: (path: string) => getThemeValue(path, themeConfig),
});

// Custom hook to use the theme
export const useTheme = () => useContext(ThemeContext);

interface ThemeProviderProps {
  children: ReactNode;
  theme?: Partial<ThemeConfig>;
}

export function ThemeProvider({ children, theme = EMPTY_THEME }: ThemeProviderProps) {
  // Merge custom theme with default theme if provided
  const mergedTheme = useMemo(() => ({ ...themeConfig, ...theme }) as ThemeConfig, [theme]);

  // Create a function to get values from the theme using dot notation
  const getValue = useCallback((path: string) => getThemeValue(path, mergedTheme), [mergedTheme]);

  const value = useMemo(() => ({ theme: mergedTheme, getValue }), [mergedTheme, getValue]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
