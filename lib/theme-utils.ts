import { themeConfig } from "@/config/config"

// Function to convert theme colors to CSS variables
export function generateCssVariables() {
  const colors = themeConfig.colors
  const components = colors.components || {}

  // Create CSS variable definitions
  const cssVars: Record<string, string> = {
    // Primary colors
    "--primary": colors.primary.DEFAULT,
    "--primary-light": colors.primary.light,
    "--primary-dark": colors.primary.dark,

    // Secondary colors
    "--secondary": colors.secondary.DEFAULT,
    "--secondary-light": colors.secondary.light,
    "--secondary-dark": colors.secondary.dark,

    // Accent colors
    "--accent": colors.accent.DEFAULT,
    "--accent-light": colors.accent.light,
    "--accent-dark": colors.accent.dark,

    // Background colors
    "--background": colors.background.DEFAULT,
    "--background-light": colors.background.light,
    "--background-dark": colors.background.dark,

    // Text colors
    "--text": colors.text.DEFAULT,
    "--text-light": colors.text.light,
    "--text-dark": colors.text.dark,

    // Border colors
    "--border": colors.border.DEFAULT,
    "--border-light": colors.border.light,
    "--border-dark": colors.border.dark,

    // Status colors
    "--success": colors.status.success,
    "--warning": colors.status.warning,
    "--error": colors.status.error,
    "--info": colors.status.info,

    // Component-specific colors
    // Navbar
    "--navbar-bg": components.navbar?.background || colors.background.DEFAULT,
    "--navbar-text": components.navbar?.text || colors.text.DEFAULT,
    "--navbar-active-text": components.navbar?.activeText || colors.primary.DEFAULT,
    "--navbar-active-border": components.navbar?.activeBorder || colors.primary.DEFAULT,
    "--navbar-hover-text": components.navbar?.hoverText || colors.text.dark,
    "--navbar-hover-bg": components.navbar?.hoverBackground || colors.background.dark,

    // Sidebar
    "--sidebar-bg": components.sidebar?.background || colors.background.DEFAULT,
    "--sidebar-border": components.sidebar?.border || colors.border.light,
    "--sidebar-text": components.sidebar?.text || colors.text.DEFAULT,
    "--sidebar-icon-bg": components.sidebar?.iconBackground || colors.primary.light,
    "--sidebar-icon-color": components.sidebar?.iconColor || colors.primary.DEFAULT,
    "--sidebar-hover-bg": components.sidebar?.hoverBackground || colors.background.dark,
    "--sidebar-skill-bg": components.sidebar?.skillBackground || colors.primary.light,
    "--sidebar-skill-hover-bg": components.sidebar?.skillHoverBackground || colors.primary.light,
    "--sidebar-skill-text": components.sidebar?.skillText || colors.text.DEFAULT,

    // Button
    "--button-primary-bg":
      components.button?.primary?.background ||
      `linear-gradient(${components.button?.primary?.gradient?.direction || "to right"}, ${components.button?.primary?.gradient?.from || "#4B5563"}, ${components.button?.primary?.gradient?.to || "#F59E0B"})`,
    "--button-primary-gradient-from": components.button?.primary?.gradient?.from || "#4B5563",
    "--button-primary-gradient-to": components.button?.primary?.gradient?.to || "#F59E0B",
    "--button-primary-text": components.button?.primary?.text || "#FFFFFF",
    "--button-primary-hover-opacity": components.button?.primary?.hoverOpacity?.toString() || "0.9",

    "--button-secondary-bg": components.button?.secondary?.background || "#F3F4F6",
    "--button-secondary-gradient-from": components.button?.secondary?.gradient?.from || "#F3F4F6",
    "--button-secondary-gradient-to": components.button?.secondary?.gradient?.to || "#E5E7EB",
    "--button-secondary-text": components.button?.secondary?.text || "#374151",
    "--button-secondary-hover-bg": components.button?.secondary?.hoverBackground || "#E5E7EB",
    "--button-secondary-gradient": `linear-gradient(${components.button?.secondary?.gradient?.direction || "to right"}, ${components.button?.secondary?.gradient?.from || "#F3F4F6"}, ${components.button?.secondary?.gradient?.to || "#E5E7EB"})`,

    "--button-accent-gradient": `linear-gradient(${components.button?.accent?.gradient?.direction || "to right"}, ${components.button?.accent?.gradient?.from || "#F59E0B"}, ${components.button?.accent?.gradient?.to || "#D97706"})`,
    "--button-accent-gradient-from": components.button?.accent?.gradient?.from || "#F59E0B",
    "--button-accent-gradient-to": components.button?.accent?.gradient?.to || "#D97706",
    "--button-accent-text": components.button?.accent?.text || "#FFFFFF",
    "--button-accent-hover-opacity": components.button?.accent?.hoverOpacity?.toString() || "0.9",

    // Dialog
    "--dialog-bg": components.dialog?.background || colors.background.DEFAULT,
    "--dialog-text": components.dialog?.text || colors.text.DEFAULT,
    "--dialog-border": components.dialog?.border || colors.border.light,
    "--dialog-sidebar-bg":
      components.dialog?.sidebar?.background ||
      `linear-gradient(to bottom, ${colors.background.DEFAULT}, ${colors.background.light}, ${colors.primary.light})`,
    "--dialog-sidebar-text": components.dialog?.sidebar?.text || colors.text.DEFAULT,
    "--dialog-sidebar-active-bg": components.dialog?.sidebar?.activeTab?.background || colors.primary.light,
    "--dialog-sidebar-active-border": components.dialog?.sidebar?.activeTab?.border || colors.primary.DEFAULT,
    "--dialog-sidebar-active-text": components.dialog?.sidebar?.activeTab?.text || colors.primary.dark,

    // Badge
    "--badge-admin-bg": components.badge?.admin?.background || colors.primary.light,
    "--badge-admin-text": components.badge?.admin?.text || colors.primary.dark,
    "--badge-default-bg": components.badge?.default?.background || colors.background.dark,
    "--badge-default-text": components.badge?.default?.text || colors.text.DEFAULT,
  }

  return cssVars
}

// Function to apply CSS variables to an element
export function applyCssVariables(element: HTMLElement = document.documentElement) {
  const cssVars = generateCssVariables()

  Object.entries(cssVars).forEach(([key, value]) => {
    element.style.setProperty(key, value)
  })
}

// Function to get a color value from the theme
export function getColor(colorPath: string) {
  const parts = colorPath.split(".")
  let result: any = themeConfig.colors

  for (const part of parts) {
    if (result && result[part] !== undefined) {
      result = result[part]
    } else {
      return undefined
    }
  }

  return result
}
