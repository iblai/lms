"use client"

import { useTheme } from "@/components/theme-provider"

// Hook to get a color from the theme
export function useThemedColor(colorPath: string, fallback?: string): string {
  const { getValue } = useTheme()

  // Get the color from the theme using the path
  // Example: "primary.DEFAULT" or "status.success"
  const color = getValue(`colors.${colorPath}`)

  // Return the color or fallback
  return color || fallback || "#000000"
}

export default useThemedColor
