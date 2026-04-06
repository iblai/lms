'use client';

import { useEffect } from 'react';
import { useTheme } from '@/components/theme-provider';
import { applyCssVariables } from '@/lib/theme-utils';

export function ThemeInitializer() {
  const { theme } = useTheme();

  useEffect(() => {
    // Apply all CSS variables from the theme
    applyCssVariables();
  }, [theme]);

  return null;
}
