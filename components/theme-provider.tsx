'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { themeConfig, type ThemeConfig, getThemeValue } from '@/config/config';

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

export function ThemeProvider({ children, theme = {} }: ThemeProviderProps) {
  // Merge custom theme with default theme if provided
  const mergedTheme = { ...themeConfig, ...theme };

  // Create a function to get values from the theme using dot notation
  const getValue = (path: string) => getThemeValue(path, mergedTheme);

  return (
    <ThemeContext.Provider value={{ theme: mergedTheme as ThemeConfig, getValue }}>
      {children}
    </ThemeContext.Provider>
  );
}
