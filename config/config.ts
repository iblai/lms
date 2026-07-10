/**
 * Global Theme Configuration
 *
 * This file contains the central configuration for the application's visual elements.
 * Modify these values to update the branding and color scheme across the entire application.
 */

export const themeConfig = {
  // Logo configuration
  logo: {
    // Main logo used in the navbar and other primary locations
    main: {
      src: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/iblai-logo-xs%20%281%29-3UYOVbXjsuvGoUnKYWGIO19nDDgFOV.png',
      alt: 'ibl.ai Logo',
      width: 120,
      height: 48,
    },
    // Small logo variant used in mobile views or where space is limited
    small: {
      src: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/iblai-logo-xs%20%281%29-3UYOVbXjsuvGoUnKYWGIO19nDDgFOV.png',
      alt: 'ibl.ai Logo',
      width: 32,
      height: 32,
    },
    // Logo used in the footer or secondary locations
    footer: {
      src: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/iblai-logo-xs%20%281%29-3UYOVbXjsuvGoUnKYWGIO19nDDgFOV.png',
      alt: 'ibl.ai Logo',
      width: 100,
      height: 40,
    },
  },

  // Color scheme configuration
  colors: {
    // Primary color palette
    primary: {
      light: '#eef6fc', // sidebar blue (light)
      DEFAULT: '#1e40af', // sidebar blue (accent)
      dark: '#1e3a8a', // sidebar blue (dark)
    },
    // Secondary color palette
    secondary: {
      light: '#E0F2FE', // light blue
      DEFAULT: '#0EA5E9', // blue-500
      dark: '#0284C7', // blue-600
    },
    // Accent colors for highlights and special elements
    accent: {
      light: '#eef6fc', // sidebar blue (light)
      DEFAULT: '#1e40af', // sidebar blue (accent)
      dark: '#1e3a8a', // sidebar blue (dark)
    },
    // Background colors
    background: {
      light: '#FFFFFF',
      DEFAULT: '#F9FAFB', // gray-50
      dark: '#F3F4F6', // gray-100
    },
    // Text colors
    text: {
      light: '#6B7280', // gray-500
      DEFAULT: '#374151', // gray-700
      dark: '#1F2937', // gray-800
      analytics: '#636364', // Custom analytics text color
    },
    // Border colors
    border: {
      light: '#E5E7EB', // gray-200
      DEFAULT: '#D1D5DB', // gray-300
      dark: '#9CA3AF', // gray-400
    },
    // Success, warning, error colors
    status: {
      success: '#10B981', // emerald-500
      warning: '#1e40af', // sidebar blue (accent)
      error: '#EF4444', // red-500
      info: '#3B82F6', // blue-500
    },
    // Component-specific colors
    components: {
      // Navbar specific colors
      navbar: {
        background: '#FFFFFF',
        text: '#374151',
        activeText: '#172554',
        activeBorder: '#1e40af',
        hoverText: '#1F2937',
        hoverBackground: '#F3F4F6',
      },
      // Sidebar specific colors
      sidebar: {
        background: '#FFFFFF',
        border: '#E5E7EB',
        text: '#374151',
        iconBackground: '#eef6fc',
        iconColor: '#1e40af',
        hoverBackground: '#F3F4F6',
        skillBackground: '#eef6fc',
        skillHoverBackground: '#cfe8fa',
        skillText: '#374151',
      },
      // Button specific colors
      button: {
        primary: {
          background: 'linear-gradient(to right, #4B5563, #1e40af)',
          text: '#FFFFFF',
          hoverOpacity: 0.9,
          // Add explicit gradient definitions
          gradient: {
            from: '#4B5563', // gray-700
            to: '#1e40af', // sidebar blue (accent)
            direction: 'to right',
          },
        },
        secondary: {
          background: '#F3F4F6',
          text: '#374151',
          hoverBackground: '#E5E7EB',
          // Add gradient for secondary buttons too
          gradient: {
            from: '#F3F4F6', // gray-100
            to: '#E5E7EB', // gray-200
            direction: 'to right',
          },
        },
        // Add accent button style
        accent: {
          gradient: {
            from: '#1e40af', // sidebar blue (accent)
            to: '#1e3a8a', // sidebar blue (dark)
            direction: 'to right',
          },
          text: '#FFFFFF',
          hoverOpacity: 0.9,
        },
      },
      // Dialog specific colors
      dialog: {
        background: '#FFFFFF',
        text: '#374151',
        border: '#E5E7EB',
        sidebar: {
          background: 'linear-gradient(to bottom, #FFFFFF, #F9FAFB, #eef6fc)',
          text: '#374151',
          activeTab: {
            background: '#eef6fc',
            border: '#1e40af',
            text: '#1e3a8a',
          },
        },
      },
      // Badge specific colors
      badge: {
        admin: {
          background: '#eef6fc',
          text: '#1e3a8a',
        },
        default: {
          background: '#F3F4F6',
          text: '#374151',
        },
      },
    },
  },

  // Border radius configuration
  borderRadius: {
    sm: '0.125rem', // 2px
    DEFAULT: '0.25rem', // 4px (reduced from default)
    md: '0.375rem', // 6px
    lg: '0.5rem', // 8px (reduced from default)
    xl: '0.75rem', // 12px
    '2xl': '1rem', // 16px
    full: '9999px',
  },

  // Font configuration
  fonts: {
    // The main font family is set in layout.tsx via Next.js font loading
    // These values are for font weights and sizes
    weight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    size: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
    },
  },

  // Shadow configuration
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  },
};

// Type definitions for the theme configuration
export type ThemeConfig = typeof themeConfig;

// Helper function to get a nested property from the theme config using a path string
// Example: getThemeValue("colors.primary.DEFAULT") returns the primary color
export function getThemeValue(path: string, config = themeConfig): any {
  return path
    .split('.')
    .reduce(
      (obj, key) => (obj && (obj as any)[key] !== undefined ? (obj as any)[key] : undefined),
      config,
    );
}

// Export default theme config
export default themeConfig;
