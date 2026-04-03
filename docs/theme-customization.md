# Theme Customization Guide

This document explains how to customize the visual elements of the application using the theme configuration system.

## Overview

The theme configuration system allows you to centrally manage and customize:

- Logo (main, small, and footer variants)
- Color scheme (primary, secondary, accent, background, text, border, and status colors)
- Border radius
- Font weights and sizes
- Shadows

## How to Customize

### 1. Edit the Theme Configuration

The main configuration file is located at `config/theme.ts`. Open this file and modify the values to match your branding requirements.

Example:

\`\`\`typescript
// Change the primary color
colors: {
primary: {
light: "#FDE68A", // amber-200
DEFAULT: "#D97706", // amber-600
dark: "#B45309", // amber-700
},
// ...
}

// Update the logo
logo: {
main: {
src: "/images/your-logo.png",
alt: "Your Company",
width: 120,
height: 48,
},
// ...
}
\`\`\`

### 2. Using Theme Values in Components

#### With the useTheme Hook

\`\`\`tsx
import { useTheme } from "@/components/theme-provider"

function MyComponent() {
const { theme } = useTheme()

return (

<div style={{ color: theme.colors.primary.DEFAULT }}>
Themed content
</div>
)
}
\`\`\`

#### With the useThemedColor Hook

\`\`\`tsx
import useThemedColor from "@/hooks/use-themed-color"

function MyComponent() {
const primaryColor = useThemedColor("primary.DEFAULT")

return (

<div style={{ color: primaryColor }}>
Themed content
</div>
)
}
\`\`\`

#### Using the Logo Component

\`\`\`tsx
import { Logo } from "@/components/logo"

function Header() {
return (

<header>
<Logo variant="main" />
</header>
)
}

function Footer() {
return (

<footer>
<Logo variant="footer" />
</footer>
)
}
\`\`\`

### 3. CSS Variables

The theme system automatically generates CSS variables that you can use in your stylesheets:

\`\`\`css
.my-element {
color: var(--primary);
background-color: var(--background-light);
border: 1px solid var(--border);
}
\`\`\`

Available CSS variables:

- `--primary`, `--primary-light`, `--primary-dark`
- `--secondary`, `--secondary-light`, `--secondary-dark`
- `--accent`, `--accent-light`, `--accent-dark`
- `--background`, `--background-light`, `--background-dark`
- `--text`, `--text-light`, `--text-dark`
- `--border`, `--border-light`, `--border-dark`
- `--success`, `--warning`, `--error`, `--info`

## Advanced Customization

### Adding New Theme Properties

To add new properties to the theme:

1. Update the `themeConfig` object in `config/theme.ts`
2. Update the CSS variable generation in `lib/theme-utils.ts` if needed
3. Use the new properties in your components

### Overriding the Theme at Runtime

You can override the theme for a specific part of your application:

\`\`\`tsx
import { ThemeProvider } from "@/components/theme-provider"

function CustomThemedSection() {
const customTheme = {
colors: {
primary: {
DEFAULT: "#3B82F6", // blue-500
}
}
}

return (
<ThemeProvider theme={customTheme}>
<YourComponent />
</ThemeProvider>
)
}
\`\`\`

## Best Practices

1. Always use the theme system for visual elements to ensure consistency
2. Avoid hardcoding colors, fonts, or other visual properties
3. Use the provided hooks and components to access theme values
4. When adding new components, ensure they respect the theme configuration
   \`\`\`

Let's create an example of how to use the theme in a component:
